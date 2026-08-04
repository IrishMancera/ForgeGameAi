import { z } from 'zod';

export interface GameForgeToolPolicy {
  name: string;
  version: string;
  inputSchema: z.ZodTypeAny;
  outputSchema: z.ZodTypeAny;
  requiredPermission: 'viewer' | 'editor' | 'admin' | 'owner';
  allowedEnvironments: Array<'sandbox' | 'staging' | 'production'>;
  mutating: boolean;
  requiresApproval: boolean;
  idempotent: boolean;
  maximumExecutionMs: number;
  maximumRows: number;
  auditCategory: string;
}

export const TOOL_POLICIES: Record<string, GameForgeToolPolicy> = {
  project_get: {
    name: 'project_get',
    version: '1.0.0',
    inputSchema: z.object({ projectId: z.string() }),
    outputSchema: z.object({ project: z.record(z.unknown()) }),
    requiredPermission: 'viewer',
    allowedEnvironments: ['sandbox', 'staging', 'production'],
    mutating: false,
    requiresApproval: false,
    idempotent: true,
    maximumExecutionMs: 5000,
    maximumRows: 1,
    auditCategory: 'PROJECT_READ',
  },
  knowledge_search: {
    name: 'knowledge_search',
    version: '1.0.0',
    inputSchema: z.object({ projectId: z.string(), query: z.string(), topK: z.number().optional().default(4) }),
    outputSchema: z.object({ results: z.array(z.record(z.unknown())) }),
    requiredPermission: 'viewer',
    allowedEnvironments: ['sandbox', 'staging', 'production'],
    mutating: false,
    requiresApproval: false,
    idempotent: true,
    maximumExecutionMs: 5000,
    maximumRows: 10,
    auditCategory: 'KNOWLEDGE_SEARCH',
  },
  economy_calculate: {
    name: 'economy_calculate',
    version: '1.0.0',
    inputSchema: z.object({ faucets: z.number(), sinks: z.number() }),
    outputSchema: z.object({ faucets: z.number(), sinks: z.number(), inflationRate: z.number(), risk: z.string() }),
    requiredPermission: 'viewer',
    allowedEnvironments: ['sandbox', 'staging', 'production'],
    mutating: false,
    requiresApproval: false,
    idempotent: true,
    maximumExecutionMs: 2000,
    maximumRows: 1,
    auditCategory: 'ECONOMY_CALCULATE',
  },
  simulation_run: {
    name: 'simulation_run',
    version: '1.0.0',
    inputSchema: z.object({ projectId: z.string(), iterations: z.number().optional().default(10000), seed: z.number().optional() }),
    outputSchema: z.object({ percentiles: z.record(z.number()), durationMs: z.number(), status: z.string() }),
    requiredPermission: 'editor',
    allowedEnvironments: ['sandbox', 'staging'],
    mutating: false,
    requiresApproval: false,
    idempotent: true,
    maximumExecutionMs: 10000,
    maximumRows: 1,
    auditCategory: 'SIMULATION_EXECUTE',
  },
  proposal_create: {
    name: 'proposal_create',
    version: '1.0.0',
    inputSchema: z.object({ projectId: z.string(), agentRole: z.string(), summary: z.string(), diff: z.record(z.unknown()) }),
    outputSchema: z.object({ proposalId: z.string(), status: z.string() }),
    requiredPermission: 'editor',
    allowedEnvironments: ['sandbox', 'staging', 'production'],
    mutating: true,
    requiresApproval: true,
    idempotent: false,
    maximumExecutionMs: 5000,
    maximumRows: 1,
    auditCategory: 'PROPOSAL_CREATE',
  },
};

export function validateMCPToolCall(toolName: string, inputs: unknown, userRole: string, environment: string = 'sandbox') {
  const policy = TOOL_POLICIES[toolName];
  if (!policy) {
    throw new Error(`MCP Security Exception: Tool '${toolName}' is unregistered and strictly forbidden.`);
  }

  // Permission Check
  const roleHierarchy: Record<string, number> = { viewer: 1, editor: 2, admin: 3, owner: 4 };
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[policy.requiredPermission] || 4;

  if (userLevel < requiredLevel) {
    throw new Error(`MCP Security Exception: Action requires '${policy.requiredPermission}' role. Your role: '${userRole}'.`);
  }

  // Environment Check
  if (!policy.allowedEnvironments.includes(environment as any)) {
    throw new Error(`MCP Security Exception: Tool '${toolName}' is not allowed in environment '${environment}'.`);
  }

  // Input Schema Validation via Zod
  const parsedInputs = policy.inputSchema.parse(inputs);
  return { policy, parsedInputs };
}
