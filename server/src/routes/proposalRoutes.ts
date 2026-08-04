/**
 * Proposal Routes — Apply, Rollback, History
 *
 * All write operations (apply, rollback) enforce:
 *  1. Project membership check (no cross-tenant writes)
 *  2. Database transaction (atomic — no partial state)
 *  3. Audit log entry on every state change
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireProjectRole, requireNonViewer } from '../middleware/rbac.js';
import { getDatabase } from '../models/schema.js';
import { memoryService } from '../ai/memory.js';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const applySchema = z.object({
  projectId: z.string().min(1),
  proposalId: z.string().min(1),
  environment: z.enum(['sandbox', 'staging', 'production']).default('sandbox'),
});

const rollbackSchema = z.object({
  projectId: z.string().min(1),
  versionNumber: z.number().int().positive(),
});

// POST /api/projects/apply — Human Approval: commit proposal to DB
// Requires editor+ role. Production environment requires owner role.
router.post('/apply', requireNonViewer, async (req, res) => {
  try {
    const { projectId, proposalId, environment } = applySchema.parse(req.body);
    const db = getDatabase();

    // ── Extra check: production requires owner role ────────────────────────
    if (environment === 'production') {
      const { resolveProjectRole } = await import('../middleware/rbac.js');
      const role = await resolveProjectRole(projectId, req.user!.userId);
      if (role !== 'owner') {
        return res.status(403).json({
          error: 'Production deployments require owner role',
          detail: 'Please request owner approval for production changes.',
          yourRole: role,
        });
      }
    }

    // ── Fetch and validate proposal ────────────────────────────────────────
    const proposal = await db.get('SELECT * FROM proposals WHERE id = ?', [proposalId]);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // ── Verify proposal belongs to the specified project ───────────────────
    if (proposal.projectId !== projectId) {
      return res.status(403).json({ error: 'Proposal does not belong to this project' });
    }

    if (proposal.status === 'applied') {
      return res.status(409).json({ error: 'Proposal has already been applied', proposalId });
    }

    // ── Fetch the next version number ──────────────────────────────────────
    const lastVersionRow = await db.get(
      'SELECT MAX(versionNumber) as latest FROM version_history WHERE projectId = ?',
      [projectId]
    );
    const nextVersion = (lastVersionRow?.latest ?? 0) + 1;

    // ── Fetch current project state (pre-change snapshot for rollback) ─────
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // ── Execute atomically: mark applied + create version + audit log ──────
    // SQLite uses BEGIN/COMMIT, Postgres uses BEGIN/COMMIT identically
    try {
      await db.exec('BEGIN');

      // 1. Mark proposal applied
      await db.run(
        "UPDATE proposals SET status = 'applied', appliedAt = CURRENT_TIMESTAMP WHERE id = ?",
        [proposalId]
      );

      // 2. Create version history with full project snapshot (enables rollback)
      const versionId = `ver-${Date.now()}-${uuid().substring(0, 5)}`;
      await db.run(
        `INSERT INTO version_history
         (id, projectId, versionNumber, summary, snapshot, proposalId, createdBy, environment)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          versionId, projectId, nextVersion,
          proposal.summary,
          JSON.stringify(project),
          proposalId,
          req.user!.userId,
          environment,
        ]
      );

      // 3. Audit log — Protocol 14: record every approved action
      await db.run(
        `INSERT INTO auditLogs (id, userId, projectId, action, resource, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          uuid(), req.user!.userId, projectId,
          'PROPOSAL_APPLIED',
          `${environment}:${proposal.agentRole}`,
          JSON.stringify({ proposalId, versionNumber: nextVersion, environment, summary: proposal.summary }),
        ]
      );

      await db.exec('COMMIT');
    } catch (txErr) {
      await db.exec('ROLLBACK');
      throw txErr;
    }

    // 4. Project memory (outside transaction — non-critical)
    try {
      await memoryService.addProjectMemory(
        projectId,
        'accepted_recommendation',
        `Applied proposal in ${environment}: ${proposal.summary}`,
        { proposalId, versionNumber: nextVersion, environment }
      );
    } catch {
      // Non-critical — proceed
    }

    res.json({
      success: true,
      proposalId,
      versionNumber: nextVersion,
      environment,
      message: `Proposal applied to ${environment} as Version v${nextVersion}.`,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Apply failed' });
  }
});

// POST /api/projects/rollback — Revert project state to target version
// Requires editor+ role.
router.post('/rollback', requireNonViewer, async (req, res) => {
  try {
    const { projectId, versionNumber } = rollbackSchema.parse(req.body);
    const db = getDatabase();

    // ── Verify version belongs to this project ─────────────────────────────
    const targetVer = await db.get(
      'SELECT * FROM version_history WHERE projectId = ? AND versionNumber = ?',
      [projectId, versionNumber]
    );
    if (!targetVer) {
      return res.status(404).json({ error: `Version ${versionNumber} not found for this project` });
    }

    const lastVersionRow = await db.get(
      'SELECT MAX(versionNumber) as latest FROM version_history WHERE projectId = ?',
      [projectId]
    );
    const nextVersion = (lastVersionRow?.latest ?? 0) + 1;

    try {
      await db.exec('BEGIN');

      // Create rollback version entry
      const rollbackVersionId = `ver-${Date.now()}-${uuid().substring(0, 5)}`;
      await db.run(
        `INSERT INTO version_history (id, projectId, versionNumber, summary, snapshot, createdBy, environment)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          rollbackVersionId, projectId, nextVersion,
          `Rollback to Version v${versionNumber}`,
          targetVer.snapshot,
          req.user!.userId,
          'sandbox',
        ]
      );

      // Audit log
      await db.run(
        `INSERT INTO auditLogs (id, userId, projectId, action, resource, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          uuid(), req.user!.userId, projectId,
          'PROJECT_ROLLBACK',
          'version_history',
          JSON.stringify({ restoredVersion: versionNumber, newVersion: nextVersion }),
        ]
      );

      await db.exec('COMMIT');
    } catch (txErr) {
      await db.exec('ROLLBACK');
      throw txErr;
    }

    try {
      await memoryService.addProjectMemory(
        projectId,
        'version_note',
        `Rolled back to Version v${versionNumber}`,
        { restoredVersion: versionNumber, currentVersion: nextVersion }
      );
    } catch {
      // Non-critical
    }

    res.json({
      success: true,
      currentVersion: nextVersion,
      restoredVersion: versionNumber,
      message: `Project state restored to Version v${versionNumber}.`,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Rollback failed' });
  }
});

// GET /api/projects/history — Version history and audit trail (read — viewer allowed)
router.get('/history', async (req, res) => {
  try {
    const projectId = String(req.query.projectId || '');
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    // ── Verify access ──────────────────────────────────────────────────────
    const { resolveProjectRole } = await import('../middleware/rbac.js');
    const role = await resolveProjectRole(projectId, req.user!.userId);
    if (!role) return res.status(403).json({ error: 'Access denied' });

    const db = getDatabase();
    const versions = await db.all(
      `SELECT id, versionNumber, summary, proposalId, createdBy, environment, createdAt
       FROM version_history WHERE projectId = ? ORDER BY versionNumber DESC LIMIT 50`,
      [projectId]
    );
    const proposals = await db.all(
      `SELECT id, agentRole, summary, affectedSystems, diff, status, appliedAt, createdAt
       FROM proposals WHERE projectId = ? ORDER BY createdAt DESC LIMIT 50`,
      [projectId]
    );

    res.json({ versions, proposals, yourRole: role });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch history' });
  }
});

export default router;
