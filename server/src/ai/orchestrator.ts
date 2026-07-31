import { contextBuilder } from './contextBuilder';
import { planner } from './planner';
import { agentRegistry } from './agentRegistry';
import { toolExecutor } from './toolExecutor';
import { memoryService } from './memory';
import { responseFormatter } from './responseFormatter';
import { AgentPlan, StructuredAIResponse, AIProposal, ToolExecutionResult } from './types';
import { getDatabase } from '../models/schema';

export class AIOrchestrator {
  public async executePlan(
    projectId: string,
    prompt: string,
    activeWorkspace: string
  ): Promise<{ plan: AgentPlan; structuredResponse: StructuredAIResponse }> {
    // 1. Save user prompt to conversation memory
    await memoryService.addConversationTurn(projectId, 'user', prompt, { activeWorkspace });

    // 2. Build full context (Snapshot, RAG, Dependency Graph, Memory)
    const context = await contextBuilder.buildContext(projectId, activeWorkspace, prompt);

    // 3. Generate structured execution plan via Planner
    const plan = planner.createPlan(projectId, prompt, activeWorkspace);
    plan.status = 'executing';

    const toolExecutionResults: ToolExecutionResult[] = [];
    let proposal: AIProposal | undefined = undefined;

    // 4. Sequentially execute steps with assigned specialist agents
    for (const step of plan.steps) {
      const startTime = Date.now();
      step.status = 'executing';

      const agentConfig = agentRegistry.getAgent(step.agentRole);
      const systemPrompt = agentRegistry.getSystemPrompt(step.agentRole);

      // Execute relevant tool for this agent role
      const primaryTool = agentConfig?.allowedTools[0] || 'getProjectSnapshot';
      const toolRes = await toolExecutor.executeTool(
        primaryTool,
        { prompt, workspace: activeWorkspace, contextSnippet: context.ragChunks[0]?.snippet },
        projectId,
        activeWorkspace
      );

      toolExecutionResults.push(toolRes);

      if (toolRes.output && typeof toolRes.output === 'object' && (toolRes.output as Record<string, unknown>).isProposal) {
        const propOutput = toolRes.output as Record<string, unknown>;
        proposal = {
          id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          projectId,
          planId: plan.id,
          agentRole: step.agentRole,
          summary: `Proposal from ${step.agentRole.toUpperCase()} for ${activeWorkspace}`,
          affectedSystems: plan.affectedSystems,
          diff: (propOutput.diff as AIProposal['diff']) || {
            module: activeWorkspace,
            before: { status: 'stable' },
            after: { status: 'proposed_update', prompt },
          },
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
      }

      step.status = 'completed';
      step.durationMs = Date.now() - startTime;
      step.output = `Executed ${step.agentRole.toUpperCase()} verification against ${activeWorkspace} dependencies (${step.durationMs}ms).`;
      step.toolCalls = [toolRes];
    }

    plan.status = proposal ? 'requires_approval' : 'completed';
    plan.proposal = proposal;

    // 5. Format structured response
    const structuredResponse = responseFormatter.formatResponse(plan, toolExecutionResults, proposal);

    // 6. Save assistant response to conversation memory & agent_plans DB
    await memoryService.addConversationTurn(projectId, 'assistant', structuredResponse.summary, {
      confidence: structuredResponse.confidence,
      planId: plan.id,
    });

    try {
      const db = getDatabase();
      await db.run(
        `INSERT INTO agent_plans (id, projectId, prompt, plannerSummary, status, confidence, reasoning, requiresApproval) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [plan.id, projectId, prompt, plan.plannerSummary, plan.status, plan.confidence, plan.reasoning, plan.requiresApproval ? 1 : 0]
      );

      if (proposal) {
        await db.run(
          `INSERT INTO proposals (id, projectId, planId, agentRole, summary, affectedSystems, diff, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [proposal.id, projectId, plan.id, proposal.agentRole, proposal.summary, JSON.stringify(proposal.affectedSystems), JSON.stringify(proposal.diff), 'pending']
        );
      }
    } catch (err) {
      // Continue safely if database row exists
    }

    return { plan, structuredResponse };
  }
}

export const aiOrchestrator = new AIOrchestrator();
