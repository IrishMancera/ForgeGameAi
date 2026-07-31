import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, AreaChart, Area
} from "recharts";
import {
  Heart, CheckSquare, AlertTriangle, HelpCircle, Clock,
  Download, Zap, Plus, CheckCircle, ShieldCheck,
  X, Filter, Target, RefreshCw
} from "lucide-react";
import { getProjects, createProject, fetchProject, type AppProject } from "../services/project";
import {
  PROJECT, RETENTION_DATA, ECONOMY_BALANCE,
  EXCITEMENT_CURVE, RISK_DATA, PROGRESSION_LEVELS, AUDIT_FINDINGS
} from "../data/mockData";
import { useModuleState } from "../services/useModuleState";

interface CommandCenterProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  projectId?: string;
  onProjectCreated?: () => void;
}

interface DecisionItem {
  id: string;
  title: string;
  category: string;
  impact: "High" | "Medium" | "Low";
  status: "Open" | "Resolved";
  owner: string;
  deadline: string;
  notes?: string;
}

interface TargetMilestone {
  id: string;
  title: string;
  metric: string;
  targetValue: string;
  currentValue: string;
  dueDate: string;
  status: "On Track" | "At Risk" | "Achieved";
}

const DEFAULT_DECISIONS: DecisionItem[] = [
  { id: "DEC-101", title: "Select Soft-to-Hard Currency exchange ratio", category: "Economy", impact: "High", status: "Open", owner: "Sarah M.", deadline: "3 days", notes: "Targeting 100:1 soft-to-hard conversion." },
  { id: "DEC-102", title: "Finalize Room Tier 5 unlock level requirements", category: "Progression", impact: "Medium", status: "Open", owner: "Alex R.", deadline: "5 days", notes: "Level 25 vs Level 30 unlock threshold." },
  { id: "DEC-103", title: "Disclose Gacha odds UI for EU regulatory compliance", category: "Monetization", impact: "High", status: "Open", owner: "Elena K.", deadline: "Tomorrow", notes: "Required for PEGI registration." },
  { id: "DEC-104", title: "Approve Bartle Achiever retention hooks in D7 event", category: "Psychology", impact: "Low", status: "Resolved", owner: "Jordan T.", deadline: "Resolved", notes: "Approved 2x XP weekend boost." },
];

const DEFAULT_MILESTONES: TargetMilestone[] = [
  { id: "M1", title: "D1 Retention Baseline", metric: "D1 Retention", targetValue: "45%", currentValue: "42%", dueDate: "Q3 Launch", status: "On Track" },
  { id: "M2", title: "Gacha Pity Cap Safeguard", metric: "Pity Pull Cap", targetValue: "80 pulls", currentValue: "80 pulls", dueDate: "Pre-Alpha", status: "Achieved" },
  { id: "M3", title: "Day 30 Inflation Shield", metric: "Sink-to-Faucet Ratio", targetValue: "95%", currentValue: "88%", dueDate: "Beta 1.0", status: "At Risk" },
];

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
    <div className="premium-card rounded-[14px] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#DED9EA]">
        <span className="text-sm font-semibold text-[#17152B]" style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.03em", textTransform: "uppercase", fontSize: "11px" }}>{title}</span>
        {action}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function CommandCenter({ onToast, projectId, onProjectCreated }: CommandCenterProps) {
  const [project, setProject] = useState<AppProject | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [creatingProject, setCreatingProject] = useState(false);
  const [retentionView, setRetentionView] = useState<"forecast" | "observed">("forecast");
  const [riskFilter, setRiskFilter] = useState<string>("All");

  // Local persistent state
  const [centerState, setCenterState] = useModuleState(
    'command-center',
    {
      decisions: DEFAULT_DECISIONS,
      milestones: DEFAULT_MILESTONES,
      mitigatedRisks: [] as string[],
    },
    projectId
  );

  // Modals
  const [selectedDecision, setSelectedDecision] = useState<DecisionItem | null>(null);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState<Partial<TargetMilestone>>({
    title: "", metric: "", targetValue: "", currentValue: "", dueDate: "", status: "On Track"
  });

  // Fetch the active project — re-runs whenever projectId changes (e.g. from Header switcher)
  const loadProject = useCallback(async () => {
    setProjectLoading(true);
    try {
      if (projectId) {
        // Fetch the specific active project from the backend
        const res = await fetchProject(projectId);
        setProject(res.project);
      } else {
        // Fall back to first project in list
        const res = await getProjects();
        setProject(res.projects[0] ?? null);
      }
    } catch {
      setProject(null);
    } finally {
      setProjectLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleCreateProject = async () => {
    setCreatingProject(true);
    try {
      const response = await createProject('Haunted Hotel', 'Hybrid-Casual Tycoon', 'Mobile');
      setProject(response.project);
      onToast('success', 'Project created', 'Your first project is ready to use.');
      // Notify App.tsx to re-fetch the backend snapshot so projectId
      // flows down to ALL workspace pages immediately.
      onProjectCreated?.();
    } catch (error) {
      onToast('error', 'Create project failed', error instanceof Error ? error.message : 'Please try again');
    } finally {
      setCreatingProject(false);
    }
  };

  // Derive xp / xpMax from real blueprintComplete so the progress bar
  // reflects live data instead of a hardcoded mock value.
  const XP_MAX = 50_000;
  const displayProject = project ? {
    ...project,
    xp: Math.round((project.blueprintComplete / 100) * XP_MAX),
    xpMax: XP_MAX,
  } : {
    ...PROJECT,
    xp: Math.round((PROJECT.blueprintComplete / 100) * XP_MAX),
    xpMax: XP_MAX,
  };

  // Decisions handlers
  const toggleDecisionStatus = (id: string) => {
    setCenterState((prev) => ({
      ...prev,
      decisions: prev.decisions.map((d) =>
        d.id === id ? { ...d, status: d.status === "Open" ? "Resolved" : "Open" } : d
      ),
    }));
    onToast("success", "Decision updated", "Status saved to project state");
  };

  // Milestone handlers
  const handleAddMilestone = () => {
    if (!newMilestone.title || !newMilestone.targetValue) {
      onToast("error", "Missing fields", "Please fill in title and target value");
      return;
    }
    const created: TargetMilestone = {
      id: `M${Date.now()}`,
      title: newMilestone.title,
      metric: newMilestone.metric || "Target Metric",
      targetValue: newMilestone.targetValue,
      currentValue: newMilestone.currentValue || "0%",
      dueDate: newMilestone.dueDate || "TBD",
      status: (newMilestone.status as TargetMilestone["status"]) || "On Track",
    };
    setCenterState((prev) => ({
      ...prev,
      milestones: [...prev.milestones, created],
    }));
    setShowAddMilestone(false);
    setNewMilestone({ title: "", metric: "", targetValue: "", currentValue: "", dueDate: "", status: "On Track" });
    onToast("success", "Milestone added", `Added "${created.title}" to target roadmap`);
  };

  // Mitigate risk handler
  const handleToggleMitigateRisk = (riskId: string) => {
    setCenterState((prev) => {
      const exists = prev.mitigatedRisks.includes(riskId);
      return {
        ...prev,
        mitigatedRisks: exists
          ? prev.mitigatedRisks.filter((id) => id !== riskId)
          : [...prev.mitigatedRisks, riskId],
      };
    });
    onToast("info", "Risk status updated", "Risk state recorded in module memory");
  };

  // Export Executive Briefing
  const handleExportBriefing = () => {
    const reportData = {
      project: displayProject.name,
      exportDate: new Date().toISOString(),
      systemHealth: displayProject.systemHealth,
      blueprintComplete: displayProject.blueprintComplete,
      decisions: centerState.decisions,
      milestones: centerState.milestones,
      activeRisks: AUDIT_FINDINGS.filter((f) => !centerState.mitigatedRisks.includes(f.id)),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${displayProject.name.toLowerCase().replace(/\s+/g, "-")}-executive-briefing.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("success", "Briefing downloaded", "Executive summary exported as JSON");
  };

  const activeDecisionsCount = centerState.decisions.filter((d) => d.status === "Open").length;
  const filteredRisks = AUDIT_FINDINGS.filter((f) => {
    if (riskFilter === "All") return true;
    return f.severity === riskFilter;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-5 space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-white border border-[#DED9EA] px-5 py-3 rounded-[14px]">
        <div>
          <h1 className="text-lg font-bold text-[#17152B]">Executive Command Center</h1>
          <p className="text-xs text-[#6C6880]">Real-time system health, risk telemetry, and decision registry</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportBriefing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#6C3BFF] bg-[#F4F1FA] border border-[#DED9EA] rounded-xl hover:bg-[#ede8fb] transition-all"
          >
            <Download size={14} /> Export Briefing
          </button>
        </div>
      </div>

      {projectLoading ? (
        <div className="rounded-[20px] bg-white/90 p-8 shadow-[0_24px_80px_rgba(108,59,255,0.08)] text-center text-[#17152B]">
          Loading workspace project…
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
            <StatCard icon={Heart} label="System Health" value={`${displayProject.systemHealth}/100`} sub="Stable ops" color="bg-[#19A974]" />
            <StatCard icon={CheckSquare} label="Blueprint Complete" value={`${displayProject.blueprintComplete}%`} sub="GDD sync active" color="bg-[#6C3BFF]" />
            <StatCard icon={AlertTriangle} label="Active Risks" value={filteredRisks.filter((r) => !centerState.mitigatedRisks.includes(r.id)).length} sub="Audit flags" color="bg-[#FF3B4F]" />
            <StatCard icon={HelpCircle} label="Open Decisions" value={activeDecisionsCount} sub="Registry pending" color="bg-[#FFC928]" />
            <StatCard icon={Clock} label="Last Simulation" value="12m ago" sub="Cohort · 500 players" color="bg-[#19C6D1]" />
          </div>

          {/* Blueprint XP Bar */}
          <div className="premium-card rounded-[14px] px-5 py-3 flex items-center gap-4">
            <Zap size={16} className="text-[#FFC928]" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#17152B]">Blueprint Readiness Progress</span>
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
              Blueprint {displayProject.blueprintComplete}% Complete
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
              action={<span className="text-[10px] text-[#19A974] font-semibold bg-[#EDFAF4] px-2 py-0.5 rounded-full">Net +2.21% Flow</span>}
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
            <SectionCard
              title="Risk Telemetry"
              action={
                <div className="flex items-center gap-1">
                  {["All", "Critical", "High"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setRiskFilter(lvl)}
                      className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${riskFilter === lvl ? "bg-[#6C3BFF] text-white" : "text-[#6C6880] hover:bg-[#F4F1FA]"}`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="p-4">
                <ResponsiveContainer width="100%" height={120}>
                  <RadarChart data={RISK_DATA} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <PolarGrid stroke="#DED9EA" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "#6C6880" }} />
                    <Radar name="Risk" dataKey="A" stroke="#FF3B4F" fill="#FF3B4F" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2 max-h-24 overflow-y-auto">
                  {filteredRisks.map((r) => {
                    const isMitigated = centerState.mitigatedRisks.includes(r.id);
                    return (
                      <div key={r.id} className="flex items-center gap-2 text-xs p-1.5 rounded bg-[#F4F1FA] border border-[#DED9EA]">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.severity === "Critical" ? "bg-[#FF3B4F]" : "bg-[#FFC928]"}`} />
                        <span className={`text-[#17152B] truncate flex-1 ${isMitigated ? "line-through opacity-60" : ""}`}>{r.finding}</span>
                        <button
                          onClick={() => handleToggleMitigateRisk(r.id)}
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded transition-all ${isMitigated ? "bg-[#EDFAF4] text-[#19A974]" : "bg-white border text-[#6C6880] hover:text-[#FF3B4F]"}`}
                        >
                          {isMitigated ? "Mitigated" : "Mitigate"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Bottom row: Decision Registry & Milestone Roadmap */}
          <div className="grid grid-cols-2 gap-4">
            {/* Open Decision Registry */}
            <SectionCard
              title="Open Decision Registry"
              action={
                <span className="text-[10px] text-[#6C3BFF] font-semibold bg-[#F4F1FA] px-2 py-0.5 rounded-full">
                  {activeDecisionsCount} Open Decisions
                </span>
              }
            >
              <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
                {centerState.decisions.map((d) => (
                  <div key={d.id} className="p-3 bg-white border border-[#DED9EA] rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-[#6C3BFF] transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${d.impact === "High" ? "bg-[#FFF0F2] text-[#FF3B4F]" : "bg-[#F4F1FA] text-[#6C6880]"}`}>
                          {d.impact} Impact
                        </span>
                        <span className="text-[10px] text-[#6C6880]">{d.category}</span>
                        <span className="text-[10px] text-[#6C6880]">· Owner: {d.owner}</span>
                      </div>
                      <div className={`text-xs font-semibold mt-1 ${d.status === "Resolved" ? "line-through text-[#6C6880]" : "text-[#17152B]"}`}>
                        {d.title}
                      </div>
                      {d.notes && <div className="text-[10px] text-[#6C6880] mt-0.5">{d.notes}</div>}
                    </div>
                    <button
                      onClick={() => toggleDecisionStatus(d.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                        d.status === "Resolved"
                          ? "bg-[#EDFAF4] text-[#19A974] border border-[#C8F0DC]"
                          : "bg-[#6C3BFF] text-white hover:bg-[#5a2fe0]"
                      }`}
                    >
                      {d.status === "Resolved" ? <ShieldCheck size={12} /> : <CheckCircle size={12} />}
                      {d.status === "Resolved" ? "Resolved" : "Mark Resolved"}
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Target Milestones Roadmap */}
            <SectionCard
              title="Target Milestone Roadmap"
              action={
                <button
                  onClick={() => setShowAddMilestone(true)}
                  className="flex items-center gap-1 text-[10px] text-[#6C3BFF] font-semibold bg-[#F4F1FA] px-2.5 py-1 rounded-full hover:bg-[#ede8fb]"
                >
                  <Plus size={11} /> Add Target
                </button>
              }
            >
              <div className="p-4 space-y-2.5 max-h-72 overflow-y-auto">
                {centerState.milestones.map((m) => (
                  <div key={m.id} className="p-3 bg-[#F4F1FA] border border-[#DED9EA] rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Target size={13} className="text-[#6C3BFF]" />
                        <span className="text-xs font-bold text-[#17152B]">{m.title}</span>
                      </div>
                      <div className="text-[10px] text-[#6C6880] mt-0.5">
                        Target: <span className="font-semibold text-[#17152B]">{m.targetValue}</span> · Current: <span className="font-semibold text-[#6C3BFF]">{m.currentValue}</span> · Due: {m.dueDate}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.status === "Achieved" ? "bg-[#EDFAF4] text-[#19A974]" :
                      m.status === "At Risk" ? "bg-[#FFF0F2] text-[#FF3B4F]" : "bg-[#FFF8E6] text-[#FFC928]"
                    }`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {showAddMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-[#DED9EA] p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#17152B]">Add Target Milestone</h3>
              <button onClick={() => setShowAddMilestone(false)} className="text-[#6C6880] hover:text-[#17152B]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">Milestone Title</label>
                <input
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  placeholder="e.g. Day 7 Retention Threshold"
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#6C6880] block mb-1">Target Value</label>
                  <input
                    value={newMilestone.targetValue}
                    onChange={(e) => setNewMilestone({ ...newMilestone, targetValue: e.target.value })}
                    placeholder="e.g. 25%"
                    className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6C6880] block mb-1">Current Value</label>
                  <input
                    value={newMilestone.currentValue}
                    onChange={(e) => setNewMilestone({ ...newMilestone, currentValue: e.target.value })}
                    placeholder="e.g. 18%"
                    className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#6C6880] block mb-1">Due Date</label>
                  <input
                    value={newMilestone.dueDate}
                    onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                    placeholder="e.g. Q4 Release"
                    className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6C6880] block mb-1">Initial Status</label>
                  <select
                    value={newMilestone.status}
                    onChange={(e) => setNewMilestone({ ...newMilestone, status: e.target.value as TargetMilestone["status"] })}
                    className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                  >
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Achieved">Achieved</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddMilestone(false)}
                className="flex-1 py-2 text-xs font-medium border border-[#DED9EA] rounded-lg text-[#6C6880] hover:bg-[#F4F1FA]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMilestone}
                className="flex-1 py-2 text-xs font-medium bg-[#6C3BFF] text-white rounded-lg hover:bg-[#5a2fe0]"
              >
                Save Milestone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
