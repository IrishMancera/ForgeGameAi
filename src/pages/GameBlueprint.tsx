import { useState } from "react";
import { ChevronRight, CheckCircle, AlertCircle, Clock, Plus, Lightbulb, MoreHorizontal } from "lucide-react";

interface GameBlueprintProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
}

const SECTIONS = [
  { id: "identity", label: "Game Identity", complete: 100, required: true },
  { id: "pillars", label: "Design Pillars", complete: 100, required: true },
  { id: "fantasy", label: "Player Fantasy", complete: 90, required: true },
  { id: "audience", label: "Target Audience", complete: 85, required: true },
  { id: "core-loop", label: "Core Gameplay Loop", complete: 95, required: true },
  { id: "meta-loop", label: "Meta Loop", complete: 80, required: true },
  { id: "session-loop", label: "Session Loop", complete: 75, required: true },
  { id: "long-term", label: "Long-Term Loop", complete: 60, required: true },
  { id: "winloss", label: "Win / Loss / Recovery", complete: 70, required: false },
  { id: "content", label: "Content Cadence", complete: 55, required: false },
  { id: "monetization", label: "Monetization Model", complete: 80, required: true },
  { id: "social", label: "Social & Live Operations", complete: 40, required: false },
  { id: "production", label: "Production Constraints", complete: 90, required: false },
  { id: "assumptions", label: "Assumptions", complete: 85, required: true },
  { id: "questions", label: "Open Questions", complete: 50, required: false },
];

const SECTION_DATA: Record<string, { fields: { label: string; value: string; type?: string }[]; aiSuggestion?: string }> = {
  identity: {
    fields: [
      { label: "Game Title", value: "Haunted Hotel" },
      { label: "Tagline", value: "Restore the mystery. Host the supernatural." },
      { label: "Genre", value: "Hybrid-Casual Idle Tycoon" },
      { label: "Platform", value: "Mobile (iOS + Android)" },
      { label: "Target Rating", value: "PEGI 7 / ESRB E10+" },
      { label: "Developer", value: "Studio Phantom Games" },
    ],
  },
  pillars: {
    fields: [
      { label: "Pillar 1", value: "Satisfying Idle Progression — Players feel meaningful advancement every session" },
      { label: "Pillar 2", value: "Supernatural Narrative — Each room and guest has a ghostly story to discover" },
      { label: "Pillar 3", value: "Collection & Mastery — Building the perfect haunted hotel is both social status and personal achievement" },
    ],
    aiSuggestion: "Consider adding a 4th pillar around Community — your social systems are currently underweighted relative to your competitive set.",
  },
  "core-loop": {
    fields: [
      { label: "Primary Action", value: "Collect coins from active rooms → Upgrade rooms → Unlock new rooms → Serve more guests" },
      { label: "Energy Gate", value: "Ghost Hunter actions gated by Energy — regenerates over time or via purchase" },
      { label: "Daily Anchor", value: "Daily Tasks provide a structured to-do list that drives 3–5 sessions per day" },
      { label: "Session End", value: "Player taps daily chest, collects offline earnings, and queues next upgrade" },
    ],
    aiSuggestion: "Your core loop is sound. D1 onboarding time is estimated at 8–12 minutes. Consider adding a 'quick win' at minute 3 to boost first-session completion rates.",
  },
  monetization: {
    fields: [
      { label: "Model", value: "Free-to-Play with IAP" },
      { label: "Hard Currency", value: "Diamonds — earned sparingly, primary IAP" },
      { label: "Primary Offers", value: "Starter Pack ($1.99), Room Bundle ($4.99), Diamond Packs ($0.99–$99.99)" },
      { label: "Gacha Element", value: "Ghost Staff Recruitment via Diamond spin" },
      { label: "Live Ops Monetization", value: "Event Battle Pass ($4.99/event), Limited Decorations" },
    ],
    aiSuggestion: "⚠ Gacha element requires odds disclosure in EU, South Korea, and Japan markets. Review before submission.",
  },
};

export default function GameBlueprint({ onToast }: GameBlueprintProps) {
  const [activeSection, setActiveSection] = useState("identity");
  const [generateModal, setGenerateModal] = useState(false);
  const [gameIdea, setGameIdea] = useState("");
  const [editedFields, setEditedFields] = useState<Record<string, Record<string, string>>>({});

  const current = SECTIONS.find((s) => s.id === activeSection)!;
  const data = SECTION_DATA[activeSection] ?? {
    fields: [
      { label: "Description", value: "This section is being developed. Use the AI panel to generate content from your game concept." },
    ],
  };

  const getFieldValue = (label: string) =>
    editedFields[activeSection]?.[label] ?? data.fields.find((f) => f.label === label)?.value ?? "";

  const setFieldValue = (label: string, value: string) => {
    setEditedFields((prev) => ({
      ...prev,
      [activeSection]: { ...(prev[activeSection] ?? {}), [label]: value },
    }));
  };

  const overallComplete = Math.round(SECTIONS.reduce((sum, s) => sum + s.complete, 0) / SECTIONS.length);

  return (
    <div className="flex-1 overflow-hidden flex bg-[#FFF9F2]">
      {/* Section index */}
      <div className="w-56 bg-white border-r border-[#DED9EA] flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-[#DED9EA]">
          <div className="text-xs font-semibold text-[#17152B] mb-1">Blueprint</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[#F4F1FA] rounded-full overflow-hidden">
              <div className="h-full bg-[#6C3BFF] rounded-full" style={{ width: `${overallComplete}%` }} />
            </div>
            <span className="text-[10px] font-mono text-[#6C3BFF]">{overallComplete}%</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-2 transition-colors ${activeSection === s.id ? "bg-[#F4F1FA] text-[#6C3BFF]" : "text-[#6C6880] hover:bg-[#F4F1FA] hover:text-[#17152B]"}`}
            >
              {s.complete === 100 ? (
                <CheckCircle size={13} className="text-[#19A974] shrink-0" />
              ) : s.complete >= 70 ? (
                <Clock size={13} className="text-[#FFC928] shrink-0" />
              ) : (
                <AlertCircle size={13} className="text-[#FF3B4F] shrink-0" />
              )}
              <span className="text-xs flex-1 truncate">{s.label}</span>
              {s.required && s.complete < 100 && (
                <span className="text-[9px] text-[#FF3B4F] font-bold">*</span>
              )}
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-[#DED9EA]">
          <button
            onClick={() => setGenerateModal(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#6C3BFF] text-white text-xs font-medium rounded-lg hover:bg-[#5a2fe0] transition-colors"
          >
            <Plus size={13} /> Generate from Idea
          </button>
        </div>
      </div>

      {/* Main editor */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-5">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#17152B]">{current.label}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-[#6C6880]">
                <span className={`font-semibold ${current.complete === 100 ? "text-[#19A974]" : current.complete >= 70 ? "text-[#FFC928]" : "text-[#FF3B4F]"}`}>
                  {current.complete}% complete
                </span>
                {current.required && <span className="text-[#FF3B4F]">Required</span>}
                <span>Last edited by Jordan K. · 2h ago</span>
              </div>
            </div>
            <button
              onClick={() => onToast("success", "Section saved", `${current.label} saved successfully`)}
              className="px-4 py-2 bg-[#6C3BFF] text-white text-sm font-medium rounded-lg hover:bg-[#5a2fe0] transition-colors"
            >
              Save Section
            </button>
          </div>

          {/* Fields */}
          <div className="bg-white rounded-[14px] border border-[#DED9EA] divide-y divide-[#DED9EA]" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
            {data.fields.map((field) => (
              <div key={field.label} className="px-5 py-4">
                <label className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider block mb-2">
                  {field.label}
                </label>
                <textarea
                  value={getFieldValue(field.label)}
                  onChange={(e) => setFieldValue(field.label, e.target.value)}
                  rows={field.value.length > 80 ? 3 : 1}
                  className="w-full text-sm text-[#17152B] bg-[#F4F1FA] border border-transparent rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#6C3BFF] focus:bg-white transition-all leading-relaxed"
                />
              </div>
            ))}
          </div>

          {/* AI Suggestion */}
          {data.aiSuggestion && (
            <div className="bg-[#F4F1FA] border border-[#DED9EA] rounded-[14px] p-4 flex gap-3">
              <Lightbulb size={16} className="text-[#6C3BFF] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-[#6C3BFF] mb-1">AI Suggestion</div>
                <p className="text-sm text-[#17152B] leading-relaxed">{data.aiSuggestion}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      {generateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl border border-[#DED9EA] shadow-2xl w-[560px] p-6">
            <h3 className="font-bold text-lg text-[#17152B] mb-1">Generate Blueprint from Game Idea</h3>
            <p className="text-sm text-[#6C6880] mb-4">Describe your game concept and the AI will extract systems, economies, and design pillars.</p>
            <textarea
              value={gameIdea}
              onChange={(e) => setGameIdea(e.target.value)}
              rows={6}
              placeholder="Example: A haunted hotel management game where players restore a crumbling Victorian hotel by serving supernatural guests. Players hire ghost staff, upgrade rooms, and discover the hotel's dark history through story content…"
              className="w-full text-sm text-[#17152B] bg-[#F4F1FA] border border-[#DED9EA] rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-[#6C3BFF] transition-all"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setGenerateModal(false)} className="flex-1 py-2.5 border border-[#DED9EA] rounded-xl text-sm text-[#6C6880] hover:bg-[#F4F1FA]">
                Cancel
              </button>
              <button
                onClick={() => {
                  setGenerateModal(false);
                  onToast("success", "Blueprint generating…", "AI is extracting systems, loops, and economy from your description");
                }}
                className="flex-1 py-2.5 bg-[#6C3BFF] text-white rounded-xl text-sm font-medium hover:bg-[#5a2fe0]"
              >
                Generate Blueprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
