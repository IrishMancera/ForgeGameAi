import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { importValidator, IMPORT_SCHEMA } from '../services/importValidator.js';
import { getProject } from '../services/projectService.js';

const router = Router();
router.use(authMiddleware);

// GET /api/import/schema — Returns the 12 import categories and their required fields
router.get('/schema', (_req, res) => {
  res.json({ categories: IMPORT_SCHEMA });
});

// POST /api/import/validate/:projectId — Validate imported data against all 12 categories
router.post('/validate/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await getProject(projectId, req.user!.userId);
    if (!project) return res.status(403).json({ error: 'Unauthorized project access' });

    const payload = req.body as Record<string, unknown>;
    const result = await importValidator.validate(projectId, payload);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Import validation failed' });
  }
});

// GET /api/import/status/:projectId — Get latest import session status
router.get('/status/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await getProject(projectId, req.user!.userId);
    if (!project) return res.status(403).json({ error: 'Unauthorized project access' });

    const { getDatabase } = await import('../models/schema.js');
    const db = getDatabase();
    const session = await db.get(
      'SELECT * FROM import_sessions WHERE projectId = ? ORDER BY createdAt DESC LIMIT 1',
      [projectId]
    );

    if (!session) {
      return res.json({
        status: 'no_import',
        message: 'No import sessions found for this project.',
        categories: IMPORT_SCHEMA.map((s) => ({ key: s.key, label: s.label, required: s.required, status: 'not_provided' })),
      });
    }

    const details = typeof session.details === 'string' ? JSON.parse(session.details) : session.details;
    res.json({ status: session.status, summary: session.summary, ...details });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load import status' });
  }
});

export default router;
