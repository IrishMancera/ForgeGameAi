import { useState, useEffect, useRef } from "react";
import {
  Bot, ChevronRight, Send, Zap,
  CheckCircle, XCircle, ShieldAlert, Cpu, GitCommit, FileText,
  Check, AlertCircle, ArrowRight, WifiOff, AlertTriangle, RefreshCw,
  Beaker, Eye, TrendingUp
} from "lucide-react";
import {
  executeAIChat, applyProposal, fetchAIStatus,
  AgentPlan, AIProposal, AIStatusResponse, AIChatResult
} from "../services/aiService";
import type { BackendSnapshot } from "../services/backend";

interface AIPanelProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  snapshot?: BackendSnapshot | null;
  projectId?: string;
  activeWorkspace?: string;
}

const AGENT_ROLE_COLORS: Record<string, string> = {
  "game-director":  "bg-[#6C3BFF]/10 text-[#6C3BFF] border-[#6C3BFF]/20",
  planner:          "bg-[#6C3BFF]/10 text-[#6C3BFF] border-[#6C3BFF]/20",
  architect:        "bg-[#19C6D1]/10 text-[#19C6D1] border-[#19C6D1]/20",
  balancer:         "bg-[#FFC928]/10 text-[#FFC928] border-[#FFC928]/20",
  auditor:          "bg-[#FF3B4F]/10 text-[#FF3B4F] border-[#FF3B4F]/20",
  psychologist:     "bg-[#8E54E9]/10 text-[#8E54E9] border-[#8E54E9]/20",
  documenter:       "bg-[#19A974]/10 text-[#19A974] border-[#19A974]/20",
  simulation:       "bg-[#00B4D8]/10 text-[#00B4D8] border-[#00B4D8]/20",
  telemetry:        "bg-[#F77F00]/10 text-[#F77F00] border-[#F77F00]/20",
  qa:               "bg-[#2DC653]/10 text-[#2DC653] border-[#2DC653]/20",
};

const AGENT_ROLES_DISPLAY = [
  { label: "Director",   key: "game-director" },
  { label: "Architect",  key: "architect" },
  { label: "Balancer",   key: "balancer" },
  { label: "Simulation", key: "simulation" },
  { label: "Telemetry",  key: "telemetry" },
  { label: "QA",         key: "qa" },
  { label: "Auditor",    key: "auditor" },
];

const SUGGESTED_PROMPTS = [
  "Analyze economy balance & gold sink inflation",
  "Find content gaps in progression curves",
  "Run D7 retention and churn analysis",
  "Validate monetization ethics compliance",
];

// ─── Demo Mode Banner ─────────────────────────────────────────────────────────
function DemoModeBanner() {
  return (
    <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-50 p-2.5">
      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
      <div className="text-[10px] leading-relaxed text-amber-800">
        <span className="font-bold">DEMO MODE</span> — No OpenAI API key detected.
        Responses are deterministic templates.{" "}
        <span className="font-semibold">Set OPENAI_API_KEY in server/.env for live analysis.</span>
      </div>
    </div>
  );
}

// ─── Offline State ────────────────────────────────────────────────────────────
function OfflineState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
      <WifiOff size={28} className="mb-3 text-[#FF3B4F]/60" />
      <div className="text-sm font-semibold text-[#17152B] mb-1">Backend Offline</div>
      <p className="text-xs text-[#6C6880] max-w-[220px] mb-4">
        The AI Operating System cannot connect to the backend server. Start the server with <code className="bg-[#F4F1FA] px-1 rounded">npm run dev:all</code>.
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6C3BFF] text-white text-xs font-semibold hover:bg-[#5a2fe0] transition-colors"
      >
        <RefreshCw size={12} /> Retry Connection
      </button>
    </div>
  );
}

// ─── AI Content Renderer ──────────────────────────────────────────────────────
function AIContentBlock({ content, isDemo }: { content: string; isDemo: boolean }) {
  if (!content) return null;
  return (
    <div className={`rounded-xl border p-3 text-[11px] leading-relaxed whitespace-pre-wrap font-mono ${
      isDemo
        ? "border-amber-200 bg-amber-50/60 text-amber-900"
        : "border-[#DED9EA] bg-[#F4F1FA]/50 text-[#17152B]"
    }`}>
      {isDemo && (
        <div className="flex items-center gap-1 mb-2 text-[9px] font-bold uppercase tracking-widest text-amber-600">
          <Beaker size={10} /> Demo Response — Not live AI analysis
        </div>
      )}
      {content}
    </div>
  );
}

// ─── Proposal Modal ───────────────────────────────────────────────────────────
function ProposalModal({
  proposal,
  onConfirm,
  onCancel,
  applying,
}: {
  proposal: AIProposal;
  onConfirm: (env: "sandbox" | "staging" | "production") => void;
  onCancel: () => void;
  applying: boolean;
}) {
  const [selectedEnv, setSelectedEnv] = useState<"sandbox" | "staging" | "production">("sandbox");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-[#DED9EA] shadow-2xl w-[520px] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-2 text-[#6C3BFF]">
          <ShieldAlert size={20} />
          <h3 className="font-bold text-[#17152B]">Human-in-the-Loop Approval</h3>
        </div>
        <p className="text-xs text-[#6C6880] mb-4">
          Review the proposed change before committing. Changes are applied to sandbox first.
          Production requires owner role.
        </p>

        {/* Summary */}
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

        {/* State Diff */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-[#6C6880] mb-2 flex items-center gap-1">
            <GitCommit size={14} /> State Diff
          </div>
          <div className="rounded-xl border border-[#DED9EA] bg-[#17152B] text-white p-3 text-xs font-mono overflow-x-auto space-y-1">
            <div className="text-red-400">- BEFORE: {JSON.stringify(proposal.diff.before, null, 2)}</div>
            <div className="text-green-400">+ AFTER:  {JSON.stringify(proposal.diff.after, null, 2)}</div>
          </div>
        </div>

        {/* Environment Selection */}
        <div className="mb-5">
          <div className="text-xs font-semibold text-[#6C6880] mb-2">Deploy Target</div>
          <div className="flex gap-2">
            {(["sandbox", "staging", "production"] as const).map((env) => (
              <button
                key={env}
                onClick={() => setSelectedEnv(env)}
                className={`flex-1 py-2 rounded-lg border text-xs font-semibold capitalize transition-colors ${
                  selectedEnv === env
                    ? "border-[#6C3BFF] bg-[#6C3BFF] text-white"
                    : "border-[#DED9EA] text-[#6C6880] hover:border-[#6C3BFF] hover:text-[#6C3BFF]"
                }`}
              >
                {env}
              </button>
            ))}
          </div>
          {selectedEnv === "production" && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 p-2">
              <AlertTriangle size={12} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-[10px] text-red-700 font-semibold">
                Production changes require owner role and cannot be automatically reversed. Ensure rollback plan is documented.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={applying}
            className="flex-1 py-2.5 border border-[#DED9EA] rounded-xl text-xs font-semibold text-[#6C6880] hover:bg-[#F4F1FA] transition-colors disabled:opacity-50"
          >
            Reject Proposal
          </button>
          <button
            onClick={() => onConfirm(selectedEnv)}
            disabled={applying}
            className="flex-1 py-2.5 bg-[#6C3BFF] text-white rounded-xl text-xs font-semibold hover:bg-[#5a2fe0] transition-colors shadow-lg shadow-[#6C3BFF]/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {applying ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle size={12} />}
            {applying ? "Applying..." : `Approve & Apply to ${selectedEnv}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIPanel({
  onToast, collapsed, onToggle, snapshot, projectId, activeWorkspace = "command-center",
}: AIPanelProps) {
  const activeProjectId = projectId || snapshot?.projectId || "";
  const [chatItems, setChatItems] = useState<AIChatResult[]>([]);
  const [input, setInput] = useState("");
  const [activeProposal, setActiveProposal] = useState<AIProposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch AI mode on mount (demo vs live)
  useEffect(() => {
    fetchAIStatus()
      .then(setAiStatus)
      .catch(() => setIsOffline(true));
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatItems, loading]);

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || loading) return;
    if (!activeProjectId) {
      onToast("warning", "No Project Selected", "Create or select a project before using the AI OS.");
      return;
    }

    setInput("");
    setLoading(true);
    setIsOffline(false);

    try {
      const result = await executeAIChat(promptText, activeProjectId, activeWorkspace);
      setChatItems((prev) => [...prev, result]);
      if (result.plan.proposal) {
        setActiveProposal(result.plan.proposal);
      }
    } catch (error) {
      if (error instanceof TypeError) {
        // Network error — backend offline
        setIsOffline(true);
        onToast("error", "Backend Offline", "Cannot reach the GameForge AI server. Start with: npm run dev:all");
      } else {
        onToast("error", "AI Execution Error", error instanceof Error ? error.message : "Plan execution failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyConfirm = async (environment: "sandbox" | "staging" | "production") => {
    if (!activeProposal || !activeProjectId) return;
    setApplying(true);
    try {
      const result = await applyProposal(activeProposal.id, activeProjectId, environment);
      onToast("success", "Proposal Applied", `Changes committed to ${environment} as Version v${result.versionNumber}.`);
      setChatItems((prev) =>
        prev.map((item) =>
          item.plan.proposal?.id === activeProposal.id
            ? { ...item, plan: { ...item.plan, status: "completed" as const, proposal: { ...activeProposal, status: "applied" as const } } }
            : item
        )
      );
    } catch (err) {
      // Real error — not a fake success
      onToast("error", "Apply Failed", err instanceof Error ? err.message : "Could not commit proposal. Check your role permissions.");
    } finally {
      setApplying(false);
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
        <div className={`w-1.5 h-1.5 rounded-full ${isOffline ? "bg-red-400" : "bg-[#19A974] animate-pulse"}`} />
        <span className="text-[9px] text-[#6C6880] font-bold uppercase tracking-wider" style={{ writingMode: "vertical-rl" }}>
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
          applying={applying}
          onCancel={() => {
            onToast("warning", "Proposal Rejected", "Write operation aborted — no changes applied.");
            setActiveProposal(null);
          }}
        />
      )}

      <aside className="flex w-[420px] shrink-0 flex-col border-l border-[#DED9EA]/70 bg-white/95 backdrop-blur-xl" style={{ boxShadow: "-12px 0 32px rgba(108, 59, 255, 0.08)" }}>
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
                  <span className={`h-1.5 w-1.5 rounded-full ${isOffline ? "bg-red-400" : "bg-[#19A974] animate-ping"}`} />
                  <span>{isOffline ? "Backend Offline" : aiStatus?.isDemo ? "Demo Mode" : "Live — " + (aiStatus?.model || "gpt-4o-mini")}</span>
                </div>
              </div>
            </div>
            <button onClick={onToggle} className="rounded-lg p-1.5 text-[#6C6880] hover:bg-[#DED9EA]/50 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Agent Roles */}
          <div className="mt-3 flex flex-wrap gap-1">
            {AGENT_ROLES_DISPLAY.map((role) => (
              <span key={role.key} className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${AGENT_ROLE_COLORS[role.key] || ""}`}>
                {role.label}
              </span>
            ))}
          </div>
        </div>

        {/* Demo Mode Banner */}
        {aiStatus?.isDemo && !isOffline && <DemoModeBanner />}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {isOffline ? (
            <OfflineState onRetry={() => {
              setIsOffline(false);
              fetchAIStatus().then(setAiStatus).catch(() => setIsOffline(true));
            }} />
          ) : chatItems.length === 0 ? (
            <div className="py-8 text-center text-[#6C6880]">
              <Bot size={32} className="mx-auto mb-2 text-[#6C3BFF]/40" />
              <div className="font-semibold text-[#17152B] text-sm mb-1">GameForge AI OS</div>
              <p className="text-xs max-w-[260px] mx-auto">
                Submit a system design, economy balance, or telemetry request to launch the multi-agent analysis pipeline.
              </p>
              {!activeProjectId && (
                <div className="mt-3 flex items-center justify-center gap-1 text-amber-600 text-[10px] font-semibold">
                  <AlertTriangle size={11} /> No project selected
                </div>
              )}
            </div>
          ) : (
            chatItems.map((item, idx) => (
              <div key={item.plan.id || idx} className="rounded-2xl border border-[#DED9EA] bg-white p-4 shadow-sm space-y-3">
                {/* Prompt + confidence */}
                <div className="flex items-start justify-between gap-2 border-b border-[#DED9EA]/50 pb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C3BFF]">Prompt</span>
                    <div className="font-semibold text-[#17152B] mt-0.5 text-xs">{item.plan.prompt}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#6C3BFF]/10 text-[#6C3BFF] text-[10px] font-bold shrink-0">
                    {item.plan.confidence}% Conf.
                  </span>
                </div>

                <div className="text-[11px] text-[#6C6880] leading-relaxed">{item.plan.plannerSummary}</div>

                {/* Plan Steps */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6C6880] flex items-center gap-1">
                    <FileText size={12} /> Pipeline ({item.plan.steps.length} Steps)
                  </div>
                  {item.plan.steps.map((step) => (
                    <div key={step.id} className="flex items-start gap-2.5 rounded-xl border border-[#DED9EA]/60 bg-[#F4F1FA]/40 p-2.5">
                      <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${
                        step.status === "failed" ? "bg-red-500" : "bg-[#19A974]"
                      }`}>
                        {step.status === "failed" ? <XCircle size={10} /> : <Check size={10} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#17152B] capitalize">{step.agentRole} Agent</span>
                          <span className="text-[9px] text-[#6C6880] font-mono">{step.durationMs || "—"}ms</span>
                        </div>
                        <p className="text-[10px] text-[#6C6880] mt-0.5">{step.description}</p>
                        {step.affectedSystems && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {step.affectedSystems.map((s) => (
                              <span key={s} className="px-1.5 rounded bg-[#6C3BFF]/10 text-[#6C3BFF] text-[9px] font-semibold">#{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Content (structured 15-protocol response) */}
                {item.aiContent && (
                  <AIContentBlock content={item.aiContent} isDemo={item.isDemo} />
                )}

                {/* Proposal Box */}
                {item.plan.proposal && (
                  <div className="rounded-xl border border-[#6C3BFF]/30 bg-[#6C3BFF]/5 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#6C3BFF]">
                        <AlertCircle size={14} /> Proposal Pending Approval
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        item.plan.proposal.status === "applied"
                          ? "bg-[#19A974] text-white"
                          : item.plan.proposal.status === "rejected"
                          ? "bg-red-500 text-white"
                          : "bg-[#6C3BFF] text-white"
                      }`}>
                        {item.plan.proposal.status === "applied" ? "Applied ✓" : item.plan.proposal.status === "rejected" ? "Rejected" : "Requires Sign-Off"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#17152B]">{item.plan.proposal.summary}</p>
                    {item.plan.proposal.status === "pending" && (
                      <button
                        onClick={() => setActiveProposal(item.plan.proposal!)}
                        className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 bg-[#6C3BFF] text-white rounded-lg text-xs font-semibold hover:bg-[#5a2fe0] transition-colors"
                      >
                        Review & Approve Proposal <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                )}

                {/* Warnings */}
                {item.plan.warnings && item.plan.warnings.length > 0 && (
                  <div className="space-y-1">
                    {item.plan.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2">
                        <AlertTriangle size={11} className="mt-0.5 shrink-0 text-amber-600" />
                        <span className="text-[10px] text-amber-800">{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center justify-center py-6 text-xs text-[#6C3BFF] gap-2">
              <Cpu className="animate-spin" size={16} />
              <span className="font-semibold">Orchestrating Agent Pipeline...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="shrink-0 border-t border-[#DED9EA]/60 p-3 bg-[#F4F1FA]/30">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#6C6880]">Quick Prompts</div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => handleSendPrompt(p)}
                disabled={loading || isOffline}
                className="rounded-lg border border-[#DED9EA] bg-white px-2.5 py-1 text-[11px] text-[#6C6880] hover:border-[#6C3BFF] hover:text-[#6C3BFF] transition-colors disabled:opacity-40"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Box */}
        <div className="shrink-0 border-t border-[#DED9EA] p-3 bg-white">
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
            isOffline ? "border-red-300 bg-red-50" : "border-[#DED9EA] bg-[#F4F1FA]"
          }`}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendPrompt(input)}
              placeholder={isOffline ? "Backend offline — cannot send requests" : "Ask AI OS to balance, design, or audit systems..."}
              disabled={isOffline}
              className="w-full bg-transparent text-xs outline-none text-[#17152B] placeholder:text-[#6C6880] disabled:cursor-not-allowed"
            />
            <button
              onClick={() => handleSendPrompt(input)}
              disabled={loading || !input.trim() || isOffline}
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
