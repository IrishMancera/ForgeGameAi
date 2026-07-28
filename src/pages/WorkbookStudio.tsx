import { useState } from "react";
import { Download, CheckCircle, AlertTriangle, XCircle, Eye, ChevronRight, Table2 } from "lucide-react";
import { WORKBOOK_SHEETS } from "../data/mockData";

interface WorkbookStudioProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
}

type GenerateState = "idle" | "validating" | "generating" | "done";

const STATUS_STYLE: Record<string, { icon: React.ReactNode; style: string }> = {
  Ready: { icon: <CheckCircle size={12} />, style: "text-[#19A974] bg-[#EDFAF4] border-[#C8F0DC]" },
  Warning: { icon: <AlertTriangle size={12} />, style: "text-[#FFC928] bg-[#FFF8E6] border-[#FFE89A]" },
  Error: { icon: <XCircle size={12} />, style: "text-[#FF3B4F] bg-[#FFF0F2] border-[#FFB3BB]" },
};

const PREVIEW_CELLS = [
  ["Level", "XP Required", "Cumulative XP", "Est. Sessions", "Est. Time", "Unlock", "Reward"],
  ["1", "100", "100", "2", "0.6h", "Reception Desk", "50 Coins"],
  ["2", "135", "235", "3", "0.8h", "Guest Room A", "1 Diamond"],
  ["5", "245", "890", "5", "1.4h", "Vending Machine", "Ghost Staff"],
  ["10", "551", "2,840", "10", "3.1h", "Swimming Pool", "Pool Skin"],
];

export default function WorkbookStudio({ onToast }: WorkbookStudioProps) {
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(
    new Set(WORKBOOK_SHEETS.filter((s) => s.status !== "Error").map((s) => s.num))
  );
  const [activeSheet, setActiveSheet] = useState(WORKBOOK_SHEETS[11]);
  const [generateState, setGenerateState] = useState<GenerateState>("idle");
  const [generateProgress, setGenerateProgress] = useState(0);
  const [successModal, setSuccessModal] = useState(false);
  const [exportHistory] = useState([
    { version: "v0.9.2", author: "Jordan K.", scenario: "Baseline", date: "2026-07-18", format: "XLSX", status: "Complete" },
    { version: "v0.9.1", author: "Riley M.", scenario: "Sensitivity A", date: "2026-07-14", format: "XLSX", status: "Complete" },
    { version: "v0.9.0", author: "Jordan K.", scenario: "Baseline", date: "2026-07-10", format: "CSV Bundle", status: "Complete" },
  ]);
  const [settings, setSettings] = useState({
    includeFormulas: true,
    includeSampleData: true,
    protectFormulas: false,
    includeCharts: true,
    freezeHeaders: true,
    addValidations: true,
    format: "XLSX",
    locale: "en-US",
  });

  const errorCount = WORKBOOK_SHEETS.filter((s) => s.status === "Error" && selectedSheets.has(s.num)).length;
  const warnCount = WORKBOOK_SHEETS.filter((s) => s.status === "Warning" && selectedSheets.has(s.num)).length;
  const readyPct = Math.round((WORKBOOK_SHEETS.filter((s) => selectedSheets.has(s.num) && s.status === "Ready").length / Math.max(selectedSheets.size, 1)) * 100);

  const handleGenerate = () => {
    if (errorCount > 0) {
      onToast("error", "Cannot generate workbook", `${errorCount} sheet(s) have blocking errors. Fix them first.`);
      return;
    }
    setGenerateState("validating");
    setGenerateProgress(0);
    setTimeout(() => { setGenerateState("generating"); setGenerateProgress(33); }, 800);
    setTimeout(() => setGenerateProgress(66), 1400);
    setTimeout(() => { setGenerateProgress(100); setGenerateState("done"); setSuccessModal(true); }, 2200);
  };

  const toggleSheet = (num: string) => {
    const next = new Set(selectedSheets);
    next.has(num) ? next.delete(num) : next.add(num);
    setSelectedSheets(next);
  };

  const toggleAll = () => {
    selectedSheets.size === WORKBOOK_SHEETS.length
      ? setSelectedSheets(new Set())
      : setSelectedSheets(new Set(WORKBOOK_SHEETS.map((s) => s.num)));
  };

  return (
    <div className="flex-1 overflow-hidden flex bg-[#FFF9F2]">
      {/* Left panel — settings */}
      <div className="w-64 shrink-0 bg-white border-r border-[#DED9EA] overflow-y-auto">
        <div className="px-4 py-3 border-b border-[#DED9EA]">
          <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider">Workbook Settings</div>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider block mb-1">Workbook Name</label>
            <input defaultValue="HauntedHotel_v0.9.3" className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 focus:outline-none focus:border-[#6C3BFF] text-[#17152B]" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider block mb-1">Export Format</label>
            <select value={settings.format} onChange={(e) => setSettings({ ...settings, format: e.target.value })}
              className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 focus:outline-none focus:border-[#6C3BFF] text-[#17152B]">
              {["XLSX", "CSV Bundle", "Google Sheets Ready", "JSON Data Pack"].map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider block mb-1">Locale</label>
            <select value={settings.locale} onChange={(e) => setSettings({ ...settings, locale: e.target.value })}
              className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B]">
              {["en-US", "en-GB", "de-DE", "ja-JP", "ko-KR"].map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div className="pt-1 space-y-2">
            {[
              { key: "includeFormulas", label: "Include Formulas" },
              { key: "includeSampleData", label: "Include Sample Data" },
              { key: "protectFormulas", label: "Protect Formula Cells" },
              { key: "includeCharts", label: "Include Charts" },
              { key: "freezeHeaders", label: "Freeze Headers" },
              { key: "addValidations", label: "Add Validation Lists" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-xs text-[#17152B]">{label}</span>
                <div
                  onClick={() => setSettings({ ...settings, [key]: !settings[key as keyof typeof settings] })}
                  className={`w-8 h-4 rounded-full transition-colors cursor-pointer relative ${settings[key as keyof typeof settings] ? "bg-[#6C3BFF]" : "bg-[#DED9EA]"}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${settings[key as keyof typeof settings] ? "left-4" : "left-0.5"}`} />
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            className={`w-full flex items-center justify-center gap-2 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors ${generateState !== "idle" && generateState !== "done" ? "bg-[#6C3BFF]/60 cursor-not-allowed" : "bg-[#6C3BFF] hover:bg-[#5a2fe0]"}`}
            disabled={generateState === "validating" || generateState === "generating"}
          >
            <Download size={14} />
            {generateState === "validating" ? "Validating…" : generateState === "generating" ? `Generating (${generateProgress}%)` : "Generate Workbook"}
          </button>

          {(generateState === "validating" || generateState === "generating") && (
            <div className="h-1.5 bg-[#F4F1FA] rounded-full overflow-hidden">
              <div className="h-full bg-[#6C3BFF] rounded-full transition-all duration-500" style={{ width: `${generateProgress}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* Center — sheet list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-[#DED9EA] px-4 py-2.5 flex items-center gap-3">
          <input type="checkbox"
            checked={selectedSheets.size === WORKBOOK_SHEETS.length}
            onChange={toggleAll}
            className="w-3.5 h-3.5 accent-[#6C3BFF] cursor-pointer"
          />
          <span className="text-xs text-[#6C6880]">{selectedSheets.size} of {WORKBOOK_SHEETS.length} sheets selected</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#F4F1FA] sticky top-0">
              <tr>
                <th className="px-4 py-2.5 w-8" />
                {["Sheet", "Description", "Rows", "Formulas", "Status", "Updated", ""].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DED9EA]">
              {WORKBOOK_SHEETS.map((sheet) => {
                const st = STATUS_STYLE[sheet.status] ?? STATUS_STYLE.Ready;
                const selected = selectedSheets.has(sheet.num);
                return (
                  <tr key={sheet.num}
                    className={`table-row-hover cursor-pointer ${activeSheet?.num === sheet.num ? "bg-[#F4F1FA]" : ""}`}
                    onClick={() => setActiveSheet(sheet)}>
                    <td className="px-4 py-2.5">
                      <input type="checkbox" checked={selected} onChange={() => toggleSheet(sheet.num)} onClick={(e) => e.stopPropagation()}
                        className="w-3.5 h-3.5 accent-[#6C3BFF] cursor-pointer" />
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-[#17152B] whitespace-nowrap">
                      {sheet.num}_{sheet.name}
                    </td>
                    <td className="px-3 py-2.5 text-[#6C6880] max-w-[180px] truncate">{sheet.desc}</td>
                    <td className="px-3 py-2.5 font-mono text-[#6C6880]">{sheet.rows}</td>
                    <td className="px-3 py-2.5 font-mono text-[#6C6880]">{sheet.formulas}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.style}`}>
                        {st.icon} {sheet.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[#6C6880] text-[10px]">{sheet.updated}</td>
                    <td className="px-3 py-2.5">
                      <button className="text-[#6C3BFF] hover:text-[#5a2fe0]" title="Preview sheet">
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right — validation panel + preview */}
      <div className="w-72 shrink-0 bg-white border-l border-[#DED9EA] overflow-y-auto">
        {/* Readiness */}
        <div className="px-4 py-4 border-b border-[#DED9EA]">
          <div className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider mb-2">Readiness</div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-2 bg-[#F4F1FA] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${readyPct >= 90 ? "bg-[#19A974]" : readyPct >= 70 ? "bg-[#FFC928]" : "bg-[#FF3B4F]"}`} style={{ width: `${readyPct}%` }} />
            </div>
            <span className="font-mono text-xs font-semibold">{readyPct}%</span>
          </div>
          {errorCount > 0 && <p className="text-[10px] text-[#FF3B4F] flex items-center gap-1"><XCircle size={10} /> {errorCount} blocking error(s)</p>}
          {warnCount > 0 && <p className="text-[10px] text-[#FFC928] flex items-center gap-1"><AlertTriangle size={10} /> {warnCount} warning(s)</p>}
        </div>

        {/* Validation items */}
        <div className="px-4 py-3 border-b border-[#DED9EA]">
          <div className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider mb-2">Validation</div>
          <div className="space-y-1.5">
            {[
              { label: "Probability pools valid", ok: false, note: "Sheet 20: total = 98% (not 100%)" },
              { label: "All formula references", ok: true, note: "183 formulas resolved" },
              { label: "Currency IDs consistent", ok: true, note: "5 currencies, 0 conflicts" },
              { label: "Unapproved assumptions", ok: false, note: "3 Draft assumptions in Sheet 02" },
              { label: "Missing units on values", ok: true },
              { label: "Analytics events defined", ok: false, note: "Ghost Hunter system missing events" },
            ].map((item) => (
              <div key={item.label} className={`flex items-start gap-2 text-[10px] ${item.ok ? "text-[#19A974]" : "text-[#FF3B4F]"}`}>
                {item.ok ? <CheckCircle size={11} className="shrink-0 mt-0.5" /> : <XCircle size={11} className="shrink-0 mt-0.5" />}
                <div>
                  <div className="font-medium">{item.label}</div>
                  {item.note && <div className="text-[#6C6880]">{item.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sheet preview */}
        {activeSheet && (
          <div className="px-4 py-3">
            <div className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider mb-2">
              Preview: {activeSheet.num}_{activeSheet.name}
            </div>
            <div className="text-[10px] text-[#6C6880] mb-2 font-mono">= Income(B2) * IncomeMultiplier^(B2-1)</div>
            <div className="overflow-x-auto border border-[#DED9EA] rounded-lg">
              <table className="text-[9px] font-mono">
                {PREVIEW_CELLS.map((row, ri) => (
                  <tr key={ri} className={ri === 0 ? "bg-[#F4F1FA] font-semibold" : ""}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2 py-1 border-b border-r border-[#DED9EA] whitespace-nowrap text-[#17152B]">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </table>
            </div>
          </div>
        )}

        {/* Export history */}
        <div className="px-4 py-3 border-t border-[#DED9EA]">
          <div className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider mb-2">Export History</div>
          <div className="space-y-2">
            {exportHistory.map((h) => (
              <div key={h.version} className="flex items-center gap-2">
                <CheckCircle size={11} className="text-[#19A974] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-[#17152B] font-mono">{h.version}</div>
                  <div className="text-[9px] text-[#6C6880]">{h.date} · {h.author} · {h.format}</div>
                </div>
                <button onClick={() => onToast("success", "Re-downloading", `${h.version} export`)} className="text-[#6C3BFF] hover:text-[#5a2fe0]">
                  <Download size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl border border-[#DED9EA] shadow-2xl w-[440px] p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#EDFAF4] flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-[#19A974]" />
            </div>
            <h3 className="font-bold text-xl text-[#17152B] mb-1">Workbook Generated!</h3>
            <p className="text-sm text-[#6C6880] mb-5">Your Excel workbook is ready to download.</p>
            <div className="bg-[#F4F1FA] rounded-xl p-4 text-left mb-5 space-y-2">
              {[
                { label: "Filename", value: "HauntedHotel_v0.9.3.xlsx" },
                { label: "File Size", value: "2.4 MB" },
                { label: "Sheets", value: `${selectedSheets.size} sheets` },
                { label: "Total Formulas", value: "847" },
                { label: "Total Rows", value: "2,847" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-[#6C6880]">{label}</span>
                  <span className="font-mono font-semibold text-[#17152B]">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSuccessModal(false)} className="flex-1 py-2.5 border border-[#DED9EA] rounded-xl text-sm text-[#6C6880] hover:bg-[#F4F1FA]">
                Close
              </button>
              <button onClick={() => { setSuccessModal(false); onToast("success", "Download started", "HauntedHotel_v0.9.3.xlsx"); }}
                className="flex-1 py-2.5 bg-[#6C3BFF] text-white rounded-xl text-sm font-semibold hover:bg-[#5a2fe0] flex items-center justify-center gap-2">
                <Download size={14} /> Download XLSX
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
