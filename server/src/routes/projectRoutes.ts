import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { createProject, getProject, getUserProjects, updateProject, updateProjectModule, deleteProject } from '../services/projectService.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  genre: z.string().optional(),
  targetPlatform: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  genre: z.string().optional(),
  targetPlatform: z.string().optional(),
  systemHealth: z.number().int().min(0).max(100).optional(),
  blueprintComplete: z.number().int().min(0).max(100).optional(),
  criticalRisks: z.number().int().min(0).optional(),
  openDecisions: z.number().int().min(0).optional(),
});

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const projects = await getUserProjects(req.user!.userId);
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load projects' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = createSchema.parse(req.body);
    const project = await createProject(req.user!.userId, data.name, data.genre, data.targetPlatform);
    res.status(201).json({ project });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

router.get('/:projectId', async (req, res) => {
  try {
    const project = await getProject(req.params.projectId, req.user!.userId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load project' });
  }
});

router.get('/:projectId/modules/:moduleName', async (req, res) => {
  try {
    const project = await getProject(req.params.projectId, req.user!.userId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const moduleName = req.params.moduleName as keyof typeof project;
    const data = project[moduleName] ?? null;
    res.json({ module: req.params.moduleName, data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load project module' });
  }
});

router.put('/:projectId/modules/:moduleName', async (req, res) => {
  try {
    const project = await updateProjectModule(
      req.params.projectId,
      req.user!.userId,
      req.params.moduleName,
      req.body
    );
    res.json({ project, module: req.params.moduleName, data: req.body });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

router.patch('/:projectId', async (req, res) => {
  try {
    const data = updateSchema.parse(req.body);
    const project = await updateProject(req.params.projectId, req.user!.userId, data);
    res.json({ project });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

router.delete('/:projectId', async (req, res) => {
  try {
    await deleteProject(req.params.projectId, req.user!.userId);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

export default router;
