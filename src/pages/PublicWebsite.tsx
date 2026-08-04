import { useState } from "react";
import { ChevronRight, Check, ChevronDown, Zap, Shield, BarChart2, Brain, Table2, ArrowRight } from "lucide-react";

interface PublicWebsiteProps {
  onEnterApp: () => void;
}

const NAV_LINKS = ["Product", "Solutions", "Templates", "Workbook Gallery", "Methodology", "Pricing", "Documentation"];

const GENRE_TEMPLATES = [
  { name: "Idle Clicker", icon: "⚡", systems: 12, tabs: 28, time: "45 min" },
  { name: "Tycoon", icon: "🏙", systems: 18, tabs: 32, time: "60 min" },
  { name: "Merge Mania", icon: "🧩", systems: 10, tabs: 24, time: "35 min" },
  { name: "Match Puzzle", icon: "🔮", systems: 8, tabs: 22, time: "30 min" },
  { name: "RPG Quest", icon: "⚔️", systems: 24, tabs: 34, time: "90 min" },
  { name: "Hotel Empire", icon: "🏨", systems: 15, tabs: 34, time: "55 min" },
  { name: "Farming Sim", icon: "🌾", systems: 14, tabs: 30, time: "50 min" },
  { name: "Survival Craft", icon: "🏕", systems: 20, tabs: 33, time: "75 min" },
];

const AGENTS = [
  { name: "Architect AI", icon: "🏗", roleClass: "System Builder", skill: "Dependency Node Mapping", pwr: "98%", desc: "Transforms raw game concepts into structured connection graphs and maps cross-system dependencies.", color: "border-[#6C3BFF]/30 bg-[#6C3BFF]/5 hover:border-[#6C3BFF]" },
  { name: "Balancer AI", icon: "⚖️", roleClass: "Economy Sage", skill: "Monte Carlo Curve Calibration", pwr: "95%", desc: "Simulates currencies, faucets, sinks, and reward tables against mathematical churn indicators.", color: "border-[#19C6D1]/30 bg-[#19C6D1]/5 hover:border-[#19C6D1]" },
  { name: "Auditor AI", icon: "🔍", roleClass: "Risk Ranger", skill: "Anti-inflation Integrity Scans", pwr: "97%", desc: "Automatically flags broken progression gaps, reward loops, and paywall spikes before deployment.", color: "border-[#FF3B4F]/30 bg-[#FF3B4F]/5 hover:border-[#FF3B4F]" },
  { name: "Psychologist AI", icon: "🧠", roleClass: "Mind Mage", skill: "Ethical Engagement Audits", pwr: "94%", desc: "Evaluates Bartle motivation scores, excitement curves, and pay-to-win mechanics for long-term health.", color: "border-[#FFC928]/30 bg-[#FFC928]/5 hover:border-[#FFC928]" },
  { name: "Documenter AI", icon: "📄", roleClass: "Workbook Scribe", skill: "Automated Workbook Compiler", pwr: "99%", desc: "Compiles balanced design data into developer-ready XLSX workbooks with formulas and layout tables.", color: "border-[#19A974]/30 bg-[#19A974]/5 hover:border-[#19A974]" },
];

const PRICING = [
  {
    level: "LVL 1 — Solo Designer",
    price: 23,
    period: "billed annually ($29 monthly)",
    desc: "Perfect for indie game designers building single prototypes.",
    color: "border-[#2C2755] bg-[#0F0C24]/60",
    features: ["1 Active Project Workspace", "10 Connected Systems", "All Core Balancer Modules", "5 Simulation Runs / month", "Developer Workbook (XLSX) Export", "Community Support Guild"],
  },
  {
    level: "LVL 50 — Studio Class",
    price: 79,
    period: "billed annually ($99 monthly)",
    desc: "For creative teams scaling multiple connected projects.",
    color: "border-[#6C3BFF] bg-[#6C3BFF]/5 shadow-[0_0_30px_rgba(108,59,255,0.25)]",
    highlight: true,
    features: ["10 Active Project Workspaces", "Unlimited Connected Systems", "Team Collaboration (5 Seats Included)", "Unlimited Monte Carlo Simulations", "All Workbook & GDD Export Formats", "AI Copilot Priority Quota", "Dedicated Priority Support"],
  },
  {
    level: "LVL 100 — Enterprise Overlord",
    price: "Custom",
    period: "custom licensing options",
    desc: "For publishing houses and studios requiring heavy simulations.",
    color: "border-[#2C2755] bg-[#17152B]/40",
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
  const [legendaryRate, setLegendaryRate] = useState(1);
  const [rareRate, setRareRate] = useState(10);
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
        color: "bg-red-500/10 border-red-500/30 text-red-400",
      };
    }
    if (legendaryRate < 0.5) {
      return {
        title: "⚡ Player Retention Churn Warning",
        desc: "Legendary drop rate is below 0.5%. Players will encounter prolonged reward dry spells, causing high frustration metrics and early churn.",
        color: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      };
    }
    return {
      title: "✨ Optimized Progression Pacing",
      desc: "Optimal balance achieved! Legendary scarcity is preserved while providing satisfying micro-rewards for D7 engagement.",
      color: "bg-green-500/10 border-green-500/30 text-green-400",
    };
  };

  const audit = getAuditMessage();

  return (
    <div className="bg-[#0F0C24] rounded-2xl border border-[#2C2755] p-6 max-w-2xl mx-auto shadow-2xl space-y-6 text-left relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#6C3BFF]/10 rounded-full blur-xl pointer-events-none" />
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#6C3BFF]/20 text-[#8B5CFF] border border-[#6C3BFF]/40 uppercase tracking-wider font-mono">SIMULATION TERMINAL v1.0.4</span>
          <h3 className="text-lg font-bold text-white font-mono">MONTE CARLO LOOT ENGINE</h3>
        </div>
        <p className="text-xs text-white/60 mt-1">Calibrate loot box rarities to run rapid simulations and generate real-time balance diagnostics.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold text-white/80 mb-1 font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FFC928] block" /> LEGENDARY DROP RATE</span>
              <span>{legendaryRate}%</span>
            </div>
            <input
              type="range" min="0.1" max="15" step="0.1"
              value={legendaryRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setLegendaryRate(val);
                if (val + rareRate > 100) setRareRate(100 - val);
              }}
              className="w-full accent-[#FFC928]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-white/80 mb-1 font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#19C6D1] block" /> RARE DROP RATE</span>
              <span>{rareRate}%</span>
            </div>
            <input
              type="range" min="1" max="50" step="1"
              value={rareRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setRareRate(val);
                if (val + legendaryRate > 100) setLegendaryRate(100 - val);
              }}
              className="w-full accent-[#19C6D1]"
            />
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={simulating}
          className="w-full bg-[#6C3BFF] text-white text-xs font-bold font-mono py-3 rounded-xl hover:bg-[#5a2fe0] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 border border-[#8B5CFF]/30 shadow-[0_4px_20px_rgba(108,59,255,0.4)]"
        >
          {simulating ? "🌀 PROCESSING RUNS..." : "⚙️ SPIN 100 MONTE CARLO ROLLS"}
        </button>

        {rolls && !simulating && (
          <div className="space-y-4 pt-4 border-t border-[#2C2755] animate-fadeIn">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#FFC928]/5 border border-[#FFC928]/25 rounded-xl p-3">
                <span className="text-2xl font-bold font-mono text-[#FFC928]">{rolls.legendary}</span>
                <div className="text-[10px] font-mono text-white/50 mt-0.5">LEGENDARIES</div>
              </div>
              <div className="bg-[#19C6D1]/5 border border-[#19C6D1]/25 rounded-xl p-3">
                <span className="text-2xl font-bold font-mono text-[#19C6D1]">{rolls.rare}</span>
                <div className="text-[10px] font-mono text-white/50 mt-0.5">RARES</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="text-2xl font-bold font-mono text-white/80">{rolls.common}</span>
                <div className="text-[10px] font-mono text-white/50 mt-0.5">COMMONS</div>
              </div>
            </div>

            {audit && (
              <div className={`p-4 rounded-xl border flex gap-3 items-start ${audit.color} bg-white/5`}>
                <div className="text-lg shrink-0">🤖</div>
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
  const [activePage, setActivePage] = useState<"home" | "pricing" | "templates" | "methodology">("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-y-auto bg-[#080516] text-white selection:bg-[#6C3BFF]/40 scroll-smooth">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-[#6C3BFF]/10 blur-[120px]" />
        <div className="absolute bottom-[-150px] right-[-100px] w-[600px] h-[600px] rounded-full bg-[#19C6D1]/8 blur-[140px]" />
        <div className="absolute inset-0 bg-repeat opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%236C3BFF' fill-opacity='0.4'%3E%3Cpath fill-rule='evenodd' d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0A071E]/80 backdrop-blur-xl border-b border-[#2C2755]/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActivePage("home")}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6C3BFF] to-[#19C6D1] flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(108,59,255,0.45)]">
              <img src="/favicon.png" className="w-5 h-5 object-contain" alt="Logo" />
            </div>
            <span style={{ fontFamily: "Orbitron, sans-serif" }} className="text-sm font-bold tracking-widest text-white">GAMEFORGE AI</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                onClick={() => {
                  if (link === "Pricing") setActivePage("pricing");
                  else if (link === "Templates") setActivePage("templates");
                  else if (link === "Methodology") setActivePage("methodology");
                  else setActivePage("home");
                }}
                className="text-sm text-white/70 hover:text-white hover:scale-105 transition-all font-medium"
              >
                {link}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onEnterApp} className="text-sm text-white/70 hover:text-white font-semibold transition-colors">Sign In</button>
            <button onClick={onEnterApp} className="flex items-center gap-1.5 bg-[#6C3BFF] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#5a2fe0] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(108,59,255,0.4)]">
              LAUNCH DECK <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Pages Router */}
      {activePage === "home" && (
        <div className="space-y-24 py-16">
          {/* Hero */}
          <section className="max-w-7xl mx-auto px-6 text-center space-y-8 relative">
            <div className="inline-flex items-center gap-2 bg-[#6C3BFF]/15 border border-[#6C3BFF]/40 rounded-full px-4 py-1.5 text-xs font-mono text-[#8B5CFF] shadow-[0_0_15px_rgba(108,59,255,0.15)]">
              <Zap size={13} className="animate-pulse" /> MONTE CARLO INTEGRITY SYSTEM ONLINE
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight max-w-5xl mx-auto">
              Build game economies that <br />
              <span className="bg-gradient-to-r from-[#6C3BFF] via-[#8B5CFF] to-[#19C6D1] bg-clip-text text-transparent">survive the player meta.</span>
            </h1>
            <p className="text-base md:text-lg text-white/60 max-w-3xl mx-auto leading-relaxed">
              Design, test, and audit mechanics with specialist AI agents. Model player motivation loops, predict currency inflation, and export developer-ready spreadsheets.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={onEnterApp} className="flex items-center gap-2 bg-[#6C3BFF] text-white font-bold px-7 py-3.5 rounded-xl hover:bg-[#5a2fe0] transition-all hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(108,59,255,0.5)] text-sm">
                INITIALIZE WORKSPACE <ArrowRight size={16} />
              </button>
              <button onClick={onEnterApp} className="flex items-center gap-2 border border-[#2C2755] bg-white/5 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-all text-sm">
                LOAD SAMPLE PROJECT
              </button>
            </div>
          </section>

          {/* Interactive Simulation widget */}
          <section className="max-w-7xl mx-auto px-6 text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">Stress-Test Your Balance on the Fly</h2>
              <p className="text-white/60 text-sm max-w-xl mx-auto">Calibrate loot curves below to verify rewards pacing against early progression limits.</p>
            </div>
            <GachaSimulator />
          </section>

          {/* Specialist Agents Decks */}
          <section className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-3xl md:text-4xl font-extrabold">CHOOSE YOUR SPECIALIST AGENT CLASS</h2>
              <p className="text-white/60 text-sm max-w-xl mx-auto">Assemble your optimization party to build complete, compliant, and balanced design registries.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {AGENTS.map((a) => (
                <div 
                  key={a.name} 
                  className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(108,59,255,0.15)] group ${a.color}`}
                >
                  <div>
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{a.icon}</div>
                    <h3 className="font-extrabold text-lg text-white font-mono">{a.name}</h3>
                    <div className="text-[10px] font-bold text-[#19C6D1] uppercase font-mono tracking-wider mt-0.5">{a.roleClass}</div>
                    <p className="text-xs text-white/70 leading-relaxed mt-4">{a.desc}</p>
                  </div>
                  <div className="pt-5 border-t border-[#2C2755] mt-6 space-y-1.5 font-mono text-[9px]">
                    <div className="flex justify-between">
                      <span className="text-white/40">SPECIALTY:</span>
                      <span className="text-white/80 text-right truncate max-w-[120px]">{a.skill}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">ACCURACY PWR:</span>
                      <span className="text-[#FFC928] font-bold">{a.pwr}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Workflow Skill Tree */}
          <section className="bg-[#0F0C24]/50 border-y border-[#2C2755]/50 py-20 px-6">
            <div className="max-w-7xl mx-auto space-y-12">
              <div className="text-center space-y-2">
                <h2 className="text-3xl md:text-4xl font-extrabold">THE SYSTEMS BALANCING PIPELINE</h2>
                <p className="text-white/60 text-sm max-w-xl mx-auto">Map your idea to a verified, game-ready worksheet step-by-step.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6 relative">
                {WORKFLOW.map((w, i) => (
                  <div key={w.step} className="relative flex flex-col justify-between bg-[#080516] border border-[#2C2755] rounded-2xl p-5 shadow-lg group hover:border-[#6C3BFF]/50 transition-all">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-mono font-bold text-[#6C3BFF] bg-[#6C3BFF]/10 px-2 py-0.5 rounded">{w.step}</span>
                        <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">STAGE</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-white font-mono mb-1">{w.label}</h4>
                      <div className="text-[10px] text-[#19C6D1] font-bold mb-3">{w.action}</div>
                      <p className="text-[11px] text-white/60 leading-relaxed">{w.desc}</p>
                    </div>
                    {i < WORKFLOW.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 z-10 translate-x-1.5">
                        <ChevronRight size={16} className="text-[#6C3BFF]/40 group-hover:text-[#6C3BFF] transition-colors" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Genre Templates Panel */}
          <section className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-3xl md:text-4xl font-extrabold">READY GENRE GRID PRESETS</h2>
              <p className="text-white/60 text-sm max-w-xl mx-auto">Deploy verified templates with preset drop lists, leveling structures, and currencies.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {GENRE_TEMPLATES.map((t) => (
                <div key={t.name} className="bg-[#0F0C24]/60 border border-[#2C2755] rounded-2xl p-5 hover:border-[#6C3BFF] transition-all duration-200 hover:-translate-y-1 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-[#6C3BFF]/5 rounded-full blur-xl pointer-events-none" />
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">{t.icon}</div>
                  <h3 className="font-extrabold text-lg text-white font-mono mb-3">{t.name}</h3>
                  <div className="text-xs text-white/60 space-y-2 border-t border-[#2C2755]/50 pt-3">
                    <div className="flex justify-between">
                      <span>CONNECTED SYSTEMS:</span>
                      <span className="font-mono text-white">{t.systems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>WORKBOOK SPREADSHEETS:</span>
                      <span className="font-mono text-white">{t.tabs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AVERAGE PacinG SETUP:</span>
                      <span className="font-mono text-[#19C6D1]">{t.time}</span>
                    </div>
                  </div>
                  <button onClick={onEnterApp} className="mt-5 w-full text-xs font-bold font-mono text-white bg-[#6C3BFF] py-2 rounded-xl hover:bg-[#5a2fe0] transition-colors shadow-md">
                    INITIALIZE GENRE
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Ethics / Fairness */}
          <section className="bg-gradient-to-r from-[#0F0C24] via-[#1E143A] to-[#0F0C24] py-16 px-6 border-y border-[#2C2755]/40 text-center">
            <div className="max-w-3xl mx-auto space-y-4">
              <Shield size={36} className="text-[#19A974] mx-auto animate-pulse" />
              <h3 className="text-2xl md:text-3xl font-extrabold text-white">Responsible Player Psychology, By Design</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Configure Bartle engagement archetypes and ethical paywall monitors. Ensure drop loops reward effort fairly without building manipulative design structures that drive negative ratings.
              </p>
            </div>
          </section>

          {/* Pricing Package Tiers */}
          <section id="pricing" className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-3xl md:text-4xl font-extrabold">SELECT YOUR LEVEL PLAN</h2>
              <p className="text-white/60 text-sm max-w-xl mx-auto">Choose the development tier that matches your current game production team size.</p>
              <div className="inline-flex items-center gap-3 bg-[#0F0C24] border border-[#2C2755] rounded-xl p-1 mt-6">
                <button onClick={() => setBilling("monthly")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${billing === "monthly" ? "bg-[#6C3BFF] text-white" : "text-white/50"}`}>MONTHLY RUNS</button>
                <button onClick={() => setBilling("annual")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${billing === "annual" ? "bg-[#6C3BFF] text-white" : "text-white/50"}`}>ANNUAL PASS (SAVE 20%)</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PRICING.map((p) => (
                <div key={p.level} className={`border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${p.color}`}>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-lg text-white font-mono">{p.level}</h3>
                      <p className="text-xs text-white/50">{p.desc}</p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold font-mono text-white">
                        {p.price === "Custom" ? "Custom" : `$${billing === "annual" ? p.price : Math.round(p.price! * 1.25)}`}
                      </span>
                      {p.price !== "Custom" && <span className="text-xs text-white/40">/ month</span>}
                    </div>
                    <div className="text-[10px] text-white/40 uppercase font-mono font-semibold">{p.period}</div>

                    <ul className="space-y-3 pt-6 border-t border-[#2C2755]/50 text-xs text-white/70">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5">
                          <Check size={14} className="text-[#19C6D1] shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button onClick={onEnterApp} className={`mt-8 w-full font-mono text-xs font-bold py-3 rounded-xl transition-all hover:scale-105 active:scale-95 ${p.highlight ? "bg-[#6C3BFF] text-white shadow-lg" : "bg-white/10 text-white hover:bg-white/20"}`}>
                    UNLOCK CLASS
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ Accordion */}
          <section className="max-w-4xl mx-auto px-6 space-y-8">
            <h2 className="text-3xl font-extrabold text-center">FREQUENTLY ASKED QUESTIONS</h2>
            <div className="space-y-4">
              {FAQS.map((faq, idx) => (
                <div key={faq.q} className="border border-[#2C2755] bg-[#0F0C24]/30 rounded-xl overflow-hidden transition-all">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-white hover:bg-white/5 transition-colors font-mono"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={16} className={`text-white/50 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="p-5 border-t border-[#2C2755]/50 bg-[#080516]/50 text-xs text-white/70 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activePage === "pricing" && (
        <div className="py-20">
          <section className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-extrabold">SELECT YOUR LEVEL PLAN</h2>
              <p className="text-white/60 text-sm max-w-xl mx-auto">Choose the development tier that matches your current game production team size.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PRICING.map((p) => (
                <div key={p.level} className={`border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 ${p.color}`}>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-extrabold text-lg text-white font-mono">{p.level}</h3>
                      <p className="text-xs text-white/50 mt-1">{p.desc}</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold font-mono text-white">
                        {p.price === "Custom" ? "Custom" : `$${p.price}`}
                      </span>
                      {p.price !== "Custom" && <span className="text-xs text-white/40">/ month</span>}
                    </div>
                    <ul className="space-y-3 pt-6 border-t border-[#2C2755]/50 text-xs text-white/70">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5">
                          <Check size={14} className="text-[#19C6D1] shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={onEnterApp} className={`mt-8 w-full font-mono text-xs font-bold py-3 rounded-xl transition-all ${p.highlight ? "bg-[#6C3BFF] text-white" : "bg-white/10 text-white"}`}>
                    UNLOCK CLASS
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activePage === "templates" && (
        <div className="py-20">
          <section className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-extrabold">GENRE WORKSPACE PRESETS</h2>
              <p className="text-white/60 text-sm max-w-xl mx-auto">Launch your project with calibrated game balance baselines.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {GENRE_TEMPLATES.map((t) => (
                <div key={t.name} className="bg-[#0F0C24]/60 border border-[#2C2755] rounded-2xl p-5 hover:border-[#6C3BFF] transition-all relative">
                  <div className="text-4xl mb-4">{t.icon}</div>
                  <h3 className="font-extrabold text-lg text-white font-mono mb-3">{t.name}</h3>
                  <div className="text-xs text-white/60 space-y-2 border-t border-[#2C2755]/50 pt-3">
                    <div className="flex justify-between">
                      <span>SYSTEMS:</span>
                      <span className="font-mono text-white">{t.systems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>WORKBOOKS:</span>
                      <span className="font-mono text-white">{t.tabs}</span>
                    </div>
                  </div>
                  <button onClick={onEnterApp} className="mt-5 w-full text-xs font-bold font-mono text-white bg-[#6C3BFF] py-2 rounded-xl">
                    USE PRESET
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activePage === "methodology" && (
        <div className="py-20">
          <section className="max-w-3xl mx-auto px-6 space-y-8 text-left">
            <h2 className="text-4xl font-extrabold text-center font-mono">THE GAMEFORGE METHODOLOGY</h2>
            <p className="text-white/70 text-sm leading-relaxed">
              GameForge Systems AI runs deterministic math simulations combined with static rule checks on raw GDD inputs. 
              Our specialist agents map system nodes to a central dependency matrix, helping designers detect loops, currency leaks, and motivation holes.
            </p>
            <div className="bg-[#0F0C24] border border-[#2C2755] rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white font-mono">Core Verification Pillars:</h3>
              <ul className="space-y-3 text-xs text-white/70">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#6C3BFF] font-bold">1.</span>
                  <span>**Structured Architecture:** Complete visual dependency graph of mechanical connections.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#6C3BFF] font-bold">2.</span>
                  <span>**Monte Carlo Calibrator:** Testing item drop ratios over 10,000 automated sessions.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#6C3BFF] font-bold">3.</span>
                  <span>**Ethical Playwalls:** Bartle Motivations compliance scoring system to preserve fairness.</span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#2C2755]/50 bg-[#080516] px-6 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6C3BFF] to-[#19C6D1] flex items-center justify-center overflow-hidden">
              <img src="/favicon.png" className="w-4 h-4 object-contain" alt="G" />
            </div>
            <span style={{ fontFamily: "Orbitron, sans-serif" }} className="text-xs font-bold tracking-widest text-white">GAMEFORGEAI SYSTEMS AI</span>
          </div>
          <div className="flex gap-6 text-xs text-white/50">
            {["Privacy Policy", "Terms of Service", "Security", "Status", "Contact"].map((l) => (
              <button key={l} className="hover:text-white transition-colors">{l}</button>
            ))}
          </div>
          <p className="text-xs text-white/40">© 2026 GameForgeAI Systems AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
