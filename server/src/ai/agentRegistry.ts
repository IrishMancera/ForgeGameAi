import { AgentRole, SpecialistAgentConfig } from './types';
import { loadPrompt } from './promptLoader';

class AgentRegistry {
  private agents: Map<AgentRole, SpecialistAgentConfig> = new Map();

  constructor() {
    this.registerDefaultAgents();
  }

  private registerDefaultAgents(): void {
    this.registerAgent({
      role: 'planner',
      name: 'Planner Agent',
      description: 'Decomposes complex game design requests into structured agent execution steps.',
      allowedTools: ['getProjectSnapshot', 'findDependencies', 'searchKnowledge'],
      promptFile: 'planner.md',
    });

    this.registerAgent({
      role: 'architect',
      name: 'Systems Architect',
      description: 'Designs core mechanics, loop structures, and node interaction maps.',
      allowedTools: ['getProjectSnapshot', 'findDependencies', 'createTable', 'updateEconomy'],
      promptFile: 'architect.md',
    });

    this.registerAgent({
      role: 'balancer',
      name: 'Economy & Progression Balancer',
      description: 'Calculates economy sinks, drop rates, gacha math, and XP curves.',
      allowedTools: ['getEconomy', 'getProgression', 'calculateEconomy', 'detectInflation', 'validateBalance', 'runMonteCarlo', 'updateEconomy', 'updateWorkbook'],
      promptFile: 'balancer.md',
    });

    this.registerAgent({
      role: 'auditor',
      name: 'Systems Auditor',
      description: 'Detects inconsistencies, orphan nodes, exploit vectors, and balance flaws.',
      allowedTools: ['getAuditResults', 'findDependencies', 'detectInflation', 'validateBalance', 'createAuditEntry'],
      promptFile: 'auditor.md',
    });

    this.registerAgent({
      role: 'psychologist',
      name: 'Player Psychology Specialist',
      description: 'Analyzes retention, Bartle archetypes, motivation curves, and ethical monetization.',
      allowedTools: ['estimateRetention', 'getAnalytics', 'searchKnowledge'],
      promptFile: 'psychologist.md',
    });

    this.registerAgent({
      role: 'documenter',
      name: 'Documentation & Spreadsheet Engine',
      description: 'Generates GDD documents, patch notes, change logs, and XLSX workbooks.',
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
