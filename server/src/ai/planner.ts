import { AgentPlan, PlanStep, AgentRole } from './types.js';
import { dependencyGraph } from './dependencyGraph.js';

// ─── Import data category definitions (matches the 12-step recommended order) ─
export const IMPORT_CATEGORIES = [
  { key: 'project_profile',       label: 'Project Profile & Design Pillars',           required: true  },
  { key: 'gdd',                   label: 'Game Design Document & Design Decisions',     required: true  },
  { key: 'economy',               label: 'Economy: Currencies, Faucets, Sinks & Prices', required: true },
  { key: 'items',                 label: 'Items, Drops, Crafting & Upgrade Tables',     required: true  },
  { key: 'progression',           label: 'XP, Levels, Difficulty & Unlock Configuration', required: true },
  { key: 'player_cohorts',        label: 'Player Cohort Definitions',                   required: true  },
  { key: 'analytics_dictionary',  label: 'Analytics Event Dictionary',                  required: true  },
  { key: 'telemetry',             label: '30–90 Days Anonymized Telemetry',             required: false },
  { key: 'patch_history',         label: 'Patch & Configuration History',               required: false },
  { key: 'monetization_policy',   label: 'Monetization, Privacy & Ethical-Design Policies', required: true },
  { key: 'architecture_docs',     label: 'Architecture, API & Database Documentation',  required: false },
  { key: 'known_issues',          label: 'Known Problems, Targets & Upcoming Milestones', required: false },
];

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

    // ── STEP 1: Game Director — Context resolution & data retrieval ───────────
    steps.push({
      id: `${planId}-step-1`,
      stepIndex: 1,
      agentRole: 'game-director',
      description: `Identify project context, user role, environment, and retrieve approved knowledge for: "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}"`,
      status: 'pending',
      confidence: 96,
      affectedSystems: [primaryWorkspace],
    });

    // ── STEP 2: Specialist Agent — intent-based routing ───────────────────────
    const specialistStep = this.resolveSpecialistStep(planId, lower, primaryWorkspace, affectedSystems);
    steps.push(specialistStep);

    // ── STEP 3: Simulation — if data-dependent prediction needed ──────────────
    const needsSimulation = lower.includes('simulat') || lower.includes('predict') ||
      lower.includes('what if') || lower.includes('drop rate') || lower.includes('inflation') ||
      lower.includes('probability') || lower.includes('monte carlo') || lower.includes('balance');
    if (needsSimulation) {
      steps.push({
        id: `${planId}-step-3`,
        stepIndex: 3,
        agentRole: 'simulation',
        description: 'Run Monte Carlo simulation to validate predictions with confidence intervals',
        status: 'pending',
        confidence: 88,
        affectedSystems: ['Simulation', 'Economy', 'Progression'],
      });
    }

    // ── STEP 4: Telemetry — compare design intent vs live data ────────────────
    const needsTelemetry = lower.includes('retention') || lower.includes('churn') ||
      lower.includes('funnel') || lower.includes('telemetry') || lower.includes('player behavior') ||
      lower.includes('analytics') || lower.includes('d1') || lower.includes('d7') || lower.includes('d30');
    if (needsTelemetry) {
      steps.push({
        id: `${planId}-step-${steps.length + 1}`,
        stepIndex: steps.length + 1,
        agentRole: 'telemetry',
        description: 'Analyze real player telemetry and compare against designed targets by cohort',
        status: 'pending',
        confidence: 85,
        affectedSystems: ['Analytics', 'Retention'],
      });
    }

    // ── STEP (n-2): QA — validation before proposal ───────────────────────────
    const isWriteRequest = lower.includes('update') || lower.includes('fix') ||
      lower.includes('change') || lower.includes('add') || lower.includes('create') ||
      lower.includes('reduce') || lower.includes('increase') || lower.includes('adjust') ||
      lower.includes('proposal') || lower.includes('apply');
    if (isWriteRequest) {
      steps.push({
        id: `${planId}-step-qa`,
        stepIndex: steps.length + 1,
        agentRole: 'qa',
        description: 'Generate regression test suite and validate change does not break approved design pillars',
        status: 'pending',
        confidence: 93,
        affectedSystems: affectedSystems,
      });
    }

    // ── STEP (n-1): Auditor — safety & compliance check ───────────────────────
    steps.push({
      id: `${planId}-step-audit`,
      stepIndex: steps.length + 1,
      agentRole: 'auditor',
      description: 'Audit safety, compliance, ethical constraints, and rollback feasibility',
      status: 'pending',
      confidence: 95,
      affectedSystems: affectedSystems,
    });

    // ── STEP (n): Documenter — generate proposal + update docs ────────────────
    steps.push({
      id: `${planId}-step-doc`,
      stepIndex: steps.length + 1,
      agentRole: 'documenter',
      description: 'Generate structured Change Proposal with old/new values, impact analysis, and rollback instructions',
      status: 'pending',
      confidence: 97,
      affectedSystems: [primaryWorkspace],
    });

    const requiresApproval = isWriteRequest;

    return {
      id: planId,
      projectId,
      prompt,
      plannerSummary: `${steps.length}-step plan: Game Director context retrieval → ${specialistStep.agentRole.toUpperCase()} analysis${needsSimulation ? ' → Simulation' : ''}${needsTelemetry ? ' → Telemetry' : ''} → ${isWriteRequest ? 'QA Validation → ' : ''}Audit → Proposal Documentation.`,
      steps,
      status: 'pending',
      confidence: 93,
      reasoning: `Decomposed request across ${affectedSystems.join(', ')}. ${requiresApproval ? 'Write operations detected — proposal and human approval required.' : 'Read-only analysis — no approval required.'}`,
      affectedSystems,
      requiresApproval,
      warnings: requiresApproval
        ? [`Proposed changes affect ${primaryWorkspace} and downstream systems: ${affectedSystems.join(', ')}. Human approval required before any staging or production deployment.`]
        : [],
      createdAt: new Date().toISOString(),
    };
  }

  private resolveSpecialistStep(
    planId: string,
    lower: string,
    primaryWorkspace: string,
    affectedSystems: string[]
  ): PlanStep {
    const stepId = `${planId}-step-2`;
    const base = { id: stepId, stepIndex: 2, status: 'pending' as const };

    // Economy & Balance
    if (lower.includes('economy') || lower.includes('balance') || lower.includes('sink') ||
        lower.includes('faucet') || lower.includes('coin') || lower.includes('gold') ||
        lower.includes('currency') || lower.includes('inflation') || lower.includes('reward')) {
      return { ...base, agentRole: 'balancer', confidence: 92,
        description: 'Analyze currency faucets, sinks, inflation risk, and drop rate balance by cohort',
        affectedSystems: ['Economy', 'Progression', 'Simulation'] };
    }

    // Progression & Difficulty
    if (lower.includes('xp') || lower.includes('level') || lower.includes('difficulty') ||
        lower.includes('progression') || lower.includes('grind') || lower.includes('unlock') ||
        lower.includes('content') || lower.includes('curve')) {
      return { ...base, agentRole: 'balancer', confidence: 90,
        description: 'Evaluate XP scaling curves, difficulty spikes, grind walls, and unlock pacing by cohort',
        affectedSystems: ['Progression', 'Economy'] };
    }

    // Telemetry & Retention
    if (lower.includes('retention') || lower.includes('churn') || lower.includes('player') ||
        lower.includes('session') || lower.includes('funnel') || lower.includes('d7') || lower.includes('d30')) {
      return { ...base, agentRole: 'telemetry', confidence: 87,
        description: 'Analyze real player behavior telemetry and retention funnels by segment',
        affectedSystems: ['Analytics', 'Retention'] };
    }

    // Psychology & Ethics
    if (lower.includes('psychology') || lower.includes('bartle') || lower.includes('motivation') ||
        lower.includes('ethical') || lower.includes('fairness') || lower.includes('paywall') ||
        lower.includes('frustration') || lower.includes('dark pattern')) {
      return { ...base, agentRole: 'psychologist', confidence: 89,
        description: 'Evaluate Bartle motivations, engagement friction, and ethical monetization compliance',
        affectedSystems: ['PlayerPsychology', 'Retention', 'AuditCenter'] };
    }

    // Simulation
    if (lower.includes('simulat') || lower.includes('monte carlo') || lower.includes('predict') ||
        lower.includes('probability') || lower.includes('what if')) {
      return { ...base, agentRole: 'simulation', confidence: 88,
        description: 'Run Monte Carlo simulation with P10/P50/P90 confidence intervals',
        affectedSystems: ['Simulation', 'Economy'] };
    }

    // Systems & Architecture
    if (lower.includes('system') || lower.includes('loop') || lower.includes('depend') ||
        lower.includes('mechanic') || lower.includes('blueprint') || lower.includes('architecture')) {
      return { ...base, agentRole: 'architect', confidence: 91,
        description: 'Analyze system dependency graph, detect broken loops and bottlenecks',
        affectedSystems: ['Systems', primaryWorkspace] };
    }

    // QA & Testing
    if (lower.includes('test') || lower.includes('validate') || lower.includes('regress') ||
        lower.includes('qa') || lower.includes('bug') || lower.includes('rollback')) {
      return { ...base, agentRole: 'qa', confidence: 94,
        description: 'Generate test scenarios and validate proposal against approved design pillars',
        affectedSystems: affectedSystems };
    }

    // Import & Data Validation
    if (lower.includes('import') || lower.includes('upload') || lower.includes('gdd') ||
        lower.includes('document') || lower.includes('knowledge base') || lower.includes('contradict')) {
      return { ...base, agentRole: 'documenter', confidence: 93,
        description: 'Validate imported data categories, check for contradictions, and establish baseline',
        affectedSystems: ['KnowledgeBase', 'Blueprint'] };
    }

    // Default: Auditor for unknown requests
    return { ...base, agentRole: 'auditor', confidence: 90,
      description: `Audit ${primaryWorkspace} for risks, inconsistencies, and design violations`,
      affectedSystems: affectedSystems };
  }

  private mapWorkspaceName(workspace: string): string {
    const map: Record<string, string> = {
      'economy-lab': 'Economy',
      'progression': 'Progression',
      'systems': 'Systems',
      'player-psychology': 'PlayerPsychology',
      'simulation': 'Simulation',
      'analytics': 'Analytics',
      'workbook-studio': 'Workbook',
      'game-blueprint': 'Blueprint',
      'knowledge-base': 'KnowledgeBase',
      'audit-center': 'AuditCenter',
      'command-center': 'Systems',
    };
    return map[workspace] || 'Systems';
  }
}

export const planner = new Planner();
