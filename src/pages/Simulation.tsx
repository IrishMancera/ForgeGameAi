import { useState } from "react";
import { Play, RotateCcw, X, CheckCircle, AlertTriangle, AlertCircle, Clock } from "lucide-react";
import { SIMULATION_RESULTS } from "../data/mockData";

interface SimulationProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
}

const SIM_TYPES = [
  "Deterministic Projection", "Cohort Simulation", "Monte Carlo Economy",
  "Player Archetype", "First Session", "Free vs Payer", "Idle/Offline",
  "Content Burn", "Live Event", "Exploit/Worst Case",
];

const PROGRESS_STEPS = [
  "Validating Inputs",
  "Building Cohorts",
  "Running Model",
  "Aggregating Results",
  "Generating Findings",
];

export default function Simulation({ onToast }: SimulationProps) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);
  const [simType, setSimType] = useState("Cohort Simulation");
  const [scenarioName, setScenarioName] = useState("Cohort: 500 Free Players — 30-Day Horizon");
  const [players, setPlayers] = useState(500);
  const [horizon, setHorizon] = useState(30);
  const [profile, setProfile] = useState("Casual");

  const runSim = () => {
    setRunning(true);
    setProgress(0);
    setCurrentStep(0);
    setDone(false);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setProgress(Math.min(100, step * 20));
      setCurrentStep(Math.min(PROGRESS_STEPS.length - 1, Math.floor(step * 0.9)));
      if (step >= 5) {
        clearInterval(interval);
        setRunning(false);
        setDone(true);
        onToast("success", "Simulation complete", `${scenarioName} — ${SIMULATION_RESULTS.findings.length} key findings`);
      }
    }, 700);
  };

  const statusIcon = (status: string) => {
    if (status === "ok") return <CheckCircle size={14} className="text-[#19A974]" />;
    if (status === "warn") return <AlertTriangle size={14} className="text-[#FFC928]" />;
    return <AlertCircle size={14} className="text-[#FF3B4F]" />;
  };

  return (
    <div className="flex-1 overflow-hidden flex bg-[#FFF9F2]">
      {/* Input panel */}
      <div className="w-80 shrink-0 bg-white border-r border-[#DED9EA] overflow-y-auto">
        <div className="px-5 py-4 border-b border-[#DED9EA]">
          <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider">Simulation Setup</div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider block mb-1">Scenario Name</label>
            <input value={scenarioName} onChange={(e) => setScenarioName(e.target.value)}
              className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 focus:outline-none focus:border-[#6C3BFF] text-[#17152B]" />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider block mb-1">Simulation Type</label>
            <select value={simType} onChange={(e) => setSimType(e.target.value)}
              className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 focus:outline-none focus:border-[#6C3BFF] text-[#17152B]">
              {SIM_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider block mb-1">Players</label>
              <input type="number" value={players} onChange={(e) => setPlayers(Number(e.target.value))}
                className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 focus:outline-none focus:border-[#6C3BFF] text-[#17152B] font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider block mb-1">Horizon (days)</label>
              <input type="number" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}
                className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 focus:outline-none focus:border-[#6C3BFF] text-[#17152B] font-mono" />
            </div>
          </div>

          {[
            { label: "Player Profile", options: ["Casual", "Mid-core", "Hardcore", "Whale", "Non-payer"], value: profile, set: setProfile },
          ].map(({ label, options, value, set }) => (
            <div key={label}>
              <label className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider block mb-1">{label}</label>
              <select value={value} onChange={(e) => set(e.target.value)}
                className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 focus:outline-none focus:border-[#6C3BFF] text-[#17152B]">
                {options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}

          {[
            { label: "Sessions per Day", val: "2.4" },
            { label: "Session Length (min)", val: "8" },
            { label: "Skill Level", val: "Average" },
            { label: "Spend Profile", val: "Non-payer" },
            { label: "Random Seed", val: "42" },
          ].map(({ label, val }) => (
            <div key={label}>
              <label className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider block mb-1">{label}</label>
              <input defaultValue={val}
                className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 focus:outline-none focus:border-[#6C3BFF] text-[#17152B] font-mono" />
            </div>
          ))}

          <button
            onClick={runSim}
            disabled={running}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#6C3BFF] text-white text-sm font-semibold rounded-xl hover:bg-[#5a2fe0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {running ? <><Clock size={15} className="animate-pulse" /> Running…</> : <><Play size={15} /> Run Simulation</>}
          </button>
          {done && (
            <button onClick={() => setDone(false)} className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#DED9EA] text-[#6C6880] text-xs rounded-xl hover:bg-[#F4F1FA]">
              <RotateCcw size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Results panel */}
      <div className="flex-1 overflow-y-auto p-5">
        {!done && !running && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Play size={48} className="text-[#DED9EA] mx-auto mb-4" />
              <h3 className="text-base font-semibold text-[#17152B] mb-1">No Simulation Results</h3>
              <p className="text-sm text-[#6C6880] max-w-xs">Configure a scenario and click Run Simulation to test your progression and economy assumptions.</p>
            </div>
          </div>
        )}

        {running && (
          <div className="max-w-lg mx-auto mt-20">
            <div className="bg-white rounded-[14px] border border-[#DED9EA] p-8" style={{ boxShadow: "0 4px 24px rgba(108,59,255,0.1)" }}>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full border-4 border-[#6C3BFF] border-t-transparent animate-spin mx-auto mb-4" />
                <div className="text-sm font-semibold text-[#17152B]">Running {simType}</div>
                <div className="text-xs text-[#6C6880] mt-1">{players} virtual players · {horizon}-day horizon</div>
              </div>
              <div className="space-y-3">
                {PROGRESS_STEPS.map((step, i) => (
                  <div key={step} className={`flex items-center gap-3 text-sm ${i < currentStep ? "text-[#19A974]" : i === currentStep ? "text-[#6C3BFF]" : "text-[#DED9EA]"}`}>
                    {i < currentStep ? <CheckCircle size={16} /> : i === currentStep ? <Clock size={16} className="animate-pulse" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                    {step}
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <div className="h-2 bg-[#F4F1FA] rounded-full overflow-hidden">
                  <div className="h-full bg-[#6C3BFF] rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-right text-xs text-[#6C6880] mt-1 font-mono">{progress}%</div>
              </div>
            </div>
          </div>
        )}

        {done && (
          <div className="space-y-5">
            <div className="bg-white rounded-[14px] border border-[#DED9EA] p-5" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-base text-[#17152B]">{SIMULATION_RESULTS.scenarioName}</h3>
                <span className="text-[10px] font-mono text-[#6C6880]">{new Date(SIMULATION_RESULTS.runAt).toLocaleString()}</span>
              </div>
              <p className="text-xs text-[#FFC928] font-medium mb-4">⚠ All results below are simulated data, not observed player behavior</p>

              <div className="grid grid-cols-3 gap-3">
                {SIMULATION_RESULTS.findings.map((f) => (
                  <div key={f.label} className={`rounded-xl border p-3 ${f.status === "critical" ? "bg-[#FFF0F2] border-[#FFB3BB]" : f.status === "warn" ? "bg-[#FFF8E6] border-[#FFE89A]" : "bg-[#EDFAF4] border-[#C8F0DC]"}`}>
                    <div className="flex items-start gap-2 mb-2">
                      {statusIcon(f.status)}
                      <span className="text-[10px] font-semibold text-[#6C6880] leading-tight">{f.label}</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-[#17152B]">{f.value}</div>
                    <div className={`text-[10px] mt-1 font-medium ${f.status === "critical" ? "text-[#FF3B4F]" : f.status === "warn" ? "text-[#FFC928]" : "text-[#19A974]"}`}>{f.change}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#F4F1FA] border border-[#DED9EA] rounded-[14px] p-4">
              <div className="text-xs font-semibold text-[#6C3BFF] uppercase tracking-wider mb-2">Key AI Findings</div>
              <ul className="space-y-2 text-sm text-[#17152B]">
                <li className="flex items-start gap-2"><AlertCircle size={14} className="text-[#FF3B4F] shrink-0 mt-0.5" /> Level 27 wall confirmed — 18–24% predicted churn. Recommend 40% cost reduction or alternative progression path.</li>
                <li className="flex items-start gap-2"><AlertTriangle size={14} className="text-[#FFC928] shrink-0 mt-0.5" /> Ghost Hunter feature adoption at 44% — below 60% target. Consider reducing energy cost for first hunt.</li>
                <li className="flex items-start gap-2"><CheckCircle size={14} className="text-[#19A974] shrink-0 mt-0.5" /> Daily task completion rate at 78% — strong daily engagement driver. No changes needed.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
