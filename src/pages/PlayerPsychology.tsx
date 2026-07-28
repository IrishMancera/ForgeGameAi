import { useState } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Brain, ShieldAlert, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { PSYCHOLOGY_SCORES, MOTIVATION_MAP, ETHICAL_RISKS } from "../data/mockData";

const TABS = ["Overview", "Motivation Map", "Cognitive Load", "Excitement Curve", "Ethical Risk", "Player Profiles"];

interface PlayerPsychologyProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
}

const COGNITIVE_LOAD = [
  { item: "Concurrent Goals", value: 4, safe: "1–3", status: "warn", evidence: "Player can have reception, guest room, daily task, and energy goals active simultaneously" },
  { item: "Visible Currencies", value: 3, safe: "1–2", status: "warn", evidence: "Coins, Diamonds, and Energy are always visible; Event Tokens appear during events" },
  { item: "New Mechanics / Session", value: 1, safe: "0–1", status: "ok", evidence: "Tutorial introduces one mechanic per session effectively" },
  { item: "Tutorial Prompts", value: 2, safe: "0–2", status: "ok", evidence: "Two simultaneous tutorial prompts at peak — within safe range" },
  { item: "Decision Complexity", value: "Medium", safe: "Low–Medium", status: "ok", evidence: "Room upgrade decisions are clear; Ghost Hunter build choices are the most complex" },
  { item: "UI Density", value: "Medium", safe: "Low–Medium", status: "ok", evidence: "Main lobby is readable; some HUD overlap during events" },
];

export default function PlayerPsychology({ onToast }: PlayerPsychologyProps) {
  const [tab, setTab] = useState("Overview");
  const [aiInput, setAiInput] = useState("");
  const [refusalVisible, setRefusalVisible] = useState(false);

  const motivationRadar = MOTIVATION_MAP.map((m) => ({ subject: m.name, score: m.score }));

  const HARMFUL_KEYWORDS = ["exploit", "addict", "manipulate", "force", "coerce", "trick", "hide", "dark pattern"];

  const checkHarmful = (text: string) => HARMFUL_KEYWORDS.some((kw) => text.toLowerCase().includes(kw));

  const handleAiSubmit = () => {
    if (checkHarmful(aiInput)) {
      setRefusalVisible(true);
    } else {
      onToast("info", "AI processing", "Analyzing player psychology impact of your request");
      setAiInput("");
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#FFF9F2]">
      <div className="bg-white border-b border-[#DED9EA] px-5 flex items-center gap-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-[#6C3BFF] text-[#6C3BFF]" : "border-transparent text-[#6C6880] hover:text-[#17152B]"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === "Overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Motivation Coverage", value: `${PSYCHOLOGY_SCORES.motivationCoverage}%`, status: "ok" },
                { label: "Cognitive Load Risk", value: `${PSYCHOLOGY_SCORES.cognitiveLoadRisk}/100`, status: "warn" },
                { label: "Learning Clarity", value: `${PSYCHOLOGY_SCORES.learningClarity}%`, status: "ok" },
                { label: "Excitement Stability", value: `${PSYCHOLOGY_SCORES.excitementStability}/100`, status: "ok" },
                { label: "Fairness & Trust", value: `${PSYCHOLOGY_SCORES.fairnessTrust}/100`, status: "warn" },
                { label: "Reward Fatigue Risk", value: `${PSYCHOLOGY_SCORES.rewardFatigue}/100`, status: "warn" },
                { label: "Frustration Risk", value: `${PSYCHOLOGY_SCORES.frustrationRisk}/100`, status: "ok" },
                { label: "Player Autonomy", value: `${PSYCHOLOGY_SCORES.playerAutonomy}%`, status: "ok" },
                { label: "Ethical Risk", value: PSYCHOLOGY_SCORES.ethicalRiskSeverity, status: "critical" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-[14px] border border-[#DED9EA] p-4" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
                  <div className={`text-xl font-bold font-mono ${s.status === "ok" ? "text-[#19A974]" : s.status === "warn" ? "text-[#FFC928]" : "text-[#FF3B4F]"}`}>{s.value}</div>
                  <div className="text-[10px] text-[#6C6880] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Methodology note */}
            <div className="bg-[#F4F1FA] border border-[#DED9EA] rounded-[14px] p-4 flex gap-3">
              <Info size={16} className="text-[#6C3BFF] shrink-0 mt-0.5" />
              <div className="text-sm text-[#17152B] leading-relaxed">
                <strong className="font-semibold">About this section:</strong> These scores analyze how Haunted Hotel affects player experience, mental engagement, and autonomy. The goal is to build a game that is compelling, fair, and respectful of players' time and money — not one that exploits psychological vulnerabilities. Ethical risk findings are presented as design problems to fix, not features to optimize.
              </div>
            </div>
          </div>
        )}

        {tab === "Motivation Map" && (
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-[14px] border border-[#DED9EA] p-5" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
              <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider mb-4">Motivation Coverage Radar</div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={motivationRadar} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                  <PolarGrid stroke="#DED9EA" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6C6880" }} />
                  <Radar dataKey="score" stroke="#6C3BFF" fill="#6C3BFF" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-[14px] border border-[#DED9EA] p-5" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
              <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider mb-4">Motivation Breakdown</div>
              <div className="space-y-3">
                {MOTIVATION_MAP.map((m) => (
                  <div key={m.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[#17152B]">{m.name}</span>
                      <span className={`font-mono text-xs font-semibold ${m.score >= 70 ? "text-[#19A974]" : m.score >= 50 ? "text-[#FFC928]" : "text-[#FF3B4F]"}`}>{m.score}%</span>
                    </div>
                    <div className="h-1.5 bg-[#F4F1FA] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${m.score >= 70 ? "bg-[#6C3BFF]" : m.score >= 50 ? "bg-[#FFC928]" : "bg-[#FF3B4F]"}`}
                        style={{ width: `${m.score}%` }} />
                    </div>
                    {m.systems.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.systems.map((s) => (
                          <span key={s} className="text-[9px] bg-[#F4F1FA] text-[#6C6880] px-1.5 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}
                    {m.systems.length === 0 && (
                      <div className="text-[10px] text-[#FF3B4F] mt-1">⚠ No systems support this motivation</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "Cognitive Load" && (
          <div className="bg-white rounded-[14px] border border-[#DED9EA] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
            <div className="px-5 py-4 border-b border-[#DED9EA]">
              <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider">Cognitive Load Audit</div>
              <p className="text-xs text-[#6C6880] mt-1">Measures how much mental effort players must sustain during a typical session. Safe ranges are based on UX research and competitor benchmarks.</p>
            </div>
            <table className="w-full text-xs">
              <thead className="bg-[#F4F1FA]">
                <tr>
                  {["Item", "Current Value", "Safe Range", "Status", "Evidence"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED9EA]">
                {COGNITIVE_LOAD.map((row) => (
                  <tr key={row.item} className="table-row-hover">
                    <td className="px-4 py-3 font-semibold text-[#17152B]">{row.item}</td>
                    <td className="px-4 py-3 font-mono font-bold text-[#17152B]">{row.value}</td>
                    <td className="px-4 py-3 font-mono text-[#6C6880]">{row.safe}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${row.status === "ok" ? "bg-[#EDFAF4] text-[#19A974]" : "bg-[#FFF8E6] text-[#FFC928]"}`}>
                        {row.status === "ok" ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                        {row.status === "ok" ? "OK" : "Review"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6C6880] max-w-[280px]">{row.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Ethical Risk" && (
          <div className="space-y-5">
            {/* AI input + refusal */}
            <div className="bg-white rounded-[14px] border border-[#DED9EA] p-5" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
              <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider mb-2">Ask AI about psychology optimization</div>
              <p className="text-xs text-[#6C6880] mb-3">Describe a monetization or engagement strategy for AI review. Harmful optimizations will be flagged with fair alternatives.</p>
              <div className="flex gap-2">
                <input
                  value={aiInput}
                  onChange={(e) => { setAiInput(e.target.value); setRefusalVisible(false); }}
                  placeholder="e.g. How do I increase Diamond spend on gacha?"
                  className="flex-1 text-sm bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 focus:outline-none focus:border-[#6C3BFF] text-[#17152B]"
                />
                <button onClick={handleAiSubmit} className="px-4 py-2 bg-[#6C3BFF] text-white text-xs font-medium rounded-lg hover:bg-[#5a2fe0]">
                  Analyze
                </button>
              </div>
              {refusalVisible && (
                <div className="mt-3 bg-[#FFF8E6] border border-[#FFE89A] rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <ShieldAlert size={16} className="text-[#FFC928] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#17152B] mb-1">This optimization approach raises ethical concerns</p>
                      <p className="text-xs text-[#6C6880] mb-3">The request appears to target manipulation or exploit player psychology in ways that could cause harm or erode trust. Instead, consider these fair alternatives:</p>
                      <ul className="text-xs text-[#17152B] space-y-1.5">
                        <li className="flex items-start gap-1.5"><span className="text-[#19A974] mt-0.5">→</span> <strong>Transparent value:</strong> Show players exactly what they get before any purchase with disclosed odds</li>
                        <li className="flex items-start gap-1.5"><span className="text-[#19A974] mt-0.5">→</span> <strong>Meaningful choices:</strong> Let players choose between multiple paths to progress, not just speed up</li>
                        <li className="flex items-start gap-1.5"><span className="text-[#19A974] mt-0.5">→</span> <strong>Content variety:</strong> Increase engagement through new story content and mechanics, not friction</li>
                        <li className="flex items-start gap-1.5"><span className="text-[#19A974] mt-0.5">→</span> <strong>Respectful reminders:</strong> Allow players to set spend limits and session reminders</li>
                        <li className="flex items-start gap-1.5"><span className="text-[#19A974] mt-0.5">→</span> <strong>Mastery rewards:</strong> Reward skill and time invested rather than spend only</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ethical risk findings */}
            <div className="space-y-3">
              {ETHICAL_RISKS.map((risk) => (
                <div key={risk.id} className="bg-white rounded-[14px] border border-[#DED9EA] p-5" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
                  <div className="flex items-start gap-3">
                    <ShieldAlert size={18} className={`shrink-0 mt-0.5 ${risk.severity === "Critical" ? "text-[#FF3B4F]" : risk.severity === "High" ? "text-[#FFC928]" : "text-[#19C6D1]"}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[#17152B]">{risk.type}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${risk.severity === "Critical" ? "bg-[#FFF0F2] text-[#FF3B4F] border-[#FFB3BB]" : risk.severity === "High" ? "bg-[#FFF8E6] text-[#FFC928] border-[#FFE89A]" : "bg-[#F4F1FA] text-[#6C6880] border-[#DED9EA]"}`}>
                          {risk.severity}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${risk.status === "Resolved" ? "bg-[#EDFAF4] text-[#19A974]" : risk.status === "In Progress" ? "bg-[#EFF6FF] text-[#19C6D1]" : "bg-[#F4F1FA] text-[#6C6880]"}`}>
                          {risk.status}
                        </span>
                        <span className="ml-auto text-[10px] font-mono text-[#6C6880]">{risk.id}</span>
                      </div>
                      <p className="text-xs text-[#6C6880] mb-2">Screen: {risk.affectedScreen}</p>
                      <p className="text-sm text-[#17152B] mb-3">{risk.evidence}</p>
                      <div className="bg-[#EDFAF4] border border-[#C8F0DC] rounded-lg p-3">
                        <div className="text-[10px] font-semibold text-[#19A974] mb-1 uppercase tracking-wider">Recommended Remediation</div>
                        <p className="text-xs text-[#17152B]">{risk.remediation}</p>
                      </div>
                      {risk.status !== "Resolved" && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => onToast("success", "Risk resolved", `${risk.type} marked as resolved`)}
                            className="text-xs px-3 py-1.5 bg-[#19A974] text-white rounded-lg hover:bg-[#148058]">Resolve</button>
                          <button onClick={() => onToast("info", "Accepted risk", "Risk added to accepted risk register")}
                            className="text-xs px-3 py-1.5 border border-[#DED9EA] text-[#6C6880] rounded-lg hover:bg-[#F4F1FA]">Accept Risk</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!["Overview", "Motivation Map", "Cognitive Load", "Ethical Risk"].includes(tab) && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Brain size={40} className="text-[#DED9EA] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#17152B]">{tab}</p>
              <p className="text-xs text-[#6C6880] mt-1">Player experience data will populate after your first simulation run.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
