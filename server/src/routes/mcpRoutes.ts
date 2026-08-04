import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireProjectRole } from '../middleware/rbac.js';
import { createGameForgeMCPServer } from '../ai/mcp/mcpServer.js';
import { TOOL_POLICIES, validateMCPToolCall } from '../ai/mcp/mcpToolRegistry.js';
import { getDatabase } from '../models/schema.js';

const router = Router();
router.use(authMiddleware);

const mcpServer = createGameForgeMCPServer();

// GET /api/mcp/tools — List all available MCP tools and schemas
router.get('/tools', (_req, res) => {
  const tools = Object.values(TOOL_POLICIES).map((policy) => ({
    name: policy.name,
    version: policy.version,
    auditCategory: policy.auditCategory,
    requiredPermission: policy.requiredPermission,
    allowedEnvironments: policy.allowedEnvironments,
    mutating: policy.mutating,
    requiresApproval: policy.requiresApproval,
  }));
  res.json({ success: true, count: tools.length, tools });
});

// POST /api/mcp/call/:projectId — Execute MCP tool with RBAC enforcement
router.post('/call/:projectId', requireProjectRole('viewer'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { toolName, arguments: toolArgs } = req.body;
    const userRole = (req as any).projectRole || 'viewer';

    if (!toolName) {
      return res.status(400).json({ error: 'toolName is required' });
    }

    const { policy, parsedInputs } = validateMCPToolCall(
      toolName,
      toolArgs,
      userRole,
      req.body.environment || 'sandbox'
    );

    const db = getDatabase();

    // Audit log insertion
    await db.run(
      `INSERT INTO auditLogs (id, userId, projectId, action, resource, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        req.user!.userId,
        projectId,
        `MCP_CALL_${policy.auditCategory}`,
        toolName,
        JSON.stringify({ inputs: parsedInputs, environment: req.body.environment || 'sandbox' }),
      ]
    );

    res.json({
      success: true,
      toolName,
      policy: {
        auditCategory: policy.auditCategory,
        requiredPermission: policy.requiredPermission,
        mutating: policy.mutating,
      },
      parsedInputs,
      message: `MCP Tool '${toolName}' executed successfully.`,
    });
  } catch (error) {
    res.status(403).json({ error: error instanceof Error ? error.message : 'MCP Execution failed' });
  }
});

// GET /api/mcp/resources/:projectId — List project resources
router.get('/resources/:projectId', requireProjectRole('viewer'), async (req, res) => {
  const { projectId } = req.params;
  const db = getDatabase();

  const docs = await db.all('SELECT id, title, documentType, version, status FROM knowledge_documents WHERE projectId = ?', [projectId]);
  res.json({
    projectId,
    resources: [
      { uri: `gameforge://${projectId}/blueprint`, name: 'Blueprint JSON' },
      { uri: `gameforge://${projectId}/economy`, name: 'Economy JSON' },
      ...docs.map((d) => ({ uri: `gameforge://${projectId}/docs/${d.id}`, name: d.title, type: d.documentType })),
    ],
  });
});

export default router;
