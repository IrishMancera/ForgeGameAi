import { useState } from "react";
import {
  Plus, Search, Table, Grid3X3, Save, Cloud, CheckCircle2,
  Network, Trash2, Edit3, X, Download
} from "lucide-react";
import { SYSTEMS } from "../data/mockData";
import { useModuleState } from "../services/useModuleState";

interface SystemsProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  projectId?: string;
}

interface SystemItem {
  id: string;
  name: string;
  category: string;
  status: string;
  complexity?: string;
  playerPurpose?: string;
  trigger?: string;
  inputs?: string[];
  outputs?: string[];
  unlockCondition?: string;
  dependencies?: string[];
  owner: string;
  description?: string;
}

const CATEGORIES = ["All", "Core", "Economy", "Meta", "Progression", "LiveOps", "Content", "Social"];

const STATUS_STYLE: Record<string, string> = {
  Approved: "bg-[#EDFAF4] text-[#19A974] border-[#C8F0DC]",
  "In Review": "bg-[#FFF8E6] text-[#FFC928] border-[#FFE89A]",
  Draft: "bg-[#F4F1FA] text-[#6C6880] border-[#DED9EA]",
};

const CAT_COLORS: Record<string, string> = {
  Core: "bg-[#6C3BFF]/10 text-[#6C3BFF]",
  Economy: "bg-[#19C6D1]/10 text-[#19C6D1]",
  Meta: "bg-[#FFC928]/10 text-[#a87d00]",
  Progression: "bg-[#19A974]/10 text-[#19A974]",
  LiveOps: "bg-[#FF3B4F]/10 text-[#FF3B4F]",
  Content: "bg-[#6C3BFF]/10 text-[#6C3BFF]",
  Social: "bg-[#19C6D1]/10 text-[#19C6D1]",
};

export default function Systems({ onToast, projectId }: SystemsProps) {
  const [view, setView] = useState<"table" | "cards">("table");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [selectedSystem, setSelectedSystem] = useState<SystemItem | null>(null);
  const [editingSystem, setEditingSystem] = useState<SystemItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);

  // Persistent module state
  const [moduleData, setModuleData, saveNow, saving] = useModuleState(
    'systems',
    { customSystems: SYSTEMS as unknown as SystemItem[] },
    projectId
  );

  const systemsList = moduleData.customSystems;

  // New system form state
  const [newSystem, setNewSystem] = useState<Partial<SystemItem>>({
    name: "", category: "Core", status: "Draft", complexity: "Medium", owner: "", description: ""
  });

  const filtered = systemsList.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || s.category === category;
    return matchesSearch && matchesCat;
  });

  // Add system handler
  const handleAddSystem = () => {
    if (!newSystem.name) {
      onToast("error", "Missing name", "Please provide a system name");
      return;
    }
    const created: SystemItem = {
      id: `SYS-${String(systemsList.length + 1).padStart(3, '0')}`,
      name: newSystem.name,
      category: newSystem.category || "Core",
      status: newSystem.status || "Draft",
      complexity: newSystem.complexity || "Medium",
      dependencies: [],
      owner: newSystem.owner || "Unassigned",
      description: newSystem.description || "System specification pending.",
    };

    setModuleData((prev) => ({
      ...prev,
      customSystems: [created, ...prev.customSystems],
    }));

    setShowAddModal(false);
    setNewSystem({ name: "", category: "Core", status: "Draft", complexity: "Medium", owner: "", description: "" });
    onToast("success", "System created", `Added ${created.id}: ${created.name}`);
  };

  // Edit system handler
  const handleSaveEditSystem = () => {
    if (!editingSystem) return;
    setModuleData((prev) => ({
      ...prev,
      customSystems: prev.customSystems.map((s) => (s.id === editingSystem.id ? editingSystem : s)),
    }));
    if (selectedSystem?.id === editingSystem.id) {
      setSelectedSystem(editingSystem);
    }
    setEditingSystem(null);
    onToast("success", "System updated", `Saved changes to ${editingSystem.name}`);
  };

  // Delete system handler
  const handleDeleteSystem = (id: string) => {
    setModuleData((prev) => ({
      ...prev,
      customSystems: prev.customSystems.filter((s) => s.id !== id),
    }));
    if (selectedSystem?.id === id) setSelectedSystem(null);
    onToast("info", "System deleted", "Removed system from architecture registry");
  };

  // Export spec handler
  const handleExportSpec = () => {
    const blob = new Blob([JSON.stringify(systemsList, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `systems-architecture-spec.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("success", "Spec exported", "Architecture JSON specification downloaded");
  };

  return (
    <div className="flex-1 overflow-hidden flex bg-[#FFF9F2]">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Toolbar */}
        <div className="bg-white border-b border-[#DED9EA] px-5 py-3 flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#F4F1FA] rounded-lg p-1">
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "table" ? "bg-white text-[#17152B] shadow-sm" : "text-[#6C6880]"}`}
            >
              <Table size={13} /> Table
            </button>
            <button
              onClick={() => setView("cards")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "cards" ? "bg-white text-[#17152B] shadow-sm" : "text-[#6C6880]"}`}
            >
              <Grid3X3 size={13} /> Cards
            </button>
          </div>

          <div className="relative flex-1 max-w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C6880]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search systems…"
              className="w-full pl-8 pr-3 py-2 text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg focus:outline-none focus:border-[#6C3BFF] text-[#17152B] placeholder:text-[#6C6880]"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === cat ? "bg-[#6C3BFF] text-white" : "bg-[#F4F1FA] text-[#6C6880] hover:text-[#17152B]"}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowGraphModal(true)}
              className="flex items-center gap-1.5 text-xs text-[#6C3BFF] bg-[#F4F1FA] border border-[#DED9EA] px-3 py-2 rounded-lg hover:bg-[#ede8fb] transition-colors"
            >
              <Network size={13} /> System Graph
            </button>

            <button
              onClick={handleExportSpec}
              className="flex items-center gap-1.5 text-xs text-[#6C6880] bg-white border border-[#DED9EA] px-3 py-2 rounded-lg hover:bg-[#F4F1FA] transition-colors"
            >
              <Download size={13} /> Export Spec
            </button>

            <button
              onClick={async () => { await saveNow(); onToast("success", "Systems saved", "System registry synced to project"); }}
              className="flex items-center gap-1.5 text-xs text-[#6C3BFF] bg-[#F4F1FA] border border-[#DED9EA] px-3 py-2 rounded-lg hover:bg-[#ede8fb] transition-colors"
            >
              {saving ? <Cloud size={13} className="animate-pulse" /> : <Save size={13} />}
              Save
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-[#6C3BFF] text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-[#5a2fe0] transition-colors shadow-sm"
            >
              <Plus size={13} /> Add System
            </button>
          </div>
        </div>

        {/* View render */}
        <div className="p-5">
          {view === "table" ? (
            <div className="bg-white rounded-[14px] border border-[#DED9EA] overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F4F1FA] text-[#6C6880] border-b border-[#DED9EA] uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">System ID</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Complexity</th>
                    <th className="px-4 py-3 font-semibold">Owner</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DED9EA]">
                  {filtered.map((sys) => (
                    <tr
                      key={sys.id}
                      onClick={() => setSelectedSystem(sys)}
                      className={`hover:bg-[#F4F1FA]/60 cursor-pointer transition-colors ${selectedSystem?.id === sys.id ? "bg-[#F4F1FA]" : ""}`}
                    >
                      <td className="px-4 py-3 font-mono text-[#6C3BFF] font-medium">{sys.id}</td>
                      <td className="px-4 py-3 font-bold text-[#17152B]">{sys.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CAT_COLORS[sys.category] || "bg-gray-100 text-gray-700"}`}>
                          {sys.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLE[sys.status] || "bg-gray-100 text-gray-700"}`}>
                          {sys.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#6C6880]">{sys.complexity ?? "Medium"}</td>
                      <td className="px-4 py-3 text-[#17152B]">{sys.owner}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingSystem(sys); }}
                          className="text-[#6C3BFF] hover:underline text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSystem(sys.id); }}
                          className="text-[#FF3B4F] hover:underline text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filtered.map((sys) => (
                <div
                  key={sys.id}
                  onClick={() => setSelectedSystem(sys)}
                  className="bg-white border border-[#DED9EA] rounded-2xl p-4 shadow-sm hover:border-[#6C3BFF] cursor-pointer transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#6C3BFF] font-semibold">{sys.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLE[sys.status] || "bg-gray-100"}`}>
                      {sys.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#17152B]">{sys.name}</h3>
                    <p className="text-xs text-[#6C6880] line-clamp-2 mt-1">{sys.description ?? sys.playerPurpose ?? "System specification pending."}</p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#6C6880] pt-2 border-t border-[#F4F1FA]">
                    <span>Category: {sys.category}</span>
                    <span>Owner: {sys.owner}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System detail drawer */}
      {selectedSystem && (
        <div className="w-80 bg-white border-l border-[#DED9EA] p-5 flex flex-col justify-between shrink-0 shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#6C3BFF] font-bold">{selectedSystem.id}</span>
              <button onClick={() => setSelectedSystem(null)} className="text-[#6C6880] hover:text-[#17152B]">
                <X size={16} />
              </button>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#17152B]">{selectedSystem.name}</h2>
              <div className="flex gap-2 mt-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${CAT_COLORS[selectedSystem.category] || "bg-gray-100"}`}>
                  {selectedSystem.category}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLE[selectedSystem.status] || "bg-gray-100"}`}>
                  {selectedSystem.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div>
                <span className="text-[#6C6880] block mb-0.5 font-semibold uppercase tracking-wider text-[10px]">Description</span>
                <p className="text-[#17152B] bg-[#F4F1FA] p-3 rounded-xl border border-[#DED9EA] leading-relaxed">
                  {selectedSystem.description ?? selectedSystem.playerPurpose ?? "System specification pending."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#F4F1FA] p-2.5 rounded-xl border border-[#DED9EA]">
                  <span className="text-[#6C6880] text-[10px] block">Complexity</span>
                  <span className="font-semibold text-[#17152B]">{selectedSystem.complexity ?? "Medium"}</span>
                </div>
                <div className="bg-[#F4F1FA] p-2.5 rounded-xl border border-[#DED9EA]">
                  <span className="text-[#6C6880] text-[10px] block">Owner</span>
                  <span className="font-semibold text-[#17152B]">{selectedSystem.owner}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-[#DED9EA]">
            <button
              onClick={() => setEditingSystem(selectedSystem)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#6C3BFF] text-white text-xs font-semibold rounded-xl hover:bg-[#5a2fe0]"
            >
              <Edit3 size={13} /> Edit System Details
            </button>
            <button
              onClick={() => handleDeleteSystem(selectedSystem.id)}
              className="w-full flex items-center justify-center gap-1.5 py-2 border border-[#FF3B4F]/30 text-[#FF3B4F] text-xs font-semibold rounded-xl hover:bg-[#FFF0F2]"
            >
              <Trash2 size={13} /> Remove System
            </button>
          </div>
        </div>
      )}

      {/* Add System Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-[#DED9EA] p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#17152B]">Add Architecture System</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#6C6880] hover:text-[#17152B]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">System Name</label>
                <input
                  value={newSystem.name}
                  onChange={(e) => setNewSystem({ ...newSystem, name: e.target.value })}
                  placeholder="e.g. Crafting & Alchemy Matrix"
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#6C6880] block mb-1">Category</label>
                  <select
                    value={newSystem.category}
                    onChange={(e) => setNewSystem({ ...newSystem, category: e.target.value })}
                    className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#6C6880] block mb-1">Status</label>
                  <select
                    value={newSystem.status}
                    onChange={(e) => setNewSystem({ ...newSystem, status: e.target.value })}
                    className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                  >
                    <option value="Draft">Draft</option>
                    <option value="In Review">In Review</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">Owner / Lead Engineer</label>
                <input
                  value={newSystem.owner}
                  onChange={(e) => setNewSystem({ ...newSystem, owner: e.target.value })}
                  placeholder="e.g. Marcus T."
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">Description</label>
                <textarea
                  value={newSystem.description}
                  onChange={(e) => setNewSystem({ ...newSystem, description: e.target.value })}
                  rows={3}
                  placeholder="System specification and feature scope..."
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 text-xs font-medium border border-[#DED9EA] rounded-lg text-[#6C6880] hover:bg-[#F4F1FA]">
                Cancel
              </button>
              <button onClick={handleAddSystem} className="flex-1 py-2 text-xs font-medium bg-[#6C3BFF] text-white rounded-lg hover:bg-[#5a2fe0]">
                Create System
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit System Modal */}
      {editingSystem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-[#DED9EA] p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#17152B]">Edit {editingSystem.id}</h3>
              <button onClick={() => setEditingSystem(null)} className="text-[#6C6880] hover:text-[#17152B]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">System Name</label>
                <input
                  value={editingSystem.name}
                  onChange={(e) => setEditingSystem({ ...editingSystem, name: e.target.value })}
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#6C6880] block mb-1">Category</label>
                  <select
                    value={editingSystem.category}
                    onChange={(e) => setEditingSystem({ ...editingSystem, category: e.target.value })}
                    className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#6C6880] block mb-1">Status</label>
                  <select
                    value={editingSystem.status}
                    onChange={(e) => setEditingSystem({ ...editingSystem, status: e.target.value })}
                    className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                  >
                    <option value="Draft">Draft</option>
                    <option value="In Review">In Review</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">Owner</label>
                <input
                  value={editingSystem.owner}
                  onChange={(e) => setEditingSystem({ ...editingSystem, owner: e.target.value })}
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">Description</label>
                <textarea
                  value={editingSystem.description ?? editingSystem.playerPurpose ?? ""}
                  onChange={(e) => setEditingSystem({ ...editingSystem, description: e.target.value })}
                  rows={3}
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditingSystem(null)} className="flex-1 py-2 text-xs font-medium border border-[#DED9EA] rounded-lg text-[#6C6880] hover:bg-[#F4F1FA]">
                Cancel
              </button>
              <button onClick={handleSaveEditSystem} className="flex-1 py-2 text-xs font-medium bg-[#6C3BFF] text-white rounded-lg hover:bg-[#5a2fe0]">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Graph Modal */}
      {showGraphModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-[#DED9EA] p-6 w-full max-w-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#17152B]">System Architecture Graph</h3>
                <p className="text-xs text-[#6C6880]">Dependency graph visualization across active game systems</p>
              </div>
              <button onClick={() => setShowGraphModal(false)} className="text-[#6C6880] hover:text-[#17152B]">
                <X size={16} />
              </button>
            </div>

            <div className="h-64 bg-[#F4F1FA] border border-[#DED9EA] rounded-xl flex items-center justify-center relative overflow-hidden p-4">
              <svg className="w-full h-full">
                <line x1="100" y1="50" x2="300" y2="100" stroke="#6C3BFF" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="300" y1="100" x2="500" y2="180" stroke="#19C6D1" strokeWidth="2" />
                <line x1="100" y1="50" x2="500" y2="180" stroke="#FFC928" strokeWidth="2" strokeDasharray="2 2" />
              </svg>
              <div className="absolute top-8 left-12 bg-white border border-[#6C3BFF] px-3 py-1.5 rounded-lg text-xs font-bold text-[#6C3BFF] shadow-sm">
                Game Core Loop
              </div>
              <div className="absolute top-20 left-64 bg-white border border-[#19C6D1] px-3 py-1.5 rounded-lg text-xs font-bold text-[#19C6D1] shadow-sm">
                Economy Sinks & Faucets
              </div>
              <div className="absolute bottom-8 right-16 bg-white border border-[#FFC928] px-3 py-1.5 rounded-lg text-xs font-bold text-[#a87d00] shadow-sm">
                Progression Curves
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setShowGraphModal(false)} className="px-4 py-2 bg-[#6C3BFF] text-white rounded-lg text-xs font-semibold hover:bg-[#5a2fe0]">
                Close Visualizer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
