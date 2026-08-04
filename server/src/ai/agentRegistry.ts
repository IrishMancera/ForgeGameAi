import { AgentRole, SpecialistAgentConfig } from './types.js';
import { loadPrompt } from './promptLoader.js';

class AgentRegistry {
  private agents: Map<AgentRole, SpecialistAgentConfig> = new Map();

  constructor() {
    this.registerDefaultAgents();
  }

  private registerDefaultAgents(): void {
    // ── ORCHESTRATOR ──────────────────────────────────────────────────────────
    this.registerAgent({
      role: 'game-director',
      name: 'Game Director',
      description: 'Central intelligence. Understands the full game and coordinates all specialist agents.',
      allowedTools: ['getProjectSnapshot', 'searchKnowledge', 'findDependencies', 'getAnalytics'],
      promptFile: 'game-director.md',
    });

    this.registerAgent({
      role: 'planner',
      name: 'Planner Agent',
      description: 'Decomposes requests into structured multi-agent execution plans.',
      allowedTools: ['getProjectSnapshot', 'findDependencies', 'searchKnowledge'],
      promptFile: 'planner.md',
    });

    // ── DESIGN & SYSTEMS ──────────────────────────────────────────────────────
    this.registerAgent({
      role: 'architect',
      name: 'Systems Designer',
      description: 'Maps game mechanics, loops, node dependencies, and detects bottlenecks.',
      allowedTools: ['getProjectSnapshot', 'findDependencies', 'createTable', 'updateEconomy'],
      promptFile: 'architect.md',
    });

    // ── ECONOMY & BALANCE ─────────────────────────────────────────────────────
    this.registerAgent({
      role: 'balancer',
      name: 'Economy Analyst',
      description: 'Analyzes currencies, faucets, sinks, prices, and monetization. Detects inflation and scarcity.',
      allowedTools: ['getEconomy', 'getProgression', 'calculateEconomy', 'detectInflation', 'validateBalance', 'runMonteCarlo', 'updateEconomy', 'updateWorkbook', 'runBalancingEngine'],
      promptFile: 'balancer.md',
    });

    // ── SIMULATION ────────────────────────────────────────────────────────────
    this.registerAgent({
      role: 'simulation',
      name: 'Simulation Agent',
      description: 'Runs Monte Carlo and cohort simulations to test predictions before production.',
      allowedTools: ['runMonteCarlo', 'getProgression', 'getEconomy', 'getProjectSnapshot', 'searchKnowledge'],
      promptFile: 'simulation.md',
    });

    // ── TELEMETRY ─────────────────────────────────────────────────────────────
    this.registerAgent({
      role: 'telemetry',
      name: 'Telemetry Analyst',
      description: 'Analyzes real player behavior. Identifies churn, anomalies, and design vs reality gaps.',
      allowedTools: ['getAnalytics', 'getTelemetryEvents', 'getProjectSnapshot', 'searchKnowledge'],
      promptFile: 'telemetry.md',
    });

    // ── PLAYER EXPERIENCE ─────────────────────────────────────────────────────
    this.registerAgent({
      role: 'psychologist',
      name: 'Player Experience Agent',
      description: 'Evaluates motivation, fairness, accessibility, and ethical monetization pressure.',
      allowedTools: ['estimateRetention', 'getAnalytics', 'searchKnowledge', 'getTelemetryEvents'],
      promptFile: 'psychologist.md',
    });

    // ── QA ────────────────────────────────────────────────────────────────────
    this.registerAgent({
      role: 'qa',
      name: 'QA Agent',
      description: 'Creates test scenarios and validates proposed changes against regression suites.',
      allowedTools: ['validateBalance', 'getProjectSnapshot', 'getEconomy', 'getProgression', 'searchKnowledge'],
      promptFile: 'qa.md',
    });

    // ── AUDIT & COMPLIANCE ────────────────────────────────────────────────────
    this.registerAgent({
      role: 'auditor',
      name: 'Audit Agent',
      description: 'Reviews technical, data-privacy, and compliance risks. Detects security and ethical violations.',
      allowedTools: ['getAuditResults', 'findDependencies', 'detectInflation', 'validateBalance', 'createAuditEntry', 'searchKnowledge'],
      promptFile: 'auditor.md',
    });

    // ── DOCUMENTATION ─────────────────────────────────────────────────────────
    this.registerAgent({
      role: 'documenter',
      name: 'Documentation Agent',
      description: 'Maintains GDDs, formulas, patch notes, and decisions with source citations.',
      allowedTools: ['searchKnowledge', 'searchWorkbook', 'updateWorkbook', 'generateSpreadsheet', 'createTable'],
      promptFile: 'documenter.md',
    });
  }

  public registerAgent(config: SpecialistAgentConfig): void {
    this.agents.set(config.role, config);
  }

  public getAgent(role: AgentRole): SpecialistAgentConfig | undefined {
    return this.agents.get(role);
  }

  public getSystemPrompt(role: AgentRole): string {
    const agent = this.agents.get(role);
    if (!agent) return '';
    return loadPrompt(agent.promptFile);
  }

  public getAllAgents(): SpecialistAgentConfig[] {
    return Array.from(this.agents.values());
  }
}

export const agentRegistry = new AgentRegistry();
