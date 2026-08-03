import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, Users, DollarSign, Activity, Download, Plus, Save, Cloud, CheckCircle2, Filter, X } from "lucide-react";
import { useModuleState } from "../services/useModuleState";

interface AnalyticsProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  projectId?: string;
}

interface TelemetryEvent {
  id: string;
  eventName: string;
  category: string;
  dailyVolume: string;
  triggerCondition: string;
}

const DEFAULT_EVENTS: TelemetryEvent[] = [
  { id: "EVT-01", eventName: "gacha_summon_pull", category: "Monetization", dailyVolume: "142,500", triggerCondition: "Player spends hard currency on recruit spin" },
  { id: "EVT-02", eventName: "room_upgrade_complete", category: "Progression", dailyVolume: "890,200", triggerCondition: "Player completes room level upgrade" },
  { id: "EVT-03", eventName: "ghost_staff_level_up", category: "Meta Loop", dailyVolume: "310,000", triggerCondition: "Player levels up ghost staff member" },
];

export default function Analytics({ onToast, projectId }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("30D");
  const [cohortFilter, setCohortFilter] = useState<"All" | "Whales" | "Casuals">("All");

  // Persistent state
  const [analyticsState, setAnalyticsState, saveNow, saving] = useModuleState(
    'analytics',
    {
      events: DEFAULT_EVENTS,
    },
    projectId
  );

  const events = analyticsState.events;

  // Add event modal
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<TelemetryEvent>>({
    eventName: "", category: "Progression", dailyVolume: "10,000", triggerCondition: ""
  });

  // Calculate dynamic chart data according to timeRange and cohortFilter multiplier
  const multiplier = cohortFilter === "Whales" ? 3.5 : cohortFilter === "Casuals" ? 0.4 : 1.0;
  const daysCount = timeRange === "7D" ? 7 : timeRange === "30D" ? 15 : 30;

  const chartData = Array.from({ length: daysCount }, (_, i) => ({
    date: `Day ${i + 1}`,
    arpu: Number((1.25 * multiplier + Math.sin(i) * 0.15).toFixed(2)),
    d1Retention: Math.round(42 * (cohortFilter === "Whales" ? 1.2 : 0.95)),
    activeUsers: Math.round((12000 + i * 450) * multiplier),
  }));

  const handleAddEvent = () => {
    if (!newEvent.eventName) {
      onToast("error", "Missing name", "Enter event name");
      return;
    }
    const created: TelemetryEvent = {
      id: `EVT-0${events.length + 1}`,
      eventName: newEvent.eventName,
      category: newEvent.category || "Progression",
      dailyVolume: newEvent.dailyVolume || "5,000",
      triggerCondition: newEvent.triggerCondition || "Event triggered by player action",
    };
    setAnalyticsState((prev) => ({ ...prev, events: [...prev.events, created] }));
    setShowAddEvent(false);
    setNewEvent({ eventName: "", category: "Progression", dailyVolume: "10,000", triggerCondition: "" });
    onToast("success", "Event registered", `Added telemetry event ${created.eventName}`);
  };

  const handleExportCSV = () => {
    let csv = "Date,ARPU,D1Retention,ActiveUsers\n";
    chartData.forEach((r) => {
      csv += `${r.date},${r.arpu},${r.d1Retention}%,${r.activeUsers}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `live-analytics-telemetry.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("success", "Exported CSV", "Analytics metrics exported");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFF9F2] p-5 space-y-5">
      {/* Header toolbar */}
      <div className="flex items-center justify-between bg-white border border-[#DED9EA] px-5 py-3 rounded-[14px]">
        <div>
          <h1 className="text-lg font-bold text-[#17152B]">Live Analytics & Telemetry</h1>
          <p className="text-xs text-[#6C6880]">Real-time player ARPU, retention tracking, and custom telemetry events</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#6C6880] bg-white border border-[#DED9EA] rounded-xl hover:bg-[#F4F1FA]"
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={async () => { await saveNow(); onToast("success", "Analytics saved", "Synced custom telemetry setup"); }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#6C3BFF] bg-[#F4F1FA] border border-[#DED9EA] rounded-xl hover:bg-[#ede8fb]"
          >
            {saving ? <Cloud size={13} className="animate-pulse" /> : <Save size={13} />} Save Config
          </button>
        </div>
      </div>

      {/* Filter controls bar */}
      <div className="flex items-center justify-between bg-white border border-[#DED9EA] px-4 py-2.5 rounded-[14px]">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#6C3BFF]" />
          <span className="text-xs font-semibold text-[#17152B]">Filters:</span>

          <div className="flex gap-1 bg-[#F4F1FA] p-1 rounded-lg">
            {(["7D", "30D", "90D"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${timeRange === t ? "bg-white text-[#17152B] shadow-sm" : "text-[#6C6880]"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-[#F4F1FA] p-1 rounded-lg">
            {(["All", "Whales", "Casuals"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCohortFilter(c)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${cohortFilter === c ? "bg-[#6C3BFF] text-white" : "text-[#6C6880]"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-[#6C6880] font-mono">Cohort Mode: {cohortFilter} ({timeRange})</span>
      </div>

      {/* Stat KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-[#DED9EA] p-4 rounded-xl shadow-sm">
          <span className="text-xs text-[#6C6880]">Average Revenue Per User (ARPU)</span>
          <div className="text-2xl font-bold text-[#17152B] mt-1 font-mono">${(1.25 * multiplier).toFixed(2)}</div>
        </div>
        <div className="bg-white border border-[#DED9EA] p-4 rounded-xl shadow-sm">
          <span className="text-xs text-[#6C6880]">Day 1 Retention</span>
          <div className="text-2xl font-bold text-[#19A974] mt-1 font-mono">{Math.round(42 * (cohortFilter === "Whales" ? 1.2 : 0.95))}%</div>
        </div>
        <div className="bg-white border border-[#DED9EA] p-4 rounded-xl shadow-sm">
          <span className="text-xs text-[#6C6880]">Active Daily Players (DAU)</span>
          <div className="text-2xl font-bold text-[#6C3BFF] mt-1 font-mono">{Math.round(18400 * multiplier).toLocaleString()}</div>
        </div>
        <div className="bg-white border border-[#DED9EA] p-4 rounded-xl shadow-sm">
          <span className="text-xs text-[#6C6880]">ARPPU (Paying Players)</span>
          <div className="text-2xl font-bold text-[#FFC928] mt-1 font-mono">${(14.80 * multiplier).toFixed(2)}</div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-white border border-[#DED9EA] p-5 rounded-[14px] shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C6880]">ARPU & Active Player Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="arpuGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#19C6D1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#19C6D1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F4F1FA" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey="arpu" stroke="#19C6D1" fill="url(#arpuGrad)" strokeWidth={2} name="ARPU ($)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Telemetry Events Registry */}
      <div className="bg-white border border-[#DED9EA] p-5 rounded-[14px] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C6880]">Custom Telemetry Events</h3>
          <button
            onClick={() => setShowAddEvent(true)}
            className="flex items-center gap-1 bg-[#6C3BFF] text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-[#5a2fe0]"
          >
            <Plus size={13} /> Add Telemetry Event
          </button>
        </div>

        <div className="bg-white border border-[#DED9EA] rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F4F1FA] text-[#6C6880] border-b border-[#DED9EA] uppercase tracking-wider">
                <th className="p-3">ID</th>
                <th className="p-3">Event Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Daily Volume</th>
                <th className="p-3">Trigger Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DED9EA]">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-[#F4F1FA]/50">
                  <td className="p-3 font-mono text-[#6C3BFF]">{e.id}</td>
                  <td className="p-3 font-bold text-[#17152B] font-mono">{e.eventName}</td>
                  <td className="p-3"><span className="px-2 py-0.5 bg-[#F4F1FA] rounded-full text-[10px] font-semibold">{e.category}</span></td>
                  <td className="p-3 font-mono font-bold text-[#19A974]">{e.dailyVolume}</td>
                  <td className="p-3 text-[#6C6880]">{e.triggerCondition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
            <h3 className="font-bold text-base">Add Telemetry Event</h3>
            <input
              placeholder="Event Name (e.g. boss_fight_victory)"
              value={newEvent.eventName}
              onChange={(e) => setNewEvent({ ...newEvent, eventName: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg"
            />
            <select
              value={newEvent.category}
              onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg"
            >
              <option value="Progression">Progression</option>
              <option value="Monetization">Monetization</option>
              <option value="Meta Loop">Meta Loop</option>
              <option value="Social">Social</option>
            </select>
            <input
              placeholder="Expected Daily Volume"
              value={newEvent.dailyVolume}
              onChange={(e) => setNewEvent({ ...newEvent, dailyVolume: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg"
            />
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddEvent(false)} className="flex-1 py-2 text-xs border rounded-lg">Cancel</button>
              <button onClick={handleAddEvent} className="flex-1 py-2 text-xs bg-[#6C3BFF] text-white rounded-lg">Register Event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
