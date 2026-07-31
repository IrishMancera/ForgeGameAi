import { useState, useRef } from "react";
import {
  BookOpen, Search, Plus, Save, Cloud, CheckCircle2, FileText, Upload, Download, Trash2, Edit3, X, Tag, Folder
} from "lucide-react";
import { useModuleState } from "../services/useModuleState";

interface KnowledgeBaseProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  projectId?: string;
}

interface KBArticle {
  id: string;
  title: string;
  category: string;
  tags: string[];
  lastUpdated: string;
  author: string;
  content: string;
}

const DEFAULT_ARTICLES: KBArticle[] = [
  {
    id: "KB-001",
    title: "Haunted Hotel Economy Design Manifesto",
    category: "Economy",
    tags: ["Gold", "Diamonds", "Monetization"],
    lastUpdated: "Yesterday",
    author: "Elena R.",
    content: "The economy balances 3 main sinks against 2 primary faucets. Hard currency converts at 1:100 ratio...",
  },
  {
    id: "KB-002",
    title: "Ghost Hunter Staff Level & Skill Curves",
    category: "Progression",
    tags: ["XP", "Staff", "Upgrades"],
    lastUpdated: "3 days ago",
    author: "Marcus T.",
    content: "Ghost staff members gain XP from active room assignments. Level cap is set to 60 with 5 star evolutions...",
  },
  {
    id: "KB-003",
    title: "EU Gacha Odds & Pity Compliance Specification",
    category: "Compliance",
    tags: ["Legal", "Gacha", "EU"],
    lastUpdated: "1 week ago",
    author: "Jordan K.",
    content: "Must display drop rates on all summon banners. Pity counter is guaranteed at 80 summons...",
  },
];

export default function KnowledgeBase({ onToast, projectId }: KnowledgeBaseProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Persistent state
  const [kbState, setKbState, saveNow, saving] = useModuleState(
    'knowledgeBase',
    { articles: DEFAULT_ARTICLES },
    projectId
  );

  const articles = kbState.articles;

  // Selected article detail
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(articles[0] || DEFAULT_ARTICLES[0]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newArticle, setNewArticle] = useState<Partial<KBArticle>>({
    title: "", category: "Economy", tags: [], author: "Studio Designer", content: ""
  });
  const [tagInput, setTagInput] = useState("");

  const filteredArticles = articles.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === "All" || a.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleAddArticle = () => {
    if (!newArticle.title || !newArticle.content) {
      onToast("error", "Missing fields", "Provide title and content");
      return;
    }
    const created: KBArticle = {
      id: `KB-0${articles.length + 1}`,
      title: newArticle.title,
      category: newArticle.category || "General",
      tags: tagInput ? tagInput.split(",").map((t) => t.trim()) : ["GDD"],
      lastUpdated: "Just now",
      author: newArticle.author || "Studio Lead",
      content: newArticle.content,
    };
    setKbState((prev) => ({ ...prev, articles: [created, ...prev.articles] }));
    setSelectedArticle(created);
    setShowAddModal(false);
    setNewArticle({ title: "", category: "Economy", tags: [], author: "Studio Designer", content: "" });
    setTagInput("");
    onToast("success", "Article created", `Added "${created.title}" to Knowledge Base`);
  };

  const handleDeleteArticle = (id: string) => {
    setKbState((prev) => ({ ...prev, articles: prev.articles.filter((a) => a.id !== id) }));
    if (selectedArticle?.id === id) setSelectedArticle(null);
    onToast("info", "Article deleted", "Removed document from Knowledge Base");
  };

  // Export .md
  const handleExportMD = (article: KBArticle) => {
    const blob = new Blob([`# ${article.title}\n\nCategory: ${article.category}\nAuthor: ${article.author}\n\n${article.content}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${article.title.toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("success", "Exported MD", "Downloaded article as Markdown");
  };

  // Import local text/md file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = String(evt.target?.result || "");
      const created: KBArticle = {
        id: `KB-0${articles.length + 1}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        category: "Imported Docs",
        tags: ["Imported"],
        lastUpdated: "Just now",
        author: "File Import",
        content: text,
      };
      setKbState((prev) => ({ ...prev, articles: [created, ...prev.articles] }));
      setSelectedArticle(created);
      onToast("success", "File Imported", `Loaded "${file.name}" into Knowledge Base`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 overflow-hidden flex bg-[#FFF9F2]">
      {/* Sidebar List */}
      <div className="w-80 bg-white border-r border-[#DED9EA] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#DED9EA] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#17152B]">Knowledge Base</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 bg-[#6C3BFF] text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-[#5a2fe0]"
            >
              <Plus size={13} /> New Doc
            </button>
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C6880]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documentation…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg outline-none focus:border-[#6C3BFF]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#DED9EA]">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className={`p-4 cursor-pointer hover:bg-[#F4F1FA]/60 transition-colors ${
                selectedArticle?.id === art.id ? "bg-[#F4F1FA]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#6C3BFF] font-semibold">{art.id}</span>
                <span className="text-[10px] text-[#6C6880]">{art.lastUpdated}</span>
              </div>
              <h3 className="font-bold text-xs text-[#17152B] mt-1 line-clamp-1">{art.title}</h3>
              <p className="text-[11px] text-[#6C6880] line-clamp-2 mt-1">{art.content}</p>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-[#DED9EA]">
          <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".md,.txt,.json" className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 py-2 border border-[#DED9EA] bg-[#F4F1FA] text-[#6C6880] text-xs font-semibold rounded-xl hover:bg-[#ede8fb]"
          >
            <Upload size={13} /> Import .MD / .TXT Document
          </button>
        </div>
      </div>

      {/* Main Article Reader & Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedArticle ? (
          <div className="max-w-3xl bg-white border border-[#DED9EA] p-6 rounded-[14px] shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#DED9EA] pb-4">
              <div>
                <span className="font-mono text-xs text-[#6C3BFF] font-bold">{selectedArticle.id}</span>
                <h1 className="text-xl font-bold text-[#17152B] mt-1">{selectedArticle.title}</h1>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#6C6880]">
                  <span>Author: {selectedArticle.author}</span>
                  <span>· Updated: {selectedArticle.lastUpdated}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportMD(selectedArticle)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#6C3BFF] bg-[#F4F1FA] border border-[#DED9EA] rounded-xl hover:bg-[#ede8fb]"
                >
                  <Download size={13} /> Export .MD
                </button>
                <button
                  onClick={() => handleDeleteArticle(selectedArticle.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FF3B4F] bg-[#FFF0F2] rounded-xl hover:bg-[#ffe5e8]"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>

            <textarea
              value={selectedArticle.content}
              onChange={(e) => {
                const updated = { ...selectedArticle, content: e.target.value };
                setSelectedArticle(updated);
                setKbState((prev) => ({
                  ...prev,
                  articles: prev.articles.map((a) => (a.id === updated.id ? updated : a)),
                }));
              }}
              rows={14}
              className="w-full text-xs text-[#17152B] bg-[#F4F1FA] border border-transparent rounded-xl p-4 resize-none focus:outline-none focus:bg-white focus:border-[#6C3BFF] font-mono leading-relaxed"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-[#6C6880]">
            Select an article from the sidebar or create a new document
          </div>
        )}
      </div>

      {/* Add Article Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">New Documentation Article</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#6C6880]">
                <X size={16} />
              </button>
            </div>
            <input
              placeholder="Article Title (e.g. Boss Fight Mechanics Spec)"
              value={newArticle.title}
              onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg"
            />
            <input
              placeholder="Category (e.g. Systems, Economy, Compliance)"
              value={newArticle.category}
              onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg"
            />
            <textarea
              placeholder="Article Markdown Content..."
              value={newArticle.content}
              onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
              rows={6}
              className="w-full p-2 text-xs border rounded-lg resize-none"
            />
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 text-xs border rounded-lg">Cancel</button>
              <button onClick={handleAddArticle} className="flex-1 py-2 text-xs bg-[#6C3BFF] text-white rounded-lg">Save Article</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
