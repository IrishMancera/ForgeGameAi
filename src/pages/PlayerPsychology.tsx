import { useState } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Brain, ShieldCheck, HeartHandshake, Save, Plus, Cloud, CheckCircle2, ShieldAlert, Sliders, X } from "lucide-react";
import { useModuleState } from "../services/useModuleState";

interface PlayerPsychologyProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  projectId?: string;
}

interface EthicalCheckItem {
  id: string;
  label: string;
  category: string;
  status: "Pass" | "Warn" | "Fail";
  description: string;
}

const DEFAULT_ETHICAL_CHECKS: EthicalCheckItem[] = [
  { id: "ETH-01", label: "Gacha Probability Disclosure", category: "Monetization", status: "Pass", description: "All drop rates disclosed in UI prior to purchase." },
  { id: "ETH-02", label: "Pity Counter Guarantee", category: "Monetization", status: "Pass", description: "Pity threshold guarantees legendary pull at 80 summons." },
  { id: "ETH-03", label: "Aggressive Pop-up Limit", category: "UX Design", status: "Warn", description: "Limit promotional pop-ups to 1 per login session." },
  { id: "ETH-04", label: "Paywall Block Detection", category: "Progression", status: "Pass", description: "Ensure non-paying players can complete main storyline." },
  { id: "ETH-05", label: "Stamina Burnout Protection", category: "Retention", status: "Pass", description: "Cap max stamina accumulation to 12 hours of offline storage." },
];

export default function PlayerPsychology({ onToast, projectId }: PlayerPsychologyProps) {
  // Persistent state
  const [psychData, setPsychData, saveNow, saving] = useModuleState(
    'psychology',
    {
      bartle: { Achiever: 40, Explorer: 30, Socializer: 20, Killer: 10 },
      ethicalChecks: DEFAULT_ETHICAL_CHECKS,
    },
    projectId
  );

  const bartle = psychData.bartle;
  const ethicalChecks = psychData.ethicalChecks;

  // Bartle slider handler (auto balances to 100%)
  const handleBartleChange = (key: keyof typeof bartle, val: number) => {
    setPsychData((prev) => {
      const currentVal = prev.bartle[key];
      const diff = val - currentVal;
      const otherKeys = (Object.keys(prev.bartle) as Array<keyof typeof bartle>).filter((k) => k !== key);
      const remainingSum = otherKeys.reduce((sum, k) => sum + prev.bartle[k], 0);

      const nextBartle = { ...prev.bartle, [key]: val };
      if (remainingSum > 0) {
        otherKeys.forEach((k) => {
          const ratio = prev.bartle[k] / remainingSum;
          nextBartle[k] = Math.max(0, Math.round(prev.bartle[k] - diff * ratio));
        });
      }
      return { ...prev, bartle: nextBartle };
    });
  };

  // Ethical check status toggle
  const toggleEthicalStatus = (id: string) => {
    setPsychData((prev) => ({
      ...prev,
      ethicalChecks: prev.ethicalChecks.map((item) => {
        if (item.id !== id) return item;
        const nextStatus = item.status === "Pass" ? "Warn" : item.status === "Warn" ? "Fail" : "Pass";
        return { ...item, status: nextStatus };
      }),
    }));
    onToast("info", "Ethical check updated", "Recalculated monetization safety rating");
  };

  const radarData = [
    { subject: "Achiever", A: bartle.Achiever },
    { subject: "Explorer", A: bartle.Explorer },
    { subject: "Socializer", A: bartle.Socializer },
    { subject: "Killer", A: bartle.Killer },
  ];

  const passCount = ethicalChecks.filter((c) => c.status === "Pass").length;
  const ethicsScore = Math.round((passCount / (ethicalChecks.length || 1)) * 100);

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFF9F2] p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-[#DED9EA] px-5 py-3 rounded-[14px]">
        <div>
          <h1 className="text-lg font-bold text-[#17152B]">Player Psychology & Ethics Lab</h1>
          <p className="text-xs text-[#6C6880]">Bartle player archetype tuning, motivation triggers, and ethical monetization scoring</p>
        </div>

        <button
          onClick={async () => { await saveNow(); onToast("success", "Psychology data saved", "Synced to project profile"); }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#6C3BFF] bg-[#F4F1FA] border border-[#DED9EA] rounded-xl hover:bg-[#ede8fb]"
        >
          {saving ? <Cloud size={13} className="animate-pulse" /> : <Save size={13} />} Save Config
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Bartle Archetype Tuning */}
        <div className="bg-white border border-[#DED9EA] p-5 rounded-[14px] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-[#6C3BFF]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C6880]">Bartle Archetype Tuning</h3>
            </div>
            <span className="text-xs font-mono font-bold text-[#6C3BFF]">Total: 100%</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3 text-xs">
              {(Object.keys(bartle) as Array<keyof typeof bartle>).map((key) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#6C6880] font-medium">{key} Persona</span>
                    <span className="font-mono font-bold text-[#17152B]">{bartle[key]}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={bartle[key]}
                    onChange={(e) => handleBartleChange(key, Number(e.target.value))}
                    className="w-full accent-[#6C3BFF]"
                  />
                </div>
              ))}
            </div>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#DED9EA" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6C6880" }} />
                  <Radar name="Bartle" dataKey="A" stroke="#6C3BFF" fill="#6C3BFF" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Ethical Monetization Scorecard */}
        <div className="bg-white border border-[#DED9EA] p-5 rounded-[14px] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#19A974]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C6880]">Ethical Monetization Score</h3>
            </div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${ethicsScore >= 80 ? "bg-[#EDFAF4] text-[#19A974]" : "bg-[#FFF0F2] text-[#FF3B4F]"}`}>
              {ethicsScore}% Compliant
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {ethicalChecks.map((item) => (
              <div key={item.id} className="p-3 bg-[#F4F1FA] border border-[#DED9EA] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#17152B]">{item.label}</span>
                  <p className="text-[10px] text-[#6C6880]">{item.description}</p>
                </div>
                <button
                  onClick={() => toggleEthicalStatus(item.id)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                    item.status === "Pass" ? "bg-[#EDFAF4] text-[#19A974]" :
                    item.status === "Warn" ? "bg-[#FFF8E6] text-[#FFC928]" : "bg-[#FFF0F2] text-[#FF3B4F]"
                  }`}
                >
                  {item.status}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
