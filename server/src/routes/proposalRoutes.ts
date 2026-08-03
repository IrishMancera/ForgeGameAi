import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDatabase } from '../models/schema.js';
import { memoryService } from '../ai/memory.js';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';

const router = Router();

const applySchema = z.object({
  projectId: z.string().default('default-project'),
  proposalId: z.string().min(1),
});

const rollbackSchema = z.object({
  projectId: z.string().default('default-project'),
  versionNumber: z.number().int().positive(),
});

router.use(authMiddleware);

// POST /api/projects/apply -> Human Approval commit to DB, Version History, Audit Log
router.post('/apply', async (req, res) => {
  try {
    const { projectId, proposalId } = applySchema.parse(req.body);
    const db = getDatabase();

    const proposal = await db.get(`SELECT * FROM proposals WHERE id = ?`, [proposalId]);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (proposal.status === 'applied') {
      return res.status(400).json({ error: 'Proposal has already been applied' });
    }

    // 1. Fetch latest version number
    const lastVersionRow = await db.get(`SELECT MAX(versionNumber) as latest FROM version_history WHERE projectId = ?`, [projectId]);
    const nextVersion = (lastVersionRow?.latest || 0) + 1;

    // 2. Fetch project snapshot
    const project = await db.get(`SELECT * FROM projects WHERE id = ? LIMIT 1`, [projectId]);
    const snapshot = project || { id: projectId, name: 'Haunted Hotel', updated: new Date().toISOString() };

    // 3. Mark proposal applied
    await db.run(`UPDATE proposals SET status = 'applied', appliedAt = CURRENT_TIMESTAMP WHERE id = ?`, [proposalId]);

    // 4. Create Version History record
    const versionId = `ver-${Date.now()}-${uuid().substring(0, 5)}`;
    await db.run(
      `INSERT INTO version_history (id, projectId, versionNumber, summary, snapshot, proposalId, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [versionId, projectId, nextVersion, proposal.summary, JSON.stringify(snapshot), proposalId, req.user?.userId || 'lead_designer']
    );

    // 5. Add entry to Project Memory
    await memoryService.addProjectMemory(
      projectId,
      'accepted_recommendation',
      `Applied proposal: ${proposal.summary}`,
      { proposalId, versionNumber: nextVersion }
    );

    // 6. Add Audit Log
    await db.run(
      `INSERT INTO auditLogs (id, userId, projectId, action, resource, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid(), req.user?.userId || 'system', projectId, 'PROPOSAL_APPLIED', 'Project State', JSON.stringify({ proposalId, versionNumber: nextVersion })]
    );

    res.json({
      success: true,
      proposalId,
      versionNumber: nextVersion,
      message: `Proposal successfully applied as Version v${nextVersion}.`,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Apply failed' });
  }
});

// POST /api/projects/rollback -> Revert project state to target version
router.post('/rollback', async (req, res) => {
  try {
    const { projectId, versionNumber } = rollbackSchema.parse(req.body);
    const db = getDatabase();

    const targetVer = await db.get(`SELECT * FROM version_history WHERE projectId = ? AND versionNumber = ?`, [projectId, versionNumber]);
    if (!targetVer) {
      return res.status(404).json({ error: `Version ${versionNumber} not found` });
    }

    // Create a new version representing the rollback
    const lastVersionRow = await db.get(`SELECT MAX(versionNumber) as latest FROM version_history WHERE projectId = ?`, [projectId]);
    const nextVersion = (lastVersionRow?.latest || 0) + 1;

    const rollbackVersionId = `ver-${Date.now()}-${uuid().substring(0, 5)}`;
    await db.run(
      `INSERT INTO version_history (id, projectId, versionNumber, summary, snapshot, createdBy) VALUES (?, ?, ?, ?, ?, ?)`,
      [rollbackVersionId, projectId, nextVersion, `Rollback to Version v${versionNumber}`, targetVer.snapshot, req.user?.userId || 'lead_designer']
    );

    await memoryService.addProjectMemory(
      projectId,
      'version_note',
      `Rolled back project to Version v${versionNumber}`,
      { restoredVersion: versionNumber, currentVersion: nextVersion }
    );

    res.json({
      success: true,
      currentVersion: nextVersion,
      restoredVersion: versionNumber,
      message: `Project successfully restored to Version v${versionNumber}.`,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Rollback failed' });
  }
});

// GET /api/projects/history -> Retrieve version history and audit log trail
router.get('/history', async (req, res) => {
  try {
    const projectId = String(req.query.projectId || 'default-project');
    const db = getDatabase();

    const versions = await db.all(`SELECT id, versionNumber, summary, proposalId, createdBy, createdAt FROM version_history WHERE projectId = ? ORDER BY versionNumber DESC LIMIT 20`, [projectId]);
    const proposals = await db.all(`SELECT id, agentRole, summary, affectedSystems, diff, status, appliedAt, createdAt FROM proposals WHERE projectId = ? ORDER BY createdAt DESC LIMIT 20`, [projectId]);

    res.json({ versions, proposals });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch history' });
  }
});

export default router;
