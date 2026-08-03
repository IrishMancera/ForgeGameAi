import { useState } from "react";
import {
  Search, Bell, Share2, Download, ChevronDown,
  Smartphone, Gamepad2, CheckCircle2, Undo2, Redo2, Save,
  Sparkles, LogOut
} from "lucide-react";
import type { BackendSnapshot } from "../services/backend";
import type { UserProfile } from "../services/auth";
import { downloadWorkbook } from "../services/export";

interface HeaderProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  unsavedChanges: boolean;
  snapshot?: BackendSnapshot | null;
  user?: UserProfile | null;
  onSignOut?: () => void;
}

export default function Header({ onToast, unsavedChanges, snapshot, user, onSignOut }: HeaderProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const notifications = [
    { id: 1, text: "Audit complete: 2 critical findings", time: "12m ago", type: "critical" },
    { id: 2, text: "Simulation finished: Cohort 500 players", time: "14m ago", type: "info" },
    { id: 3, text: "Riley M. approved System Registry changes", time: "1h ago", type: "success" },
    { id: 4, text: "Workbook Sheet 20 has probability errors", time: "2h ago", type: "warning" },
  ];

  return (
    <header className="z-10 flex h-14 shrink-0 items-center gap-3 border-b border-white/70 bg-white/70 px-4 backdrop-blur-xl">
      <div className="mr-2 flex items-center gap-2 rounded-2xl border border-[#6C3BFF]/15 bg-gradient-to-r from-[#6C3BFF]/10 via-white to-[#19C6D1]/10 px-3 py-2 shadow-[0_10px_24px_rgba(108,59,255,0.08)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C3BFF] via-[#8B5CFF] to-[#19C6D1] shadow-[0_8px_20px_rgba(108,59,255,0.25)]">
          <Sparkles size={14} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-[#17152B]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            {snapshot?.projectName ?? "Haunted Hotel"}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#6C6880]">
            {snapshot?.gameGenre ?? "Hybrid-Casual Tycoon"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1 rounded-full border border-[#DED9EA] bg-white/80 px-2.5 py-1 text-xs text-[#6C6880] transition-all hover:border-[#6C3BFF] hover:text-[#17152B]">
          v0.9.3 <ChevronDown size={11} />
        </button>
        <span className="flex items-center gap-1 rounded-full border border-[#DED9EA] bg-[#F4F1FA] px-2 py-0.5 text-[10px] font-medium text-[#6C3BFF]">
          <Smartphone size={10} /> Mobile
        </span>
        <span className="flex items-center gap-1 rounded-full border border-[#CAF4F6] bg-[#F0FDFE] px-2 py-0.5 text-[10px] font-medium text-[#19C6D1]">
          <Gamepad2 size={10} /> {snapshot?.gameGenre ?? "Hybrid-Casual Tycoon"}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-[#EDFAF4] px-2 py-0.5 text-[10px] font-medium text-[#19A974]">
          <CheckCircle2 size={10} /> {snapshot?.systemStatus.uptime ?? "99.98% uptime"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {unsavedChanges && (
          <span className="mr-1 rounded-full border border-[#FFE89A] bg-[#FFF8E6] px-2 py-0.5 text-[10px] font-medium text-[#FFC928]">
            Unsaved changes
          </span>
        )}
        <button onClick={() => onToast("info", "Undo", "Last action undone")} className="rounded-md p-1.5 text-[#6C6880] transition-colors hover:bg-[#F4F1FA] hover:text-[#17152B]" title="Undo (Ctrl+Z)">
          <Redo2 size={14} />
        </button>
        <button onClick={() => onToast("info", "Redo", "Action re-applied")} className="rounded-md p-1.5 text-[#6C6880] transition-colors hover:bg-[#F4F1FA] hover:text-[#17152B]" title="Redo (Ctrl+Shift+Z)">
          <Undo2 size={14} />
        </button>
        <button onClick={() => onToast("success", "Saved", "All changes saved successfully")} className="rounded-md p-1.5 text-[#6C6880] transition-colors hover:bg-[#F4F1FA] hover:text-[#17152B]" title="Save">
          <Save size={14} />
        </button>
      </div>

      <button className="flex w-44 items-center gap-2 rounded-xl border border-[#DED9EA] bg-[#F4F1FA]/70 px-3 py-1.5 text-xs text-[#6C6880] transition-all hover:border-[#6C3BFF] hover:bg-white">
        <Search size={13} />
        <span>Search…</span>
        <span className="ml-auto rounded bg-[#DED9EA] px-1.5 py-0.5 font-mono text-[10px]">⌘K</span>
      </button>

      <div className="relative">
        <button
          onClick={() => { setNotifOpen(!notifOpen); setExportOpen(false); }}
          className="relative rounded-md p-1.5 text-[#6C6880] transition-colors hover:bg-[#F4F1FA] hover:text-[#17152B]"
        >
          <Bell size={16} />
          <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-[#FF3B4F]" />
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-1 w-80 overflow-hidden rounded-2xl border border-[#DED9EA] bg-white shadow-2xl z-50">
            <div className="flex items-center justify-between border-b border-[#DED9EA] px-4 py-3">
              <span className="text-sm font-semibold text-[#17152B]">Notifications</span>
              <span className="cursor-pointer text-xs font-medium text-[#6C3BFF]">Mark all read</span>
            </div>
            {notifications.map((n) => (
              <div key={n.id} className="cursor-pointer border-b border-[#DED9EA] px-4 py-3 last:border-0 hover:bg-[#F4F1FA]">
                <div className="flex items-start gap-2">
                  <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.type === "critical" ? "bg-[#FF3B4F]" : n.type === "success" ? "bg-[#19A974]" : n.type === "warning" ? "bg-[#FFC928]" : "bg-[#19C6D1]"}`} />
                  <div>
                    <p className="text-xs text-[#17152B]">{n.text}</p>
                    <p className="mt-0.5 text-[10px] text-[#6C6880]">{n.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="rounded-md p-1.5 text-[#6C6880] transition-colors hover:bg-[#F4F1FA] hover:text-[#17152B]" onClick={() => onToast("info", "Share link copied", "Anyone with the link can view")}>
        <Share2 size={16} />
      </button>

      <div className="relative">
        <button
          onClick={() => { setExportOpen(!exportOpen); setNotifOpen(false); }}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6C3BFF] to-[#8B5CFF] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(108,59,255,0.24)] transition-all hover:scale-[1.01]"
        >
          <Download size={13} />
          Export
          <ChevronDown size={11} />
        </button>
        {exportOpen && (
          <div className="absolute right-0 top-full mt-1 w-60 overflow-hidden rounded-2xl border border-[#DED9EA] bg-white shadow-2xl z-50">
            <button
              onClick={async () => {
                setExportOpen(false);
                if (!snapshot?.projectId) {
                  onToast('warning', 'No project selected', 'Create or open a project before exporting.');
                  return;
                }

                try {
                  onToast('info', 'Exporting workbook', 'Your XLSX workbook is being generated.');
                  const result = await downloadWorkbook(snapshot.projectId, [
                    { key: 'core', label: 'Core Systems', rows: 8 },
                    { key: 'economy', label: 'Economy', rows: 14 },
                    { key: 'progression', label: 'Progression', rows: 10 },
                    { key: 'psychology', label: 'Psychology', rows: 6 },
                    { key: 'simulation', label: 'Simulation', rows: 6 },
                  ]);

                  const blobUrl = URL.createObjectURL(result.blob);
                  const anchor = document.createElement('a');
                  anchor.href = blobUrl;
                  anchor.download = result.fileName;
                  document.body.appendChild(anchor);
                  anchor.click();
                  anchor.remove();
                  URL.revokeObjectURL(blobUrl);
                  onToast('success', 'Workbook ready', `${result.fileName} downloaded.`);
                } catch (error) {
                  onToast('error', 'Export failed', error instanceof Error ? error.message : 'Unable to generate workbook');
                }
              }}
              className="w-full px-4 py-2.5 text-left text-xs text-[#17152B] transition-colors hover:bg-[#F4F1FA]"
            >
              Generate XLSX Workbook
            </button>
            {['Export as JSON Pack', 'Export CSV Bundle', 'Google Sheets Ready'].map((opt) => (
              <button
                key={opt}
                onClick={() => { setExportOpen(false); onToast('info', 'Export option selected', `${opt} is available soon.`); }}
                className="w-full px-4 py-2.5 text-left text-xs text-[#17152B] transition-colors hover:bg-[#F4F1FA]"
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {user ? (
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right text-xs leading-tight">
            <span className="font-semibold text-[#17152B]">{user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user.email}</span>
            <span className="text-[#6C6880]">{user.role === 'admin' ? 'Admin' : 'Creator'}</span>
          </div>
          <button
            onClick={() => {
              onSignOut?.();
              onToast('info', 'Signed out', 'You have been signed out successfully');
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DED9EA] bg-white px-3 py-2 text-[11px] font-semibold text-[#6C3BFF] transition hover:bg-[#F4F1FA]"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      ) : (
        <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#6C3BFF] to-[#19C6D1] text-[10px] font-black text-white shadow-[0_8px_20px_rgba(108,59,255,0.24)] transition-all hover:scale-105">
          JK
        </div>
      )}

      {(exportOpen || notifOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setExportOpen(false); setNotifOpen(false); }} />
      )}
    </header>
  );
}
