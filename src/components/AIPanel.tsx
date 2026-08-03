import { useState } from "react";
import {
  Bot, ChevronRight, Send, Paperclip, Zap, Table2,
  CheckCircle, Edit3, XCircle, ShieldAlert, Cpu, GitCommit, FileText, Check, AlertCircle, ArrowRight
} from "lucide-react";
import { executeAIChat, applyProposal, AgentPlan, AIProposal } from "../services/aiService";
import type { BackendSnapshot } from "../services/backend";

interface AIPanelProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  snapshot?: BackendSnapshot | null;
  projectId?: string;
  activeWorkspace?: string;
}

const AGENT_ROLES = [
  { label: "Planner", color: "bg-[#6C3BFF]/10 text-[#6C3BFF] border-[#6C3BFF]/20" },
  { label: "Architect", color: "bg-[#19C6D1]/10 text-[#19C6D1] border-[#19C6D1]/20" },
  { label: "Balancer", color: "bg-[#FFC928]/10 text-[#FFC928] border-[#FFC928]/20" },
  { label: "Auditor", color: "bg-[#FF3B4F]/10 text-[#FF3B4F] border-[#FF3B4F]/20" },
  { label: "Psychologist", color: "bg-[#8E54E9]/10 text-[#8E54E9] border-[#8E54E9]/20" },
  { label: "Documenter", color: "bg-[#19A974]/10 text-[#19A974] border-[#19A974]/20" },
];

const SUGGESTED_PROMPTS = [
  "Analyze economy balance & gold sink inflation",
  "Find content gaps in progression curves",
  "Review ethical monetization & stamina friction",
  "Build missing workbook tables for drops",
];

interface ProposalModalProps {
  proposal: AIProposal;
  onConfirm: () => void;
  onCancel: () => void;
}

function ProposalModal({ proposal, onConfirm, onCancel }: ProposalModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-[#DED9EA] shadow-2xl w-[480px] p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-2 text-[#6C3BFF]">
          <ShieldAlert size={20} />
          <h3 className="font-bold text-[#17152B]">Review & Approve AI Proposal</h3>
        </div>
        <p className="text-xs text-[#6C6880] mb-4">
          Human-in-the-Loop Safeguard: This proposal requires your explicit approval before mutating project state.
        </p>

        <div className="rounded-xl bg-[#F4F1FA] p-3 mb-4 border border-[#DED9EA]">
          <div className="text-xs font-semibold text-[#17152B] mb-1">{proposal.summary}</div>
          <div className="flex flex-wrap gap-1 mt-2">
            {proposal.affectedSystems.map((sys) => (
              <span key={sys} className="px-2 py-0.5 rounded-full bg-[#6C3BFF]/10 text-[#6C3BFF] text-[10px] font-semibold">
                {sys}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs font-semibold text-[#6C6880] mb-2 flex items-center gap-1">
            <GitCommit size={14} /> State Diff Preview
          </div>
          <div className="rounded-xl border border-[#DED9EA] bg-[#17152B] text-white p-3 text-xs font-mono overflow-x-auto space-y-1">
            <div className="text-red-400">- BEFORE: {JSON.stringify(proposal.diff.before)}</div>
            <div className="text-green-400">+ AFTER: {JSON.stringify(proposal.diff.after)}</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-[#DED9EA] rounded-xl text-xs font-semibold text-[#6C6880] hover:bg-[#F4F1FA] transition-colors"
          >
            Reject Proposal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-[#6C3BFF] text-white rounded-xl text-xs font-semibold hover:bg-[#5a2fe0] transition-colors shadow-lg shadow-[#6C3BFF]/20"
          >
            Approve & Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIPanel({ onToast, collapsed, onToggle, snapshot, projectId, activeWorkspace = 'command-center' }: AIPanelProps) {
  const activeProjectId = projectId || snapshot?.projectId || 'proj-haunted-hotel-001';
  const [plans, setPlans] = useState<AgentPlan[]>([]);
  const [input, setInput] = useState("");
  const [activeProposal, setActiveProposal] = useState<AIProposal | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || loading) return;
    setInput("");
    setLoading(true);

    try {
      const { plan } = await executeAIChat(promptText, activeProjectId, activeWorkspace);
      setPlans((prev) => [...prev, plan]);

      if (plan.proposal) {
        setActiveProposal(plan.proposal);
      }
    } catch (error) {
      onToast("error", "AI Execution Error", error instanceof Error ? error.message : "Plan execution failed");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyConfirm = async () => {
    if (!activeProposal) return;
    try {
      const result = await applyProposal(activeProposal.id, activeProjectId);
      onToast("success", "Proposal Applied", `Changes committed as Version v${result.versionNumber}.`);
      setPlans((prev) =>
        prev.map((p) => (p.proposal?.id === activeProposal.id ? { ...p, status: 'completed', proposal: { ...activeProposal, status: 'applied' } } : p))
      );
    } catch (err) {
      onToast("error", "Apply Failed", "Unable to commit proposal.");
    } finally {
      setActiveProposal(null);
    }
  };

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="w-10 bg-white border-l border-[#DED9EA] flex flex-col items-center py-4 gap-2 hover:bg-[#F4F1FA] transition-colors shrink-0"
        title="Open AI Operating System Panel"
      >
        <Cpu size={18} className="text-[#6C3BFF]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#19A974] animate-pulse" />
        <span className="text-[9px] text-[#6C6880] font-bold uppercase tracking-wider" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
          AI OS Workbench
        </span>
      </button>
    );
  }

  return (
    <>
      {activeProposal && (
        <ProposalModal
          proposal={activeProposal}
          onConfirm={handleApplyConfirm}
          onCancel={() => {
            onToast("warning", "Proposal Rejected", "Write operation aborted.");
            setActiveProposal(null);
          }}
        />
      )}

      <aside className="flex w-[400px] shrink-0 flex-col border-l border-[#DED9EA]/70 bg-white/95 backdrop-blur-xl" style={{ boxShadow: "-12px 0 32px rgba(108, 59, 255, 0.08)" }}>
        {/* Header */}
        <div className="shrink-0 border-b border-[#DED9EA]/70 px-4 py-3 bg-[#F4F1FA]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#6C3BFF] text-white shadow-md shadow-[#6C3BFF]/20">
                <Cpu size={15} />
              </div>
              <div>
                <span className="text-xs font-bold text-[#17152B] tracking-tight">AI Operating System</span>
                <div className="flex items-center gap-1.5 text-[10px] text-[#6C6880]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#19A974] animate-ping" />
                  <span>Orchestrator Active</span>
                </div>
              </div>
            </div>
            <button onClick={onToggle} className="rounded-lg p-1.5 text-[#6C6880] hover:bg-[#DED9EA]/50 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Specialist Agent Roles */}
          <div className="mt-3 flex flex-wrap gap-1">
            {AGENT_ROLES.map((role) => (
              <span key={role.label} className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${role.color}`}>
                {role.label}
              </span>
            ))}
          </div>
        </div>

        {/* Content Plan Timeline Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {plans.length === 0 ? (
            <div className="py-8 text-center text-[#6C6880]">
              <Bot size={32} className="mx-auto mb-2 text-[#6C3BFF]/40" />
              <div className="font-semibold text-[#17152B] text-sm mb-1">GameForge AI OS</div>
              <p className="text-xs max-w-[260px] mx-auto">
                Submit a system design or economy balance request to launch the multi-agent plan execution pipeline.
              </p>
            </div>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="rounded-2xl border border-[#DED9EA] bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-[#DED9EA]/50 pb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C3BFF]">User Prompt</span>
                    <div className="font-semibold text-[#17152B] mt-0.5 text-xs">{plan.prompt}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#6C3BFF]/10 text-[#6C3BFF] text-[10px] font-bold">
                    {plan.confidence}% Conf.
                  </span>
                </div>

                <div className="text-[11px] text-[#6C6880] leading-relaxed">{plan.plannerSummary}</div>

                {/* Plan Steps Timeline */}
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6C6880] flex items-center gap-1">
                    <FileText size={12} /> Plan Timeline ({plan.steps.length} Steps)
                  </div>
                  {plan.steps.map((step) => (
                    <div key={step.id} className="flex items-start gap-2.5 rounded-xl border border-[#DED9EA]/60 bg-[#F4F1FA]/40 p-2.5">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#19A974] text-white">
                        <Check size={10} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#17152B] capitalize">{step.agentRole} Agent</span>
                          <span className="text-[9px] text-[#6C6880] font-mono">{step.durationMs || 150}ms</span>
                        </div>
                        <p className="text-[10px] text-[#6C6880] mt-0.5">{step.description}</p>
                        {step.affectedSystems && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {step.affectedSystems.map((s) => (
                              <span key={s} className="px-1.5 py-0.2 rounded bg-[#6C3BFF]/10 text-[#6C3BFF] text-[9px] font-semibold">
                                #{s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Proposal Action Box if write tool triggered */}
                {plan.proposal && (
                  <div className="rounded-xl border border-[#6C3BFF]/30 bg-[#6C3BFF]/5 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#6C3BFF]">
                        <AlertCircle size={14} /> Proposal Pending Approval
                      </div>
                      <span className="text-[10px] bg-[#6C3BFF] text-white px-2 py-0.5 rounded-full font-semibold">
                        Requires Sign-Off
                      </span>
                    </div>
                    <p className="text-[11px] text-[#17152B]">{plan.proposal.summary}</p>
                    <button
                      onClick={() => setActiveProposal(plan.proposal!)}
                      className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 bg-[#6C3BFF] text-white rounded-lg text-xs font-semibold hover:bg-[#5a2fe0] transition-colors"
                    >
                      Review & Approve Proposal <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center justify-center py-6 text-xs text-[#6C3BFF] gap-2">
              <Cpu className="animate-spin" size={16} />
              <span className="font-semibold">Orchestrator Executing Agent Steps...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="shrink-0 border-t border-[#DED9EA]/60 p-3 bg-[#F4F1FA]/30">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#6C6880]">Quick System Prompts</div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => handleSendPrompt(p)}
                className="rounded-lg border border-[#DED9EA] bg-white px-2.5 py-1 text-[11px] text-[#6C6880] hover:border-[#6C3BFF] hover:text-[#6C3BFF] transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input Box */}
        <div className="shrink-0 border-t border-[#DED9EA] p-3 bg-white">
          <div className="flex items-center gap-2 rounded-xl border border-[#DED9EA] bg-[#F4F1FA] px-3 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendPrompt(input)}
              placeholder="Ask AI OS to balance, design, or audit systems..."
              className="w-full bg-transparent text-xs outline-none text-[#17152B] placeholder:text-[#6C6880]"
            />
            <button
              onClick={() => handleSendPrompt(input)}
              disabled={loading || !input.trim()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C3BFF] text-white hover:bg-[#5a2fe0] transition-colors disabled:opacity-50"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
