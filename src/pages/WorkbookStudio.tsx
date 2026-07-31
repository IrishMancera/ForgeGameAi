import { useState, useRef } from "react";
import {
  Table as TableIcon, Plus, Save, Cloud, CheckCircle2, Download, Upload, Trash2, Edit3, X, FileSpreadsheet
} from "lucide-react";
import * as XLSX from "xlsx";
import { useModuleState } from "../services/useModuleState";

interface WorkbookStudioProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  projectId?: string;
}

interface SheetTab {
  id: string;
  name: string;
  columns: string[];
  rows: string[][];
}

const DEFAULT_SHEETS: SheetTab[] = [
  {
    id: "sheet-1",
    name: "Room Upgrade Economy",
    columns: ["Tier", "Room Name", "Base Upgrade Cost", "Gold Income/min", "Payback Time (min)", "Status"],
    rows: [
      ["Tier 1", "Haunted Lobby", "100", "12", "8.3", "Active"],
      ["Tier 2", "Ghostly Library", "250", "28", "8.9", "Active"],
      ["Tier 3", "Phantom Suite", "650", "65", "10.0", "Active"],
      ["Tier 4", "Supernatural Ballroom", "1,800", "150", "12.0", "Draft"],
      ["Tier 5", "Poltergeist Penthouse", "5,000", "380", "13.1", "Draft"],
    ],
  },
  {
    id: "sheet-2",
    name: "Gacha Staff Drop Table",
    columns: ["Staff ID", "Staff Name", "Rarity", "Drop Rate (%)", "Pity Count", "Energy Bonus"],
    rows: [
      ["STF-01", "Ghost Butler Edgar", "Common", "40.0%", "0", "+5% Gold"],
      ["STF-02", "Phantom Maid Clara", "Uncommon", "30.0%", "0", "+10% Gold"],
      ["STF-03", "Banshee Singer Victoria", "Rare", "15.0%", "5", "+15% Energy"],
      ["STF-04", "Specter Chef Gustave", "Epic", "4.0%", "15", "+25% Speed"],
      ["STF-05", "Lord Malakor", "Legendary", "1.0%", "50", "+50% All Sinks"],
    ],
  },
];

export default function WorkbookStudio({ onToast, projectId }: WorkbookStudioProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Persistent state
  const [workbookData, setWorkbookData, saveNow, saving] = useModuleState(
    'workbook',
    { sheets: DEFAULT_SHEETS },
    projectId
  );

  const sheets = workbookData.sheets;
  const [activeSheetId, setActiveSheetId] = useState<string>("sheet-1");

  const currentSheet = sheets.find((s) => s.id === activeSheetId) || sheets[0] || DEFAULT_SHEETS[0];

  // Cell editing handler
  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    setWorkbookData((prev) => ({
      ...prev,
      sheets: prev.sheets.map((sheet) => {
        if (sheet.id !== currentSheet.id) return sheet;
        const newRows = sheet.rows.map((row, rIdx) => {
          if (rIdx !== rowIndex) return row;
          const nextRow = [...row];
          nextRow[colIndex] = value;
          return nextRow;
        });
        return { ...sheet, rows: newRows };
      }),
    }));
  };

  // Row operations
  const handleAddRow = () => {
    setWorkbookData((prev) => ({
      ...prev,
      sheets: prev.sheets.map((sheet) => {
        if (sheet.id !== currentSheet.id) return sheet;
        const newRow = Array(sheet.columns.length).fill("");
        return { ...sheet, rows: [...sheet.rows, newRow] };
      }),
    }));
    onToast("success", "Row added", `Inserted row ${currentSheet.rows.length + 1}`);
  };

  const handleDeleteRow = (rowIndex: number) => {
    setWorkbookData((prev) => ({
      ...prev,
      sheets: prev.sheets.map((sheet) => {
        if (sheet.id !== currentSheet.id) return sheet;
        return { ...sheet, rows: sheet.rows.filter((_, idx) => idx !== rowIndex) };
      }),
    }));
    onToast("info", "Row removed", "Deleted row from table");
  };

  // Column operations
  const handleAddColumn = () => {
    const colName = prompt("Enter column header title:", "New Column");
    if (!colName) return;

    setWorkbookData((prev) => ({
      ...prev,
      sheets: prev.sheets.map((sheet) => {
        if (sheet.id !== currentSheet.id) return sheet;
        return {
          ...sheet,
          columns: [...sheet.columns, colName],
          rows: sheet.rows.map((r) => [...r, ""]),
        };
      }),
    }));
    onToast("success", "Column added", `Added column "${colName}"`);
  };

  // Tab operations
  const handleAddSheet = () => {
    const sheetName = prompt("Enter new sheet tab name:", "New Sheet");
    if (!sheetName) return;
    const newId = `sheet-${Date.now()}`;
    const newSheet: SheetTab = {
      id: newId,
      name: sheetName,
      columns: ["Column A", "Column B", "Column C"],
      rows: [["Data 1", "Data 2", "Data 3"]],
    };

    setWorkbookData((prev) => ({
      ...prev,
      sheets: [...prev.sheets, newSheet],
    }));
    setActiveSheetId(newId);
    onToast("success", "Sheet created", `Added tab "${sheetName}"`);
  };

  const handleDeleteSheet = (sheetId: string) => {
    if (sheets.length <= 1) {
      onToast("error", "Cannot delete", "Workbook must have at least one sheet tab");
      return;
    }
    setWorkbookData((prev) => ({
      ...prev,
      sheets: prev.sheets.filter((s) => s.id !== sheetId),
    }));
    setActiveSheetId(sheets.find((s) => s.id !== sheetId)?.id || "sheet-1");
    onToast("info", "Sheet removed", "Deleted sheet tab");
  };

  // Real XLSX Export using `xlsx` library
  const handleExportXLSX = () => {
    const wb = XLSX.utils.book_new();

    sheets.forEach((sheet) => {
      const data = [sheet.columns, ...sheet.rows];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 30));
    });

    XLSX.writeFile(wb, `gameforge-workbook-studio.xlsx`);
    onToast("success", "XLSX Exported", "Downloaded genuine Excel workbook .xlsx file");
  };

  // Real XLSX Import using `xlsx` library
  const handleImportXLSX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });

        const importedSheets: SheetTab[] = wb.SheetNames.map((name, idx) => {
          const ws = wb.Sheets[name];
          const rawData = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
          const columns = (rawData[0] as string[]) || ["Col A", "Col B", "Col C"];
          const rows = rawData.slice(1).map((r) => columns.map((_, i) => String(r[i] ?? "")));
          return {
            id: `imported-${idx}-${Date.now()}`,
            name,
            columns,
            rows,
          };
        });

        if (importedSheets.length > 0) {
          setWorkbookData({ sheets: importedSheets });
          setActiveSheetId(importedSheets[0].id);
          onToast("success", "XLSX Loaded", `Imported ${importedSheets.length} sheet tabs from ${file.name}`);
        }
      } catch (err) {
        onToast("error", "Import failed", "Could not parse Excel file");
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#FFF9F2]">
      {/* Header toolbar */}
      <div className="bg-white border-b border-[#DED9EA] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-[#6C3BFF]" />
          <div>
            <h1 className="text-sm font-bold text-[#17152B]">Workbook Studio (XLSX Spreadsheet Engine)</h1>
            <p className="text-[10px] text-[#6C6880]">Full multi-tab Excel spreadsheet editor with native .xlsx read & write</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportXLSX}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#6C6880] bg-white border border-[#DED9EA] rounded-xl hover:bg-[#F4F1FA]"
          >
            <Upload size={13} /> Import .XLSX
          </button>
          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#6C3BFF] bg-[#F4F1FA] border border-[#DED9EA] rounded-xl hover:bg-[#ede8fb]"
          >
            <Download size={13} /> Download .XLSX
          </button>

          <button
            onClick={async () => { await saveNow(); onToast("success", "Workbook saved", "Synced spreadsheet data"); }}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#6C3BFF] rounded-xl hover:bg-[#5a2fe0]"
          >
            {saving ? <Cloud size={13} className="animate-pulse" /> : <Save size={13} />} Save Workbook
          </button>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="bg-white border-b border-[#DED9EA] px-5 flex items-center gap-1 overflow-x-auto">
        {sheets.map((s) => (
          <div key={s.id} className="group relative flex items-center">
            <button
              onClick={() => setActiveSheetId(s.id)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                activeSheetId === s.id ? "border-[#6C3BFF] text-[#6C3BFF]" : "border-transparent text-[#6C6880] hover:text-[#17152B]"
              }`}
            >
              <TableIcon size={12} />
              {s.name}
            </button>
            {sheets.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteSheet(s.id); }}
                className="opacity-0 group-hover:opacity-100 text-[#6C6880] hover:text-[#FF3B4F] p-1 transition-all mr-1"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={handleAddSheet}
          className="flex items-center gap-1 px-3 py-1 text-xs text-[#6C3BFF] font-semibold hover:bg-[#F4F1FA] rounded-lg ml-2"
        >
          <Plus size={13} /> Add Sheet Tab
        </button>
      </div>

      {/* Grid editor */}
      <div className="flex-1 overflow-auto p-5">
        <div className="bg-white border border-[#DED9EA] rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 bg-[#F4F1FA] border-b border-[#DED9EA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#17152B]">{currentSheet.name}</span>
              <span className="text-[10px] text-[#6C6880]">{currentSheet.rows.length} rows × {currentSheet.columns.length} columns</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddColumn}
                className="px-3 py-1 text-xs font-semibold text-[#6C3BFF] bg-white border border-[#DED9EA] rounded-lg hover:bg-[#F4F1FA]"
              >
                + Insert Column
              </button>
              <button
                onClick={handleAddRow}
                className="px-3 py-1 text-xs font-semibold text-white bg-[#6C3BFF] rounded-lg hover:bg-[#5a2fe0]"
              >
                + Insert Row
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F4F1FA] text-[#6C6880] border-b border-[#DED9EA] uppercase tracking-wider">
                  <th className="p-2 w-10 text-center border-r border-[#DED9EA]">#</th>
                  {currentSheet.columns.map((col, cIdx) => (
                    <th key={cIdx} className="p-2 font-bold text-[#17152B] border-r border-[#DED9EA]">
                      {col}
                    </th>
                  ))}
                  <th className="p-2 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED9EA]">
                {currentSheet.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#F4F1FA]/40">
                    <td className="p-2 text-center text-[#6C6880] font-mono bg-[#F4F1FA]/60 border-r border-[#DED9EA]">
                      {rIdx + 1}
                    </td>
                    {currentSheet.columns.map((_, cIdx) => (
                      <td key={cIdx} className="p-1 border-r border-[#DED9EA]">
                        <input
                          value={row[cIdx] ?? ""}
                          onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-xs text-[#17152B] outline-none focus:bg-[#FFF9F2] focus:ring-1 focus:ring-[#6C3BFF] rounded transition-all"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleDeleteRow(rIdx)}
                        className="text-[#6C6880] hover:text-[#FF3B4F] transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
