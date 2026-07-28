import { useState } from "react";
import { BookOpen, Upload, CheckCircle, AlertCircle, Clock, Search, FileText, File, ImageIcon, Table } from "lucide-react";

interface KnowledgeBaseProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
}

const SOURCES = [
  { id: 1, name: "Haunted Hotel GDD v3.2.pdf", type: "GDD", size: "4.2 MB", status: "Approved", facts: 142, assumptions: 28, date: "2026-07-15" },
  { id: 2, name: "Economy Model Draft.xlsx", type: "Excel", size: "1.1 MB", status: "Approved", facts: 89, assumptions: 14, date: "2026-07-18" },
  { id: 3, name: "Competitor Analysis Notes.docx", type: "Notes", size: "0.3 MB", status: "Needs Review", facts: 34, assumptions: 22, date: "2026-07-19" },
  { id: 4, name: "UI Mockups Q2.png", type: "Image", size: "8.7 MB", status: "Approved", facts: 12, assumptions: 3, date: "2026-07-10" },
  { id: 5, name: "Analytics Schema v2.json", type: "Schema", size: "0.1 MB", status: "Approved", facts: 48, assumptions: 0, date: "2026-07-20" },
  { id: 6, name: "Idle Game Market Research.pdf", type: "PDF", size: "2.8 MB", status: "Approved", facts: 67, assumptions: 15, date: "2026-07-12" },
];

const STATUS_STYLE: Record<string, string> = {
  Approved: "bg-[#EDFAF4] text-[#19A974] border-[#C8F0DC]",
  "Needs Review": "bg-[#FFF8E6] text-[#FFC928] border-[#FFE89A]",
  Uploading: "bg-[#F4F1FA] text-[#6C6880] border-[#DED9EA]",
  Failed: "bg-[#FFF0F2] text-[#FF3B4F] border-[#FFB3BB]",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  GDD: <FileText size={16} className="text-[#6C3BFF]" />,
  Excel: <Table size={16} className="text-[#19A974]" />,
  Notes: <FileText size={16} className="text-[#19C6D1]" />,
  Image: <ImageIcon size={16} className="text-[#FFC928]" />,
  Schema: <File size={16} className="text-[#FF3B4F]" />,
  PDF: <FileText size={16} className="text-[#6C6880]" />,
};

export default function KnowledgeBase({ onToast }: KnowledgeBaseProps) {
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [sources, setSources] = useState(SOURCES);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    onToast("info", "Processing file…", "Extracting facts, assumptions, and formulas");
  };

  const filtered = sources.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFF9F2] p-5 space-y-5">
      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-[14px] p-8 text-center transition-colors cursor-pointer ${dragging ? "border-[#6C3BFF] bg-[#F4F1FA]" : "border-[#DED9EA] bg-white hover:border-[#6C3BFF] hover:bg-[#F4F1FA]"}`}
      >
        <Upload size={28} className="mx-auto text-[#6C3BFF] mb-3" />
        <p className="text-sm font-semibold text-[#17152B] mb-1">Drop files here or click to upload</p>
        <p className="text-xs text-[#6C6880]">Supported: GDD (PDF/DOCX), Excel/CSV, Images, JSON schemas, Mechanics notes</p>
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {["Game Design Documents", "Economy Sheets", "PDFs", "Images", "Analytics Schemas", "Team Decisions"].map((t) => (
            <span key={t} className="text-[10px] bg-[#F4F1FA] text-[#6C6880] border border-[#DED9EA] px-2 py-1 rounded-full">{t}</span>
          ))}
        </div>
      </div>

      {/* Search + table */}
      <div className="bg-white rounded-[14px] border border-[#DED9EA] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#DED9EA]">
          <div className="relative flex-1 max-w-80">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C6880]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search knowledge sources…"
              className="w-full pl-8 pr-3 py-2 text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg focus:outline-none focus:border-[#6C3BFF] text-[#17152B]" />
          </div>
          <div className="text-xs text-[#6C6880]">{filtered.length} sources</div>
        </div>

        <table className="w-full text-xs">
          <thead className="bg-[#F4F1FA]">
            <tr>
              {["Source", "Type", "Size", "Facts", "Assumptions", "Status", "Uploaded", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DED9EA]">
            {filtered.map((s) => (
              <tr key={s.id} className="table-row-hover">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {TYPE_ICON[s.type] ?? <File size={16} className="text-[#6C6880]" />}
                    <span className="font-medium text-[#17152B] max-w-[200px] truncate">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#6C6880]">{s.type}</td>
                <td className="px-4 py-3 font-mono text-[#6C6880]">{s.size}</td>
                <td className="px-4 py-3 font-mono font-semibold text-[#19C6D1]">{s.facts}</td>
                <td className="px-4 py-3 font-mono text-[#FFC928]">{s.assumptions}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[s.status] ?? STATUS_STYLE.Uploading}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[10px] text-[#6C6880]">{s.date}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => onToast("info", "Reviewing", `${s.name} — extracted facts loaded`)}
                      className="text-[10px] text-[#6C3BFF] font-semibold hover:text-[#5a2fe0]">Review</button>
                    {s.status === "Needs Review" && (
                      <button onClick={() => { setSources((prev) => prev.map((src) => src.id === s.id ? { ...src, status: "Approved" } : src)); onToast("success", "Source approved", s.name); }}
                        className="text-[10px] text-[#19A974] font-semibold hover:text-[#148058]">Approve</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
