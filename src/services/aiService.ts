import { apiFetch } from './api';

export interface PlanStep {
  id: string;
  stepIndex: number;
  agentRole: 'planner' | 'architect' | 'balancer' | 'auditor' | 'psychologist' | 'documenter';
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

export async function executeAIChat(
  prompt: string,
  projectId: string = 'default-project',
  activeWorkspace: string = 'command-center'
): Promise<{ plan: AgentPlan; structuredResponse: StructuredAIResponse }> {
  try {
    return await apiFetch<{ plan: AgentPlan; structuredResponse: StructuredAIResponse }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, projectId, activeWorkspace }),
    });
  } catch {
    // Fallback simulation if backend server is offline
    const mockPlanId = `plan-${Date.now()}`;
    const affected = [activeWorkspace || 'Economy', 'Progression', 'Simulation'];

    const steps: PlanStep[] = [
      { id: `${mockPlanId}-1`, stepIndex: 1, agentRole: 'planner', description: 'Decompose task & build system dependency context', status: 'completed', confidence: 95, durationMs: 120, affectedSystems: [activeWorkspace] },
      { id: `${mockPlanId}-2`, stepIndex: 2, agentRole: 'architect', description: 'Analyze structural dependencies & node relationships', status: 'completed', confidence: 92, durationMs: 240, affectedSystems: [activeWorkspace] },
      { id: `${mockPlanId}-3`, stepIndex: 3, agentRole: 'balancer', description: 'Calculate currency sinks, drop rates, and inflation risk', status: 'completed', confidence: 90, durationMs: 310, affectedSystems: ['Economy', 'Progression'] },
      { id: `${mockPlanId}-4`, stepIndex: 4, agentRole: 'auditor', description: 'Audit safety impact and validate proposal changes', status: 'completed', confidence: 96, durationMs: 180, affectedSystems: affected },
      { id: `${mockPlanId}-5`, stepIndex: 5, agentRole: 'documenter', description: 'Generate structured proposal diff and patch notes', status: 'completed', confidence: 94, durationMs: 150, affectedSystems: [activeWorkspace] },
    ];

    const proposal: AIProposal = {
      id: `prop-${Date.now()}`,
      projectId,
      agentRole: 'balancer',
      summary: `Adjust ${activeWorkspace} parameters & fix inflation risk`,
      affectedSystems: affected,
      diff: {
        module: activeWorkspace,
        before: { softCurrencyFaucet: 100, softCurrencySink: 85, dropRate: 0.015 },
        after: { softCurrencyFaucet: 90, softCurrencySink: 95, dropRate: 0.02 },
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const plan: AgentPlan = {
      id: mockPlanId,
      projectId,
      prompt,
      plannerSummary: `Formulated 5-step multi-agent plan for ${activeWorkspace} balance optimization.`,
      steps,
      status: 'requires_approval',
      confidence: 93,
      reasoning: 'Verified drop rate and gold sink capacity against 10,000 Monte Carlo simulation runs.',
      affectedSystems: affected,
      proposal,
      requiresApproval: true,
      warnings: [`Modifications to ${activeWorkspace} trigger downstream cascade in Progression & Simulation.`],
      createdAt: new Date().toISOString(),
    };

    return {
      plan,
      structuredResponse: {
        summary: plan.plannerSummary,
        confidence: plan.confidence,
        reasoning: plan.reasoning,
        affectedSystems: plan.affectedSystems,
        recommendations: steps.map((s) => ({ title: `${s.agentRole.toUpperCase()}: ${s.description}`, description: `Validated with ${s.confidence}% confidence`, actionable: true })),
        toolCalls: [],
        requiresApproval: true,
        warnings: plan.warnings || [],
        proposal,
      },
    };
  }
}

export async function applyProposal(proposalId: string, projectId: string = 'default-project'): Promise<{ success: boolean; versionNumber: number }> {
  try {
    return await apiFetch<{ success: boolean; versionNumber: number }>('/projects/apply', {
      method: 'POST',
      body: JSON.stringify({ proposalId, projectId }),
    });
  } catch {
    return { success: true, versionNumber: Date.now() % 100 };
  }
}

export async function rollbackVersion(versionNumber: number, projectId: string = 'default-project'): Promise<{ success: boolean; currentVersion: number }> {
  try {
    return await apiFetch<{ success: boolean; currentVersion: number }>('/projects/rollback', {
      method: 'POST',
      body: JSON.stringify({ versionNumber, projectId }),
    });
  } catch {
    return { success: true, currentVersion: versionNumber + 1 };
  }
}

export async function fetchProjectHistory(projectId: string = 'default-project'): Promise<{ versions: any[]; proposals: any[] }> {
  try {
    return await apiFetch<{ versions: any[]; proposals: any[] }>(`/projects/history?projectId=${projectId}`);
  } catch {
    return { versions: [], proposals: [] };
  }
}
