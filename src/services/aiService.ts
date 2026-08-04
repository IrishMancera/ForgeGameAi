/**
 * Frontend AI Service
 *
 * All API calls throw real errors on failure — no silent mock fallbacks.
 * When the backend is offline or returns an error, the UI must show
 * an explicit error state, not silently substitute fake data.
 *
 * Per spec: "DO NOT silently fall back to fake AI or fake simulations in production."
 */
import { apiFetch } from './api';

export interface PlanStep {
  id: string;
  stepIndex: number;
  agentRole: string;
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  confidence: number;
  durationMs?: number;
  output?: string;
  affectedSystems?: string[];
  toolCalls?: any[];
}

export interface AIProposal {
  id: string;
  projectId: string;
  planId?: string;
  agentRole: string;
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

export interface AgentPlan {
  id: string;
  projectId: string;
  prompt: string;
  plannerSummary: string;
  steps: PlanStep[];
  status: 'pending' | 'planning' | 'executing' | 'completed' | 'failed' | 'requires_approval';
  confidence: number;
  reasoning: string;
  affectedSystems: string[];
  proposal?: AIProposal;
  requiresApproval: boolean;
  warnings?: string[];
  createdAt: string;
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
  toolCalls: any[];
  requiresApproval: boolean;
  warnings: string[];
  proposal?: AIProposal;
}

export interface AIStatusResponse {
  isDemo: boolean;
  model: string;
  message: string;
}

export interface AIChatResult {
  plan: AgentPlan;
  structuredResponse: StructuredAIResponse;
  aiContent: string;
  isDemo: boolean;
}

/**
 * Check current AI mode (demo vs live) from the backend.
 * Used to show the demo banner in the UI.
 */
export async function fetchAIStatus(): Promise<AIStatusResponse> {
  return apiFetch<AIStatusResponse>('/api/ai/status');
}

/**
 * Execute an AI chat request through the full orchestration pipeline.
 *
 * Throws on failure — callers must handle the error and show an appropriate
 * error state. Never falls back to fake data.
 */
export async function executeAIChat(
  prompt: string,
  projectId: string,
  activeWorkspace: string = 'command-center'
): Promise<AIChatResult> {
  // Real API call only — no mock fallback
  return apiFetch<AIChatResult>('/api/ai/chat', {
    method: 'POST',
    body: { prompt, projectId, activeWorkspace },
  });
}

/**
 * Apply an approved AI proposal to the project.
 *
 * Throws on failure — the caller must handle errors and NOT silently
 * report success when nothing was applied.
 */
export async function applyProposal(
  proposalId: string,
  projectId: string,
  environment: 'sandbox' | 'staging' | 'production' = 'sandbox'
): Promise<{ success: boolean; versionNumber: number; environment: string }> {
  return apiFetch<{ success: boolean; versionNumber: number; environment: string }>(
    '/api/projects/apply',
    {
      method: 'POST',
      body: { proposalId, projectId, environment },
    }
  );
}

/**
 * Rollback a project to a previous version.
 *
 * Throws on failure — never fake-reports success.
 */
export async function rollbackVersion(
  versionNumber: number,
  projectId: string
): Promise<{ success: boolean; currentVersion: number }> {
  return apiFetch<{ success: boolean; currentVersion: number }>(
    '/api/projects/rollback',
    {
      method: 'POST',
      body: { versionNumber, projectId },
    }
  );
}

/**
 * Fetch version history and proposals for a project.
 * Returns empty arrays on failure (safe read-only operation).
 */
export async function fetchProjectHistory(
  projectId: string
): Promise<{ versions: any[]; proposals: any[] }> {
  try {
    return await apiFetch<{ versions: any[]; proposals: any[] }>(
      `/api/projects/history?projectId=${encodeURIComponent(projectId)}`
    );
  } catch {
    return { versions: [], proposals: [] };
  }
}
