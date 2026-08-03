import { AgentPlan, PlanStep, AgentRole } from './types';
import { dependencyGraph } from './dependencyGraph';

export class Planner {
  public createPlan(projectId: string, prompt: string, activeWorkspace: string): AgentPlan {
    const planId = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const lower = prompt.toLowerCase();

    const primaryWorkspace = this.mapWorkspaceName(activeWorkspace);
    const affectedSystems = dependencyGraph.getAffectedSystems([primaryWorkspace]);
    if (!affectedSystems.includes(primaryWorkspace)) {
      affectedSystems.unshift(primaryWorkspace);
    }

    const steps: PlanStep[] = [];

    // Step 1: Architect / Planner structural inspection
    steps.push({
      id: `${planId}-step-1`,
      stepIndex: 1,
      agentRole: 'architect',
      description: `Analyze system structure and dependency tree for ${primaryWorkspace}`,
      status: 'pending',
      confidence: 94,
      affectedSystems: [primaryWorkspace],
    });

    // Step 2: Specialist agent based on query intent
    if (lower.includes('economy') || lower.includes('balance') || lower.includes('drop rate') || lower.includes('xp') || lower.includes('inflation')) {
      steps.push({
        id: `${planId}-step-2`,
        stepIndex: 2,
        agentRole: 'balancer',
        description: 'Calculate currency sinks, drop rate balance, and inflation risk',
        status: 'pending',
        confidence: 91,
        affectedSystems: ['Economy', 'Progression'],
      });
    } else if (lower.includes('retention') || lower.includes('psychology') || lower.includes('bartle') || lower.includes('player')) {
      steps.push({
        id: `${planId}-step-2`,
        stepIndex: 2,
        agentRole: 'psychologist',
        description: 'Evaluate Bartle motivation scores, retention curves, and engagement friction',
        status: 'pending',
        confidence: 89,
        affectedSystems: ['Retention', 'PlayerPsychology'],
      });
    } else {
      steps.push({
        id: `${planId}-step-2`,
        stepIndex: 2,
        agentRole: 'auditor',
        description: 'Scan system graph for orphan nodes, dead-ends, and risk severity flags',
        status: 'pending',
        confidence: 92,
        affectedSystems: affectedSystems,
      });
    }

    // Step 3: Auditor Verification
    steps.push({
      id: `${planId}-step-3`,
      stepIndex: 3,
      agentRole: 'auditor',
      description: 'Audit safety impact and validate proposal changes',
      status: 'pending',
      confidence: 95,
      affectedSystems: affectedSystems,
    });

    // Step 4: Documentation / Proposal Generation
    steps.push({
      id: `${planId}-step-4`,
      stepIndex: 4,
      agentRole: 'documenter',
      description: 'Generate structured proposal diff and update documentation',
      status: 'pending',
      confidence: 96,
      affectedSystems: [primaryWorkspace],
    });

    const isWriteRequest = lower.includes('update') || lower.includes('fix') || lower.includes('build') || lower.includes('change') || lower.includes('add') || lower.includes('create');

    return {
      id: planId,
      projectId,
      prompt,
      plannerSummary: `Formulated a ${steps.length}-step execution plan for ${primaryWorkspace} analysis and balance engineering.`,
      steps,
      status: 'pending',
      confidence: 93,
      reasoning: `Decomposed request into multi-agent sequence across ${affectedSystems.join(', ')}.`,
      affectedSystems,
      requiresApproval: isWriteRequest,
      warnings: isWriteRequest ? [`Proposed changes modify ${primaryWorkspace} and affect ${affectedSystems.join(', ')}.`] : [],
      createdAt: new Date().toISOString(),
    };
  }

  private mapWorkspaceName(workspace: string): string {
    const map: Record<string, string> = {
      'economy-lab': 'Economy',
      'progression': 'Progression',
      'systems': 'Systems',
      'player-psychology': 'Retention',
      'simulation': 'Simulation',
      'analytics': 'Analytics',
      'workbook-studio': 'Workbook',
      'game-blueprint': 'Blueprint',
    };
    return map[workspace] || 'Systems';
  }
}

export const planner = new Planner();
