import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Play, RotateCcw, Download, Save, Cloud, CheckCircle2, Sliders, Activity, Clock, ShieldCheck, Flame } from "lucide-react";
import { useModuleState } from "../services/useModuleState";

interface SimulationProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  projectId?: string;
}

interface SimulationRun {
  id: string;
  timestamp: string;
  playersCount: number;
  daysSimulated: number;
  gachaRate: number;
  d1Retention: number;
  d30Retention: number;
  maxBurnoutLevel: number;
  pityHitRate: number;
  status: "Completed";
}

const DEFAULT_RUNS: SimulationRun[] = [
  {
    id: "RUN-1092",
    timestamp: "12 mins ago",
    playersCount: 10000,
    daysSimulated: 30,
    gachaRate: 1.5,
    d1Retention: 42.4,
    d30Retention: 8.2,
    maxBurnoutLevel: 28,
    pityHitRate: 14.2,
    status: "Completed",
  },
  {
    id: "RUN-1091",
    timestamp: "2 hours ago",
    playersCount: 5000,
    daysSimulated: 14,
    gachaRate: 2.0,
    d1Retention: 45.1,
    d30Retention: 9.6,
    maxBurnoutLevel: 32,
    pityHitRate: 11.5,
    status: "Completed",
  },
];

export default function Simulation({ onToast, projectId }: SimulationProps) {
  // Parametric controls
  const [playersCount, setPlayersCount] = useState(10000);
  const [daysSimulated, setDaysSimulated] = useState(30);
  const [gachaRate, setGachaRate] = useState(1.5);
  const [staminaCap, setStaminaCap] = useState(120);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Persistent module state
  const [simState, setSimState, saveNow, saving] = useModuleState(
    'simulation',
    {
      runs: DEFAULT_RUNS,
      currentChartData: Array.from({ length: 30 }, (_, i) => ({
        day: `Day ${i + 1}`,
        f2pPlayers: Math.round(10000 * Math.pow(0.92, i)),
        whales: Math.round(500 * Math.pow(0.98, i)),
        economySinkVolume: Math.round(15000 * Math.pow(1.05, i)),
      })),
    },
    projectId
  );

  const runs = simState.runs;
  const chartData = simState.currentChartData;

  // Run Simulation handler
  const handleRunSimulation = () => {
    setIsRunning(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);

          // Generate randomized stochastic simulation results based on inputs
          const newD1 = Number((40 + Math.random() * 6).toFixed(1));
          const newD30 = Number((7 + Math.random() * 3).toFixed(1));
          const newBurnout = Math.round(20 + Math.random() * 15);
          const newPityHits = Number((10 + Math.random() * 8).toFixed(1));

          const newRun: SimulationRun = {
            id: `RUN-${Math.floor(1000 + Math.random() * 9000)}`,
            timestamp: "Just now",
            playersCount,
            daysSimulated,
            gachaRate,
            d1Retention: newD1,
            d30Retention: newD30,
            maxBurnoutLevel: newBurnout,
            pityHitRate: newPityHits,
            status: "Completed",
          };

          // Generate chart curve data
          const newChart = Array.from({ length: daysSimulated }, (_, i) => ({
            day: `Day ${i + 1}`,
            f2pPlayers: Math.round(playersCount * Math.pow(0.91 + (newD1 / 1000), i)),
            whales: Math.round((playersCount * 0.05) * Math.pow(0.98, i)),
            economySinkVolume: Math.round(15000 * Math.pow(1.04, i)),
          }));

          setSimState((prev) => ({
            ...prev,
            runs: [newRun, ...prev.runs],
            currentChartData: newChart,
          }));

          onToast("success", "Simulation finished", `Completed ${playersCount.toLocaleString()} player cohort run`);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  // Export CSV
  const handleExportCSV = () => {
    let csv = "RunID,Timestamp,PlayersCount,Days,GachaRate,D1Retention,D30Retention,BurnoutLevel\n";
    runs.forEach((r) => {
      csv += `${r.id},${r.timestamp},${r.playersCount},${r.daysSimulated},${r.gachaRate},${r.d1Retention}%,${r.d30Retention}%,Lvl ${r.maxBurnoutLevel}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monte-carlo-simulation-runs.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("success", "Exported CSV", "Simulation run logs downloaded");
  };

  const latestRun = runs[0] || DEFAULT_RUNS[0];

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFF9F2] p-5 space-y-5">
      {/* Header toolbar */}
      <div className="flex items-center justify-between bg-white border border-[#DED9EA] px-5 py-3 rounded-[14px]">
        <div>
          <h1 className="text-lg font-bold text-[#17152B]">Monte Carlo Simulation Engine</h1>
          <p className="text-xs text-[#6C6880]">Stochastic cohort testing for economy sinks, retention curves, and gacha probability</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#6C6880] bg-white border border-[#DED9EA] rounded-xl hover:bg-[#F4F1FA]"
          >
            <Download size={13} /> Export Audit CSV
          </button>
          <button
            onClick={async () => { await saveNow(); onToast("success", "Simulation state saved", "Synced runs history"); }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#6C3BFF] bg-[#F4F1FA] border border-[#DED9EA] rounded-xl hover:bg-[#ede8fb]"
          >
            {saving ? <Cloud size={13} className="animate-pulse" /> : <Save size={13} />} Save History
          </button>
        </div>
      </div>

      {/* Simulator controls and Status */}
      <div className="grid grid-cols-3 gap-4">
        {/* Controls Card */}
        <div className="bg-white border border-[#DED9EA] p-5 rounded-[14px] shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-[#6C3BFF]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C6880]">Cohort Simulation Parameters</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#6C6880]">Cohort Size</span>
                <span className="font-mono font-bold text-[#17152B]">{playersCount.toLocaleString()} Players</span>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={playersCount}
                onChange={(e) => setPlayersCount(Number(e.target.value))}
                className="w-full accent-[#6C3BFF]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#6C6880]">Timeframe</span>
                <span className="font-mono font-bold text-[#17152B]">{daysSimulated} Days</span>
              </div>
              <input
                type="range"
                min="7"
                max="90"
                step="1"
                value={daysSimulated}
                onChange={(e) => setDaysSimulated(Number(e.target.value))}
                className="w-full accent-[#6C3BFF]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#6C6880]">Gacha Drop Rate</span>
                <span className="font-mono font-bold text-[#6C3BFF]">{gachaRate}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={gachaRate}
                onChange={(e) => setGachaRate(Number(e.target.value))}
                className="w-full accent-[#6C3BFF]"
              />
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#6C3BFF] text-white text-xs font-bold rounded-xl hover:bg-[#5a2fe0] transition-all disabled:opacity-50 shadow-md"
            >
              <Play size={14} className={isRunning ? "animate-spin" : ""} />
              {isRunning ? `Running Simulation (${progress}%)` : "Run Monte Carlo Simulation"}
            </button>

            {isRunning && (
              <div className="h-1.5 bg-[#F4F1FA] rounded-full overflow-hidden">
                <div className="h-full bg-[#19C6D1] rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Latest Run Results */}
        <div className="col-span-2 bg-white border border-[#DED9EA] p-5 rounded-[14px] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#19A974]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C6880]">Latest Run Outcome ({latestRun.id})</h3>
            </div>
            <span className="text-xs font-mono text-[#6C6880]">{latestRun.timestamp}</span>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-[#F4F1FA] border border-[#DED9EA] rounded-xl">
              <span className="text-[10px] text-[#6C6880] block">D1 Retention</span>
              <span className="text-lg font-bold text-[#6C3BFF] font-mono">{latestRun.d1Retention}%</span>
            </div>
            <div className="p-3 bg-[#F4F1FA] border border-[#DED9EA] rounded-xl">
              <span className="text-[10px] text-[#6C6880] block">D30 Retention</span>
              <span className="text-lg font-bold text-[#19A974] font-mono">{latestRun.d30Retention}%</span>
            </div>
            <div className="p-3 bg-[#F4F1FA] border border-[#DED9EA] rounded-xl">
              <span className="text-[10px] text-[#6C6880] block">Burnout Wall Level</span>
              <span className="text-lg font-bold text-[#FF3B4F] font-mono">Level {latestRun.maxBurnoutLevel}</span>
            </div>
            <div className="p-3 bg-[#F4F1FA] border border-[#DED9EA] rounded-xl">
              <span className="text-[10px] text-[#6C6880] block">Pity Hit Rate</span>
              <span className="text-lg font-bold text-[#FFC928] font-mono">{latestRun.pityHitRate}%</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="f2pGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C3BFF" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6C3BFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4F1FA" />
              <XAxis dataKey="day" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Area type="monotone" dataKey="f2pPlayers" stroke="#6C3BFF" fill="url(#f2pGrad)" strokeWidth={2} name="Active Players" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Runs Log */}
      <div className="bg-white border border-[#DED9EA] p-5 rounded-[14px] shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C6880]">Simulation History Log</h3>
        <div className="divide-y divide-[#DED9EA] max-h-48 overflow-y-auto">
          {runs.map((r) => (
            <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-[#6C3BFF]">{r.id}</span>
                <span className="text-[#6C6880]">{r.timestamp}</span>
                <span className="px-2 py-0.5 bg-[#F4F1FA] rounded-full text-[10px] font-semibold">{r.playersCount.toLocaleString()} Players</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span>D1: <strong className="text-[#6C3BFF]">{r.d1Retention}%</strong></span>
                <span>D30: <strong className="text-[#19A974]">{r.d30Retention}%</strong></span>
                <span>Pity: <strong className="text-[#FFC928]">{r.pityHitRate}%</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
