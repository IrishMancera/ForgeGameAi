import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { FlaskConical, TrendingUp, AlertTriangle, Save, Plus, Cloud, CheckCircle2, Trash2, Edit3, X, Download, Dices, RefreshCw } from "lucide-react";
import { CURRENCIES, ECONOMY_BALANCE } from "../data/mockData";
import { useModuleState } from "../services/useModuleState";

interface EconomyLabProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  projectId?: string;
}

interface CurrencyItem {
  id: string;
  name: string;
  type: "Soft" | "Hard" | "Event" | "Energy";
  initialBalance: number;
  faucetRatePerMin: number;
  sinkRatePerMin: number;
  primarySink: string;
}

interface DropItem {
  id: string;
  item: string;
  rarity: string;
  weight: number;
  value: number;
  pity: number;
}

const TABS = ["Overview", "Currencies", "Sources & Sinks", "Income Formulas", "Drop Tables", "Sensitivity Test"];

const INITIAL_CURRENCIES: CurrencyItem[] = [
  { id: "CUR-01", name: "Gold Coins", type: "Soft", initialBalance: 5000, faucetRatePerMin: 120, sinkRatePerMin: 100, primarySink: "Room Upgrades" },
  { id: "CUR-02", name: "Diamonds", type: "Hard", initialBalance: 50, faucetRatePerMin: 0.5, sinkRatePerMin: 0.4, primarySink: "Gacha Summons" },
  { id: "CUR-03", name: "Energy Shards", type: "Energy", initialBalance: 120, faucetRatePerMin: 10, sinkRatePerMin: 8, primarySink: "Ghost Hunting" },
];

const INITIAL_DROP_TABLE: DropItem[] = [
  { id: "REW_01", item: "Small Coin Bag", rarity: "Common", weight: 40, value: 200, pity: 0 },
  { id: "REW_02", item: "Medium Coin Bag", rarity: "Common", weight: 30, value: 500, pity: 0 },
  { id: "REW_03", item: "Energy Potion", rarity: "Uncommon", weight: 15, value: 30, pity: 2 },
  { id: "REW_04", item: "Ghost Fragment", rarity: "Rare", weight: 10, value: 150, pity: 5 },
  { id: "REW_05", item: "Diamond Shard", rarity: "Epic", weight: 4, value: 5, pity: 10 },
  { id: "REW_06", item: "Haunted Key", rarity: "Legendary", weight: 1, value: 1, pity: 50 },
];

const FORMULA_VARS = {
  BaseIncome: 12,
  IncomeMultiplier: 1.18,
  BaseCost: 100,
  CostMultiplier: 1.35,
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

export default function EconomyLab({ onToast, projectId }: EconomyLabProps) {
  const [tab, setTab] = useState("Overview");

  // Persistent state
  const [econData, setEconData, saveNow, saving] = useModuleState(
    'economy',
    {
      currencies: INITIAL_CURRENCIES,
      dropTable: INITIAL_DROP_TABLE,
      vars: FORMULA_VARS,
      sensitivityVals: { incomeMultiplier: 1.18, costMultiplier: 1.35, sessionLength: 10 },
    },
    projectId
  );

  // Gacha probability calculator state
  const [targetPulls, setTargetPulls] = useState(50);
  const [baseDropRate, setBaseDropRate] = useState(1.5);
  const [pityThreshold, setPityThreshold] = useState(80);

  // Modals
  const [showAddCurrency, setShowAddCurrency] = useState(false);
  const [newCurr, setNewCurr] = useState<Partial<CurrencyItem>>({
    name: "", type: "Soft", initialBalance: 1000, faucetRatePerMin: 50, sinkRatePerMin: 40, primarySink: "Upgrades"
  });

  const [showAddDrop, setShowAddDrop] = useState(false);
  const [newDrop, setNewDrop] = useState<Partial<DropItem>>({
    item: "", rarity: "Common", weight: 10, value: 100, pity: 0
  });

  const currencies = econData.currencies;
  const dropTable = econData.dropTable;
  const vars = econData.vars;

  const setVars = (v: typeof FORMULA_VARS) => setEconData((prev) => ({ ...prev, vars: v }));
  const setSensitivityVals = (sv: typeof econData.sensitivityVals) => setEconData((prev) => ({ ...prev, sensitivityVals: sv }));

  const formulaData = generateFormulaData(vars);
  const totalWeight = dropTable.reduce((sum, r) => sum + r.weight, 0);

  // Currency handlers
  const handleAddCurrency = () => {
    if (!newCurr.name) {
      onToast("error", "Missing name", "Provide currency name");
      return;
    }
    const created: CurrencyItem = {
      id: `CUR-0${currencies.length + 1}`,
      name: newCurr.name,
      type: (newCurr.type as CurrencyItem["type"]) || "Soft",
      initialBalance: Number(newCurr.initialBalance) || 1000,
      faucetRatePerMin: Number(newCurr.faucetRatePerMin) || 10,
      sinkRatePerMin: Number(newCurr.sinkRatePerMin) || 10,
      primarySink: newCurr.primarySink || "General Sinks",
    };
    setEconData((prev) => ({ ...prev, currencies: [...prev.currencies, created] }));
    setShowAddCurrency(false);
    setNewCurr({ name: "", type: "Soft", initialBalance: 1000, faucetRatePerMin: 50, sinkRatePerMin: 40, primarySink: "Upgrades" });
    onToast("success", "Currency created", `Added ${created.name}`);
  };

  const handleDeleteCurrency = (id: string) => {
    setEconData((prev) => ({ ...prev, currencies: prev.currencies.filter((c) => c.id !== id) }));
    onToast("info", "Currency removed", "Removed from economy config");
  };

  // Drop table handlers
  const handleAddDrop = () => {
    if (!newDrop.item) {
      onToast("error", "Missing item", "Enter item name");
      return;
    }
    const created: DropItem = {
      id: `REW_0${dropTable.length + 1}`,
      item: newDrop.item,
      rarity: newDrop.rarity || "Common",
      weight: Number(newDrop.weight) || 10,
      value: Number(newDrop.value) || 50,
      pity: Number(newDrop.pity) || 0,
    };
    setEconData((prev) => ({ ...prev, dropTable: [...prev.dropTable, created] }));
    setShowAddDrop(false);
    setNewDrop({ item: "", rarity: "Common", weight: 10, value: 100, pity: 0 });
    onToast("success", "Item added", `Added ${created.item} to drop table`);
  };

  const handleDeleteDrop = (id: string) => {
    setEconData((prev) => ({ ...prev, dropTable: prev.dropTable.filter((d) => d.id !== id) }));
    onToast("info", "Item removed", "Item removed from drop table");
  };

  // Gacha probability calculation
  const calculateGachaChance = () => {
    const p = baseDropRate / 100;
    const probNoHitsInN = Math.pow(1 - p, Math.min(targetPulls, pityThreshold - 1));
    const probAtLeastOne = (1 - probNoHitsInN) * 100;
    return targetPulls >= pityThreshold ? 100 : Math.min(99.9, Math.max(0.1, probAtLeastOne)).toFixed(2);
  };

  // Export CSV
  const handleExportCSV = () => {
    let csv = "Type,Name,FaucetRatePerMin,SinkRatePerMin,NetFlow\n";
    currencies.forEach((c) => {
      csv += `${c.type},${c.name},${c.faucetRatePerMin},${c.sinkRatePerMin},${c.faucetRatePerMin - c.sinkRatePerMin}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `economy-specification.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("success", "Export completed", "Economy specification downloaded as CSV");
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#FFF9F2]">
      {/* Tab bar */}
      <div className="bg-white border-b border-[#DED9EA] px-5 flex items-center gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t ? "border-[#6C3BFF] text-[#6C3BFF]" : "border-transparent text-[#6C6880] hover:text-[#17152B]"
            }`}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pr-1 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 text-xs text-[#6C6880] bg-white border border-[#DED9EA] px-2.5 py-1 rounded-lg hover:bg-[#F4F1FA]"
          >
            <Download size={11} /> Export CSV
          </button>
          <button
            onClick={async () => { await saveNow(); onToast("success", "Economy saved", "Synced to project database"); }}
            className="flex items-center gap-1 text-xs text-[#6C3BFF] bg-[#F4F1FA] border border-[#DED9EA] px-2.5 py-1 rounded-lg hover:bg-[#ede8fb]"
          >
            {saving ? <Cloud size={11} className="animate-pulse" /> : <Save size={11} />} Save
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === "Overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-[#DED9EA] p-4 rounded-xl shadow-sm">
                <span className="text-xs text-[#6C6880]">Active Currencies</span>
                <div className="text-2xl font-bold text-[#17152B] mt-1">{currencies.length}</div>
              </div>
              <div className="bg-white border border-[#DED9EA] p-4 rounded-xl shadow-sm">
                <span className="text-xs text-[#6C6880]">Net Economy Flow Rate</span>
                <div className="text-2xl font-bold text-[#19A974] mt-1">+2.21% / Day</div>
              </div>
              <div className="bg-white border border-[#DED9EA] p-4 rounded-xl shadow-sm">
                <span className="text-xs text-[#6C6880]">Inflation Health Index</span>
                <div className="text-2xl font-bold text-[#6C3BFF] mt-1">94.8 / 100</div>
              </div>
            </div>

            <div className="bg-white border border-[#DED9EA] p-4 rounded-xl shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C6880] mb-3">Currency Faucet vs Sink Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ECONOMY_BALANCE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F1FA" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6C6880" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#6C6880" }} />
                  <Tooltip />
                  <Bar dataKey="sources" name="Faucets (Income)" fill="#19C6D1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sinks" name="Sinks (Drain)" fill="#6C3BFF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === "Currencies" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#17152B]">Currency Registry</h3>
              <button
                onClick={() => setShowAddCurrency(true)}
                className="flex items-center gap-1 bg-[#6C3BFF] text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#5a2fe0]"
              >
                <Plus size={13} /> Add Currency
              </button>
            </div>

            <div className="bg-white border border-[#DED9EA] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F4F1FA] text-[#6C6880] border-b border-[#DED9EA] uppercase tracking-wider">
                    <th className="p-3">ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Initial Balance</th>
                    <th className="p-3">Faucet Rate/min</th>
                    <th className="p-3">Sink Rate/min</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DED9EA]">
                  {currencies.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F4F1FA]/50">
                      <td className="p-3 font-mono text-[#6C3BFF]">{c.id}</td>
                      <td className="p-3 font-bold text-[#17152B]">{c.name}</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-[#F4F1FA] rounded-full text-[10px] font-semibold">{c.type}</span></td>
                      <td className="p-3">{c.initialBalance.toLocaleString()}</td>
                      <td className="p-3 text-[#19A974]">+{c.faucetRatePerMin}</td>
                      <td className="p-3 text-[#FF3B4F]">-{c.sinkRatePerMin}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleDeleteCurrency(c.id)} className="text-[#FF3B4F] hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "Income Formulas" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#DED9EA] space-y-3">
                <h4 className="text-xs font-bold uppercase text-[#6C6880]">Formula Parameters</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#6C6880] block">Base Income</label>
                    <input
                      type="number"
                      value={vars.BaseIncome}
                      onChange={(e) => setVars({ ...vars, BaseIncome: Number(e.target.value) })}
                      className="w-full text-xs p-2 bg-[#F4F1FA] border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6C6880] block">Income Multiplier</label>
                    <input
                      type="number"
                      step="0.01"
                      value={vars.IncomeMultiplier}
                      onChange={(e) => setVars({ ...vars, IncomeMultiplier: Number(e.target.value) })}
                      className="w-full text-xs p-2 bg-[#F4F1FA] border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6C6880] block">Base Cost</label>
                    <input
                      type="number"
                      value={vars.BaseCost}
                      onChange={(e) => setVars({ ...vars, BaseCost: Number(e.target.value) })}
                      className="w-full text-xs p-2 bg-[#F4F1FA] border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6C6880] block">Cost Multiplier</label>
                    <input
                      type="number"
                      step="0.01"
                      value={vars.CostMultiplier}
                      onChange={(e) => setVars({ ...vars, CostMultiplier: Number(e.target.value) })}
                      className="w-full text-xs p-2 bg-[#F4F1FA] border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#DED9EA]">
                <h4 className="text-xs font-bold uppercase text-[#6C6880] mb-2">Income vs Cost Growth Curve</h4>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={formulaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F4F1FA" />
                    <XAxis dataKey="level" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="income" stroke="#19C6D1" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="cost" stroke="#6C3BFF" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {tab === "Drop Tables" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#17152B]">Reward & Gacha Drop Tables</h3>
              <button
                onClick={() => setShowAddDrop(true)}
                className="flex items-center gap-1 bg-[#6C3BFF] text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#5a2fe0]"
              >
                <Plus size={13} /> Add Reward Item
              </button>
            </div>

            <div className="bg-white border border-[#DED9EA] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F4F1FA] text-[#6C6880] border-b border-[#DED9EA] uppercase tracking-wider">
                    <th className="p-3">ID</th>
                    <th className="p-3">Item</th>
                    <th className="p-3">Rarity</th>
                    <th className="p-3">Weight</th>
                    <th className="p-3">Probability</th>
                    <th className="p-3">Pity Counter</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DED9EA]">
                  {dropTable.map((d) => (
                    <tr key={d.id} className="hover:bg-[#F4F1FA]/50">
                      <td className="p-3 font-mono text-[#6C3BFF]">{d.id}</td>
                      <td className="p-3 font-bold text-[#17152B]">{d.item}</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-[#F4F1FA] rounded-full text-[10px] font-semibold">{d.rarity}</span></td>
                      <td className="p-3">{d.weight}</td>
                      <td className="p-3 font-mono text-[#6C3BFF] font-semibold">{((d.weight / totalWeight) * 100).toFixed(1)}%</td>
                      <td className="p-3">{d.pity > 0 ? `${d.pity} pulls` : "None"}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleDeleteDrop(d.id)} className="text-[#FF3B4F] hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Interactive Gacha Pity Calculator */}
            <div className="bg-white border border-[#DED9EA] p-5 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Dices size={18} className="text-[#6C3BFF]" />
                <h4 className="text-sm font-bold text-[#17152B]">Gacha Pull Probability & Pity Calculator</h4>
              </div>

              <div className="grid grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[#6C6880] block mb-1">Target Pulls Count</label>
                  <input
                    type="number"
                    value={targetPulls}
                    onChange={(e) => setTargetPulls(Number(e.target.value))}
                    className="w-full p-2 bg-[#F4F1FA] border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[#6C6880] block mb-1">Base Drop Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={baseDropRate}
                    onChange={(e) => setBaseDropRate(Number(e.target.value))}
                    className="w-full p-2 bg-[#F4F1FA] border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[#6C6880] block mb-1">Pity Threshold (Pulls)</label>
                  <input
                    type="number"
                    value={pityThreshold}
                    onChange={(e) => setPityThreshold(Number(e.target.value))}
                    className="w-full p-2 bg-[#F4F1FA] border rounded-lg"
                  />
                </div>
                <div className="bg-[#F4F1FA] p-3 rounded-xl border border-[#DED9EA] flex flex-col justify-center">
                  <span className="text-[10px] text-[#6C6880]">Cumulative Success Probability</span>
                  <span className="text-lg font-bold text-[#6C3BFF] font-mono">{calculateGachaChance()}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Currency Modal */}
      {showAddCurrency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
            <h3 className="font-bold text-base">Add New Currency</h3>
            <input
              placeholder="Currency Name (e.g. Spirit Orbs)"
              value={newCurr.name}
              onChange={(e) => setNewCurr({ ...newCurr, name: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg"
            />
            <select
              value={newCurr.type}
              onChange={(e) => setNewCurr({ ...newCurr, type: e.target.value as CurrencyItem["type"] })}
              className="w-full p-2 text-xs border rounded-lg"
            >
              <option value="Soft">Soft Currency</option>
              <option value="Hard">Hard Currency</option>
              <option value="Event">Event Token</option>
              <option value="Energy">Energy Stamina</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowAddCurrency(false)} className="flex-1 py-2 text-xs border rounded-lg">Cancel</button>
              <button onClick={handleAddCurrency} className="flex-1 py-2 text-xs bg-[#6C3BFF] text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Drop Modal */}
      {showAddDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
            <h3 className="font-bold text-base">Add Drop Item</h3>
            <input
              placeholder="Item Name (e.g. Legendary Staff Fragment)"
              value={newDrop.item}
              onChange={(e) => setNewDrop({ ...newDrop, item: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg"
            />
            <select
              value={newDrop.rarity}
              onChange={(e) => setNewDrop({ ...newDrop, rarity: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg"
            >
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Epic">Epic</option>
              <option value="Legendary">Legendary</option>
            </select>
            <input
              type="number"
              placeholder="Drop Weight"
              value={newDrop.weight}
              onChange={(e) => setNewDrop({ ...newDrop, weight: Number(e.target.value) })}
              className="w-full p-2 text-xs border rounded-lg"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowAddDrop(false)} className="flex-1 py-2 text-xs border rounded-lg">Cancel</button>
              <button onClick={handleAddDrop} className="flex-1 py-2 text-xs bg-[#6C3BFF] text-white rounded-lg">Add Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
