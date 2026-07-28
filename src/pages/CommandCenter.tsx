import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, Legend, AreaChart, Area
} from "recharts";
import {
  Heart, CheckSquare, AlertTriangle, HelpCircle, Clock,
  TrendingUp, ArrowUpRight, ArrowDownRight, Info, Download,
  LayoutGrid, Zap
} from "lucide-react";
import { getProjects, createProject, type AppProject } from "../services/project";
import {
  PROJECT, RETENTION_DATA, ECONOMY_BALANCE, EXCITEMENT_CURVE,
  RISK_DATA, KPI_FORECAST, PROGRESSION_LEVELS, AUDIT_FINDINGS
} from "../data/mockData";

interface CommandCenterProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="premium-card rounded-[14px] p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <div className="text-xl font-bold text-[#17152B]" style={{ fontFamily: "IBM Plex Mono, monospace" }}>{value}</div>
        <div className="text-xs text-[#6C6880] font-medium">{label}</div>
        {sub && <div className="text-[10px] text-[#6C6880] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="premium-card rounded-[14px] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#DED9EA]">
        <span className="text-sm font-semibold text-[#17152B]" style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.03em", textTransform: "uppercase", fontSize: "11px" }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function CommandCenter({ onToast }: CommandCenterProps) {
  const [project, setProject] = useState<AppProject | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [creatingProject, setCreatingProject] = useState(false);
  const [retentionView, setRetentionView] = useState<"forecast" | "observed">("forecast");
  const [selectedSheets, setSelectedSheets] = useState({
    core: true, economy: true, progression: true, psychology: true, simulation: true,
  });

  useEffect(() => {
    let active = true;
    getProjects()
      .then((response) => {
        if (!active) return;
        setProject(response.projects[0] ?? null);
      })
      .catch(() => {
        if (!active) return;
        setProject(null);
      })
      .finally(() => {
        if (active) setProjectLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreateProject = async () => {
    setCreatingProject(true);
    try {
      const response = await createProject('Haunted Hotel', 'Hybrid-Casual Tycoon', 'Mobile');
      setProject(response.project);
      onToast('success', 'Project created', 'Your first project is ready to use.');
    } catch (error) {
      onToast('error', 'Create project failed', error instanceof Error ? error.message : 'Please try again');
    } finally {
      setCreatingProject(false);
    }
  };

  const displayProject = project ? {
    ...project,
    xp: PROJECT.xp,
    xpMax: PROJECT.xpMax,
  } : PROJECT;

  const topRisks = AUDIT_FINDINGS.filter((f) => f.severity === "Critical" || f.severity === "High").slice(0, 3);
  const levelSample = PROGRESSION_LEVELS.filter((l) => [1, 5, 10, 15, 20, 27, 30, 40, 50].includes(l.level));

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-5 space-y-5">
      {projectLoading ? (
        <div className="rounded-[20px] bg-white/90 p-8 shadow-[0_24px_80px_rgba(108,59,255,0.08)] text-center text-[#17152B]">
          Loading your projects…
        </div>
      ) : !project ? (
        <div className="rounded-[20px] bg-white/90 p-8 shadow-[0_24px_80px_rgba(108,59,255,0.08)] text-center text-[#17152B]">
          <h2 className="text-xl font-semibold mb-4">No active project yet</h2>
          <p className="text-sm text-[#6C6880] mb-6">Create your first project and unlock AI recommendations, balance analysis, and analytics dashboards.</p>
          <button
            onClick={handleCreateProject}
            disabled={creatingProject}
            className="rounded-[14px] bg-[#6C3BFF] px-6 py-3 text-sm font-semibold text-white hover:bg-[#5a2fe0] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creatingProject ? 'Creating project…' : 'Create first project'}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Top stat bar */}
          <div className="grid grid-cols-5 gap-3">
        <StatCard icon={Heart} label="System Health" value={`${displayProject.systemHealth}/100`} sub="4 issues open" color="bg-[#19A974]" />
        <StatCard icon={CheckSquare} label="Blueprint Complete" value={`${displayProject.blueprintComplete}%`} sub="2 sections incomplete" color="bg-[#6C3BFF]" />
        <StatCard icon={AlertTriangle} label="Critical Risks" value={displayProject.criticalRisks} sub="Audit Center" color="bg-[#FF3B4F]" />
        <StatCard icon={HelpCircle} label="Open Decisions" value={displayProject.openDecisions} sub="7 awaiting review" color="bg-[#FFC928]" />
        <StatCard icon={Clock} label="Last Simulation" value="12m ago" sub="Cohort · 500 players" color="bg-[#19C6D1]" />
      </div>

      {/* Blueprint XP Bar */}
      <div className="premium-card rounded-[14px] px-5 py-3 flex items-center gap-4">
        <Zap size={16} className="text-[#FFC928]" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-[#17152B]">Blueprint Progress</span>
            <span className="text-xs font-mono text-[#6C3BFF]">{displayProject.xp.toLocaleString()} / {displayProject.xpMax.toLocaleString()} XP</span>
          </div>
          <div className="h-2 bg-[#F4F1FA] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6C3BFF] to-[#19C6D1] rounded-full transition-all"
              style={{ width: `${(displayProject.xp / displayProject.xpMax) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-[#FFC928] font-semibold bg-[#FFF8E6] border border-[#FFE89A] px-2 py-0.5 rounded-full">
          Blueprint 86% Complete · +250 XP
        </span>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Retention Forecast */}
        <SectionCard
          title="Retention Forecast"
          action={
            <div className="flex gap-1">
              {(["forecast", "observed"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setRetentionView(v)}
                  className={`text-[10px] px-2 py-1 rounded-md capitalize transition-colors ${retentionView === v ? "bg-[#6C3BFF] text-white" : "text-[#6C6880] hover:bg-[#F4F1FA]"}`}
                >
                  {v}
                </button>
              ))}
            </div>
          }
        >
          <div className="p-4">
            <div className="flex gap-4 mb-3">
              {[
                { label: "D1", value: retentionView === "forecast" ? "42%" : "39%" },
                { label: "D7", value: retentionView === "forecast" ? "18%" : "16%" },
                { label: "D30", value: retentionView === "forecast" ? "8%" : "7%" },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-lg font-bold text-[#17152B]" style={{ fontFamily: "IBM Plex Mono, monospace" }}>{m.value}</div>
                  <div className="text-[10px] text-[#6C6880]" style={{ fontFamily: "Rajdhani, sans-serif" }}>{m.label} RETENTION</div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={RETENTION_DATA} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C3BFF" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6C3BFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F1FA" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6C6880" }} />
                <YAxis tick={{ fontSize: 10, fill: "#6C6880" }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #DED9EA" }} />
                <Area type="monotone" dataKey={retentionView} stroke="#6C3BFF" fill="url(#retGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Economy Balance */}
        <SectionCard
          title="Economy Balance"
          action={<span className="text-[10px] text-[#19A974] font-semibold bg-[#EDFAF4] px-2 py-0.5 rounded-full">Stable · Net +2.21%</span>}
        >
          <div className="p-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={ECONOMY_BALANCE} layout="vertical" margin={{ top: 0, right: 8, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F1FA" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#6C6880" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#6C6880" }} width={55} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #DED9EA" }} />
                <Bar dataKey="sources" name="Sources" fill="#19C6D1" radius={[0, 4, 4, 0]} barSize={10} />
                <Bar dataKey="sinks" name="Sinks" fill="#6C3BFF" radius={[0, 4, 4, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Risk Radar */}
        <SectionCard title="Risk Radar" action={<span className="text-[10px] text-[#FF3B4F] font-semibold bg-[#FFF0F2] px-2 py-0.5 rounded-full">2 Critical</span>}>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={160}>
              <RadarChart data={RISK_DATA} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <PolarGrid stroke="#DED9EA" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6C6880" }} />
                <Radar name="Risk" dataKey="A" stroke="#FF3B4F" fill="#FF3B4F" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {topRisks.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.severity === "Critical" ? "bg-[#FF3B4F]" : "bg-[#FFC928]"}`} />
                  <span className="text-[#17152B] truncate flex-1">{r.finding}</span>
                  <span className={`text-[10px] font-semibold ${r.severity === "Critical" ? "text-[#FF3B4F]" : "text-[#FFC928]"}`}>{r.severity}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Second grid row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Excitement Curve */}
        <SectionCard
          title="Excitement Curve"
          action={
            <div className="flex gap-3 text-[10px]">
              <span className="text-[#19A974]">Score: 78/100</span>
              <span className="text-[#6C6880]">Stability: Good</span>
              <span className="text-[#FFC928]">Volatility: Medium</span>
            </div>
          }
        >
          <div className="p-4">
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={EXCITEMENT_CURVE} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="excGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFC928" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FFC928" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F1FA" />
                <XAxis dataKey="stage" tick={{ fontSize: 9, fill: "#6C6880" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#6C6880" }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #DED9EA" }}
                  formatter={(val: number, name: string) => [val, "Intensity"]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.label ?? label}
                />
                <Area type="monotone" dataKey="intensity" stroke="#FFC928" fill="url(#excGrad)" strokeWidth={2} dot={{ fill: "#FFC928", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* KPI Forecast table */}
        <SectionCard title="KPI Forecast" action={<span className="text-[10px] text-[#6C6880]">vs. Baseline Simulation</span>}>
          <div className="p-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-[#6C6880] uppercase">
                  <th className="text-left pb-2 font-medium">Metric</th>
                  <th className="text-right pb-2 font-medium">Current</th>
                  <th className="text-right pb-2 font-medium">Forecast</th>
                  <th className="text-right pb-2 font-medium">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED9EA]">
                {KPI_FORECAST.map((kpi) => (
                  <tr key={kpi.metric} className="table-row-hover">
                    <td className="py-2 font-medium text-[#17152B]">{kpi.metric}</td>
                    <td className="py-2 text-right font-mono text-[#6C6880]">{kpi.current}</td>
                    <td className="py-2 text-right font-mono text-[#17152B] font-semibold">{kpi.forecast}</td>
                    <td className="py-2 text-right font-mono text-[#19A974]">{kpi.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Economy Overview */}
        <SectionCard title="Economy Overview">
          <div className="p-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-[#6C6880] uppercase">
                  <th className="text-left pb-2 font-medium">Currency</th>
                  <th className="text-right pb-2 font-medium">Sources</th>
                  <th className="text-right pb-2 font-medium">Sinks</th>
                  <th className="text-right pb-2 font-medium">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED9EA]">
                {ECONOMY_BALANCE.map((row) => (
                  <tr key={row.name} className="table-row-hover">
                    <td className="py-2 font-medium text-[#17152B]">{row.name}</td>
                    <td className="py-2 text-right font-mono text-[#19C6D1]">{row.sources.toLocaleString()}</td>
                    <td className="py-2 text-right font-mono text-[#6C3BFF]">{row.sinks.toLocaleString()}</td>
                    <td className={`py-2 text-right font-mono font-semibold ${row.net > 0 ? "text-[#19A974]" : "text-[#FF3B4F]"}`}>
                      {row.net > 0 ? "+" : ""}{row.net.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Level Progression Sample */}
        <SectionCard title="Level Progression Sample">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-[#6C6880] uppercase bg-[#F4F1FA]">
                  <th className="text-left px-3 py-2 font-medium">Lvl</th>
                  <th className="text-right px-3 py-2 font-medium">XP Req</th>
                  <th className="text-left px-3 py-2 font-medium">Unlock</th>
                  <th className="text-left px-3 py-2 font-medium">Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED9EA]">
                {levelSample.map((row) => (
                  <tr key={row.level} className="table-row-hover">
                    <td className="px-3 py-1.5 font-mono font-bold text-[#17152B]">{row.level}</td>
                    <td className="px-3 py-1.5 font-mono text-right text-[#6C6880]">{row.xpRequired.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-[#17152B] truncate max-w-[100px]">{row.mainUnlock || "—"}</td>
                    <td className="px-3 py-1.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${row.difficultyGap === "HIGH ⚠" ? "bg-[#FFF0F2] text-[#FF3B4F]" : row.difficultyGap === "Medium" ? "bg-[#FFF8E6] text-[#FFC928]" : "bg-[#EDFAF4] text-[#19A974]"}`}>
                        {row.difficultyGap}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Workbook Generator */}
        <SectionCard
          title="Workbook Generator"
          action={
            <button
              onClick={() => onToast("success", "Workbook generated!", "HauntedHotel_v0.9.3.xlsx — 34 sheets, 2,847 rows")}
              className="flex items-center gap-1.5 text-[10px] bg-[#6C3BFF] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#5a2fe0] transition-colors"
            >
              <Download size={11} /> Generate XLSX
            </button>
          }
        >
          <div className="p-4 space-y-2">
            {[
              { key: "core", label: "Core Systems & Loops", rows: 8, ready: true },
              { key: "economy", label: "Economy & Formulas", rows: 14, ready: true },
              { key: "progression", label: "Progression & XP", rows: 6, ready: true },
              { key: "psychology", label: "Psychology & Curves", rows: 4, ready: true },
              { key: "simulation", label: "Simulation & Analytics", rows: 6, ready: false },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedSheets[item.key as keyof typeof selectedSheets]}
                  onChange={(e) => setSelectedSheets({ ...selectedSheets, [item.key]: e.target.checked })}
                  className="w-3.5 h-3.5 accent-[#6C3BFF] cursor-pointer"
                />
                <span className="flex-1 text-xs text-[#17152B]">{item.label}</span>
                <span className="text-[10px] text-[#6C6880] font-mono">{item.rows} sheets</span>
                {!item.ready && <span className="text-[10px] text-[#FF3B4F]">⚠ errors</span>}
              </label>
            ))}
            <div className="mt-3 pt-3 border-t border-[#DED9EA]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6C6880]">Readiness</span>
                <span className="font-mono text-[#19A974] font-semibold">92%</span>
              </div>
              <div className="h-1.5 bg-[#F4F1FA] rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-[#19A974] rounded-full" style={{ width: "92%" }} />
              </div>
              <p className="text-[10px] text-[#FF3B4F] mt-1.5">⚠ Sheet 20 has probability pool errors</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
      )}
    </div>
  );
}
