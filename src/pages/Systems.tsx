import { useState } from "react";
import { Plus, Search, Filter, Grid3X3, Table, Network, Clock, ChevronRight, X, ExternalLink, CheckCircle, AlertCircle, Clock3 } from "lucide-react";
import { SYSTEMS } from "../data/mockData";

interface SystemsProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
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
};

export default function Systems({ onToast }: SystemsProps) {
  const [view, setView] = useState<"table" | "cards">("table");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedSystem, setSelectedSystem] = useState<typeof SYSTEMS[0] | null>(null);
  const [addModal, setAddModal] = useState(false);

  const filtered = SYSTEMS.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || s.category === category;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex-1 overflow-hidden flex bg-[#FFF9F2]">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Toolbar */}
        <div className="bg-white border-b border-[#DED9EA] px-5 py-3 flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#F4F1FA] rounded-lg p-1">
            <button onClick={() => setView("table")} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "table" ? "bg-white text-[#17152B] shadow-sm" : "text-[#6C6880]"}`}>
              <Table size={13} /> Table
            </button>
            <button onClick={() => setView("cards")} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "cards" ? "bg-white text-[#17152B] shadow-sm" : "text-[#6C6880]"}`}>
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

          <div className="flex gap-1.5">
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

          <button
            onClick={() => setAddModal(true)}
            className="ml-auto flex items-center gap-1.5 bg-[#6C3BFF] text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-[#5a2fe0] transition-colors"
          >
            <Plus size={13} /> Add System
          </button>
        </div>

        <div className="p-5">
          {view === "table" ? (
            <div className="bg-white rounded-[14px] border border-[#DED9EA] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#F4F1FA] sticky top-0">
                    <tr>
                      {["System ID", "Name", "Category", "Player Purpose", "Owner", "Status", "Confidence", "Version", "Actions"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-[#6C6880] uppercase tracking-wider text-[10px] whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DED9EA]">
                    {filtered.map((sys) => (
                      <tr key={sys.id} className="table-row-hover cursor-pointer" onClick={() => setSelectedSystem(sys)}>
                        <td className="px-4 py-3 font-mono text-[10px] text-[#6C6880]">{sys.id}</td>
                        <td className="px-4 py-3 font-semibold text-[#17152B] whitespace-nowrap">{sys.name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[sys.category] ?? "bg-[#F4F1FA] text-[#6C6880]"}`}>
                            {sys.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#6C6880] max-w-[200px] truncate">{sys.playerPurpose}</td>
                        <td className="px-4 py-3 text-[#17152B]">{sys.owner}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[sys.status] ?? STATUS_STYLE.Draft}`}>
                            {sys.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1 bg-[#DED9EA] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${sys.confidence >= 85 ? "bg-[#19A974]" : sys.confidence >= 70 ? "bg-[#FFC928]" : "bg-[#FF3B4F]"}`}
                                style={{ width: `${sys.confidence}%` }} />
                            </div>
                            <span className="font-mono">{sys.confidence}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[#6C6880]">{sys.version}</td>
                        <td className="px-4 py-3">
                          <button className="text-[#6C3BFF] hover:text-[#5a2fe0] text-[10px] font-semibold" onClick={(e) => { e.stopPropagation(); setSelectedSystem(sys); }}>
                            View →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-[#DED9EA] text-xs text-[#6C6880]">
                {filtered.length} of {SYSTEMS.length} systems
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filtered.map((sys) => (
                <div
                  key={sys.id}
                  onClick={() => setSelectedSystem(sys)}
                  className="bg-white rounded-[14px] border border-[#DED9EA] p-4 cursor-pointer hover:border-[#6C3BFF] transition-colors"
                  style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[sys.category] ?? "bg-[#F4F1FA] text-[#6C6880]"}`}>
                      {sys.category}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[sys.status] ?? STATUS_STYLE.Draft}`}>
                      {sys.status}
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-[#17152B] mb-1">{sys.name}</div>
                  <div className="font-mono text-[10px] text-[#6C6880] mb-2">{sys.id}</div>
                  <p className="text-xs text-[#6C6880] line-clamp-2 mb-3">{sys.playerPurpose}</p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#6C6880]">{sys.owner}</span>
                    <span className="font-mono text-[#6C6880]">{sys.confidence}% confidence</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      {selectedSystem && (
        <div className="w-[420px] shrink-0 bg-white border-l border-[#DED9EA] flex flex-col overflow-y-auto">
          <div className="px-5 py-4 border-b border-[#DED9EA] flex items-start justify-between shrink-0">
            <div>
              <div className="font-mono text-[10px] text-[#6C6880] mb-1">{selectedSystem.id}</div>
              <div className="font-bold text-base text-[#17152B]">{selectedSystem.name}</div>
            </div>
            <button onClick={() => setSelectedSystem(null)} className="p-1 text-[#6C6880] hover:text-[#17152B] rounded hover:bg-[#F4F1FA]">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 p-5 space-y-5 text-sm">
            {[
              { label: "Player Purpose", value: selectedSystem.playerPurpose },
              { label: "Trigger", value: selectedSystem.trigger },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider mb-1">{item.label}</div>
                <p className="text-[#17152B]">{item.value}</p>
              </div>
            ))}

            <div>
              <div className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider mb-2">Inputs</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedSystem.inputs.map((inp) => (
                  <span key={inp} className="text-[11px] bg-[#19C6D1]/10 text-[#19C6D1] border border-[#19C6D1]/20 px-2 py-0.5 rounded-full">{inp}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider mb-2">Outputs</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedSystem.outputs.map((out) => (
                  <span key={out} className="text-[11px] bg-[#6C3BFF]/10 text-[#6C3BFF] border border-[#6C3BFF]/20 px-2 py-0.5 rounded-full">{out}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider mb-2">Dependencies</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedSystem.dependencies.map((d) => (
                  <span key={d} className="font-mono text-[11px] bg-[#F4F1FA] border border-[#DED9EA] px-2 py-0.5 rounded-full text-[#6C6880]">{d}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Unlock Condition", value: selectedSystem.unlockCondition },
                { label: "Owner", value: selectedSystem.owner },
                { label: "Version", value: selectedSystem.version },
                { label: "Status", value: selectedSystem.status },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider mb-1">{item.label}</div>
                  <div className="text-sm text-[#17152B]">{item.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider mb-2">Confidence</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-[#F4F1FA] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${selectedSystem.confidence >= 85 ? "bg-[#19A974]" : selectedSystem.confidence >= 70 ? "bg-[#FFC928]" : "bg-[#FF3B4F]"}`}
                    style={{ width: `${selectedSystem.confidence}%` }} />
                </div>
                <span className="font-mono text-xs font-semibold">{selectedSystem.confidence}%</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => onToast("info", "Edit mode", `Editing ${selectedSystem.name}`)}
                className="flex-1 py-2 bg-[#6C3BFF] text-white text-xs font-medium rounded-lg hover:bg-[#5a2fe0] transition-colors">
                Edit System
              </button>
              <button onClick={() => onToast("info", "Duplicate created", `${selectedSystem.name} duplicated`)}
                className="flex-1 py-2 border border-[#DED9EA] text-[#6C6880] text-xs rounded-lg hover:bg-[#F4F1FA] transition-colors">
                Duplicate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add System Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl border border-[#DED9EA] shadow-2xl w-[500px] p-6">
            <h3 className="font-bold text-lg text-[#17152B] mb-4">Add New System</h3>
            <div className="space-y-3">
              {["System Name", "Category", "Player Purpose", "Trigger", "Owner"].map((f) => (
                <div key={f}>
                  <label className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider block mb-1">{f}</label>
                  <input className="w-full text-sm bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 focus:outline-none focus:border-[#6C3BFF] text-[#17152B]" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setAddModal(false)} className="flex-1 py-2.5 border border-[#DED9EA] rounded-xl text-sm text-[#6C6880] hover:bg-[#F4F1FA]">Cancel</button>
              <button onClick={() => { setAddModal(false); onToast("success", "System added", "New system created in Draft status"); }}
                className="flex-1 py-2.5 bg-[#6C3BFF] text-white rounded-xl text-sm font-medium hover:bg-[#5a2fe0]">
                Create System
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
