import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, FunnelChart, Funnel,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";
import { BarChart2, Info } from "lucide-react";
import { ANALYTICS_DATA, RETENTION_DATA } from "../data/mockData";

const TABS = ["Retention", "Onboarding Funnel", "Feature Adoption", "Economy", "Monetization"];

interface AnalyticsProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
}

const FILTERS = {
  dateRange: ["Last 7 days", "Last 30 days", "Last 90 days", "Custom"],
  platform: ["All Platforms", "iOS", "Android"],
  country: ["All Countries", "US", "UK", "DE", "JP", "KR"],
  segment: ["All Players", "New Users", "D7+ Players", "Payers", "Non-payers"],
};

export default function Analytics({ onToast }: AnalyticsProps) {
  const [tab, setTab] = useState("Retention");
  const [dataMode, setDataMode] = useState<"forecast" | "observed">("observed");
  const [filters, setFilters] = useState({ dateRange: "Last 30 days", platform: "All Platforms", country: "All Countries", segment: "All Players" });

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#FFF9F2]">
      {/* Mode toggle + filters */}
      <div className="bg-white border-b border-[#DED9EA] px-5 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-[#F4F1FA] rounded-lg p-1 shrink-0">
          {(["observed", "forecast"] as const).map((m) => (
            <button key={m} onClick={() => setDataMode(m)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-semibold capitalize transition-colors ${dataMode === m ? "bg-white text-[#17152B] shadow-sm" : "text-[#6C6880]"}`}>
              {m === "observed" ? "📊 Observed" : "🔮 Forecast"}
            </button>
          ))}
        </div>

        {dataMode === "forecast" && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#FFC928] bg-[#FFF8E6] border border-[#FFE89A] px-2.5 py-1 rounded-full">
            <Info size={11} /> Showing forecasted data — not observed player behavior
          </div>
        )}

        {Object.entries(filters).map(([key, val]) => (
          <select
            key={key}
            value={val}
            onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
            className="text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-2.5 py-1.5 text-[#17152B] focus:outline-none focus:border-[#6C3BFF]"
          >
            {FILTERS[key as keyof typeof FILTERS].map((o) => <option key={o}>{o}</option>)}
          </select>
        ))}

        <button onClick={() => onToast("success", "CSV exported", "Analytics data downloaded")}
          className="ml-auto text-xs text-[#6C3BFF] hover:text-[#5a2fe0] font-medium">
          ↓ CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#DED9EA] px-5 flex items-center gap-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-[#6C3BFF] text-[#6C3BFF]" : "border-transparent text-[#6C6880] hover:text-[#17152B]"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === "Retention" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: dataMode === "observed" ? "D1 Observed" : "D1 Forecast", value: dataMode === "observed" ? "39%" : "42%", color: "text-[#6C3BFF]" },
                { label: dataMode === "observed" ? "D7 Observed" : "D7 Forecast", value: dataMode === "observed" ? "16%" : "18%", color: "text-[#19C6D1]" },
                { label: dataMode === "observed" ? "D30 Observed" : "D30 Forecast", value: dataMode === "observed" ? "7%" : "8%", color: "text-[#19A974]" },
              ].map((m) => (
                <div key={m.label} className="bg-white rounded-[14px] border border-[#DED9EA] p-4" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
                  <div className={`text-3xl font-bold font-mono ${m.color}`}>{m.value}</div>
                  <div className="text-xs text-[#6C6880] mt-1">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[14px] border border-[#DED9EA] p-5" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
              <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider mb-4">D1–D30 Retention Curve</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={RETENTION_DATA} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="obsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#19C6D1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#19C6D1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="frcGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C3BFF" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6C3BFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F1FA" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6C6880" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#6C6880" }} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #DED9EA" }} formatter={(v: number) => [`${v}%`]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="observed" name="Observed" stroke="#19C6D1" fill="url(#obsGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#6C3BFF" fill="url(#frcGrad)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === "Onboarding Funnel" && (
          <div className="bg-white rounded-[14px] border border-[#DED9EA] p-5" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
            <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider mb-4">Onboarding Funnel</div>
            <div className="space-y-2">
              {ANALYTICS_DATA.onboardingFunnel.map((step, i) => {
                const pct = Math.round((step.value / ANALYTICS_DATA.onboardingFunnel[0].value) * 100);
                const drop = i > 0 ? Math.round(((ANALYTICS_DATA.onboardingFunnel[i - 1].value - step.value) / ANALYTICS_DATA.onboardingFunnel[i - 1].value) * 100) : 0;
                return (
                  <div key={step.stage} className="flex items-center gap-3">
                    <div className="w-36 text-xs text-[#17152B] font-medium shrink-0">{step.stage}</div>
                    <div className="flex-1 h-7 bg-[#F4F1FA] rounded-lg overflow-hidden relative">
                      <div
                        className="h-full rounded-lg transition-all"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, #6C3BFF, #19C6D1)` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-end pr-3 text-[10px] font-mono font-bold text-[#17152B]">
                        {step.value.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-12 text-right text-[10px] font-mono text-[#6C6880]">{pct}%</div>
                    {drop > 0 && <div className="w-16 text-right text-[10px] font-mono text-[#FF3B4F]">–{drop}%</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "Feature Adoption" && (
          <div className="bg-white rounded-[14px] border border-[#DED9EA] p-5" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
            <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider mb-4">Feature Adoption Rate</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ANALYTICS_DATA.featureAdoption} layout="vertical" margin={{ top: 0, right: 8, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F1FA" horizontal={false} />
                <XAxis type="number" unit="%" tick={{ fontSize: 10, fill: "#6C6880" }} domain={[0, 100]} />
                <YAxis dataKey="feature" type="category" tick={{ fontSize: 11, fill: "#6C6880" }} width={90} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #DED9EA" }} formatter={(v: number) => [`${v}%`, "Adoption"]} />
                <Bar dataKey="adoption" radius={[0, 4, 4, 0]} barSize={18}>
                  {ANALYTICS_DATA.featureAdoption.map((entry, index) => (
                    <Cell key={index} fill={entry.adoption >= 60 ? "#6C3BFF" : entry.adoption >= 40 ? "#FFC928" : "#FF3B4F"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === "Economy" && (
          <div className="bg-white rounded-[14px] border border-[#DED9EA] p-5" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
            <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider mb-4">Weekly Coin Flow — Earned vs Spent</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ANALYTICS_DATA.currencyFlow} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F1FA" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6C6880" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6C6880" }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #DED9EA" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="earned" name="Coins Earned" fill="#19C6D1" radius={[4, 4, 0, 0]} barSize={22} />
                <Bar dataKey="spent" name="Coins Spent" fill="#6C3BFF" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === "Monetization" && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Conversion Rate", value: "2.8%", change: "+0.3pp", color: "text-[#19A974]" },
              { label: "ARPDAU", value: "$0.18", change: "+12%", color: "text-[#19A974]" },
              { label: "LTV (90d)", value: "$3.40", change: "+8%", color: "text-[#19A974]" },
              { label: "Payer Share", value: "4.1%", change: "+0.5pp", color: "text-[#19A974]" },
              { label: "ARPPU", value: "$4.39", change: "–2%", color: "text-[#FF3B4F]" },
              { label: "Gacha Spend Share", value: "71%", change: "⚠ High", color: "text-[#FF3B4F]" },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-[14px] border border-[#DED9EA] p-4" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
                <div className={`text-2xl font-bold font-mono ${m.color}`}>{m.value}</div>
                <div className="text-xs text-[#6C6880] mt-0.5">{m.label}</div>
                <div className={`text-[10px] mt-1 font-medium ${m.color}`}>{m.change} vs last period</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
