import { useState } from "react";
import {
  Bot, ChevronRight, Send, Paperclip, Zap, Table2,
  CheckCircle, Edit3, XCircle
} from "lucide-react";
import { AI_MESSAGES } from "../data/mockData";
import { aiChat } from "../services/ai";
import type { BackendSnapshot } from "../services/backend";

interface AIPanelProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  snapshot?: BackendSnapshot | null;
  projectId?: string;
}

const AGENT_ROLES = [
  { label: "Architect", color: "bg-[#6C3BFF]/10 text-[#6C3BFF] border-[#6C3BFF]/20" },
  { label: "Balancer", color: "bg-[#19C6D1]/10 text-[#19C6D1] border-[#19C6D1]/20" },
  { label: "Auditor", color: "bg-[#FF3B4F]/10 text-[#FF3B4F] border-[#FF3B4F]/20" },
  { label: "Psychologist", color: "bg-[#FFC928]/10 text-[#FFC928] border-[#FFC928]/20" },
  { label: "Documenter", color: "bg-[#19A974]/10 text-[#19A974] border-[#19A974]/20" },
];

const SUGGESTED_PROMPTS = [
  "Analyze economy balance",
  "Find content gaps",
  "Review ethical risks",
  "Build missing tables",
];

interface ApplyModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  affectedSystems: string[];
}

function ApplyModal({ onConfirm, onCancel, affectedSystems }: ApplyModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl border border-[#DED9EA] shadow-2xl w-[420px] p-6">
        <h3 className="font-semibold text-[#17152B] mb-1">Apply AI Recommendation?</h3>
        <p className="text-sm text-[#6C6880] mb-4">This will update the following areas and create a change-log entry:</p>
        <ul className="space-y-1.5 mb-5">
          {affectedSystems.map((s) => (
            <li key={s} className="flex items-center gap-2 text-sm text-[#17152B]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#6C3BFF]" />
              {s}
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-[#DED9EA] rounded-lg text-sm text-[#6C6880] hover:bg-[#F4F1FA] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-[#6C3BFF] text-white rounded-lg text-sm font-medium hover:bg-[#5a2fe0] transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIPanel({ onToast, collapsed, onToggle, snapshot, projectId }: AIPanelProps) {
  const [messages, setMessages] = useState(AI_MESSAGES);
  const [input, setInput] = useState("");
  const [applyModal, setApplyModal] = useState<{ systems: string[] } | null>(null);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    if (!projectId) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "AI requires a saved project before connecting to real-time analysis. Please create a project or open an existing one.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      const response = await aiChat(projectId, input);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "AI request failed.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="w-10 bg-white border-l border-[#DED9EA] flex flex-col items-center py-4 gap-2 hover:bg-[#F4F1FA] transition-colors"
        title="Open AI Panel"
      >
        <Bot size={18} className="text-[#6C3BFF]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#19A974]" />
        <span className="text-[9px] text-[#6C6880] font-medium" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
          AI Copilot
        </span>
      </button>
    );
  }

  return (
    <>
      {applyModal && (
        <ApplyModal
          affectedSystems={applyModal.systems}
          onConfirm={() => {
            setApplyModal(null);
            onToast("success", "Changes applied", "AI recommendation applied. Change log updated.");
          }}
          onCancel={() => setApplyModal(null)}
        />
      )}

      <aside className="flex w-[380px] shrink-0 flex-col border-l border-white/70 bg-white/80 backdrop-blur-xl" style={{ boxShadow: "-12px 0 32px rgba(108, 59, 255, 0.08)" }}>
        <div className="shrink-0 border-b border-[#DED9EA]/70 px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C3BFF] to-[#19C6D1] shadow-[0_8px_20px_rgba(108,59,255,0.24)]">
                <Bot size={15} className="text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#17152B]" style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.02em" }}>
                  SYSTEM ARCHITECT AI
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#19A974]" />
                  <span className="text-[10px] text-[#6C6880]">Online · {snapshot?.systemStatus.activeAgents ?? 5} agents synced</span>
                </div>
              </div>
            </div>
            <button onClick={onToggle} className="rounded transition-colors p-1 text-[#6C6880] hover:bg-[#F4F1FA] hover:text-[#17152B]">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {AGENT_ROLES.map((r) => (
              <span key={r.label} className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${r.color}`}
                style={{ fontFamily: "Rajdhani, sans-serif" }}>
                {r.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-b border-[#DED9EA]/70 px-4 py-3">
          <button
            onClick={() => onToast("info", "Running full audit…", "Scanning all 15 systems and 34 workbook sheets")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#FF3B4F]/20 bg-[#FF3B4F]/10 py-2 text-xs font-semibold text-[#FF3B4F] transition-colors hover:bg-[#FF3B4F]/20"
          >
            <Zap size={12} /> Run Full Audit
          </button>
          <button
            onClick={() => onToast("success", "Building missing tables…", "Identified 3 incomplete table definitions")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#6C3BFF]/20 bg-[#6C3BFF]/10 py-2 text-xs font-semibold text-[#6C3BFF] transition-colors hover:bg-[#6C3BFF]/20"
          >
            <Table2 size={12} /> Build Missing Tables
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {messages.map((msg, i) => {
            if (dismissed.has(i)) return null;
            return (
              <div key={i} className={`${msg.role === "user" ? "flex justify-end" : ""}`}>
                {msg.role === "user" ? (
                  <div className="bg-[#6C3BFF] text-white text-xs rounded-xl rounded-tr-sm px-3 py-2 max-w-[85%]">
                    <p>{msg.content}</p>
                    <p className="text-[10px] text-white/60 mt-1">{msg.timestamp}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-[#F4F1FA] rounded-xl rounded-tl-sm p-3 text-xs text-[#17152B] leading-relaxed">
                      {/* Render basic markdown bold */}
                      <p>{msg.content.replace(/\*\*(.*?)\*\*/g, "$1")}</p>
                      {(msg as any).confidence != null && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#DED9EA]">
                          <span className="text-[10px] text-[#6C6880]">Confidence</span>
                          <div className="flex-1 h-1 bg-[#DED9EA] rounded-full">
                            <div
                              className="h-1 bg-[#6C3BFF] rounded-full"
                              style={{ width: `${(msg as any).confidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-[#6C3BFF]">{(msg as any).confidence}%</span>
                        </div>
                      )}
                      {(msg as any).affectedSystems && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(msg as any).affectedSystems.map((s: string) => (
                            <span key={s} className="text-[10px] bg-white border border-[#DED9EA] px-1.5 py-0.5 rounded text-[#6C6880]">{s}</span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-[#6C6880] mt-2">{msg.timestamp}</p>
                    </div>
                    {(msg as any).actions && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setApplyModal({ systems: (msg as any).affectedSystems ?? ["Economy Lab"] })}
                          className="flex items-center gap-1 text-[10px] bg-[#6C3BFF] text-white px-2.5 py-1.5 rounded-lg font-medium hover:bg-[#5a2fe0] transition-colors"
                        >
                          <CheckCircle size={10} /> Apply
                        </button>
                        <button
                          onClick={() => onToast("info", "Edit mode", "Opening recommendation editor")}
                          className="flex items-center gap-1 text-[10px] border border-[#DED9EA] text-[#6C6880] px-2.5 py-1.5 rounded-lg hover:bg-[#F4F1FA] transition-colors"
                        >
                          <Edit3 size={10} /> Edit
                        </button>
                        <button
                          onClick={() => setDismissed((prev) => new Set([...prev, i]))}
                          className="flex items-center gap-1 text-[10px] border border-[#FF3B4F]/30 text-[#FF3B4F] px-2.5 py-1.5 rounded-lg hover:bg-[#FF3B4F]/10 transition-colors"
                        >
                          <XCircle size={10} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Suggested prompts */}
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => setInput(p)}
              className="text-[10px] bg-[#F4F1FA] text-[#6C6880] px-2.5 py-1 rounded-full border border-[#DED9EA] hover:border-[#6C3BFF] hover:text-[#6C3BFF] transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#DED9EA] shrink-0">
          <div className="flex items-end gap-2 bg-[#F4F1FA] border border-[#DED9EA] rounded-xl px-3 py-2 focus-within:border-[#6C3BFF] transition-colors">
            <button className="text-[#6C6880] hover:text-[#6C3BFF] transition-colors shrink-0 mb-0.5">
              <Paperclip size={14} />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask the AI anything about your game system…"
              rows={1}
              className="flex-1 bg-transparent text-xs text-[#17152B] placeholder:text-[#6C6880] resize-none outline-none leading-relaxed"
              style={{ minHeight: "20px", maxHeight: "80px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-[#6C3BFF] text-white rounded-lg p-1.5 hover:bg-[#5a2fe0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
