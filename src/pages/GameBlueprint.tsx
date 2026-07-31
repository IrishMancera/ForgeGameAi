import { useState } from "react";
import {
  ChevronRight, CheckCircle, AlertCircle, Clock, Plus,
  Lightbulb, Download, Trash2, Edit3, Save, X, FileText, CheckCircle2, Cloud
} from "lucide-react";
import { useModuleState } from "../services/useModuleState";

interface GameBlueprintProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  projectId?: string;
}

interface BlueprintField {
  label: string;
  value: string;
}

interface BlueprintSection {
  id: string;
  label: string;
  required: boolean;
  fields: BlueprintField[];
  aiSuggestion?: string;
}

const DEFAULT_SECTIONS: BlueprintSection[] = [
  {
    id: "identity",
    label: "Game Identity",
    required: true,
    fields: [
      { label: "Game Title", value: "Haunted Hotel" },
      { label: "Tagline", value: "Restore the mystery. Host the supernatural." },
      { label: "Genre", value: "Hybrid-Casual Idle Tycoon" },
      { label: "Platform", value: "Mobile (iOS + Android)" },
      { label: "Target Rating", value: "PEGI 7 / ESRB E10+" },
      { label: "Developer", value: "Studio Phantom Games" },
    ],
  },
  {
    id: "pillars",
    label: "Design Pillars",
    required: true,
    fields: [
      { label: "Pillar 1", value: "Satisfying Idle Progression — Players feel meaningful advancement every session" },
      { label: "Pillar 2", value: "Supernatural Narrative — Each room and guest has a ghostly story to discover" },
      { label: "Pillar 3", value: "Collection & Mastery — Building the perfect haunted hotel is both social status and personal achievement" },
    ],
    aiSuggestion: "Consider adding a 4th pillar around Community — your social systems are currently underweighted relative to your competitive set.",
  },
  {
    id: "core-loop",
    label: "Core Gameplay Loop",
    required: true,
    fields: [
      { label: "Primary Action", value: "Collect coins from active rooms → Upgrade rooms → Unlock new rooms → Serve more guests" },
      { label: "Energy Gate", value: "Ghost Hunter actions gated by Energy — regenerates over time or via purchase" },
      { label: "Daily Anchor", value: "Daily Tasks provide a structured to-do list that drives 3–5 sessions per day" },
      { label: "Session End", value: "Player taps daily chest, collects offline earnings, and queues next upgrade" },
    ],
    aiSuggestion: "Your core loop is sound. D1 onboarding time is estimated at 8–12 minutes. Consider adding a 'quick win' at minute 3 to boost first-session completion rates.",
  },
  {
    id: "monetization",
    label: "Monetization Model",
    required: true,
    fields: [
      { label: "Model", value: "Free-to-Play with IAP" },
      { label: "Hard Currency", value: "Diamonds — earned sparingly, primary IAP" },
      { label: "Primary Offers", value: "Starter Pack ($1.99), Room Bundle ($4.99), Diamond Packs ($0.99–$99.99)" },
      { label: "Gacha Element", value: "Ghost Staff Recruitment via Diamond spin" },
      { label: "Live Ops Monetization", value: "Event Battle Pass ($4.99/event), Limited Decorations" },
    ],
    aiSuggestion: "⚠ Gacha element requires odds disclosure in EU, South Korea, and Japan markets. Review before submission.",
  },
];

export default function GameBlueprint({ onToast, projectId }: GameBlueprintProps) {
  const [activeSectionId, setActiveSectionId] = useState("identity");
  const [generateModal, setGenerateModal] = useState(false);
  const [gameIdea, setGameIdea] = useState("");

  // Modals for section/field management
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState("");
  const [newSectionRequired, setNewSectionRequired] = useState(false);

  // Persistent module state
  const [blueprintData, setBlueprintData, saveNow, saving] = useModuleState(
    "blueprint",
    { sections: DEFAULT_SECTIONS },
    projectId
  );

  const sections = blueprintData.sections;

  // Active section helper
  const currentSection = sections.find((s) => s.id === activeSectionId) || sections[0] || DEFAULT_SECTIONS[0];

  // Completion calculations
  const calculateSectionComplete = (sec: BlueprintSection): number => {
    if (sec.fields.length === 0) return 0;
    const filled = sec.fields.filter((f) => f.value.trim().length > 0).length;
    return Math.round((filled / sec.fields.length) * 100);
  };

  const overallComplete = Math.round(
    sections.reduce((sum, sec) => sum + calculateSectionComplete(sec), 0) / (sections.length || 1)
  );

  // Field change handler
  const handleFieldChange = (label: string, newValue: string) => {
    setBlueprintData((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) =>
        sec.id === currentSection.id
          ? {
              ...sec,
              fields: sec.fields.map((f) => (f.label === label ? { ...f, value: newValue } : f)),
            }
          : sec
      ),
    }));
  };

  // Add field handler
  const handleAddField = () => {
    if (!newFieldLabel.trim()) {
      onToast("error", "Missing label", "Please provide a field label");
      return;
    }
    setBlueprintData((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) =>
        sec.id === currentSection.id
          ? {
              ...sec,
              fields: [...sec.fields, { label: newFieldLabel.trim(), value: newFieldValue.trim() }],
            }
          : sec
      ),
    }));
    setShowAddFieldModal(false);
    setNewFieldLabel("");
    setNewFieldValue("");
    onToast("success", "Field added", `Added "${newFieldLabel}" to ${currentSection.label}`);
  };

  // Delete field handler
  const handleDeleteField = (label: string) => {
    setBlueprintData((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) =>
        sec.id === currentSection.id
          ? {
              ...sec,
              fields: sec.fields.filter((f) => f.label !== label),
            }
          : sec
      ),
    }));
    onToast("info", "Field removed", `Removed "${label}"`);
  };

  // Add section handler
  const handleAddSection = () => {
    if (!newSectionLabel.trim()) {
      onToast("error", "Missing section name", "Please enter a section title");
      return;
    }
    const newId = newSectionLabel.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const newSec: BlueprintSection = {
      id: newId,
      label: newSectionLabel.trim(),
      required: newSectionRequired,
      fields: [
        { label: "Overview", value: "Describe the core goals of this section." },
      ],
    };
    setBlueprintData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSec],
    }));
    setActiveSectionId(newId);
    setShowAddSectionModal(false);
    setNewSectionLabel("");
    setNewSectionRequired(false);
    onToast("success", "Section created", `Added section "${newSec.label}"`);
  };

  // Delete section handler
  const handleDeleteSection = (secId: string) => {
    if (sections.length <= 1) {
      onToast("error", "Cannot delete", "Blueprint must have at least one section");
      return;
    }
    setBlueprintData((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== secId),
    }));
    setActiveSectionId(sections.find((s) => s.id !== secId)?.id || "identity");
    onToast("info", "Section deleted", "Section removed from blueprint");
  };

  // Export GDD handler
  const handleExportGDD = (format: "md" | "json") => {
    if (format === "json") {
      const blob = new Blob([JSON.stringify(blueprintData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `game-blueprint-gdd.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      let mdText = `# Game Design Document (GDD)\n\nOverall Completion: ${overallComplete}%\n\n`;
      sections.forEach((sec) => {
        mdText += `## ${sec.label}\n\n`;
        sec.fields.forEach((f) => {
          mdText += `### ${f.label}\n${f.value}\n\n`;
        });
      });
      const blob = new Blob([mdText], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `game-blueprint-gdd.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
    onToast("success", "GDD Exported", `Downloaded blueprint in .${format} format`);
  };

  return (
    <div className="flex-1 overflow-hidden flex bg-[#FFF9F2]">
      {/* Section index sidebar */}
      <div className="w-64 bg-white border-r border-[#DED9EA] flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-[#DED9EA]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-[#17152B]">GDD Sections</span>
            <span className="text-xs font-mono text-[#6C3BFF] font-bold">{overallComplete}%</span>
          </div>
          <div className="h-1.5 bg-[#F4F1FA] rounded-full overflow-hidden">
            <div className="h-full bg-[#6C3BFF] rounded-full transition-all" style={{ width: `${overallComplete}%` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {sections.map((s) => {
            const comp = calculateSectionComplete(s);
            return (
              <div key={s.id} className="group relative flex items-center">
                <button
                  onClick={() => setActiveSectionId(s.id)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-2 transition-colors ${
                    activeSectionId === s.id ? "bg-[#F4F1FA] text-[#6C3BFF] font-semibold" : "text-[#6C6880] hover:bg-[#F4F1FA] hover:text-[#17152B]"
                  }`}
                >
                  {comp === 100 ? (
                    <CheckCircle size={13} className="text-[#19A974] shrink-0" />
                  ) : comp >= 70 ? (
                    <Clock size={13} className="text-[#FFC928] shrink-0" />
                  ) : (
                    <AlertCircle size={13} className="text-[#FF3B4F] shrink-0" />
                  )}
                  <span className="text-xs flex-1 truncate">{s.label}</span>
                  {s.required && comp < 100 && (
                    <span className="text-[9px] text-[#FF3B4F] font-bold">*</span>
                  )}
                </button>
                {sections.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSection(s.id); }}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 text-[#6C6880] hover:text-[#FF3B4F] p-1 transition-all"
                    title="Delete section"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-[#DED9EA] space-y-2">
          <button
            onClick={() => setShowAddSectionModal(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#F4F1FA] border border-[#DED9EA] text-[#6C3BFF] text-xs font-semibold rounded-xl hover:bg-[#ede8fb] transition-colors"
          >
            <Plus size={13} /> Add Custom Section
          </button>
          <button
            onClick={() => setGenerateModal(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#6C3BFF] text-white text-xs font-semibold rounded-xl hover:bg-[#5a2fe0] transition-colors shadow-sm"
          >
            <FileText size={13} /> Generate from Concept
          </button>
        </div>
      </div>

      {/* Main GDD editor */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-5">
          {/* Section header */}
          <div className="flex items-center justify-between bg-white border border-[#DED9EA] px-5 py-4 rounded-[14px] shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-[#17152B]">{currentSection.label}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-[#6C6880]">
                <span className={`font-semibold ${calculateSectionComplete(currentSection) === 100 ? "text-[#19A974]" : "text-[#FFC928]"}`}>
                  {calculateSectionComplete(currentSection)}% complete
                </span>
                {currentSection.required && <span className="text-[#FF3B4F] font-semibold">Required Section</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportGDD("md")}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#F4F1FA] border border-[#DED9EA] text-xs font-semibold text-[#6C3BFF] rounded-xl hover:bg-[#ede8fb]"
              >
                <Download size={13} /> Export .MD
              </button>

              <button
                onClick={async () => {
                  await saveNow();
                  onToast("success", "Blueprint saved", `${currentSection.label} synced to project memory`);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#6C3BFF] text-white text-xs font-semibold rounded-xl hover:bg-[#5a2fe0] transition-colors"
              >
                {saving ? <Cloud size={13} className="animate-pulse" /> : <Save size={13} />}
                Save Section
              </button>
            </div>
          </div>

          {/* Fields list */}
          <div className="bg-white rounded-[14px] border border-[#DED9EA] divide-y divide-[#DED9EA] shadow-sm">
            {currentSection.fields.map((field) => (
              <div key={field.label} className="px-5 py-4 group relative">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider block">
                    {field.label}
                  </label>
                  <button
                    onClick={() => handleDeleteField(field.label)}
                    className="opacity-0 group-hover:opacity-100 text-[#6C6880] hover:text-[#FF3B4F] text-xs flex items-center gap-1 transition-all"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
                <textarea
                  value={field.value}
                  onChange={(e) => handleFieldChange(field.label, e.target.value)}
                  rows={field.value.length > 80 ? 3 : 1}
                  className="w-full text-sm text-[#17152B] bg-[#F4F1FA] border border-transparent rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-[#6C3BFF] focus:bg-white transition-all leading-relaxed"
                />
              </div>
            ))}

            <div className="p-4 bg-[#F4F1FA]/50 text-center">
              <button
                onClick={() => setShowAddFieldModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#6C3BFF] bg-white border border-[#DED9EA] rounded-xl hover:bg-[#F4F1FA]"
              >
                <Plus size={13} /> Add Custom Field to {currentSection.label}
              </button>
            </div>
          </div>

          {/* AI Suggestion block */}
          {currentSection.aiSuggestion && (
            <div className="bg-[#F4F1FA] border border-[#DED9EA] rounded-[14px] p-4 flex gap-3 shadow-sm">
              <Lightbulb size={16} className="text-[#6C3BFF] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-[#6C3BFF] mb-1">AI Recommendation</div>
                <p className="text-sm text-[#17152B] leading-relaxed">{currentSection.aiSuggestion}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Field Modal */}
      {showAddFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-[#DED9EA] p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#17152B]">Add Field to {currentSection.label}</h3>
              <button onClick={() => setShowAddFieldModal(false)} className="text-[#6C6880] hover:text-[#17152B]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">Field Label / Name</label>
                <input
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="e.g. Target Audience Demographics"
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">Initial Value / Content</label>
                <textarea
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  rows={3}
                  placeholder="Enter initial field content or specifications..."
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddFieldModal(false)} className="flex-1 py-2 text-xs font-medium border border-[#DED9EA] rounded-lg text-[#6C6880] hover:bg-[#F4F1FA]">
                Cancel
              </button>
              <button onClick={handleAddField} className="flex-1 py-2 text-xs font-medium bg-[#6C3BFF] text-white rounded-lg hover:bg-[#5a2fe0]">
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-[#DED9EA] p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#17152B]">Add Custom Section</h3>
              <button onClick={() => setShowAddSectionModal(false)} className="text-[#6C6880] hover:text-[#17152B]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">Section Title</label>
                <input
                  value={newSectionLabel}
                  onChange={(e) => setNewSectionLabel(e.target.value)}
                  placeholder="e.g. Social & Guild Systems"
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reqCheck"
                  checked={newSectionRequired}
                  onChange={(e) => setNewSectionRequired(e.target.checked)}
                  className="accent-[#6C3BFF]"
                />
                <label htmlFor="reqCheck" className="text-xs text-[#17152B]">Mark section as Required for 100% GDD completion</label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddSectionModal(false)} className="flex-1 py-2 text-xs font-medium border border-[#DED9EA] rounded-lg text-[#6C6880] hover:bg-[#F4F1FA]">
                Cancel
              </button>
              <button onClick={handleAddSection} className="flex-1 py-2 text-xs font-medium bg-[#6C3BFF] text-white rounded-lg hover:bg-[#5a2fe0]">
                Create Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Concept Generator Modal */}
      {generateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-[#DED9EA] shadow-2xl w-[560px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-[#17152B]">Generate Blueprint from Concept</h3>
              <button onClick={() => setGenerateModal(false)} className="text-[#6C6880] hover:text-[#17152B]">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-[#6C6880]">Describe your game concept and the platform will auto-generate structured section entries.</p>
            <textarea
              value={gameIdea}
              onChange={(e) => setGameIdea(e.target.value)}
              rows={5}
              placeholder="Example: A haunted hotel management game where players restore a crumbling hotel by serving ghostly guests..."
              className="w-full text-xs text-[#17152B] bg-[#F4F1FA] border border-[#DED9EA] rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-[#6C3BFF]"
            />
            <div className="flex gap-3">
              <button onClick={() => setGenerateModal(false)} className="flex-1 py-2 border border-[#DED9EA] rounded-xl text-xs font-medium text-[#6C6880] hover:bg-[#F4F1FA]">
                Cancel
              </button>
              <button
                onClick={() => {
                  setGenerateModal(false);
                  onToast("success", "Blueprint generated", "Pillars and gameplay loops populated from concept");
                }}
                className="flex-1 py-2 bg-[#6C3BFF] text-white rounded-xl text-xs font-semibold hover:bg-[#5a2fe0]"
              >
                Generate Entries
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
