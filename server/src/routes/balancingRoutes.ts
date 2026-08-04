import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireNonViewer, requireProjectRole } from '../middleware/rbac.js';
import { balancingEngine } from '../services/balancingEngine.js';
import { getProject } from '../services/projectService.js';

const router = Router();
router.use(authMiddleware);

// POST /api/balancing/run/:projectId — Run deterministic balance analysis (requires editor+)
router.post('/run/:projectId', requireNonViewer, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await getProject(projectId, req.user!.userId);
    if (!project) return res.status(403).json({ error: 'Unauthorized project access' });

    // Use project module data from DB
    const projectData: Record<string, unknown> = {
      economy: project.economy,
      progression: project.progression,
      analytics: project.analytics,
      psychology: project.psychology,
    };

    const report = await balancingEngine.runReport(projectId, projectData);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Balancing analysis failed' });
  }
});

// GET /api/balancing/report/:projectId — Get latest balance report from audit log
router.get('/report/:projectId', requireProjectRole('viewer'), async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await getProject(projectId, req.user!.userId);
    if (!project) return res.status(403).json({ error: 'Unauthorized project access' });

    const { getDatabase } = await import('../models/schema.js');
    const db = getDatabase();

    const report = await db.get(
      `SELECT * FROM agent_plans WHERE projectId = ? AND prompt = 'AUTOMATIC_BALANCE_REPORT'
       ORDER BY createdAt DESC LIMIT 1`,
      [projectId]
    );

    if (!report) {
      return res.json({ message: 'No balance report generated yet. POST /api/balancing/run/:projectId to generate one.' });
    }

    res.json({
      reportId: report.id,
      summary: report.plannerSummary,
      overallHealth: report.confidence,
      generatedAt: report.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load balance report' });
  }
});

export default router;
