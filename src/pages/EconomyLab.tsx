import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { FlaskConical, TrendingUp, AlertTriangle, Info, Play, Save, Plus } from "lucide-react";
import { CURRENCIES, ECONOMY_BALANCE } from "../data/mockData";

interface EconomyLabProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
}

const TABS = ["Overview", "Currencies", "Sources & Sinks", "Income Formulas", "Upgrade Costs", "Drop Tables", "Sensitivity Test"];

const FORMULA_VARS = {
  BaseIncome: 12,
  IncomeMultiplier: 1.18,
  BaseCost: 100,
  CostMultiplier: 1.35,
  OfflineCap: 4,
  OfflineRate: 0.5,
};

function generateFormulaData(vars: typeof FORMULA_VARS) {
  return Array.from({ length: 30 }, (_, i) => ({
    level: i + 1,
    income: Math.round(vars.BaseIncome * Math.pow(vars.IncomeMultiplier, i)),
    cost: Math.round(vars.BaseCost * Math.pow(vars.CostMultiplier, i)),
    timeToUpgrade: parseFloat((Math.round(vars.BaseCost * Math.pow(vars.CostMultiplier, i)) /
      (Math.round(vars.BaseIncome * Math.pow(vars.IncomeMultiplier, i)) / 60)).toFixed(1)),
  }));
}

const DROP_TABLE = [
  { id: "REW_DAILY_001", item: "Small Coin Bag", rarity: "Common", weight: 40, probability: "40.0%", value: 200, pity: 0 },
  { id: "REW_DAILY_002", item: "Medium Coin Bag", rarity: "Common", weight: 30, probability: "30.0%", value: 500, pity: 0 },
  { id: "REW_DAILY_003", item: "Energy Potion", rarity: "Uncommon", weight: 15, probability: "15.0%", value: 30, pity: 2 },
  { id: "REW_DAILY_004", item: "Ghost Fragment", rarity: "Rare", weight: 10, probability: "10.0%", value: 150, pity: 5 },
  { id: "REW_DAILY_005", item: "Diamond Shard", rarity: "Epic", weight: 4, probability: "4.0%", value: 5, pity: 10 },
  { id: "REW_DAILY_006", item: "Haunted Key", rarity: "Legendary", weight: 1, probability: "1.0%", value: 1, pity: 50 },
];

const RARITY_COLORS: Record<string, string> = {
  Common: "text-[#6C6880]",
  Uncommon: "text-[#19A974]",
  Rare: "text-[#19C6D1]",
  Epic: "text-[#6C3BFF]",
  Legendary: "text-[#FFC928]",
};

export default function EconomyLab({ onToast }: EconomyLabProps) {
  const [tab, setTab] = useState("Overview");
  const [vars, setVars] = useState(FORMULA_VARS);
  const [formulaCode, setFormulaCode] = useState(
    `Income(level) = BaseIncome × IncomeMultiplier^(level - 1)\nUpgradeCost(level) = BaseCost × CostMultiplier^(level - 1)\nTimeToUpgrade = UpgradeCost / EffectiveIncomePerSecond\nOfflineReward = min(OfflineSeconds, OfflineCap×3600) × EffectiveIncomePerSecond × OfflineRate`
  );
  const [sensitivityVals, setSensitivityVals] = useState({ incomeMultiplier: 1.18, costMultiplier: 1.35, sessionLength: 10, rewardValue: 100 });

  const formulaData = generateFormulaData(vars);
  const totalWeight = DROP_TABLE.reduce((sum, r) => sum + r.weight, 0);

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#FFF9F2]">
      {/* Tab bar */}
      <div className="bg-white border-b border-[#DED9EA] px-5 flex items-center gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-[#6C3BFF] text-[#6C3BFF]" : "border-transparent text-[#6C6880] hover:text-[#17152B]"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === "Overview" && (
          <div className="space-y-5">
            {/* Health scores */}
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: "Economy Health", value: "78/100", color: "text-[#FFC928]" },
                { label: "Source/Sink Ratio", value: "1.06:1", color: "text-[#19A974]" },
                { label: "Inflation Forecast", value: "+2.3%/mo", color: "text-[#19C6D1]" },
                { label: "Hoarding Risk", value: "Low", color: "text-[#19A974]" },
                { label: "Bottleneck", value: "L27 Gate", color: "text-[#FF3B4F]" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-[14px] border border-[#DED9EA] p-4" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
                  <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-[#6C6880] mt-0.5 font-medium">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Currency flow chart */}
            <div className="bg-white rounded-[14px] border border-[#DED9EA] p-5" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
              <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider mb-4">Currency Flow (Sources vs Sinks)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ECONOMY_BALANCE} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F1FA" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6C6880" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6C6880" }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #DED9EA" }} />
                  <Bar dataKey="sources" name="Sources" fill="#19C6D1" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="sinks" name="Sinks" fill="#6C3BFF" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === "Currencies" && (
          <div className="bg-white rounded-[14px] border border-[#DED9EA] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#DED9EA]">
              <span className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider">Currencies</span>
              <button onClick={() => onToast("success", "Currency added", "New currency created in Draft")} className="flex items-center gap-1.5 bg-[#6C3BFF] text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                <Plus size={12} /> Add Currency
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#F4F1FA]">
                  <tr>
                    {["ID", "Name", "Type", "Start Balance", "Cap", "Visibility", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DED9EA]">
                  {CURRENCIES.map((c) => (
                    <tr key={c.id} className="table-row-hover">
                      <td className="px-4 py-3 font-mono text-[10px] text-[#6C6880]">{c.id}</td>
                      <td className="px-4 py-3 font-semibold text-[#17152B]">{c.name}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F1FA] text-[#6C6880] capitalize">{c.type}</span>
                      </td>
                      <td className="px-4 py-3 font-mono">{c.startingBalance.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono">{c.cap.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[#6C6880]">{c.visibility}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.status === "Stable" ? "bg-[#EDFAF4] text-[#19A974] border-[#C8F0DC]" : c.status === "Review" ? "bg-[#FFF8E6] text-[#FFC928] border-[#FFE89A]" : "bg-[#F4F1FA] text-[#6C6880] border-[#DED9EA]"}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "Income Formulas" && (
          <div className="flex gap-5 h-full">
            {/* Variables panel */}
            <div className="w-64 shrink-0 space-y-4">
              <div className="bg-white rounded-[14px] border border-[#DED9EA] p-4" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
                <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider mb-3">Variables</div>
                {Object.entries(vars).map(([key, val]) => (
                  <div key={key} className="mb-3">
                    <label className="text-[10px] font-mono text-[#6C6880] block mb-1">{key}</label>
                    <input
                      type="number"
                      value={val}
                      step={key.includes("Multiplier") || key.includes("Rate") ? 0.01 : 1}
                      onChange={(e) => setVars({ ...vars, [key]: parseFloat(e.target.value) })}
                      className="w-full font-mono text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 focus:outline-none focus:border-[#6C3BFF] text-[#17152B]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Editor + chart */}
            <div className="flex-1 space-y-4">
              <div className="bg-white rounded-[14px] border border-[#DED9EA] p-4" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider">Formula Editor</div>
                  <div className="flex gap-2">
                    <button onClick={() => onToast("success", "Formulas validated", "All formula expressions are valid")} className="flex items-center gap-1 text-xs text-[#19A974] bg-[#EDFAF4] border border-[#C8F0DC] px-2.5 py-1 rounded-lg">
                      <Play size={11} /> Validate
                    </button>
                    <button onClick={() => onToast("success", "Saved", "Formula changes saved")} className="flex items-center gap-1 text-xs text-[#6C3BFF] bg-[#F4F1FA] border border-[#DED9EA] px-2.5 py-1 rounded-lg">
                      <Save size={11} /> Save
                    </button>
                  </div>
                </div>
                <textarea
                  value={formulaCode}
                  onChange={(e) => setFormulaCode(e.target.value)}
                  rows={6}
                  className="w-full font-mono text-xs bg-[#17152B] text-[#19C6D1] p-4 rounded-lg resize-none focus:outline-none leading-relaxed"
                />
                <div className="mt-2 text-[10px] text-[#19A974] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#19A974]" /> All expressions valid · No circular references detected
                </div>
              </div>

              <div className="bg-white rounded-[14px] border border-[#DED9EA] p-4" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
                <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider mb-3">Preview: Income vs Cost (L1–30)</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={formulaData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F4F1FA" />
                    <XAxis dataKey="level" tick={{ fontSize: 10, fill: "#6C6880" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#6C6880" }} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #DED9EA" }} />
                    <Line type="monotone" dataKey="income" name="Income/min" stroke="#19C6D1" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="cost" name="Upgrade Cost" stroke="#FF3B4F" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {tab === "Drop Tables" && (
          <div className="space-y-4">
            <div className="bg-white rounded-[14px] border border-[#DED9EA] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#DED9EA]">
                <div>
                  <span className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider">Daily Chest Drop Table</span>
                  <span className={`ml-3 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${totalWeight === 100 ? "bg-[#EDFAF4] text-[#19A974] border-[#C8F0DC]" : "bg-[#FFF0F2] text-[#FF3B4F] border-[#FFB3BB]"}`}>
                    Total: {totalWeight}% {totalWeight !== 100 && "⚠ Must equal 100"}
                  </span>
                </div>
                <button className="flex items-center gap-1.5 bg-[#6C3BFF] text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                  <Plus size={12} /> Add Reward
                </button>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-[#F4F1FA]">
                  <tr>
                    {["ID", "Item", "Rarity", "Weight", "Probability", "Value", "Pity @"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DED9EA]">
                  {DROP_TABLE.map((r) => (
                    <tr key={r.id} className="table-row-hover">
                      <td className="px-4 py-2.5 font-mono text-[10px] text-[#6C6880]">{r.id}</td>
                      <td className="px-4 py-2.5 font-semibold text-[#17152B]">{r.item}</td>
                      <td className={`px-4 py-2.5 font-semibold ${RARITY_COLORS[r.rarity]}`}>{r.rarity}</td>
                      <td className="px-4 py-2.5 font-mono">{r.weight}</td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-[#19C6D1]">{r.probability}</td>
                      <td className="px-4 py-2.5 font-mono">{r.value}</td>
                      <td className="px-4 py-2.5 font-mono text-[#6C6880]">{r.pity > 0 ? `${r.pity} pulls` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "Sensitivity Test" && (
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-[14px] border border-[#DED9EA] p-5" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
              <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider mb-4">Sensitivity Controls</div>
              {[
                { key: "incomeMultiplier", label: "Income Multiplier", min: 1.05, max: 1.5, step: 0.01 },
                { key: "costMultiplier", label: "Cost Multiplier", min: 1.1, max: 2.0, step: 0.01 },
                { key: "sessionLength", label: "Session Length (min)", min: 3, max: 30, step: 1 },
                { key: "rewardValue", label: "Reward Value (%)", min: 50, max: 200, step: 5 },
              ].map((ctrl) => (
                <div key={ctrl.key} className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-[#17152B] font-medium">{ctrl.label}</label>
                    <span className="font-mono text-xs text-[#6C3BFF] font-semibold">{sensitivityVals[ctrl.key as keyof typeof sensitivityVals]}</span>
                  </div>
                  <input
                    type="range"
                    min={ctrl.min}
                    max={ctrl.max}
                    step={ctrl.step}
                    value={sensitivityVals[ctrl.key as keyof typeof sensitivityVals]}
                    onChange={(e) => setSensitivityVals({ ...sensitivityVals, [ctrl.key]: parseFloat(e.target.value) })}
                    className="w-full accent-[#6C3BFF]"
                  />
                  <div className="flex justify-between text-[10px] text-[#6C6880]">
                    <span>{ctrl.min}</span><span>{ctrl.max}</span>
                  </div>
                </div>
              ))}
              <button onClick={() => onToast("info", "Simulation running…", "Sensitivity analysis in progress")}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#6C3BFF] text-white text-xs font-medium rounded-lg">
                <Play size={13} /> Run Analysis
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-[14px] border border-[#DED9EA] p-4" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
                <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider mb-3">KPI Impact</div>
                {[
                  { kpi: "Time to L27", before: "23.1d", after: "19.8d", impact: "positive", magnitude: "High" },
                  { kpi: "D30 Retention", before: "7.8%", after: "8.4%", impact: "positive", magnitude: "Medium" },
                  { kpi: "ARPDAU", before: "$0.18", after: "$0.21", impact: "positive", magnitude: "Medium" },
                  { kpi: "Coin Balance D7", before: "3,200", after: "4,100", impact: "positive", magnitude: "High" },
                ].map((row) => (
                  <div key={row.kpi} className="flex items-center gap-2 py-2 border-b border-[#DED9EA] last:border-0">
                    <span className="flex-1 text-xs text-[#17152B]">{row.kpi}</span>
                    <span className="font-mono text-[11px] text-[#6C6880]">{row.before}</span>
                    <span className="text-[#6C6880]">→</span>
                    <span className="font-mono text-[11px] text-[#19A974] font-semibold">{row.after}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${row.magnitude === "High" ? "bg-[#EDFAF4] text-[#19A974]" : "bg-[#FFF8E6] text-[#FFC928]"}`}>{row.magnitude}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fallback for unimplemented tabs */}
        {!["Overview", "Currencies", "Income Formulas", "Drop Tables", "Sensitivity Test"].includes(tab) && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FlaskConical size={40} className="text-[#DED9EA] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#17152B]">{tab}</p>
              <p className="text-xs text-[#6C6880] mt-1">Select a currency or formula to begin editing.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
