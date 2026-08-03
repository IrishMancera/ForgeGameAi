import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Layers, Save, Plus, Cloud, CheckCircle2, Trash2, Download, Sliders, X } from "lucide-react";
import { useModuleState } from "../services/useModuleState";

interface ProgressionProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  projectId?: string;
}

interface UnlockItem {
  level: number;
  feature: string;
  category: string;
}

const DEFAULT_UNLOCKS: UnlockItem[] = [
  { level: 2, feature: "Guest Reception Room", category: "Core Rooms" },
  { level: 5, feature: "Ghost Hunter Staff Recruitment", category: "Staff" },
  { level: 10, feature: "Supernatural Lounge & Bar", category: "Meta Rooms" },
  { level: 15, feature: "Haunted Boss Raids", category: "Events" },
  { level: 25, feature: "PvP Manor Leaderboards", category: "Social" },
];

export default function Progression({ onToast, projectId }: ProgressionProps) {
  // Persistent state
  const [progData, setProgData, saveNow, saving] = useModuleState(
    'progression',
    {
      baseXP: 100,
      exponent: 1.85,
      maxLevel: 50,
      unlocks: DEFAULT_UNLOCKS,
    },
    projectId
  );

  const baseXP = progData.baseXP;
  const exponent = progData.exponent;
  const maxLevel = progData.maxLevel;
  const unlocks = progData.unlocks;

  const setBaseXP = (v: number) => setProgData((prev) => ({ ...prev, baseXP: v }));
  const setExponent = (v: number) => setProgData((prev) => ({ ...prev, exponent: v }));
  const setMaxLevel = (v: number) => setProgData((prev) => ({ ...prev, maxLevel: v }));

  // Modals
  const [showAddUnlock, setShowAddUnlock] = useState(false);
  const [newUnlock, setNewUnlock] = useState<Partial<UnlockItem>>({
    level: 10, feature: "", category: "Core Rooms"
  });

  // Calculate level curve dynamically
  const levelCurveData = Array.from({ length: maxLevel }, (_, i) => {
    const lvl = i + 1;
    const reqXP = Math.round(baseXP * Math.pow(lvl, exponent));
    const totalXP = Math.round((baseXP / (exponent + 1)) * Math.pow(lvl, exponent + 1));
    return {
      level: lvl,
      xpRequired: reqXP,
      totalCumulativeXP: totalXP,
    };
  });

  // Unlock handlers
  const handleAddUnlock = () => {
    if (!newUnlock.feature) {
      onToast("error", "Missing feature", "Provide unlock feature name");
      return;
    }
    const created: UnlockItem = {
      level: Number(newUnlock.level) || 1,
      feature: newUnlock.feature,
      category: newUnlock.category || "Core Rooms",
    };
    setProgData((prev) => ({
      ...prev,
      unlocks: [...prev.unlocks, created].sort((a, b) => a.level - b.level),
    }));
    setShowAddUnlock(false);
    setNewUnlock({ level: 10, feature: "", category: "Core Rooms" });
    onToast("success", "Unlock added", `Added "${created.feature}" at Level ${created.level}`);
  };

  const handleDeleteUnlock = (feature: string) => {
    setProgData((prev) => ({
      ...prev,
      unlocks: prev.unlocks.filter((u) => u.feature !== feature),
    }));
    onToast("info", "Unlock removed", `Removed feature unlock`);
  };

  // Export CSV
  const handleExportCSV = () => {
    let csv = "Level,XPRequired,TotalCumulativeXP\n";
    levelCurveData.forEach((row) => {
      csv += `${row.level},${row.xpRequired},${row.totalCumulativeXP}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `progression-curve-level-1-to-${maxLevel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("success", "Exported CSV", "Progression curve data downloaded");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFF9F2] p-5 space-y-5">
      {/* Header toolbar */}
      <div className="flex items-center justify-between bg-white border border-[#DED9EA] px-5 py-3 rounded-[14px]">
        <div>
          <h1 className="text-lg font-bold text-[#17152B]">Progression & Level Curve Lab</h1>
          <p className="text-xs text-[#6C6880]">Parametric XP growth modeling, unlock scheduling, and player power scaling</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#6C6880] bg-white border border-[#DED9EA] rounded-xl hover:bg-[#F4F1FA]"
          >
            <Download size={13} /> Export Curve CSV
          </button>
          <button
            onClick={async () => { await saveNow(); onToast("success", "Progression saved", "Synced curve to project memory"); }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#6C3BFF] bg-[#F4F1FA] border border-[#DED9EA] rounded-xl hover:bg-[#ede8fb]"
          >
            {saving ? <Cloud size={13} className="animate-pulse" /> : <Save size={13} />} Save Curve
          </button>
        </div>
      </div>

      {/* Simulator controls and Chart */}
      <div className="grid grid-cols-3 gap-4">
        {/* Controls Card */}
        <div className="bg-white border border-[#DED9EA] p-5 rounded-[14px] shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-[#6C3BFF]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C6880]">XP Formula Controls</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#6C6880]">Base XP (Level 1)</span>
                <span className="font-mono font-bold text-[#17152B]">{baseXP} XP</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={baseXP}
                onChange={(e) => setBaseXP(Number(e.target.value))}
                className="w-full accent-[#6C3BFF]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#6C6880]">Growth Exponent</span>
                <span className="font-mono font-bold text-[#6C3BFF]">{exponent}x</span>
              </div>
              <input
                type="range"
                min="1.1"
                max="2.5"
                step="0.05"
                value={exponent}
                onChange={(e) => setExponent(Number(e.target.value))}
                className="w-full accent-[#6C3BFF]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#6C6880]">Level Cap</span>
                <span className="font-mono font-bold text-[#17152B]">{maxLevel} Levels</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={maxLevel}
                onChange={(e) => setMaxLevel(Number(e.target.value))}
                className="w-full accent-[#6C3BFF]"
              />
            </div>

            <div className="bg-[#F4F1FA] p-3 rounded-xl border border-[#DED9EA] space-y-1 font-mono text-[10px]">
              <div className="text-[#6C6880]">Formula Expression:</div>
              <div className="text-[#6C3BFF] font-bold">XP_Required(L) = {baseXP} × L^{exponent}</div>
            </div>
          </div>
        </div>

        {/* Level Curve Chart */}
        <div className="col-span-2 bg-white border border-[#DED9EA] p-5 rounded-[14px] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C6880]">Cumulative XP Required Curve</h3>
            <span className="text-xs text-[#19A974] font-semibold bg-[#EDFAF4] px-2 py-0.5 rounded-full">
              Level {maxLevel} Total: {levelCurveData[levelCurveData.length - 1]?.totalCumulativeXP.toLocaleString()} XP
            </span>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={levelCurveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4F1FA" />
              <XAxis dataKey="level" tick={{ fontSize: 10, fill: "#6C6880" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6C6880" }} />
              <Tooltip formatter={(val: any) => [Number(val).toLocaleString(), "XP"]} />
              <Line type="monotone" dataKey="xpRequired" stroke="#6C3BFF" strokeWidth={2.5} dot={false} name="Level XP Required" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Unlock Schedule */}
      <div className="bg-white border border-[#DED9EA] p-5 rounded-[14px] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-[#6C3BFF]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C6880]">Feature Unlock Schedule</h3>
          </div>
          <button
            onClick={() => setShowAddUnlock(true)}
            className="flex items-center gap-1 bg-[#6C3BFF] text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-[#5a2fe0]"
          >
            <Plus size={13} /> Add Level Unlock
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {unlocks.map((u) => (
            <div key={u.feature} className="p-3 bg-[#F4F1FA] border border-[#DED9EA] rounded-xl flex flex-col justify-between group relative">
              <button
                onClick={() => handleDeleteUnlock(u.feature)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[#6C6880] hover:text-[#FF3B4F] transition-all"
              >
                <Trash2 size={12} />
              </button>
              <div>
                <span className="text-[10px] font-bold text-[#6C3BFF] bg-white px-2 py-0.5 rounded-full border">
                  Level {u.level}
                </span>
                <h4 className="text-xs font-bold text-[#17152B] mt-2">{u.feature}</h4>
              </div>
              <span className="text-[10px] text-[#6C6880] mt-2">{u.category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Unlock Modal */}
      {showAddUnlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-[#DED9EA] p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#17152B]">Add Level Unlock</h3>
              <button onClick={() => setShowAddUnlock(false)} className="text-[#6C6880] hover:text-[#17152B]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">Required Level</label>
                <input
                  type="number"
                  value={newUnlock.level}
                  onChange={(e) => setNewUnlock({ ...newUnlock, level: Number(e.target.value) })}
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">Feature / Content Name</label>
                <input
                  value={newUnlock.feature}
                  onChange={(e) => setNewUnlock({ ...newUnlock, feature: e.target.value })}
                  placeholder="e.g. Guild Guildhall Tier 1"
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">Category</label>
                <select
                  value={newUnlock.category}
                  onChange={(e) => setNewUnlock({ ...newUnlock, category: e.target.value })}
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B]"
                >
                  <option value="Core Rooms">Core Rooms</option>
                  <option value="Staff">Staff</option>
                  <option value="Meta Rooms">Meta Rooms</option>
                  <option value="Events">Events</option>
                  <option value="Social">Social</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddUnlock(false)} className="flex-1 py-2 text-xs font-medium border rounded-lg">Cancel</button>
              <button onClick={handleAddUnlock} className="flex-1 py-2 text-xs bg-[#6C3BFF] text-white rounded-lg">Add Unlock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
