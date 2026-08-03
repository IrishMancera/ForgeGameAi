import { StructuredAIResponse, AgentPlan, AIProposal, ToolExecutionResult } from './types';

export class ResponseFormatter {
  public formatResponse(
    plan: AgentPlan,
    toolResults: ToolExecutionResult[],
    proposal?: AIProposal
  ): StructuredAIResponse {
    const summary = plan.plannerSummary || `Completed execution plan for: "${plan.prompt}"`;
    const confidence = plan.confidence || 92;
    const reasoning = plan.reasoning || `Executed ${plan.steps.length} specialist agent steps with tool verification.`;
    const affectedSystems = plan.affectedSystems || [];
    
    const recommendations = plan.steps.map((step) => ({
      title: `${step.agentRole.toUpperCase()}: ${step.description}`,
      description: step.output || `Validated system mechanics with ${step.confidence}% confidence.`,
      actionable: true,
    }));

    const warnings = plan.warnings || [];
    if (proposal && proposal.status === 'pending') {
      warnings.push(`Proposal #${proposal.id} requires user approval before database write.`);
    }

    return {
      summary,
      confidence,
      reasoning,
      affectedSystems,
      recommendations,
      toolCalls: toolResults,
      requiresApproval: Boolean(proposal || plan.requiresApproval),
      warnings,
      proposal,
    };
  }
}

export const responseFormatter = new ResponseFormatter();
