import { useState } from "react";
import {
  ChevronRight, Check, ChevronDown, Zap, Shield, BarChart2, Brain, Table2, ArrowRight,
  Sparkles, Coins, TrendingUp, Cpu, Flame, Layers, Award, Activity, CheckCircle2, Lock,
  FileSpreadsheet, Code2, BookOpen, Terminal
} from "lucide-react";

interface PublicWebsiteProps {
  onEnterApp: () => void;
}

type PageKey =
  | "home"
  | "product"
  | "solutions"
  | "templates"
  | "workbook-gallery"
  | "methodology"
  | "pricing"
  | "documentation";

const NAV_ITEMS: { label: string; key: PageKey }[] = [
  { label: "Product", key: "product" },
  { label: "Solutions", key: "solutions" },
  { label: "Templates", key: "templates" },
  { label: "Workbook Gallery", key: "workbook-gallery" },
  { label: "Methodology", key: "methodology" },
  { label: "Pricing", key: "pricing" },
  { label: "Documentation", key: "documentation" },
];

const GENRE_TEMPLATES = [
  { name: "Idle Clicker", icon: "⚡", systems: 12, tabs: 28, time: "45 min", badge: "POPULAR" },
  { name: "Tycoon", icon: "🏙", systems: 18, tabs: 32, time: "60 min", badge: "GOLD TIER" },
  { name: "Merge Mania", icon: "🧩", systems: 10, tabs: 24, time: "35 min", badge: "FAST" },
  { name: "Match Puzzle", icon: "🔮", systems: 8, tabs: 22, time: "30 min", badge: "HOT" },
  { name: "RPG Quest", icon: "⚔️", systems: 24, tabs: 34, time: "90 min", badge: "HARDCORE" },
  { name: "Hotel Empire", icon: "🏨", systems: 15, tabs: 34, time: "55 min", badge: "NEW" },
  { name: "Farming Sim", icon: "🌾", systems: 14, tabs: 30, time: "50 min", badge: "CASUAL" },
  { name: "Survival Craft", icon: "🏕", systems: 20, tabs: 33, time: "75 min", badge: "ADVANCED" },
];

const AGENTS = [
  { name: "Architect AI", icon: "🏗", roleClass: "System Builder", skill: "Dependency Node Mapping", pwr: "98%", desc: "Transforms raw game concepts into structured connection graphs and maps cross-system dependencies.", color: "border-red-200 bg-red-50/40 hover:border-red-500 shadow-xs" },
  { name: "Balancer AI", icon: "⚖️", roleClass: "Economy Sage", skill: "Monte Carlo Curve Calibration", pwr: "95%", desc: "Simulates currencies, faucets, sinks, and reward tables against mathematical churn indicators.", color: "border-emerald-200 bg-emerald-50/40 hover:border-[#00E676] shadow-xs" },
  { name: "Auditor AI", icon: "🔍", roleClass: "Risk Ranger", skill: "Anti-inflation Integrity Scans", pwr: "97%", desc: "Automatically flags broken progression gaps, reward loops, and paywall spikes before deployment.", color: "border-amber-200 bg-amber-50/40 hover:border-amber-500 shadow-xs" },
  { name: "Psychologist AI", icon: "🧠", roleClass: "Mind Mage", skill: "Ethical Engagement Audits", pwr: "94%", desc: "Evaluates Bartle motivation scores, excitement curves, and pay-to-win mechanics for long-term health.", color: "border-[#FF3B4F]/30 bg-[#FF3B4F]/5 hover:border-[#FF3B4F] shadow-xs" },
  { name: "Documenter AI", icon: "📄", roleClass: "Workbook Scribe", skill: "Automated Workbook Compiler", pwr: "99%", desc: "Compiles balanced design data into developer-ready XLSX workbooks with formulas and layout tables.", color: "border-emerald-300 bg-emerald-50/60 hover:border-[#00E676] shadow-xs" },
];

const WORKBOOKS = [
  { title: "Master Economy Faucets & Sinks", sheets: 12, formulas: 240, genre: "4X Strategy / RPG", desc: "Dynamic Excel workbook with gold drop rates, shop pricing formulas, and gold sink depletion rates." },
  { title: "Level Pacing & XP Progression Curve", sheets: 8, formulas: 180, genre: "Action RPG", desc: "XP scaling formulas, monster drop ratios, and level unlock gates mapped with Excel functions." },
  { title: "Gacha Loot Box Probability Matrix", sheets: 10, formulas: 310, genre: "Mobile Gacha", desc: "Pity counters, drop rates, and 10,000 Monte Carlo run percentiles (P10, P50, P90)." },
];

const PRICING = [
  {
    level: "LVL 1 — Solo Designer",
    price: 29,
    period: "billed annually ($35 monthly)",
    desc: "Perfect for indie game designers building single prototypes.",
    color: "border-[#E4E0EC] bg-white shadow-lg hover:shadow-xl",
    features: ["1 Active Project Workspace", "10 Connected Systems", "All Core Balancer Modules", "5 Simulation Runs / month", "Developer Workbook (XLSX) Export", "Community Support Guild"],
  },
  {
    level: "LVL 50 — Studio Class",
    price: 99,
    period: "billed annually ($125 monthly)",
    desc: "For creative teams scaling multiple connected projects.",
    color: "border-[#FFD700] bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30 shadow-[0_10px_40px_rgba(245,158,11,0.25)] ring-2 ring-[#FFD700]/60",
    highlight: true,
    features: ["10 Active Project Workspaces", "Unlimited Connected Systems", "Team Collaboration (5 Seats Included)", "Unlimited Monte Carlo Simulations", "All Workbook & GDD Export Formats", "AI Copilot Priority Quota", "Dedicated Priority Support"],
  },
  {
    level: "LVL 100 — Enterprise Overlord",
    price: "Custom",
    period: "custom licensing options",
    desc: "For publishing houses and studios requiring heavy simulations.",
    color: "border-[#09090B] bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white shadow-2xl",
    isDark: true,
    features: ["Unlimited Projects & Team Seats", "SSO Authentication & Audit Logs", "Custom Developer API Pipelines", "Dedicated Private Server GPU Quota", "SLA Agreements & Private Cloud Devs", "Game Balance Optimization Workshops"],
  },
];

const WORKFLOW = [
  { step: "01", label: "EXTRACT", action: "Load Raw GDD / Logs", desc: "Upload GDD drafts, spreadsheets, or logs. AI extracts facts, assumptions, and contradictions." },
  { step: "02", label: "STRUCTURE", action: "Build System Map", desc: "System nodes and currencies are organized into a clean visual blueprint and dependency map." },
  { step: "03", label: "MODEL", action: "Fit Math Formulas", desc: "Verify level pacing and adjust drop rate percentages with integrated formulas." },
  { step: "04", label: "SIMULATE", action: "Run Monte Carlo Checks", desc: "Simulate 10,000 player journeys in seconds to stress-test your economy under stress." },
  { step: "05", label: "AUDIT", action: "Verify Integrity & Fairness", desc: "Flag pay-to-win risks, progression bottlenecks, and reward spikes automatically." },
  { step: "06", label: "EXPORT", action: "Ship Handoff Workbook", desc: "Generate dynamic, formula-mapped Excel sheets ready for developer integration." },
];

const FAQS = [
  { q: "Is this a game engine or a spreadsheet tool?", a: "Neither. GameForge Systems AI is a design intelligence platform that sits between your concept and your developer. It helps you think clearly, catch problems early, and produce developer-ready documentation." },
  { q: "Can I import my existing GDD or Excel file?", a: "Yes. The Knowledge Base accepts PDFs, DOCX, Excel, CSV, JSON schemas, and images. AI extracts structured data and maps it to your blueprint automatically." },
  { q: "Is my game data private?", a: "Yes. All project data is encrypted at rest and in transit. Your designs are never used to train shared models. Enterprise plans support private deployment." },
  { q: "What happens if I cancel?", a: "You keep read access to all exported workbooks. Project data is retained for 90 days." },
];

function GachaSimulator() {
  const [legendaryRate, setLegendaryRate] = useState(1.5);
  const [rareRate, setRareRate] = useState(12);
  const [rolls, setRolls] = useState<{ legendary: number; rare: number; common: number } | null>(null);
  const [simulating, setSimulating] = useState(false);

  const runSimulation = () => {
    setSimulating(true);
    setTimeout(() => {
      let legendaryCount = 0;
      let rareCount = 0;
      let commonCount = 0;

      for (let i = 0; i < 100; i++) {
        const rand = Math.random() * 100;
        if (rand < legendaryRate) {
          legendaryCount++;
        } else if (rand < legendaryRate + rareRate) {
          rareCount++;
        } else {
          commonCount++;
        }
      }

      setRolls({
        legendary: legendaryCount,
        rare: rareCount,
        common: commonCount,
      });
      setSimulating(false);
    }, 800);
  };

  const getAuditMessage = () => {
    if (!rolls) return null;
    if (legendaryRate > 5) {
      return {
        title: "🚨 Economy Hyper-Inflation Risk",
        desc: "Legendary drop rate is too high (>5%). This will flood your server economy, crash item trade value, and lead to rapid progression stagnation.",
        color: "bg-red-500/10 border-red-500/30 text-red-700 font-sans",
      };
    }
    if (legendaryRate < 0.5) {
      return {
        title: "⚡ Player Retention Churn Warning",
        desc: "Legendary drop rate is below 0.5%. Players will encounter prolonged reward dry spells, causing high frustration metrics and early churn.",
        color: "bg-amber-500/10 border-amber-500/30 text-amber-700 font-sans",
      };
    }
    return {
      title: "✨ Gold-Standard Balanced Pacing",
      desc: "Optimal balance achieved! Scarcity is preserved while providing satisfying micro-rewards for D7 retention targets.",
      color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 font-sans",
    };
  };

  const audit = getAuditMessage();

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-[#E4E0EC] p-8 max-w-3xl mx-auto shadow-[0_20px_50px_rgba(9,9,11,0.08)] space-y-6 text-left relative overflow-hidden group">
      <div className="absolute top-[-80px] right-[-80px] w-64 h-64 bg-gradient-to-br from-[#FFD700]/30 via-amber-300/20 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
      <div className="absolute bottom-[-80px] left-[-80px] w-64 h-64 bg-gradient-to-br from-[#00E676]/20 via-emerald-200/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between border-b border-[#E4E0EC] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-800 border border-amber-500/30 uppercase tracking-widest font-mono flex items-center gap-1.5 shadow-2xs">
              <Coins size={13} className="text-[#FFD700]" /> GOLD MONTE CARLO ENGINE
            </span>
            <span className="text-[10px] font-mono font-bold text-[#00E676] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">LIVE ENGINE</span>
          </div>
          <h3 className="text-2xl font-extrabold text-[#09090B] mt-2 font-space tracking-tight">STRESS-TEST LOOT & ECONOMY DROP RATES</h3>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-[#09090B]/60 bg-[#FAFAFC] px-3.5 py-2 rounded-2xl border border-[#E4E0EC] shadow-2xs">
          <Activity size={14} className="text-[#00E676] animate-pulse" /> 10,000 RUNS / SEC
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-4 bg-[#FAFAFC] p-5 rounded-2xl border border-[#E4E0EC]">
          <div>
            <div className="flex justify-between text-xs font-bold text-[#09090B] mb-2 font-mono">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#FFD700] shadow-[0_0_10px_#FFD700] block" /> LEGENDARY GOLD DROP RATE</span>
              <span className="text-amber-600 font-mono text-sm font-black">{legendaryRate}%</span>
            </div>
            <input
              type="range" min="0.1" max="15" step="0.1"
              value={legendaryRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setLegendaryRate(val);
                if (val + rareRate > 100) setRareRate(100 - val);
              }}
              className="w-full accent-[#FFD700] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-[#09090B] mb-2 font-mono">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#00E676] shadow-[0_0_10px_#00E676] block" /> RARE NEON DROP RATE</span>
              <span className="text-emerald-600 font-mono text-sm font-black">{rareRate}%</span>
            </div>
            <input
              type="range" min="1" max="50" step="1"
              value={rareRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setRareRate(val);
                if (val + legendaryRate > 100) setLegendaryRate(100 - val);
              }}
              className="w-full accent-[#00E676] cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={simulating}
          className="w-full bg-[#09090B] hover:bg-black text-white text-xs font-black font-mono py-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 shadow-[0_10px_30px_rgba(9,9,11,0.25)] relative overflow-hidden group/btn"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF3B4F]/20 via-[#FFD700]/20 to-[#00E676]/20 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          <Coins size={16} className="text-[#FFD700] animate-bounce" />
          {simulating ? "🌀 COMPUTING MONTE CARLO PROBABILITIES..." : "RUN 100 MONTE CARLO ROLLS"}
        </button>

        {rolls && !simulating && (
          <div className="space-y-4 pt-4 border-t border-[#E4E0EC] animate-fadeIn">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-amber-500/10 border border-amber-400/40 rounded-2xl p-4 shadow-2xs">
                <span className="text-3xl font-black font-mono text-amber-600">{rolls.legendary}</span>
                <div className="text-[10px] font-bold font-mono text-amber-800 mt-1 flex items-center justify-center gap-1">
                  <Coins size={11} className="text-[#FFD700]" /> LEGENDARIES
                </div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-400/40 rounded-2xl p-4 shadow-2xs">
                <span className="text-3xl font-black font-mono text-emerald-600">{rolls.rare}</span>
                <div className="text-[10px] font-bold font-mono text-emerald-800 mt-1">RARES</div>
              </div>
              <div className="bg-zinc-100 border border-zinc-300 rounded-2xl p-4 shadow-2xs">
                <span className="text-3xl font-black font-mono text-zinc-700">{rolls.common}</span>
                <div className="text-[10px] font-bold font-mono text-zinc-500 mt-1">COMMONS</div>
              </div>
            </div>

            {audit && (
              <div className={`p-4 rounded-2xl border flex gap-3 items-start ${audit.color} shadow-2xs`}>
                <div className="text-xl shrink-0">🤖</div>
                <div>
                  <h4 className="font-bold text-xs font-mono">{audit.title}</h4>
                  <p className="text-[11px] leading-relaxed mt-0.5 opacity-90">{audit.desc}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicWebsite({ onEnterApp }: PublicWebsiteProps) {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activePage, setActivePage] = useState<PageKey>("home");

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#FAFAFC] text-[#09090B] selection:bg-[#FFD700]/30 font-sans">
      {/* Background Ambient Glow Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-[#00E676]/15 via-[#00F5D4]/10 to-transparent blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[400px] right-[-150px] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-[#FF3B4F]/12 via-rose-300/10 to-transparent blur-[160px]" />
      </div>

      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-2xl border-b border-[#E4E0EC]/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActivePage("home")}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#09090B] via-zinc-900 to-[#FF3B4F] flex items-center justify-center overflow-hidden shadow-md group-hover:scale-105 transition-transform">
              <img src="/favicon.png" className="w-6 h-6 object-contain" alt="Logo" />
            </div>
            <div>
              <span className="text-base font-black tracking-widest text-[#09090B] font-mono block leading-none">GAMEFORGE<span className="text-[#FF3B4F]">.AI</span></span>
              <span className="text-[9px] font-bold tracking-wider text-[#00E676] uppercase font-mono mt-0.5 block">Game Design & LiveOps OS</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setActivePage(item.key)}
                className={`text-xs font-extrabold font-mono transition-colors uppercase tracking-wider ${
                  activePage === item.key ? "text-[#FF3B4F] border-b-2 border-[#FF3B4F] pb-1" : "text-[#09090B]/70 hover:text-[#FF3B4F]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onEnterApp} className="text-xs font-bold font-mono text-[#09090B]/80 hover:text-[#09090B] transition-colors px-3 py-2">
              SIGN IN
            </button>
            <button
              onClick={onEnterApp}
              className="flex items-center gap-2 bg-[#09090B] hover:bg-black text-white text-xs font-black font-mono px-5 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_4px_20px_rgba(9,9,11,0.25)] border border-amber-400/30"
            >
              <Coins size={14} className="text-[#FFD700]" /> LAUNCH SYSTEM <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Page Router View */}
      <main className="flex-1 py-12">
        {/* ─── 1. HOME PAGE ──────────────────────────────────────────────────────── */}
        {activePage === "home" && (
          <div className="space-y-16">
            <section className="max-w-7xl mx-auto px-6 text-center space-y-8 relative">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-red-500/10 border border-[#E4E0EC] rounded-full px-5 py-2 text-xs font-mono text-[#09090B] font-extrabold shadow-2xs">
                <Sparkles size={14} className="text-[#FFD700] animate-pulse" />
                <span>NEXT-GEN EVIDENCE-DRIVEN AI ENGINE FOR GAME STUDIOS</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-[#09090B] leading-tight tracking-tight max-w-5xl mx-auto font-space">
                ENGINEER GAME <span className="font-serif italic font-normal text-[#FF3B4F] tracking-normal">economies</span> THAT <br />
                <span className="bg-gradient-to-r from-[#FF3B4F] via-[#00E676] to-[#F59E0B] bg-clip-text text-transparent font-black">
                  SURVIVE REAL PLAYER METAS.
                </span>
              </h1>

              <p className="text-base md:text-xl text-[#09090B]/75 max-w-3xl mx-auto leading-relaxed font-sans font-medium">
                Architect core game loops, simulate 10,000-player Monte Carlo journeys, prevent hyper-inflation, and export developer-ready formula spreadsheets with <span className="font-serif italic text-amber-700 font-normal">10 specialist AI agents</span>.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-5 pt-4">
                <button
                  onClick={onEnterApp}
                  className="flex items-center gap-3 bg-[#09090B] hover:bg-black text-white font-black font-mono px-8 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_10px_35px_rgba(9,9,11,0.25)] text-xs border border-[#FFD700]/40"
                >
                  <Sparkles size={16} className="text-[#FFD700]" /> INITIALIZE WORKSPACE <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => setActivePage("templates")}
                  className="flex items-center gap-2 border border-[#E4E0EC] bg-white text-[#09090B] font-extrabold font-mono px-8 py-4 rounded-2xl hover:bg-zinc-50 transition-all text-xs shadow-2xs hover:border-[#09090B]"
                >
                  <Table2 size={16} className="text-[#00E676]" /> EXPLORE TEMPLATES
                </button>
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 text-center space-y-6">
              <GachaSimulator />
            </section>
          </div>
        )}

        {/* ─── 2. PRODUCT PAGE ─────────────────────────────────────────────────── */}
        {activePage === "product" && (
          <section className="max-w-7xl mx-auto px-6 space-y-12 animate-fadeIn">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold font-mono text-[#00E676] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">10 AI AGENT SPECIALISTS</span>
              <h2 className="text-4xl md:text-6xl font-black text-[#09090B] font-space tracking-tight">
                SPECIALIST AI <span className="font-serif italic font-normal text-[#FF3B4F]">agent</span> DECK
              </h2>
              <p className="text-[#09090B]/60 text-sm max-w-xl mx-auto font-sans">Deploy AI specialist agents to continuously audit game balance, progression walls, and motivation curves.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {AGENTS.map((a) => (
                <div key={a.name} className={`border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group bg-white relative overflow-hidden ${a.color}`}>
                  <div>
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{a.icon}</div>
                    <h3 className="font-black text-lg text-[#09090B] font-space">{a.name}</h3>
                    <div className="text-[10px] font-extrabold text-[#00E676] uppercase font-mono tracking-wider mt-0.5">{a.roleClass}</div>
                    <p className="text-xs text-[#09090B]/70 leading-relaxed mt-4 font-sans">{a.desc}</p>
                  </div>
                  <div className="pt-5 border-t border-[#E4E0EC] mt-6 space-y-2 font-mono text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-[#09090B]/50">SPECIALTY:</span>
                      <span className="text-[#09090B] font-bold truncate max-w-[120px]">{a.skill}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#09090B]/50">ACCURACY:</span>
                      <span className="text-amber-600 font-black">{a.pwr}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── 3. SOLUTIONS PAGE ───────────────────────────────────────────────── */}
        {activePage === "solutions" && (
          <section className="max-w-7xl mx-auto px-6 space-y-14 animate-fadeIn">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold font-mono text-amber-800 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">AUTOMATED WORKFLOW</span>
              <h2 className="text-4xl md:text-6xl font-black text-[#09090B] font-space">
                6-STAGE GAME DESIGN <span className="font-serif italic font-normal text-[#00E676]">pipeline</span>
              </h2>
              <p className="text-[#09090B]/60 text-sm max-w-xl mx-auto font-sans">From raw GDD text drafts to production-ready formula workbooks in minutes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 relative">
              {WORKFLOW.map((w, i) => (
                <div key={w.step} className="relative flex flex-col justify-between bg-white border border-[#E4E0EC] rounded-3xl p-6 shadow-2xs group hover:border-[#09090B] transition-all hover:shadow-xl">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-mono font-bold text-[#FF3B4F] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">{w.step}</span>
                      <span className="text-[9px] font-mono text-[#09090B]/40 uppercase tracking-widest font-extrabold">STAGE</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-[#09090B] font-mono mb-1">{w.label}</h4>
                    <div className="text-[10px] text-[#00E676] font-bold mb-3">{w.action}</div>
                    <p className="text-[11px] text-[#09090B]/70 leading-relaxed font-sans">{w.desc}</p>
                  </div>
                  {i < WORKFLOW.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 z-10 translate-x-1.5">
                      <ChevronRight size={18} className="text-[#09090B]/30 group-hover:text-[#09090B] transition-colors" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── 4. TEMPLATES PAGE ───────────────────────────────────────────────── */}
        {activePage === "templates" && (
          <section className="max-w-7xl mx-auto px-6 space-y-12 animate-fadeIn">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold font-mono text-[#09090B] uppercase tracking-widest bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">PRE-BALANCED TEMPLATES</span>
              <h2 className="text-4xl md:text-6xl font-black text-[#09090B] font-space">
                READY-TO-USE GENRE <span className="font-serif italic font-normal text-amber-600">baselines</span>
              </h2>
              <p className="text-[#09090B]/60 text-sm max-w-xl mx-auto font-sans">Deploy pre-configured game balance blueprints with preset leveling curves and currency structures.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {GENRE_TEMPLATES.map((t) => (
                <div key={t.name} className="bg-white border border-[#E4E0EC] rounded-3xl p-6 hover:border-[#FFD700] transition-all duration-200 hover:-translate-y-1 relative group overflow-hidden shadow-2xs hover:shadow-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-4xl group-hover:scale-110 transition-transform duration-200">{t.icon}</div>
                    <span className="text-[9px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/30 flex items-center gap-1">
                      <Coins size={10} className="text-[#FFD700]" /> {t.badge}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-lg text-[#09090B] font-space mb-3">{t.name}</h3>
                  <div className="text-xs text-[#09090B]/70 space-y-2 border-t border-[#E4E0EC] pt-3 font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#09090B]/50">SYSTEMS:</span>
                      <span className="font-bold text-[#09090B]">{t.systems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#09090B]/50">WORKBOOKS:</span>
                      <span className="font-bold text-[#09090B]">{t.tabs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#09090B]/50">SETUP TIME:</span>
                      <span className="font-bold text-[#00E676]">{t.time}</span>
                    </div>
                  </div>
                  <button onClick={onEnterApp} className="mt-5 w-full text-xs font-bold font-mono text-white bg-[#09090B] py-3.5 rounded-2xl hover:bg-black transition-colors shadow-md">
                    INITIALIZE PRESET
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── 5. WORKBOOK GALLERY PAGE ────────────────────────────────────────── */}
        {activePage === "workbook-gallery" && (
          <section className="max-w-7xl mx-auto px-6 space-y-12 animate-fadeIn">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold font-mono text-[#00E676] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">XLSX HANDOFF WORKBOOKS</span>
              <h2 className="text-4xl md:text-6xl font-black text-[#09090B] font-space">
                DEVELOPER HANDOFF <span className="font-serif italic font-normal text-emerald-600">workbooks</span>
              </h2>
              <p className="text-[#09090B]/60 text-sm max-w-xl mx-auto font-sans">Automated developer-ready Excel sheets compiled directly from your system model.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {WORKBOOKS.map((wb) => (
                <div key={wb.title} className="bg-white border border-[#E4E0EC] rounded-3xl p-8 shadow-xs hover:shadow-2xl transition-all duration-300 space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#00E676]">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold font-mono uppercase text-emerald-600">{wb.genre}</span>
                    <h3 className="font-extrabold text-xl text-[#09090B] font-space mt-1">{wb.title}</h3>
                    <p className="text-xs text-[#09090B]/70 leading-relaxed mt-2 font-sans">{wb.desc}</p>
                  </div>
                  <div className="pt-4 border-t border-[#E4E0EC] flex justify-between text-xs font-mono">
                    <div><span className="text-[#09090B]/50">SHEETS:</span> <span className="font-bold">{wb.sheets}</span></div>
                    <div><span className="text-[#09090B]/50">FORMULAS:</span> <span className="font-bold text-[#00E676]">{wb.formulas}</span></div>
                  </div>
                  <button onClick={onEnterApp} className="w-full bg-[#09090B] hover:bg-black text-white text-xs font-bold font-mono py-3.5 rounded-2xl transition-colors">
                    PREVIEW & EXPORT WORKBOOK
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── 6. METHODOLOGY PAGE ─────────────────────────────────────────────── */}
        {activePage === "methodology" && (
          <section className="max-w-4xl mx-auto px-6 space-y-10 animate-fadeIn text-left">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold font-mono text-[#FF3B4F] uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full border border-red-100">ENGINEERING PROOF</span>
              <h2 className="text-4xl md:text-6xl font-black text-[#09090B] font-space">
                THE GAMEFORGE <span className="font-serif italic font-normal text-[#FF3B4F]">methodology</span>
              </h2>
            </div>

            <p className="text-[#09090B]/80 text-base leading-relaxed font-sans font-medium bg-white p-8 rounded-3xl border border-[#E4E0EC] shadow-2xs">
              GameForge Systems AI runs 10,000-run Linear Congruential Generator (LCG) Monte Carlo simulations combined with static rule checks on raw GDD inputs. 
              Our specialist agents map system nodes to a central dependency matrix, helping designers detect loops, currency leaks, and motivation holes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
              <div className="bg-white border border-[#E4E0EC] p-6 rounded-3xl space-y-2">
                <span className="text-lg font-black text-[#FF3B4F] font-mono">01</span>
                <h4 className="font-bold text-sm font-space">Structured Architecture</h4>
                <p className="text-xs text-[#09090B]/70 leading-relaxed">Visual dependency graphs mapping mechanical connections.</p>
              </div>
              <div className="bg-white border border-[#E4E0EC] p-6 rounded-3xl space-y-2">
                <span className="text-lg font-black text-amber-600 font-mono">02</span>
                <h4 className="font-bold text-sm font-space">Monte Carlo Calibrator</h4>
                <p className="text-xs text-[#09090B]/70 leading-relaxed">Testing drop ratios over 10,000 automated player runs.</p>
              </div>
              <div className="bg-white border border-[#E4E0EC] p-6 rounded-3xl space-y-2">
                <span className="text-lg font-black text-[#00E676] font-mono">03</span>
                <h4 className="font-bold text-sm font-space">Ethical Paywall Audit</h4>
                <p className="text-xs text-[#09090B]/70 leading-relaxed">Bartle motivation scoring to preserve player fairness.</p>
              </div>
            </div>
          </section>
        )}

        {/* ─── 7. PRICING PAGE ─────────────────────────────────────────────────── */}
        {activePage === "pricing" && (
          <section className="max-w-7xl mx-auto px-6 space-y-12 animate-fadeIn">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold font-mono text-[#FF3B4F] uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full border border-red-100">TRANSPARENT PRICING</span>
              <h2 className="text-4xl md:text-6xl font-black text-[#09090B] font-space">
                CHOOSE YOUR STUDIO <span className="font-serif italic font-normal text-[#FF3B4F]">level</span>
              </h2>
              <p className="text-[#09090B]/60 text-sm max-w-xl mx-auto font-sans">Transparent subscription tiers tailored for indie designers and enterprise game studios.</p>

              <div className="inline-flex items-center gap-3 bg-white border border-[#E4E0EC] rounded-2xl p-1.5 mt-6 shadow-2xs">
                <button onClick={() => setBilling("monthly")} className={`px-5 py-2 rounded-xl text-xs font-extrabold font-mono transition-all ${billing === "monthly" ? "bg-[#09090B] text-white shadow-md" : "text-[#09090B]/60"}`}>MONTHLY</button>
                <button onClick={() => setBilling("annual")} className={`px-5 py-2 rounded-xl text-xs font-extrabold font-mono transition-all ${billing === "annual" ? "bg-[#09090B] text-white shadow-md" : "text-[#09090B]/60"}`}>ANNUAL PASS (SAVE 20%)</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PRICING.map((p) => (
                <div key={p.level} className={`border rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 ${p.color}`}>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className={`font-black text-xl font-space ${p.isDark ? "text-white" : "text-[#09090B]"}`}>{p.level}</h3>
                      <p className={`text-xs font-sans ${p.isDark ? "text-zinc-400" : "text-[#09090B]/60"}`}>{p.desc}</p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className={`text-5xl font-black font-mono ${p.isDark ? "text-white" : "text-[#09090B]"}`}>
                        {p.price === "Custom" ? "Custom" : `$${billing === "annual" ? p.price : Math.round(p.price! * 1.25)}`}
                      </span>
                      {p.price !== "Custom" && <span className={`text-xs ${p.isDark ? "text-zinc-400" : "text-[#09090B]/50"}`}>/ month</span>}
                    </div>

                    <ul className={`space-y-3.5 pt-6 border-t ${p.isDark ? "border-zinc-800 text-zinc-300" : "border-[#E4E0EC] text-[#09090B]/80"} text-xs font-sans`}>
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-3">
                          <CheckCircle2 size={16} className={p.isDark ? "text-[#00E676]" : "text-[#00E676] shrink-0"} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button onClick={onEnterApp} className="mt-10 w-full font-mono text-xs font-extrabold py-4 rounded-2xl bg-[#09090B] text-white hover:bg-black transition-colors">
                    UNLOCK PLAN CLASS
                  </button>
                </div>
              ))}
            </div>

            <div className="max-w-4xl mx-auto space-y-6 pt-10">
              <h3 className="text-2xl font-black font-space text-center">FREQUENTLY ASKED QUESTIONS</h3>
              <div className="space-y-4">
                {FAQS.map((faq, idx) => (
                  <div key={faq.q} className="border border-[#E4E0EC] bg-white rounded-2xl overflow-hidden shadow-2xs">
                    <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full flex justify-between p-5 text-left font-mono font-bold text-sm">
                      <span>{faq.q}</span>
                      <ChevronDown size={18} className={openFaq === idx ? "rotate-180" : ""} />
                    </button>
                    {openFaq === idx && <div className="p-5 border-t bg-[#FAFAFC] text-xs text-[#09090B]/80 font-sans">{faq.a}</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── 8. DOCUMENTATION PAGE ───────────────────────────────────────────── */}
        {activePage === "documentation" && (
          <section className="max-w-4xl mx-auto px-6 space-y-10 animate-fadeIn text-left">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold font-mono text-[#09090B] uppercase tracking-widest bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">DEVELOPER API & MCP SPEC</span>
              <h2 className="text-4xl md:text-6xl font-black text-[#09090B] font-space">
                SYSTEM <span className="font-serif italic font-normal text-amber-600">documentation</span>
              </h2>
            </div>

            <div className="bg-white border border-[#E4E0EC] p-8 rounded-3xl space-y-6 shadow-2xs font-mono text-xs">
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <Code2 size={18} /> REST API Endpoints & MCP Tools
              </div>
              <div className="bg-zinc-900 text-zinc-200 p-5 rounded-2xl space-y-2 overflow-x-auto">
                <p className="text-emerald-400">// MCP Tool Registry List Request</p>
                <p>GET /api/mcp/tools</p>
                <p className="text-emerald-400 mt-3">// Execute Economy Monte Carlo Tool</p>
                <p>POST /api/mcp/call/:projectId &#123; "toolName": "economy_calculate" &#125;</p>
              </div>
              <p className="text-[#09090B]/70 font-sans text-xs">
                GameForge AI exposes standardized Model Context Protocol (MCP) server endpoints allowing external agent SDKs to discover and execute permission-checked balancing functions.
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Footer (Rendered at bottom of EVERY page!) */}
      <footer className="border-t border-[#E4E0EC] bg-white px-6 py-14">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Studio & Brand */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActivePage("home")}>
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#09090B] via-zinc-900 to-[#FF3B4F] flex items-center justify-center overflow-hidden shadow-md">
                  <img src="/favicon.png" className="w-5 h-5 object-contain" alt="G" />
                </div>
                <div>
                  <span className="text-sm font-black tracking-widest text-[#09090B] font-mono block leading-none">GAMEFORGE<span className="text-[#FF3B4F]">.AI</span></span>
                  <span className="text-[9px] font-bold text-[#00E676] uppercase font-mono mt-0.5 block">Tool by Outrank Strategy</span>
                </div>
              </div>
              <p className="text-xs text-[#09090B]/70 leading-relaxed font-sans">
                GameForge AI is the internal design intelligence tool engineered for <strong className="text-[#09090B] font-semibold">Outrank Strategy</strong>, developers of the hit mobile game <strong className="text-[#FF3B4F]">Dice Masters</strong>.
              </p>
            </div>

            {/* Column 2: Flagship Mobile Games & Studio */}
            <div className="space-y-3 font-sans">
              <h4 className="text-xs font-black font-mono text-[#09090B] uppercase tracking-wider">OUTRANK STRATEGY STUDIO</h4>
              <ul className="space-y-2 text-xs text-[#09090B]/70">
                <li className="flex items-center gap-2">
                  <Coins size={13} className="text-[#FFD700]" />
                  <span className="font-bold text-[#09090B]">Dice Masters</span> (Mobile Game)
                </li>
                <li>Outrank Strategy Game Lab</li>
                <li>Mobile Economy Systems</li>
                <li>LiveOps & Churn Prevention</li>
              </ul>
            </div>

            {/* Column 3: Lead Developer & System Architect */}
            <div className="space-y-3 font-sans">
              <h4 className="text-xs font-black font-mono text-[#09090B] uppercase tracking-wider">DEVELOPER & ARCHITECT</h4>
              <div className="space-y-2 text-xs text-[#09090B]/70">
                <p className="font-bold text-[#09090B] flex items-center gap-1.5">
                  <Award size={14} className="text-amber-500" /> Irish Mancera
                </p>
                <p className="text-[11px] leading-relaxed text-[#09090B]/70">
                  Lead Mobile Game System Developer & Principal AI Architect behind Outrank Strategy and GameForge AI.
                </p>
              </div>
            </div>

            {/* Column 4: Quick Navigation Links */}
            <div className="space-y-3 font-sans">
              <h4 className="text-xs font-black font-mono text-[#09090B] uppercase tracking-wider">NAVIGATION</h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#09090B]/70">
                {NAV_ITEMS.map((item) => (
                  <button key={item.key} onClick={() => setActivePage(item.key)} className="text-left hover:text-[#FF3B4F] transition-colors">
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#E4E0EC] flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-[#09090B]/60">
            <p>© 2026 Outrank Strategy & Irish Mancera. All rights reserved.</p>
            <p className="text-[11px] text-[#09090B]/50">GameForge.AI — Powered by Dice Masters Engineering</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
