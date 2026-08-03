import { useState } from "react";
import {
  LayoutDashboard, FileText, Network, FlaskConical, TrendingUp,
  Brain, Play, BarChart2, Table2, BookOpen, ShieldCheck, Settings,
  ChevronLeft, ChevronRight, Globe
} from "lucide-react";
import type { BackendSnapshot } from "../services/backend";

export type AppPage =
  | "website"
  | "command-center"
  | "game-blueprint"
  | "systems"
  | "economy-lab"
  | "progression"
  | "player-psychology"
  | "simulation"
  | "analytics"
  | "workbook-studio"
  | "knowledge-base"
  | "audit-center"
  | "settings";

interface NavItem {
  id: AppPage;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "command-center", label: "Command Center", icon: LayoutDashboard },
  { id: "game-blueprint", label: "Game Blueprint", icon: FileText },
  { id: "systems", label: "Systems", icon: Network },
  { id: "economy-lab", label: "Economy Lab", icon: FlaskConical },
  { id: "progression", label: "Progression", icon: TrendingUp },
  { id: "player-psychology", label: "Player Psychology", icon: Brain },
  { id: "simulation", label: "Simulation", icon: Play },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "workbook-studio", label: "Workbook Studio", icon: Table2, badge: "!", badgeColor: "bg-[#FF3B4F]" },
  { id: "knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { id: "audit-center", label: "Audit Center", icon: ShieldCheck, badge: "2", badgeColor: "bg-[#FF3B4F]" },
];

interface SidebarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  snapshot?: BackendSnapshot | null;
}

export default function Sidebar({ currentPage, onNavigate, snapshot }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative flex flex-col shrink-0 border-r border-white/60 bg-white/75 backdrop-blur-xl transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[248px]"}`}
      style={{ boxShadow: "16px 0 40px rgba(108, 59, 255, 0.08)" }}
    >
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-[#DED9EA]/70 shrink-0 ${collapsed ? "justify-center px-0" : ""}`}>
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C3BFF] via-[#8B5CFF] to-[#19C6D1] shadow-[0_10px_24px_rgba(108,59,255,0.28)]">
          <span style={{ fontFamily: "Orbitron, sans-serif" }} className="text-sm font-black leading-none text-white">G</span>
          <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-[#FFC928]" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: "Orbitron, sans-serif" }} className="text-[10px] font-black uppercase tracking-[0.24em] text-[#17152B] leading-tight">
              GameForge
            </div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#6C6880]">Systems AI</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {/* Website link */}
        <button
          onClick={() => onNavigate("website")}
          className={`group relative flex w-full items-center gap-3 text-left transition-all duration-150 ${collapsed ? "justify-center px-0 py-3" : "px-4 py-2.5"} ${currentPage === "website" ? "nav-active bg-gradient-to-r from-[#6C3BFF]/12 to-[#19C6D1]/8 text-[#6C3BFF]" : "text-[#6C6880] hover:-translate-y-0.5 hover:bg-[#F4F1FA] hover:text-[#17152B]"}`}
          title={collapsed ? "Public Website" : undefined}
        >
          <Globe size={17} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Public Website</span>}
          {!collapsed && currentPage === "website" && (
            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#6C3BFF]" />
          )}
        </button>

        <div className={`${collapsed ? "mx-2" : "mx-4"} my-1 h-px bg-[#DED9EA]`} />

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group relative flex w-full items-center gap-3 text-left transition-all duration-150 ${collapsed ? "justify-center px-0 py-3" : "px-4 py-2.5"} ${active ? "nav-active bg-gradient-to-r from-[#6C3BFF]/12 to-[#19C6D1]/8 text-[#6C3BFF]" : "text-[#6C6880] hover:-translate-y-0.5 hover:bg-[#F4F1FA] hover:text-[#17152B]"}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={17} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.badge && (
                <span className={`absolute right-2 top-2 h-2 w-2 rounded-full ${item.badgeColor}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#DED9EA] py-2">
        {[
          { id: "settings" as AppPage, icon: Settings, label: "Project Settings" },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`group relative flex w-full items-center gap-3 text-left transition-all ${collapsed ? "justify-center px-0 py-3" : "px-4 py-2.5"} text-[#6C6880] hover:-translate-y-0.5 hover:bg-[#F4F1FA] hover:text-[#17152B]`}
            title={collapsed ? label : undefined}
          >
            <Icon size={17} />
            {!collapsed && <span className="text-sm">{label}</span>}
          </button>
        ))}

        <div className={`flex items-center gap-3 rounded-2xl border border-[#DED9EA]/70 bg-gradient-to-br from-white to-[#F4F1FA] ${collapsed ? "mx-2 justify-center px-2 py-3" : "mx-3 my-2 px-3 py-3"}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6C3BFF] to-[#19C6D1] text-[10px] font-black text-white">
            JK
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-[#17152B]">Jordan K.</div>
              <div className="text-[10px] text-[#6C6880]">Lead Designer</div>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[#DED9EA] bg-white text-[#6C6880] shadow-sm transition-all hover:border-[#6C3BFF] hover:text-[#17152B]"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
