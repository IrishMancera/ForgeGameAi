import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { PROGRESSION_LEVELS } from "../data/mockData";

const TABS = ["Player XP", "Feature Unlocks", "Upgrade Ladders", "Milestones", "Difficulty vs Power"];

interface ProgressionProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
}

export default function Progression({ onToast }: ProgressionProps) {
  const [tab, setTab] = useState("Player XP");
  const [curve, setCurve] = useState<"exponential" | "linear" | "logarithmic">("exponential");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const paginated = PROGRESSION_LEVELS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(PROGRESSION_LEVELS.length / PAGE_SIZE);

  const chartData = PROGRESSION_LEVELS.map((l) => ({
    level: l.level,
    xpRequired: l.xpRequired,
    cumulativeXP: l.cumulativeXP,
    requiredPower: l.requiredPower,
    expectedPower: l.expectedPower,
  }));

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#FFF9F2]">
      {/* Tab bar */}
      <div className="bg-white border-b border-[#DED9EA] px-5 flex items-center gap-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-[#6C3BFF] text-[#6C3BFF]" : "border-transparent text-[#6C6880] hover:text-[#17152B]"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === "Player XP" && (
          <div className="space-y-5">
            {/* Curve selector + chart */}
            <div className="bg-white rounded-[14px] border border-[#DED9EA] p-5" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider">XP Required per Level</div>
                <div className="flex gap-1 bg-[#F4F1FA] rounded-lg p-1">
                  {(["exponential", "linear", "logarithmic"] as const).map((c) => (
                    <button key={c} onClick={() => { setCurve(c); onToast("info", `Curve changed to ${c}`, "Recalculating all progression values"); }}
                      className={`px-3 py-1 rounded-md text-[10px] font-semibold capitalize transition-colors ${curve === c ? "bg-white text-[#17152B] shadow-sm" : "text-[#6C6880]"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F1FA" />
                  <XAxis dataKey="level" tick={{ fontSize: 10, fill: "#6C6880" }} label={{ value: "Level", position: "insideBottom", offset: -2, fontSize: 10, fill: "#6C6880" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#6C6880" }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #DED9EA" }}
                    formatter={(val: number) => [val.toLocaleString(), "XP Required"]} />
                  <ReferenceLine x={27} stroke="#FF3B4F" strokeDasharray="4 4" label={{ value: "Paywall ⚠", position: "top", fontSize: 10, fill: "#FF3B4F" }} />
                  <Line type="monotone" dataKey="xpRequired" stroke="#6C3BFF" strokeWidth={2} dot={false} name="XP Required" />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#FF3B4F]">
                <AlertTriangle size={12} />
                Level 27 paywall spike detected — upgrade cost is 15.5× median daily income at this level
              </div>
            </div>

            {/* Difficulty vs Power */}
            <div className="bg-white rounded-[14px] border border-[#DED9EA] p-5" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
              <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider mb-4">Difficulty vs Player Power</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F1FA" />
                  <XAxis dataKey="level" tick={{ fontSize: 10, fill: "#6C6880" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#6C6880" }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #DED9EA" }} />
                  <Line type="monotone" dataKey="requiredPower" stroke="#FF3B4F" strokeWidth={2} dot={false} name="Required Power" />
                  <Line type="monotone" dataKey="expectedPower" stroke="#19A974" strokeWidth={2} dot={false} name="Expected Player Power" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Level table */}
            <div className="bg-white rounded-[14px] border border-[#DED9EA] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#F4F1FA]">
                    <tr>
                      {["Lvl", "XP Required", "Cum. XP", "Sessions", "Est. Time", "Unlock", "Reward", "Gap", "Notes"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DED9EA]">
                    {paginated.map((row) => (
                      <tr key={row.level} className={`table-row-hover ${row.level === 27 ? "bg-[#FFF0F2]" : ""}`}>
                        <td className="px-4 py-2.5 font-mono font-bold text-[#17152B]">{row.level}</td>
                        <td className="px-4 py-2.5 font-mono text-[#6C6880]">{row.xpRequired.toLocaleString()}</td>
                        <td className="px-4 py-2.5 font-mono text-[#6C6880]">{row.cumulativeXP.toLocaleString()}</td>
                        <td className="px-4 py-2.5 font-mono">{row.estimatedSessions}</td>
                        <td className="px-4 py-2.5 font-mono">{row.estimatedTime}</td>
                        <td className="px-4 py-2.5 text-[#17152B] max-w-[100px] truncate">{row.mainUnlock || "—"}</td>
                        <td className="px-4 py-2.5 text-[#6C6880]">{row.reward}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${row.difficultyGap === "HIGH ⚠" ? "bg-[#FFF0F2] text-[#FF3B4F]" : row.difficultyGap === "Medium" ? "bg-[#FFF8E6] text-[#FFC928]" : "bg-[#EDFAF4] text-[#19A974]"}`}>
                            {row.difficultyGap}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[#FF3B4F] text-[10px] max-w-[160px] truncate">{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-[#DED9EA] flex items-center justify-between text-xs text-[#6C6880]">
                <span>Levels {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, PROGRESSION_LEVELS.length)} of 50</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-2 py-1 border border-[#DED9EA] rounded disabled:opacity-40 hover:bg-[#F4F1FA]">← Prev</button>
                  <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page === totalPages - 1} className="px-2 py-1 border border-[#DED9EA] rounded disabled:opacity-40 hover:bg-[#F4F1FA]">Next →</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab !== "Player XP" && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <TrendingUp size={40} className="text-[#DED9EA] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#17152B]">{tab}</p>
              <p className="text-xs text-[#6C6880] mt-1">Use the Player XP tab to build your base curve first.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
