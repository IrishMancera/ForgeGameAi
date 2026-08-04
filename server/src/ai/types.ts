export type AgentRole =
  | 'planner'
  | 'architect'
  | 'balancer'
  | 'auditor'
  | 'psychologist'
  | 'documenter'
  | 'simulation'
  | 'telemetry'
  | 'qa'
  | 'game-director';

// Safety action levels — AI cannot exceed its assigned level autonomously
export type SafetyLevel =
  | 'observe'     // Read-only: explain findings
  | 'recommend'   // Suggest change + impact analysis, no writes
  | 'simulate'    // Run simulations against sandbox values
  | 'draft'       // Generate diffs and configuration proposals
  | 'sandbox'     // Apply to non-production environment
  | 'staging'     // Requires designated approver
  | 'production'; // Requires human approval + rollback snapshot

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revising';


export type PlanStatus = 'pending' | 'planning' | 'executing' | 'completed' | 'failed' | 'requires_approval';
export type StepStatus = 'pending' | 'executing' | 'completed' | 'failed';

export interface PlanStep {
  id: string;
  stepIndex: number;
  agentRole: AgentRole;
  description: string;
  status: StepStatus;
  confidence: number; // 0 to 100
  durationMs?: number;
  output?: string;
  affectedSystems?: string[];
  toolCalls?: ToolExecutionResult[];
}

export interface AgentPlan {
  id: string;
  projectId: string;
  prompt: string;
  plannerSummary: string;
  steps: PlanStep[];
  status: PlanStatus;
  confidence: number;
  reasoning: string;
  affectedSystems: string[];
  proposal?: AIProposal;
  requiresApproval: boolean;
  warnings?: string[];
  createdAt: string;
}

export interface AIProposal {
  id: string;
  projectId: string;
  planId?: string;
  agentRole: AgentRole;
  summary: string;
  affectedSystems: string[];
  diff: {
    module: string;
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  status: 'pending' | 'applied' | 'rejected';
  createdAt: string;
}

export interface ToolDefinition {
  name: string;
  category: 'READ' | 'ANALYSIS' | 'WRITE';
  description: string;
  parameters: Record<string, unknown>;
  requiresApproval?: boolean;
}

export interface ToolExecutionResult {
  toolName: string;
  category: 'READ' | 'ANALYSIS' | 'WRITE';
  inputs: Record<string, unknown>;
  output: unknown;
  success: boolean;
  error?: string;
}

export interface AIContext {
  projectId: string;
  activeWorkspace: string;
  projectSnapshot?: Record<string, unknown> | null;
  recentChanges?: Array<{ timestamp: string; action: string; details: string }>;
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; text: string }>;
  projectMemory: Array<{ type: string; content: string; metadata?: Record<string, unknown> }>;
  ragChunks: Array<{ documentId: string; documentType: string; snippet: string; score: number }>;
  dependencyMap: Record<string, string[]>;
  userRole?: string;
  projectVersion: number;
}

export interface StructuredAIResponse {
  summary: string;
  confidence: number;
  reasoning: string;
  affectedSystems: string[];
  recommendations: Array<{
    title: string;
    description: string;
    actionable: boolean;
  }>;
  toolCalls: ToolExecutionResult[];
  requiresApproval: boolean;
  warnings: string[];
  proposal?: AIProposal;
}

export interface SpecialistAgentConfig {
  role: AgentRole;
  name: string;
  description: string;
  allowedTools: string[];
  promptFile: string;
}
