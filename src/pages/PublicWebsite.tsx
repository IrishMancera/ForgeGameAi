import { useState } from "react";
import { ChevronRight, Check, ChevronDown, Zap, Shield, BarChart2, Brain, Table2, ArrowRight } from "lucide-react";

interface PublicWebsiteProps {
  onEnterApp: () => void;
}

const NAV_LINKS = ["Product", "Solutions", "Templates", "Workbook Gallery", "Methodology", "Pricing", "Documentation"];

const GENRE_TEMPLATES = [
  { name: "Idle", icon: "⚡", systems: 12, tabs: 28, time: "45 min" },
  { name: "Tycoon", icon: "🏙", systems: 18, tabs: 32, time: "60 min" },
  { name: "Merge", icon: "🧩", systems: 10, tabs: 24, time: "35 min" },
  { name: "Puzzle", icon: "🔮", systems: 8, tabs: 22, time: "30 min" },
  { name: "RPG", icon: "⚔️", systems: 24, tabs: 34, time: "90 min" },
  { name: "Hotel", icon: "🏨", systems: 15, tabs: 34, time: "55 min" },
  { name: "Farming", icon: "🌾", systems: 14, tabs: 30, time: "50 min" },
  { name: "Survival", icon: "🏕", systems: 20, tabs: 33, time: "75 min" },
];

const AGENTS = [
  { name: "Architect", icon: "🏗", desc: "Maps your game concept into a connected system graph with dependencies and loops.", color: "bg-[#6C3BFF]/10 border-[#6C3BFF]/20" },
  { name: "Balancer", icon: "⚖️", desc: "Models economies, formulas, and progression curves against real player behavior benchmarks.", color: "bg-[#19C6D1]/10 border-[#19C6D1]/20" },
  { name: "Auditor", icon: "🔍", desc: "Finds broken dependencies, content gaps, paywall spikes, and missing analytics events.", color: "bg-[#FF3B4F]/10 border-[#FF3B4F]/20" },
  { name: "Psychologist", icon: "🧠", desc: "Reviews player motivation, cognitive load, ethical risk, and reward quality.", color: "bg-[#FFC928]/10 border-[#FFC928]/20" },
  { name: "Documenter", icon: "📄", desc: "Generates developer-ready workbooks, handoff notes, and annotated formula tables.", color: "bg-[#19A974]/10 border-[#19A974]/20" },
];

const PRICING = [
  {
    name: "Solo Designer",
    monthly: 29,
    annual: 23,
    color: "border-[#DED9EA]",
    features: ["1 project", "10 systems", "All core modules", "5 simulation runs/month", "XLSX export", "Community support"],
  },
  {
    name: "Studio",
    monthly: 99,
    annual: 79,
    color: "border-[#6C3BFF]",
    highlight: true,
    features: ["10 projects", "Unlimited systems", "Team collaboration (5 seats)", "Unlimited simulations", "All export formats", "AI Copilot priority", "Priority support"],
  },
  {
    name: "Enterprise",
    monthly: null,
    annual: null,
    color: "border-[#17152B]",
    features: ["Unlimited projects & seats", "SSO & audit logs", "Custom integrations", "Dedicated AI quota", "SLA & private deployment", "Onboarding workshop"],
  },
];

const WORKFLOW = [
  { step: "01", label: "Extract", desc: "Upload GDDs, spreadsheets, notes, and mockups. AI extracts facts, assumptions, and contradictions." },
  { step: "02", label: "Structure", desc: "Systems, economies, and progression are organized into a connected blueprint with dependency graph." },
  { step: "03", label: "Model", desc: "Formulas are validated, currencies balanced, and progression curves fitted to realistic player behavior." },
  { step: "04", label: "Simulate", desc: "Cohort simulations test assumptions before a single line of game code is written." },
  { step: "05", label: "Audit", desc: "Automated audit finds gaps, paywall spikes, broken dependencies, and ethical risk flags." },
  { step: "06", label: "Export", desc: "Generate developer-ready XLSX workbooks with formulas, charts, and annotated handoff notes." },
];

const FAQS = [
  { q: "Is this a game engine or a spreadsheet tool?", a: "Neither. GameForge Systems AI is a design intelligence platform that sits between your concept and your developer. It helps you think clearly, catch problems early, and produce developer-ready documentation." },
  { q: "Can I import my existing GDD or Excel file?", a: "Yes. The Knowledge Base accepts PDFs, DOCX, Excel, CSV, JSON schemas, and images. AI extracts structured data and maps it to your blueprint automatically." },
  { q: "Is my game data private?", a: "Yes. All project data is encrypted at rest and in transit. Your designs are never used to train shared models. Enterprise plans support private deployment." },
  { q: "What happens if I cancel?", a: "You keep read access to all exported workbooks. Project data is retained for 90 days." },
];

export default function PublicWebsite({ onEnterApp }: PublicWebsiteProps) {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activePage, setActivePage] = useState<"home" | "pricing" | "templates" | "methodology">("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(108,59,255,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(25,198,209,0.18),_transparent_35%),linear-gradient(135deg,_#fff9f2_0%,_#fef8f1_45%,_#f7f0ff_100%)] text-[#17152B]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-orb ambient-orb-left" />
        <div className="ambient-orb ambient-orb-right" />
        <div className="grid-overlay" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-[#DED9EA]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => setActivePage("home")}>
            <div className="w-7 h-7 rounded-lg bg-[#6C3BFF] flex items-center justify-center">
              <span style={{ fontFamily: "Orbitron, sans-serif" }} className="text-white font-bold text-sm">G</span>
            </div>
            <span style={{ fontFamily: "Orbitron, sans-serif" }} className="text-xs font-bold text-[#17152B] uppercase tracking-wider">GameForge AI</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-5 flex-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                onClick={() => {
                  if (link === "Pricing") setActivePage("pricing");
                  else if (link === "Templates") setActivePage("templates");
                  else if (link === "Methodology") setActivePage("methodology");
                  else setActivePage("home");
                }}
                className="text-sm text-[#6C6880] hover:text-[#17152B] transition-colors whitespace-nowrap"
              >
                {link}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button onClick={onEnterApp} className="text-sm text-[#6C6880] hover:text-[#17152B]">Sign In</button>
            <button onClick={onEnterApp} className="flex items-center gap-1.5 bg-[#6C3BFF] text-white text-sm font-semibold px-4 py-2 rounded-[10px] hover:bg-[#5a2fe0] transition-colors">
              Start Your Blueprint <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {activePage === "home" && (
        <>
          {/* Hero */}
          <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
            <div className="inline-flex items-center gap-2 bg-[#F4F1FA] border border-[#DED9EA] rounded-full px-3 py-1.5 text-xs font-medium text-[#6C3BFF] mb-6">
              <Zap size={12} /> Now with Monte Carlo simulation and ethical AI audit
            </div>
            <h1 className="text-5xl font-bold text-[#17152B] mb-4 leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Build a game system that<br />
              <span className="text-[#6C3BFF]">survives contact with real players.</span>
            </h1>
            <p className="text-lg text-[#6C6880] max-w-2xl mx-auto mb-8 leading-relaxed">
              Turn ideas and incomplete documents into connected mechanics, balanced economies, ethical player experiences, simulations, audits, and developer-ready workbooks.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={onEnterApp} className="flex items-center gap-2 bg-[#6C3BFF] text-white font-semibold px-6 py-3 rounded-[10px] hover:bg-[#5a2fe0] transition-colors text-sm">
                Start Your Blueprint <ArrowRight size={15} />
              </button>
              <button onClick={onEnterApp} className="flex items-center gap-2 border border-[#DED9EA] text-[#17152B] font-medium px-6 py-3 rounded-[10px] hover:bg-[#F4F1FA] transition-colors text-sm">
                Explore Sample Project
              </button>
            </div>
          </section>

          {/* Dashboard preview strip */}
          <section className="bg-[#17152B] py-10 px-6 mb-16">
            <div className="max-w-6xl mx-auto">
              <div className="rounded-2xl bg-[#1E1B35] border border-[#DED9EA]/10 overflow-hidden" style={{ boxShadow: "0 24px 80px rgba(108,59,255,0.3)" }}>
                <div className="h-8 bg-[#17152B] flex items-center px-4 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF3B4F]/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFC928]/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#19A974]/70" />
                  <span className="ml-4 text-[10px] font-mono text-white/30">Haunted Hotel — System Health · System Architect AI</span>
                </div>
                <div className="grid grid-cols-4 gap-3 p-5">
                  {[
                    { label: "System Health", value: "84/100", color: "text-[#19A974]" },
                    { label: "Blueprint", value: "86%", color: "text-[#6C3BFF]" },
                    { label: "Critical Risks", value: "2", color: "text-[#FF3B4F]" },
                    { label: "Open Decisions", value: "7", color: "text-[#FFC928]" },
                  ].map((m) => (
                    <div key={m.label} className="bg-white/5 rounded-xl p-3">
                      <div className={`text-2xl font-bold font-mono ${m.color}`}>{m.value}</div>
                      <div className="text-[10px] text-white/50 mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Agents */}
          <section className="max-w-7xl mx-auto px-6 pb-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-[#17152B] mb-2">Five specialist agents, one coherent system</h2>
              <p className="text-[#6C6880] text-base">Each agent has a distinct role — together they cover every stage of game design documentation.</p>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {AGENTS.map((a) => (
                <div key={a.name} className={`bg-white rounded-[14px] border p-5 ${a.color}`} style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
                  <div className="text-2xl mb-3">{a.icon}</div>
                  <div className="font-bold text-sm text-[#17152B] mb-1">{a.name}</div>
                  <p className="text-xs text-[#6C6880] leading-relaxed">{a.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Workflow */}
          <section className="bg-[#F4F1FA] py-16 px-6 mb-16">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[#17152B] mb-2">From idea to workbook</h2>
              </div>
              <div className="grid grid-cols-6 gap-4">
                {WORKFLOW.map((w, i) => (
                  <div key={w.step} className="relative">
                    <div className="bg-white rounded-[14px] border border-[#DED9EA] p-4 h-full" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
                      <div className="text-[10px] font-mono font-bold text-[#6C3BFF] mb-1">{w.step}</div>
                      <div className="font-bold text-sm text-[#17152B] mb-1">{w.label}</div>
                      <p className="text-[11px] text-[#6C6880] leading-relaxed">{w.desc}</p>
                    </div>
                    {i < WORKFLOW.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-2 -translate-y-1/2 z-10">
                        <ChevronRight size={14} className="text-[#DED9EA]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Genre templates preview */}
          <section className="max-w-7xl mx-auto px-6 pb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#17152B] mb-2">Start with a genre template</h2>
              <p className="text-[#6C6880]">Pre-built system registries, economies, and workbooks — customize in minutes.</p>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {GENRE_TEMPLATES.map((t) => (
                <div key={t.name} className="bg-white rounded-[14px] border border-[#DED9EA] p-5 hover:border-[#6C3BFF] transition-colors cursor-pointer" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
                  <div className="text-3xl mb-3">{t.icon}</div>
                  <div className="font-bold text-base text-[#17152B] mb-2">{t.name}</div>
                  <div className="text-xs text-[#6C6880] space-y-1">
                    <div>{t.systems} systems included</div>
                    <div>{t.tabs} workbook tabs</div>
                    <div>Setup: ~{t.time}</div>
                  </div>
                  <button className="mt-3 w-full text-[10px] font-semibold text-[#6C3BFF] bg-[#F4F1FA] py-1.5 rounded-lg hover:bg-[#6C3BFF]/10 transition-colors">
                    Use Template →
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Responsible design statement */}
          <section className="bg-[#17152B] py-12 px-6 mb-16">
            <div className="max-w-3xl mx-auto text-center">
              <Shield size={32} className="text-[#19A974] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">Responsible player psychology, by design</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Every GameForge project includes an Ethical Risk audit that flags deceptive timers, undisclosed odds, coercive scarcity, and pay-to-progress walls. If you ask the AI to optimize for manipulation, it refuses and offers fair alternatives instead. Great games don't exploit players — they earn their time.
              </p>
            </div>
          </section>

          {/* Final CTA */}
          <section className="max-w-7xl mx-auto px-6 pb-20 text-center">
            <h2 className="text-4xl font-bold text-[#17152B] mb-4">Ready to build something that works?</h2>
            <p className="text-[#6C6880] mb-8 text-lg">Your first project is free. No credit card required.</p>
            <button onClick={onEnterApp} className="flex items-center gap-2 bg-[#6C3BFF] text-white font-bold px-8 py-4 rounded-[10px] hover:bg-[#5a2fe0] transition-colors text-base mx-auto">
              Start Your Blueprint <ArrowRight size={18} />
            </button>
          </section>
        </>
      )}

      {activePage === "pricing" && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-[#17152B] mb-2">Simple, transparent pricing</h1>
            <p className="text-[#6C6880] mb-6">All plans include a 14-day free trial.</p>
            <div className="inline-flex items-center gap-1 bg-[#F4F1FA] border border-[#DED9EA] rounded-lg p-1">
              {(["monthly", "annual"] as const).map((b) => (
                <button key={b} onClick={() => setBilling(b)}
                  className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${billing === b ? "bg-white text-[#17152B] shadow-sm" : "text-[#6C6880]"}`}>
                  {b} {b === "annual" && <span className="text-[#19A974] text-xs">–20%</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan) => (
              <div key={plan.name} className={`bg-white rounded-[14px] border-2 p-6 ${plan.color} ${plan.highlight ? "shadow-2xl shadow-[#6C3BFF]/15 scale-105" : ""}`}>
                {plan.highlight && (
                  <div className="text-[10px] font-bold text-[#6C3BFF] bg-[#F4F1FA] px-2 py-0.5 rounded-full inline-block mb-3">MOST POPULAR</div>
                )}
                <h3 className="font-bold text-lg text-[#17152B] mb-1">{plan.name}</h3>
                <div className="mb-5">
                  {plan.monthly ? (
                    <>
                      <span className="text-3xl font-bold font-mono text-[#17152B]">${billing === "monthly" ? plan.monthly : plan.annual}</span>
                      <span className="text-[#6C6880] text-sm">/mo</span>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-[#17152B]">Custom pricing</span>
                  )}
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#17152B]">
                      <Check size={14} className="text-[#19A974] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={onEnterApp}
                  className={`w-full py-3 rounded-[10px] text-sm font-semibold transition-colors ${plan.highlight ? "bg-[#6C3BFF] text-white hover:bg-[#5a2fe0]" : "border border-[#DED9EA] text-[#17152B] hover:bg-[#F4F1FA]"}`}>
                  {plan.monthly ? "Get started" : "Contact sales"}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto mt-16">
            <h3 className="text-2xl font-bold text-[#17152B] mb-6 text-center">Frequently asked</h3>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-white rounded-[14px] border border-[#DED9EA] overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-[#17152B]"
                  >
                    {faq.q}
                    <ChevronDown size={16} className={`text-[#6C6880] transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-[#6C6880] leading-relaxed border-t border-[#DED9EA] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {activePage === "templates" && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h1 className="text-4xl font-bold text-[#17152B] mb-2">Genre Templates</h1>
          <p className="text-[#6C6880] mb-8">Pre-built system registries and economy models for every major mobile genre.</p>
          <div className="grid grid-cols-4 gap-5">
            {GENRE_TEMPLATES.map((t) => (
              <div key={t.name} className="bg-white rounded-[14px] border border-[#DED9EA] p-6 hover:border-[#6C3BFF] transition-colors cursor-pointer" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
                <div className="text-4xl mb-4">{t.icon}</div>
                <h3 className="font-bold text-lg text-[#17152B] mb-3">{t.name}</h3>
                <div className="space-y-1.5 text-xs text-[#6C6880] mb-4">
                  <div className="flex justify-between"><span>Systems</span><span className="font-mono font-semibold text-[#17152B]">{t.systems}</span></div>
                  <div className="flex justify-between"><span>Workbook tabs</span><span className="font-mono font-semibold text-[#17152B]">{t.tabs}</span></div>
                  <div className="flex justify-between"><span>Setup time</span><span className="font-mono font-semibold text-[#17152B]">{t.time}</span></div>
                </div>
                <button onClick={onEnterApp} className="w-full py-2.5 bg-[#6C3BFF] text-white text-xs font-semibold rounded-lg hover:bg-[#5a2fe0]">
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {activePage === "methodology" && (
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h1 className="text-4xl font-bold text-[#17152B] mb-4">Our Methodology</h1>
          <p className="text-[#6C6880] text-lg mb-10 leading-relaxed">GameForge follows a rigorous Extract → Structure → Model → Simulate → Audit → Export pipeline. Every output is clearly labeled by its source.</p>
          <div className="space-y-4">
            {[
              { label: "Observed fact", desc: "Data or text extracted directly from uploaded documents. Exactly as stated by the source.", badge: "bg-[#19C6D1]/10 text-[#19C6D1]" },
              { label: "AI assumption", desc: "An inference made by the AI when the source is incomplete or ambiguous. Always flagged with confidence score.", badge: "bg-[#FFC928]/10 text-[#a87d00]" },
              { label: "AI recommendation", desc: "A design suggestion made by the AI based on benchmarks and analysis. Requires human approval before use.", badge: "bg-[#6C3BFF]/10 text-[#6C3BFF]" },
              { label: "Simulated result", desc: "Output from a deterministic or probabilistic simulation. Not observed player behavior.", badge: "bg-[#FF3B4F]/10 text-[#FF3B4F]" },
              { label: "Approved decision", desc: "A design choice explicitly approved by a human team member. Locked unless manually re-opened.", badge: "bg-[#19A974]/10 text-[#19A974]" },
            ].map(({ label, desc, badge }) => (
              <div key={label} className="bg-white rounded-[14px] border border-[#DED9EA] p-5 flex gap-4" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
                <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 h-fit ${badge}`}>{label}</span>
                <p className="text-sm text-[#6C6880] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-[#DED9EA] bg-white px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#6C3BFF] flex items-center justify-center">
              <span style={{ fontFamily: "Orbitron, sans-serif" }} className="text-white font-bold text-[10px]">G</span>
            </div>
            <span className="text-xs font-bold text-[#17152B]" style={{ fontFamily: "Orbitron, sans-serif" }}>GAMEFORGE SYSTEMS AI</span>
          </div>
          <div className="flex gap-6 text-xs text-[#6C6880]">
            {["Privacy Policy", "Terms of Service", "Security", "Status", "Contact"].map((l) => (
              <button key={l} className="hover:text-[#17152B] transition-colors">{l}</button>
            ))}
          </div>
          <p className="text-xs text-[#6C6880]">© 2026 GameForge Systems AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
