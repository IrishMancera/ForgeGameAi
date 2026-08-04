import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { aiOrchestrator } from '../ai/orchestrator.js';
import { planner } from '../ai/planner.js';
import { toolExecutor, REGISTERED_TOOLS } from '../ai/toolExecutor.js';
import { getProject } from '../services/projectService.js';
import { getDatabase } from '../models/schema.js';
import { z } from 'zod';

const router = Router();

const chatSchema = z.object({
  projectId: z.string().default('default-project'),
  prompt: z.string().min(1),
  activeWorkspace: z.string().default('command-center'),
});

const toolSchema = z.object({
  toolName: z.string().min(1),
  inputs: z.record(z.unknown()).default({}),
  projectId: z.string().default('default-project'),
  activeWorkspace: z.string().default('command-center'),
});

router.use(authMiddleware);

// POST /api/ai/chat -> Full AI OS Orchestration Execution
router.post('/chat', async (req, res) => {
  try {
    const { projectId, prompt, activeWorkspace } = chatSchema.parse(req.body);
    
    const project = await getProject(projectId, req.user!.userId);
    if (!project) {
      return res.status(403).json({ error: 'Unauthorized project access' });
    }

    const result = await aiOrchestrator.executePlan(projectId, prompt, activeWorkspace);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'AI Orchestration failed' });
  }
});

// POST /api/ai/plan -> Generate Execution Plan only
router.post('/plan', async (req, res) => {
  try {
    const { projectId, prompt, activeWorkspace } = chatSchema.parse(req.body);

    const project = await getProject(projectId, req.user!.userId);
    if (!project) {
      return res.status(403).json({ error: 'Unauthorized project access' });
    }

    const agentPlan = planner.createPlan(projectId, prompt, activeWorkspace);
    res.status(201).json({ plan: agentPlan });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Plan generation failed' });
  }
});

// POST /api/ai/tool -> Direct Tool Execution with Role & Safety Verification
router.post('/tool', async (req, res) => {
  try {
    const { toolName, inputs, projectId, activeWorkspace } = toolSchema.parse(req.body);

    const project = await getProject(projectId, req.user!.userId);
    if (!project) {
      return res.status(403).json({ error: 'Unauthorized project access' });
    }

    const toolDef = REGISTERED_TOOLS.find((t) => t.name === toolName);

    if (!toolDef) {
      return res.status(404).json({ error: `Tool ${toolName} not registered` });
    }

    if (toolDef.requiresApproval) {
      return res.json({
        requiresApproval: true,
        toolName,
        message: `Tool ${toolName} requires explicit proposal approval before execution.`,
        proposal: {
          id: `prop-${Date.now()}`,
          projectId,
          agentRole: 'architect',
          summary: `Proposal for ${toolName}`,
          diff: { module: activeWorkspace, before: {}, after: inputs },
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      });
    }

    const result = await toolExecutor.executeTool(toolName, inputs, projectId, activeWorkspace);
    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Tool execution failed' });
  }
});

// POST /api/ai/monitor — Protocol 15: Monitor results after approved change
router.post('/monitor', async (req, res) => {
  try {
    const { projectId, proposalId, actualMetrics } = req.body;
    if (!projectId || !proposalId || !actualMetrics) {
      return res.status(400).json({ error: 'projectId, proposalId, and actualMetrics are required' });
    }
    const project = await getProject(projectId, req.user!.userId);
    if (!project) return res.status(403).json({ error: 'Unauthorized project access' });

    const result = await aiOrchestrator.monitorAppliedChange(projectId, proposalId, actualMetrics);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Monitoring failed' });
  }
});

// GET /api/ai/status — Returns demo mode status for frontend banner
router.get('/status', async (_req, res) => {
  const { config } = await import('../config.js');
  res.json({
    isDemo: !config.openai?.apiKey,
    model: config.openai?.apiKey ? 'gpt-4o-mini' : 'demo',
    message: config.openai?.apiKey
      ? 'Live AI mode active.'
      : '⚠️ DEMO MODE — Set OPENAI_API_KEY in server/.env for live analysis.',
  });
});

export default router;

