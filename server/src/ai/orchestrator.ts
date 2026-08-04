import { contextBuilder } from './contextBuilder.js';
import { planner } from './planner.js';
import { agentRegistry } from './agentRegistry.js';
import { toolExecutor } from './toolExecutor.js';
import { memoryService } from './memory.js';
import { responseFormatter } from './responseFormatter.js';
import { AgentPlan, StructuredAIResponse, AIProposal, ToolExecutionResult } from './types.js';
import { getDatabase } from '../models/schema.js';
import { callOpenAI, buildContextMessages } from '../services/aiService.js';
import { v4 as uuid } from 'uuid';

/**
 * GameForge AI Orchestrator
 *
 * Implements the full agent operating sequence:
 *   Game Project Data
 *     → Knowledge & Data Layer (RAG + snapshot)
 *       → AI Agent Orchestrator (this class)
 *         → Specialist Agents (multi-step plan)
 *           → Analysis & Simulation
 *             → Change Proposal
 *               → Automated Validation (QA + Audit)
 *                 → Human Approval gate
 *                   ├── Approved → Apply to sandbox/staging → Monitor → Audit Log
 *                   └── Rejected → Revise Proposal (re-queued)
 */
export class AIOrchestrator {
  public async executePlan(
    projectId: string,
    prompt: string,
    activeWorkspace: string
  ): Promise<{
    plan: AgentPlan;
    structuredResponse: StructuredAIResponse;
    aiContent: string;
    isDemo: boolean;
  }> {

    // ── LAYER 1: Save user prompt to conversation memory ────────────────────
    await memoryService.addConversationTurn(projectId, 'user', prompt, { activeWorkspace });

    // ── LAYER 2: Knowledge & Data Layer — Build full context ────────────────
    // Retrieves: project snapshot, RAG document chunks, conversation history,
    // dependency map, agent memory
    const context = await contextBuilder.buildContext(projectId, activeWorkspace, prompt);

    // ── LAYER 3: AI Agent Orchestrator — Generate multi-step plan ───────────
    const plan = planner.createPlan(projectId, prompt, activeWorkspace);
    plan.status = 'executing';

    const toolExecutionResults: ToolExecutionResult[] = [];
    let proposal: AIProposal | undefined = undefined;

    // ── LAYER 4: Specialist Agents — Execute steps sequentially ────────────
    for (const step of plan.steps) {
      const startTime = Date.now();
      step.status = 'executing';

      const agentConfig = agentRegistry.getAgent(step.agentRole);
      const primaryTool = agentConfig?.allowedTools[0] || 'getProjectSnapshot';

      const toolRes = await toolExecutor.executeTool(
        primaryTool,
        {
          prompt,
          workspace: activeWorkspace,
          agentRole: step.agentRole,
          contextSnippet: context.ragChunks[0]?.snippet ?? '',
          projectSnapshot: context.projectSnapshot,
        },
        projectId,
        activeWorkspace
      );

      toolExecutionResults.push(toolRes);

      // ── LAYER 5: Analysis & Simulation — detect proposal output ───────────
      if (toolRes.output && typeof toolRes.output === 'object' &&
          (toolRes.output as Record<string, unknown>).isProposal) {
        const propOutput = toolRes.output as Record<string, unknown>;
        proposal = {
          id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          projectId,
          planId: plan.id,
          agentRole: step.agentRole,
          summary: `[${step.agentRole.toUpperCase()}] Proposal for ${activeWorkspace}: ${prompt.slice(0, 80)}`,
          affectedSystems: plan.affectedSystems,
          diff: (propOutput.diff as AIProposal['diff']) || {
            module: activeWorkspace,
            before: { status: 'original' },
            after: { status: 'proposed_update', prompt },
          },
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
      }

      step.status = 'completed';
      step.durationMs = Date.now() - startTime;
      step.output = `[${step.agentRole.toUpperCase()}] Executed ${primaryTool} in ${step.durationMs}ms → ${toolRes.success ? 'SUCCESS' : 'FAILED'}.`;
      step.toolCalls = [toolRes];
    }

    // ── LAYER 5 cont: Automated Validation ────────────────────────────────
    // The QA and Auditor steps in the plan handle validation automatically.
    // Their step outputs are included in structuredResponse.

    // ── LAYER 6: Change Proposal ───────────────────────────────────────────
    // If any write-intent tools produced a proposal, it's captured above.
    // Set plan status based on whether approval is required.
    plan.status = plan.requiresApproval ? 'requires_approval' : 'completed';
    plan.proposal = proposal;

    // ── LAYER 7: Live AI Content via 15-Protocol System Prompt ────────────
    // Injects project snapshot + RAG citations into the GPT context window.
    const ragChunks = context.ragChunks.map((c) => ({
      snippet: c.snippet,
      documentType: c.documentType,
    }));
    const convHistory = context.conversationHistory.map((h) => ({
      role: h.role,
      text: h.text,
    }));

    const aiResult = await callOpenAI(
      prompt,
      context.projectSnapshot ?? null,
      ragChunks,
      convHistory,
      activeWorkspace,
    );

    // ── LAYER 8: Format structured response ───────────────────────────────
    const structuredResponse = responseFormatter.formatResponse(plan, toolExecutionResults, proposal);

    // ── LAYER 9: Save to conversation memory + agent_plans table ──────────
    await memoryService.addConversationTurn(projectId, 'assistant', aiResult.content, {
      confidence: structuredResponse.confidence,
      planId: plan.id,
      isDemo: aiResult.isDemo,
    });

    // ── LAYER 10: Audit Log — record every material recommendation ─────────
    try {
      const db = getDatabase();

      // Persist plan
      await db.run(
        `INSERT OR IGNORE INTO agent_plans
         (id, projectId, prompt, plannerSummary, status, confidence, reasoning, requiresApproval)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [plan.id, projectId, prompt, plan.plannerSummary,
         plan.status, plan.confidence, plan.reasoning, plan.requiresApproval ? 1 : 0]
      );

      // Persist proposal if generated
      if (proposal) {
        await db.run(
          `INSERT OR IGNORE INTO proposals
           (id, projectId, planId, agentRole, summary, affectedSystems, diff, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [proposal.id, projectId, plan.id, proposal.agentRole,
           proposal.summary,
           JSON.stringify(proposal.affectedSystems),
           JSON.stringify(proposal.diff),
           'pending']
        );
      }

      // Persist audit log entry for every material AI recommendation
      await db.run(
        `INSERT INTO auditLogs
         (id, userId, projectId, action, resource, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          uuid(),
          'system-ai',
          projectId,
          'AI_RECOMMENDATION',
          activeWorkspace,
          JSON.stringify({
            planId: plan.id,
            prompt: prompt.slice(0, 200),
            agentsInvolved: plan.steps.map((s) => s.agentRole),
            requiresApproval: plan.requiresApproval,
            isDemo: aiResult.isDemo,
          }),
        ]
      );
    } catch (err) {
      console.warn('[Orchestrator] Audit log persistence failed (non-critical):', err);
    }

    return { plan, structuredResponse, aiContent: aiResult.content, isDemo: aiResult.isDemo };
  }

  /**
   * Monitor results after an approved change has been applied.
   * Compares actual telemetry against the prediction in the original proposal.
   */
  public async monitorAppliedChange(
    projectId: string,
    proposalId: string,
    actualMetrics: Record<string, number>
  ): Promise<{ comparison: Record<string, unknown>; auditEntry: string }> {
    const db = getDatabase();

    const proposal = await db.get(
      'SELECT * FROM proposals WHERE id = ? AND projectId = ?',
      [proposalId, projectId]
    );

    if (!proposal) {
      return { comparison: {}, auditEntry: 'Proposal not found' };
    }

    const diff = typeof proposal.diff === 'string' ? JSON.parse(proposal.diff) : proposal.diff;
    const comparison = {
      proposalId,
      module: diff?.module ?? 'unknown',
      predictedValues: diff?.after ?? {},
      actualMetrics,
      timestamp: new Date().toISOString(),
      deviations: Object.entries(actualMetrics).map(([key, actual]) => ({
        metric: key,
        actual,
        predicted: (diff?.after as Record<string, unknown>)?.[key] ?? 'N/A',
      })),
    };

    const auditEntry = `POST-CHANGE MONITORING: Proposal ${proposalId} applied. Actual vs predicted comparison recorded.`;

    // Record in audit log per Protocol 15
    await db.run(
      `INSERT INTO auditLogs (id, userId, projectId, action, resource, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid(), 'system-ai', projectId, 'POST_CHANGE_MONITOR', diff?.module ?? 'unknown',
       JSON.stringify(comparison)]
    );

    return { comparison, auditEntry };
  }
}

export const aiOrchestrator = new AIOrchestrator();
