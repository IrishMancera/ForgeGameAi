import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search, Bell, Share2, Download, ChevronDown,
  Smartphone, Gamepad2, CheckCircle2, Undo2, Redo2, Save,
  Sparkles, LogOut, Plus, Check, History, Layers, X, Clock,
  FileSpreadsheet, FileJson, FileText, Table, Loader2, ArrowRight, Command, Layout, ShieldAlert, Cpu
} from "lucide-react";
import * as XLSX from "xlsx";
import type { BackendSnapshot } from "../services/backend";
import type { UserProfile } from "../services/auth";
import type { AppProject } from "../services/project";
import { SYSTEMS, RETENTION_DATA, ECONOMY_BALANCE, RISK_DATA, AUDIT_FINDINGS } from "../data/mockData";

interface HeaderProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  unsavedChanges: boolean;
  snapshot?: BackendSnapshot | null;
  user?: UserProfile | null;
  onSignOut?: () => void;
  projects?: AppProject[];
  activeProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onCreateProject?: (name: string, genre?: string, targetPlatform?: string) => Promise<void>;
  onNavigate?: (page: string) => void;
  onSave?: () => void;
}

interface VersionSnapshot {
  id: string;
  version: string;
  label: string;
  date: string;
  author: string;
  isCurrent?: boolean;
}

interface NotificationItem {
  id: number;
  text: string;
  time: string;
  type: "critical" | "info" | "success" | "warning";
  unread: boolean;
}

interface SearchResultItem {
  id: string;
  title: string;
  category: "Navigation" | "System" | "Document" | "Action";
  detail: string;
  action: () => void;
}

const DEFAULT_VERSIONS: VersionSnapshot[] = [
  { id: "v-3", version: "v0.9.3", label: "Active GDD & Balance Spec", date: "Just now", author: "Jordan K.", isCurrent: true },
  { id: "v-2", version: "v0.9.2", label: "Restored Tier 4 Economy Sinks", date: "2 days ago", author: "Sarah M." },
  { id: "v-1", version: "v0.9.1", label: "Initial System Architecture Draft", date: "5 days ago", author: "Alex R." },
  { id: "v-0", version: "v0.9.0", label: "Pre-alpha Baseline Concept", date: "1 week ago", author: "Jordan K." },
];

const GENRES = [
  "Hybrid-Casual Tycoon",
  "Action RPG",
  "Match-3 Puzzle",
  "4X Strategy",
  "MMORPG",
  "FPS Arena",
  "Idle Clicker",
  "Card Battler",
  "Simulation & Builder"
];

const PLATFORMS = ["Mobile", "PC", "Console", "Cross-Platform"];

export default function Header({
  onToast,
  unsavedChanges,
  snapshot,
  user,
  onSignOut,
  projects = [],
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onNavigate,
  onSave,
}: HeaderProps) {
  const headerRef = useRef<HTMLDivElement | null>(null);

  // Popover Toggles
  const [exportOpen, setExportOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [versionDropdownOpen, setVersionDropdownOpen] = useState(false);

  // Modals
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showCreateVersionModal, setShowCreateVersionModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Search Palette State
  const [searchQuery, setSearchQuery] = useState("");

  // Undo / Redo History Stack State
  const [historyStack, setHistoryStack] = useState<string[]>([
    "Initial workspace state loaded",
    "GDD Section update: Core Tycoon Loop",
    "Economy balance modified: Gold sinks",
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(2);

  // Save Loading State
  const [isSaving, setIsSaving] = useState(false);

  // Create Project Form State
  const [newProjName, setNewProjName] = useState("");
  const [newProjGenre, setNewProjGenre] = useState(GENRES[0]);
  const [newProjPlatform, setNewProjPlatform] = useState(PLATFORMS[0]);
  const [creatingProject, setCreatingProject] = useState(false);

  // Version Control State
  const [versions, setVersions] = useState<VersionSnapshot[]>(DEFAULT_VERSIONS);
  const [activeVersion, setActiveVersion] = useState<string>("v0.9.3");
  const [newVersionTag, setNewVersionTag] = useState("");
  const [newVersionSummary, setNewVersionSummary] = useState("");

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 1, text: "Audit complete: 2 critical findings", time: "12m ago", type: "critical", unread: true },
    { id: 2, text: "Simulation finished: Cohort 500 players", time: "14m ago", type: "info", unread: true },
    { id: 3, text: "Riley M. approved System Registry changes", time: "1h ago", type: "success", unread: true },
    { id: 4, text: "Workbook Sheet 20 has probability errors", time: "2h ago", type: "warning", unread: false },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyStack.length - 1;

  // ─── UNDO / REDO / SAVE HANDLERS ─────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      onToast("info", "Undo Action", `Reverted to: "${historyStack[nextIdx]}"`);
    } else {
      onToast("warning", "Nothing to Undo", "At beginning of edit history stack.");
    }
  }, [historyIndex, historyStack, onToast]);

  const handleRedo = useCallback(() => {
    if (historyIndex < historyStack.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      onToast("info", "Redo Action", `Reapplied: "${historyStack[nextIdx]}"`);
    } else {
      onToast("warning", "Nothing to Redo", "At latest change in edit history stack.");
    }
  }, [historyIndex, historyStack, onToast]);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    if (onSave) onSave();

    // Push new save snapshot into history
    const saveLabel = `Saved workspace spec (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    setHistoryStack((prev) => [...prev.slice(0, historyIndex + 1), saveLabel]);
    setHistoryIndex((prev) => prev + 1);

    setTimeout(() => {
      setIsSaving(false);
      onToast("success", "Project Saved", "All module configurations and system balance specs synced to project database.");
    }, 400);
  }, [onSave, historyIndex, onToast]);

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S, Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
        setProjectDropdownOpen(false);
        setVersionDropdownOpen(false);
        setExportOpen(false);
        setNotifOpen(false);
      } else if (isCmdOrCtrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      } else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleRedo();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if (e.key === "Escape") {
        setShowSearchModal(false);
        setExportOpen(false);
        setNotifOpen(false);
        setProjectDropdownOpen(false);
        setVersionDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleSave, handleUndo, handleRedo]);

  // Click outside to dismiss popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setExportOpen(false);
        setNotifOpen(false);
        setProjectDropdownOpen(false);
        setVersionDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    onToast("success", "Notifications Cleared", "All notifications marked as read");
  };

  const handleNotificationClick = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  };

  const activeProjectName = snapshot?.projectName ?? (projects.find((p) => p.id === activeProjectId)?.name || "Haunted Hotel");
  const activeGameGenre = snapshot?.gameGenre ?? (projects.find((p) => p.id === activeProjectId)?.genre || "Hybrid-Casual Tycoon");
  const activePlatform = projects.find((p) => p.id === activeProjectId)?.targetPlatform || "Mobile";

  // ─── SEARCH COMMAND PALETTE DATA ──────────────────────────────────────────
  const searchResults: SearchResultItem[] = [
    // Navigation
    { id: "nav-cmd", title: "Command Center", category: "Navigation", detail: "Executive dashboard, health telemetry & decision registry", action: () => onNavigate?.("command-center") },
    { id: "nav-gdd", title: "Game Blueprint (GDD)", category: "Navigation", detail: "Core GDD document, vision pillars & mechanic specs", action: () => onNavigate?.("game-blueprint") },
    { id: "nav-[#6C3BFF]", title: "Systems Architect", category: "Navigation", detail: "Game loop architecture, node graph & system dependencies", action: () => onNavigate?.("systems") },
    { id: "nav-eco", title: "Economy Lab", category: "Navigation", detail: "Currencies, gacha drop tables, sinks & faucets", action: () => onNavigate?.("economy-lab") },
    { id: "nav-[#19A974]", title: "Progression Lab", category: "Navigation", detail: "XP curves, level formulas & milestone unlocks", action: () => onNavigate?.("progression") },
    { id: "nav-psych", title: "Player Psychology", category: "Navigation", detail: "Bartle player archetypes & ethical monetization safety", action: () => onNavigate?.("player-psychology") },
    { id: "nav-sim", title: "Monte Carlo Simulation", category: "Navigation", detail: "Stochastic player cohort economy simulations", action: () => onNavigate?.("simulation") },
    { id: "nav-ana", title: "Live Analytics", category: "Navigation", detail: "Retention metrics, DAU/ARPU telemetry & event funnel", action: () => onNavigate?.("analytics") },
    { id: "nav-wb", title: "Workbook Studio", category: "Navigation", detail: "Multi-tab spreadsheet editor with .xlsx read/write", action: () => onNavigate?.("workbook-studio") },
    { id: "nav-[#19C6D1]", title: "Knowledge Base", category: "Navigation", detail: "GDD documents, technical guides & markdown articles", action: () => onNavigate?.("knowledge-base") },
    { id: "nav-aud", title: "Audit Center", category: "Navigation", detail: "System diagnostic scan, vulnerability flags & recommendations", action: () => onNavigate?.("audit-center") },
    { id: "nav-set", title: "Settings", category: "Navigation", detail: "Profile, workspace team members & API key manager", action: () => onNavigate?.("settings") },

    // Systems
    ...SYSTEMS.map((s) => ({
      id: `sys-${s.id}`,
      title: `${s.id}: ${s.name}`,
      category: "System" as const,
      detail: `Category: ${s.category} · Status: ${s.status} · Owner: ${s.owner}`,
      action: () => onNavigate?.("systems"),
    })),

    // Actions
    { id: "act-newproj", title: "+ Create New Project", category: "Action", detail: "Initialize a brand new game project workspace", action: () => setShowCreateProjectModal(true) },
    { id: "act-newver", title: "+ Commit Version Snapshot", category: "Action", detail: "Lock in current GDD and balance spec as a revision tag", action: () => setShowCreateVersionModal(true) },
    { id: "act-xlsx", title: "Export XLSX Workbook", category: "Action", detail: "Download complete multi-sheet Excel file (.xlsx)", action: () => handleExportXLSX() },
    { id: "act-json", title: "Export JSON Pack", category: "Action", detail: "Download project specification JSON pack", action: () => handleExportJSON() },
    { id: "act-csv", title: "Export CSV Bundle", category: "Action", detail: "Download CSV tables bundle file", action: () => handleExportCSV() },
  ];

  const filteredSearchResults = searchResults.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── REAL EXPORT HANDLERS ──────────────────────────────────────────────────
  const handleExportXLSX = () => {
    setExportOpen(false);
    const wb = XLSX.utils.book_new();

    const overview = [
      ["Property", "Value"],
      ["Project Name", activeProjectName],
      ["Game Genre", activeGameGenre],
      ["Target Platform", activePlatform],
      ["Active Version", activeVersion],
      ["System Health", `${snapshot?.liveMetrics?.health ?? 85}/100`],
      ["Blueprint Complete", `${snapshot?.liveMetrics?.blueprint ?? 50}%`],
      ["Active Risks", snapshot?.liveMetrics?.risks ?? 2],
      ["Open Decisions", snapshot?.liveMetrics?.decisions ?? 7],
      ["Export Date", new Date().toLocaleString()]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overview), "Overview");

    const systems = [
      ["ID", "System Name", "Category", "Status", "Owner"],
      ...SYSTEMS.map((s) => [s.id, s.name, s.category, s.status, s.owner])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(systems), "Systems Architecture");

    const economy = [
      ["Currency", "Sources (per min)", "Sinks (per min)", "Net Balance"],
      ...ECONOMY_BALANCE.map((e) => [e.name, e.sources, e.sinks, e.net])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(economy), "Economy Balance");

    const audit = [
      ["ID", "Category", "Severity", "Status", "Finding Summary", "Proposed Fix"],
      ...AUDIT_FINDINGS.map((a) => [a.id, a.category, a.severity, a.status, a.finding, a.proposedFix || ""])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(audit), "Audit Findings");

    XLSX.writeFile(wb, `${activeProjectName.toLowerCase().replace(/\s+/g, "-")}-workbook.xlsx`);
    onToast("success", "XLSX Workbook Exported", "Downloaded genuine multi-sheet Excel file (.xlsx)");
  };

  const handleExportJSON = () => {
    setExportOpen(false);
    const exportData = {
      project: {
        name: activeProjectName,
        genre: activeGameGenre,
        platform: activePlatform,
        version: activeVersion,
        exportedAt: new Date().toISOString(),
        liveMetrics: snapshot?.liveMetrics || { health: 85, blueprint: 50, risks: 2, decisions: 7 }
      },
      systems: SYSTEMS,
      retentionForecast: RETENTION_DATA,
      economyBalance: ECONOMY_BALANCE,
      riskTelemetry: RISK_DATA,
      auditFindings: AUDIT_FINDINGS
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeProjectName.toLowerCase().replace(/\s+/g, "-")}-data-pack.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("success", "JSON Pack Exported", "Downloaded project specification .json pack");
  };

  const handleExportCSV = () => {
    setExportOpen(false);
    const csvRows = [
      `# GAMEFORGE AI PROJECT SPECIFICATION BUNDLE`,
      `Project Name,Game Genre,Target Platform,Active Version,System Health,Blueprint Complete,Export Date`,
      `"${activeProjectName}","${activeGameGenre}","${activePlatform}","${activeVersion}","${snapshot?.liveMetrics?.health ?? 85}/100","${snapshot?.liveMetrics?.blueprint ?? 50}%","${new Date().toLocaleDateString()}"`,
      ``,
      `# SYSTEMS ARCHITECTURE REGISTRY`,
      `System ID,Name,Category,Status,Owner`,
      ...SYSTEMS.map((s) => `"${s.id}","${s.name}","${s.category}","${s.status}","${s.owner}"`),
      ``,
      `# ECONOMY BALANCE FAUCETS & SINKS`,
      `Currency,Sources,Sinks,Net Balance`,
      ...ECONOMY_BALANCE.map((e) => `"${e.name}",${e.sources},${e.sinks},${e.net}`)
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeProjectName.toLowerCase().replace(/\s+/g, "-")}-bundle.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("success", "CSV Bundle Exported", "Downloaded project data CSV bundle file");
  };

  const handleExportGoogleSheets = () => {
    setExportOpen(false);
    const sheetsFormattedRows = [
      `Project Summary\t\t\t\t`,
      `Project Name\t${activeProjectName}\tGenre\t${activeGameGenre}\tPlatform\t${activePlatform}`,
      `Health Score\t${snapshot?.liveMetrics?.health ?? 85}/100\tBlueprint Complete\t${snapshot?.liveMetrics?.blueprint ?? 50}%\tVersion\t${activeVersion}`,
      ``,
      `Systems Architecture\t\t\t\t`,
      `System ID\tSystem Name\tCategory\tStatus\tOwner`,
      ...SYSTEMS.map((s) => `${s.id}\t${s.name}\t${s.category}\t${s.status}\t${s.owner}`),
      ``,
      `Retention Metrics\t\t\t\t`,
      `Day\tForecast Retention (%)\tObserved Retention (%)`,
      ...RETENTION_DATA.map((r) => `${r.day}\t${r.forecast}%\t${r.observed}%`)
    ];

    const blob = new Blob([sheetsFormattedRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeProjectName.toLowerCase().replace(/\s+/g, "-")}-google-sheets.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("success", "Google Sheets Export", "Downloaded Google Sheets ready CSV file");
  };

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) {
      onToast("error", "Missing Name", "Please enter a project name");
      return;
    }
    setCreatingProject(true);
    try {
      if (onCreateProject) {
        await onCreateProject(newProjName.trim(), newProjGenre, newProjPlatform);
      }
      setShowCreateProjectModal(false);
      setProjectDropdownOpen(false);
      setNewProjName("");
      onToast("success", "Project Created", `"${newProjName}" is now your active project.`);
    } catch (err) {
      onToast("error", "Creation Failed", err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreatingProject(false);
    }
  };

  const handleCreateVersionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionTag.trim() || !newVersionSummary.trim()) {
      onToast("error", "Missing Fields", "Provide both version tag and revision notes");
      return;
    }
    const created: VersionSnapshot = {
      id: `v-${Date.now()}`,
      version: newVersionTag.trim().startsWith("v") ? newVersionTag.trim() : `v${newVersionTag.trim()}`,
      label: newVersionSummary.trim(),
      date: "Just now",
      author: user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "Designer",
      isCurrent: true,
    };
    const updated = [created, ...versions.map((v) => ({ ...v, isCurrent: false }))];
    setVersions(updated);
    setActiveVersion(created.version);
    setShowCreateVersionModal(false);
    setVersionDropdownOpen(false);
    setNewVersionTag("");
    setNewVersionSummary("");
    onToast("success", "Version Snapshot Saved", `Committed ${created.version}: ${created.label}`);
  };

  return (
    <header ref={headerRef} className="z-[60] flex h-14 shrink-0 items-center gap-3 border-b border-white/70 bg-white/70 px-4 backdrop-blur-xl">
      {/* Active Project Dropdown Trigger */}
      <div className="relative">
        <button
          onClick={() => {
            setProjectDropdownOpen(!projectDropdownOpen);
            setVersionDropdownOpen(false);
            setExportOpen(false);
            setNotifOpen(false);
          }}
          className="flex items-center gap-2 rounded-xl border border-[#6C3BFF]/20 bg-gradient-to-r from-[#6C3BFF]/10 via-white to-[#19C6D1]/10 px-3 py-1.5 shadow-[0_6px_18px_rgba(108,59,255,0.08)] hover:border-[#6C3BFF] transition-all"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#6C3BFF] via-[#8B5CFF] to-[#19C6D1] shadow-sm">
            <Sparkles size={12} className="text-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#17152B]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              <span>{activeProjectName}</span>
              <ChevronDown size={11} className="text-[#6C6880]" />
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#6C3BFF]">
              {activeGameGenre}
            </div>
          </div>
        </button>

        {/* Project Selector Menu */}
        {projectDropdownOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-72 overflow-hidden rounded-2xl border border-[#DED9EA] bg-white shadow-2xl z-50 p-2 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6C6880]">
              Game Projects ({projects.length > 0 ? projects.length : 1})
            </div>

            <div className="max-h-56 overflow-y-auto space-y-0.5">
              {projects.length > 0 ? (
                projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject?.(p.id);
                      setProjectDropdownOpen(false);
                      onToast("info", "Project Switched", `Switched to ${p.name}`);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all ${
                      p.id === activeProjectId || (p.name === activeProjectName)
                        ? "bg-[#6C3BFF]/10 text-[#6C3BFF] font-bold"
                        : "text-[#17152B] hover:bg-[#F4F1FA]"
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="truncate">{p.name}</span>
                      <span className="text-[10px] text-[#6C6880] font-normal">{p.genre || "Hybrid-Casual"} · {p.targetPlatform || "Mobile"}</span>
                    </div>
                    {(p.id === activeProjectId || p.name === activeProjectName) && <Check size={14} className="text-[#6C3BFF]" />}
                  </button>
                ))
              ) : (
                <button
                  className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl bg-[#6C3BFF]/10 text-[#6C3BFF] font-bold"
                >
                  <div className="flex flex-col text-left">
                    <span>{activeProjectName}</span>
                    <span className="text-[10px] text-[#6C6880] font-normal">{activeGameGenre}</span>
                  </div>
                  <Check size={14} className="text-[#6C3BFF]" />
                </button>
              )}
            </div>

            <div className="pt-1 border-t border-[#DED9EA]">
              <button
                onClick={() => {
                  setProjectDropdownOpen(false);
                  setShowCreateProjectModal(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-[#6C3BFF] rounded-xl hover:bg-[#5a2fe0] transition-colors"
              >
                <Plus size={13} /> Create New Project
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Version Control & Metadata Badges */}
      <div className="flex items-center gap-2">
        {/* Interactive Version Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setVersionDropdownOpen(!versionDropdownOpen);
              setProjectDropdownOpen(false);
              setExportOpen(false);
              setNotifOpen(false);
            }}
            className="flex items-center gap-1 rounded-full border border-[#DED9EA] bg-white px-3 py-1 text-xs font-bold text-[#6C3BFF] transition-all hover:border-[#6C3BFF] hover:bg-[#F4F1FA]"
            title="Version Control & Snapshot History"
          >
            <History size={12} />
            <span>{activeVersion}</span>
            <ChevronDown size={11} />
          </button>

          {versionDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-80 overflow-hidden rounded-2xl border border-[#DED9EA] bg-white shadow-2xl z-50 p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-[#DED9EA] pb-2">
                <div className="flex items-center gap-1.5">
                  <Layers size={14} className="text-[#6C3BFF]" />
                  <span className="text-xs font-bold text-[#17152B]">Version Control History</span>
                </div>
                <button
                  onClick={() => {
                    setVersionDropdownOpen(false);
                    setShowCreateVersionModal(true);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#6C3BFF] bg-[#F4F1FA] border border-[#DED9EA] px-2.5 py-1 rounded-lg hover:bg-[#ede8fb]"
                >
                  <Plus size={11} /> New Snapshot
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5">
                {versions.map((ver) => (
                  <div
                    key={ver.id}
                    onClick={() => {
                      setActiveVersion(ver.version);
                      onToast("info", "Version Selected", `Viewing ${ver.version}: ${ver.label}`);
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      ver.version === activeVersion
                        ? "border-[#6C3BFF] bg-[#F4F1FA]"
                        : "border-[#DED9EA] bg-white hover:bg-[#F4F1FA]/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#6C3BFF]">{ver.version}</span>
                      <span className="text-[10px] text-[#6C6880] flex items-center gap-1">
                        <Clock size={10} /> {ver.date}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#17152B] mt-0.5">{ver.label}</p>
                    <p className="text-[10px] text-[#6C6880]">Committed by {ver.author}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <span className="flex items-center gap-1 rounded-full border border-[#DED9EA] bg-[#F4F1FA] px-2.5 py-0.5 text-[10px] font-medium text-[#6C3BFF]">
          <Smartphone size={10} /> {activePlatform}
        </span>
        <span className="flex items-center gap-1 rounded-full border border-[#CAF4F6] bg-[#F0FDFE] px-2.5 py-0.5 text-[10px] font-medium text-[#19C6D1]">
          <Gamepad2 size={10} /> {activeGameGenre}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-[#EDFAF4] px-2.5 py-0.5 text-[10px] font-medium text-[#19A974]">
          <CheckCircle2 size={10} /> {snapshot?.systemStatus.uptime ?? "99.98% uptime"}
        </span>
      </div>

      {/* Undo, Redo & Save Controls */}
      <div className="ml-auto flex items-center gap-1">
        {unsavedChanges && (
          <span className="mr-1 rounded-full border border-[#FFE89A] bg-[#FFF8E6] px-2 py-0.5 text-[10px] font-medium text-[#FFC928]">
            Unsaved changes
          </span>
        )}
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={`rounded-md p-1.5 transition-colors ${
            canUndo ? "text-[#6C6880] hover:bg-[#F4F1FA] hover:text-[#17152B]" : "text-gray-300 cursor-not-allowed"
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className={`rounded-md p-1.5 transition-colors ${
            canRedo ? "text-[#6C6880] hover:bg-[#F4F1FA] hover:text-[#17152B]" : "text-gray-300 cursor-not-allowed"
          }`}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={14} />
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-md p-1.5 text-[#6C3BFF] hover:bg-[#F4F1FA] transition-colors"
          title="Save Workspace Spec (Ctrl+S)"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin text-[#6C3BFF]" /> : <Save size={14} />}
        </button>
      </div>

      {/* Search Bar & Global Command Palette Trigger */}
      <button
        onClick={() => {
          setShowSearchModal(true);
          setExportOpen(false);
          setNotifOpen(false);
          setProjectDropdownOpen(false);
          setVersionDropdownOpen(false);
        }}
        className="flex w-44 items-center gap-2 rounded-xl border border-[#DED9EA] bg-[#F4F1FA]/70 px-3 py-1.5 text-xs text-[#6C6880] transition-all hover:border-[#6C3BFF] hover:bg-white"
        title="Search Workspace & Actions (Ctrl+K)"
      >
        <Search size={13} />
        <span>Search…</span>
        <span className="ml-auto rounded bg-[#DED9EA] px-1.5 py-0.5 font-mono text-[10px]">⌘K</span>
      </button>

      {/* Notifications Popover */}
      <div className="relative">
        <button
          onClick={() => {
            setNotifOpen(!notifOpen);
            setExportOpen(false);
            setProjectDropdownOpen(false);
            setVersionDropdownOpen(false);
          }}
          className="relative rounded-md p-1.5 text-[#6C6880] transition-colors hover:bg-[#F4F1FA] hover:text-[#17152B]"
          title="Notifications"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-[#FF3B4F]" />
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-80 overflow-hidden rounded-2xl border border-[#DED9EA] bg-white shadow-2xl z-50">
            <div className="flex items-center justify-between border-b border-[#DED9EA] px-4 py-3 bg-[#F4F1FA]/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#17152B]">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-[#FF3B4F] text-white px-1.5 py-0.2 rounded-full font-mono">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-[#6C3BFF] hover:underline"
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-[#DED9EA]">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id)}
                  className={`p-3.5 cursor-pointer transition-colors hover:bg-[#F4F1FA]/60 ${
                    n.unread ? "bg-white" : "bg-[#F4F1FA]/30"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        n.type === "critical"
                          ? "bg-[#FF3B4F]"
                          : n.type === "success"
                          ? "bg-[#19A974]"
                          : n.type === "warning"
                          ? "bg-[#FFC928]"
                          : "bg-[#19C6D1]"
                      }`}
                    />
                    <div className="flex-1">
                      <p className={`text-xs ${n.unread ? "font-bold text-[#17152B]" : "text-[#6C6880]"}`}>
                        {n.text}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#6C6880] font-mono">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button className="rounded-md p-1.5 text-[#6C6880] transition-colors hover:bg-[#F4F1FA] hover:text-[#17152B]" onClick={() => onToast("info", "Share link copied", "Anyone with the link can view")}>
        <Share2 size={16} />
      </button>

      {/* Export Dropdown with Genuine Downloads */}
      <div className="relative">
        <button
          onClick={() => {
            setExportOpen(!exportOpen);
            setNotifOpen(false);
            setProjectDropdownOpen(false);
            setVersionDropdownOpen(false);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6C3BFF] to-[#8B5CFF] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(108,59,255,0.24)] transition-all hover:scale-[1.01]"
        >
          <Download size={13} />
          Export
          <ChevronDown size={11} />
        </button>
        {exportOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-60 overflow-hidden rounded-2xl border border-[#DED9EA] bg-white shadow-2xl z-50 p-1 space-y-0.5">
            <button
              onClick={handleExportXLSX}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-[#17152B] transition-colors hover:bg-[#F4F1FA] rounded-xl"
            >
              <FileSpreadsheet size={15} className="text-[#19A974]" />
              <div>
                <div>Generate XLSX Workbook</div>
                <div className="text-[10px] text-[#6C6880] font-normal">Multi-sheet Excel file (.xlsx)</div>
              </div>
            </button>

            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-[#17152B] transition-colors hover:bg-[#F4F1FA] rounded-xl"
            >
              <FileJson size={15} className="text-[#6C3BFF]" />
              <div>
                <div>Export as JSON Pack</div>
                <div className="text-[10px] text-[#6C6880] font-normal">Structured spec JSON (.json)</div>
              </div>
            </button>

            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-[#17152B] transition-colors hover:bg-[#F4F1FA] rounded-xl"
            >
              <FileText size={15} className="text-[#19C6D1]" />
              <div>
                <div>Export CSV Bundle</div>
                <div className="text-[10px] text-[#6C6880] font-normal">Formatted CSV tables (.csv)</div>
              </div>
            </button>

            <button
              onClick={handleExportGoogleSheets}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-[#17152B] transition-colors hover:bg-[#F4F1FA] rounded-xl"
            >
              <Table size={15} className="text-[#FFC928]" />
              <div>
                <div>Google Sheets Ready</div>
                <div className="text-[10px] text-[#6C6880] font-normal">TSV/CSV formatted for Google Sheets</div>
              </div>
            </button>
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
            className="inline-flex items-center gap-2 rounded-xl border border-[#DED9EA] bg-white px-3 py-2 text-[11px] font-semibold text-[#6C6880] transition hover:bg-[#FFF0F2] hover:text-[#FF3B4F]"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      ) : (
        <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#6C3BFF] to-[#19C6D1] text-[10px] font-black text-white shadow-[0_8px_20px_rgba(108,59,255,0.24)] transition-all hover:scale-105">
          JK
        </div>
      )}

      {/* ─── GLOBAL COMMAND PALETTE SEARCH MODAL ─────────────────────────────── */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[55] flex items-start justify-center bg-black/40" style={{ top: '3.5rem' }}>
          <div className="bg-white rounded-2xl border border-[#DED9EA] w-full max-w-xl shadow-2xl overflow-hidden space-y-0 mx-auto mt-8 z-[58] relative">
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#DED9EA] bg-[#F4F1FA]/50">
              <Search size={18} className="text-[#6C3BFF]" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages, game systems, docs, actions... (Esc to close)"
                className="w-full text-sm bg-transparent outline-none text-[#17152B] placeholder:text-[#6C6880]"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-[#6C6880] hover:text-[#17152B] text-xs font-semibold px-2 py-1 bg-white rounded-lg border"
              >
                ESC
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-[#DED9EA] p-2">
              {filteredSearchResults.length > 0 ? (
                filteredSearchResults.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => {
                      res.action();
                      setShowSearchModal(false);
                      setSearchQuery("");
                    }}
                    className="p-3 cursor-pointer hover:bg-[#F4F1FA] rounded-xl flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-2 rounded-lg ${
                        res.category === "Navigation" ? "bg-[#6C3BFF]/10 text-[#6C3BFF]" :
                        res.category === "System" ? "bg-[#19C6D1]/10 text-[#19C6D1]" :
                        res.category === "Action" ? "bg-[#19A974]/10 text-[#19A974]" : "bg-gray-100 text-gray-600"
                      }`}>
                        {res.category === "Navigation" ? <Layout size={14} /> :
                         res.category === "System" ? <Cpu size={14} /> :
                         res.category === "Action" ? <Sparkles size={14} /> : <Command size={14} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#17152B] group-hover:text-[#6C3BFF]">{res.title}</h4>
                          <span className="text-[9px] font-bold uppercase px-2 py-0.2 rounded-md bg-[#F4F1FA] text-[#6C6880]">
                            {res.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6C6880] mt-0.5">{res.detail}</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-[#6C6880] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#6C6880]">
                  No matching workspace results found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE PROJECT MODAL ────────────────────────────────────────────── */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-[#DED9EA] p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6C3BFF]/10 text-[#6C3BFF]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17152B]">Create New Game Project</h3>
                  <p className="text-xs text-[#6C6880]">Initialize a brand new design workspace</p>
                </div>
              </div>
              <button onClick={() => setShowCreateProjectModal(false)} className="text-[#6C6880] hover:text-[#17152B]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">Project Name</label>
                <input
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="e.g. Cyberpunk Runner or Galaxy Conquest"
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-xl px-3 py-2.5 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">Primary Game Genre</label>
                <select
                  value={newProjGenre}
                  onChange={(e) => setNewProjGenre(e.target.value)}
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-xl px-3 py-2.5 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">Target Platform</label>
                <select
                  value={newProjPlatform}
                  onChange={(e) => setNewProjPlatform(e.target.value)}
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-xl px-3 py-2.5 text-[#17152B] outline-none focus:border-[#6C3BFF]"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateProjectModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold border border-[#DED9EA] rounded-xl text-[#6C6880] hover:bg-[#F4F1FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProject}
                  className="flex-1 py-2.5 text-xs font-semibold bg-[#6C3BFF] text-white rounded-xl hover:bg-[#5a2fe0] disabled:opacity-60"
                >
                  {creatingProject ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CREATE VERSION SNAPSHOT MODAL ────────────────────────────────────── */}
      {showCreateVersionModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-[#DED9EA] p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6C3BFF]/10 text-[#6C3BFF]">
                  <History size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17152B]">Commit Version Snapshot</h3>
                  <p className="text-xs text-[#6C6880]">Lock in current GDD and balance specs</p>
                </div>
              </div>
              <button onClick={() => setShowCreateVersionModal(false)} className="text-[#6C6880] hover:text-[#17152B]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateVersionSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">Version Tag</label>
                <input
                  value={newVersionTag}
                  onChange={(e) => setNewVersionTag(e.target.value)}
                  placeholder="e.g. v1.0.0 or v0.9.4"
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-xl px-3 py-2.5 text-[#17152B] outline-none focus:border-[#6C3BFF] font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6C6880] block mb-1">Release / Revision Notes</label>
                <textarea
                  value={newVersionSummary}
                  onChange={(e) => setNewVersionSummary(e.target.value)}
                  rows={3}
                  placeholder="Summary of balance adjustments, GDD changes, or rule additions..."
                  className="w-full text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-xl px-3 py-2.5 text-[#17152B] outline-none focus:border-[#6C3BFF] resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateVersionModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold border border-[#DED9EA] rounded-xl text-[#6C6880] hover:bg-[#F4F1FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-semibold bg-[#6C3BFF] text-white rounded-xl hover:bg-[#5a2fe0]"
                >
                  Save Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
