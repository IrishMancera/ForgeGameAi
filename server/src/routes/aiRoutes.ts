import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { aiOrchestrator } from '../ai/orchestrator.js';
import { planner } from '../ai/planner.js';
import { toolExecutor, REGISTERED_TOOLS } from '../ai/toolExecutor.js';
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

export default router;
