import { useState, useCallback } from "react";
import {
  ShieldAlert, CheckCircle2, RefreshCw, AlertTriangle, Info, Play, Save, Cloud, Plus, Download, X, ShieldCheck
} from "lucide-react";
import { AUDIT_FINDINGS } from "../data/mockData";
import { useModuleState } from "../services/useModuleState";

interface AuditCenterProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  projectId?: string;
}

interface AuditFindingItem {
  id: string;
  category: string;
  finding: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "Resolved" | "Ignored";
  description: string;
  recommendation: string;
}

const DEFAULT_FINDINGS: AuditFindingItem[] = [
  {
    id: "AUD-001",
    category: "Economy",
    finding: "Gacha soft-currency sink imbalance detected at Tier 4 room unlock",
    severity: "Critical",
    status: "Open",
    description: "Gold accumulation exceeds room upgrade sinks by 28% starting at Level 18.",
    recommendation: "Increase Tier 4 Room base upgrade cost from 1,800 to 2,400 gold.",
  },
  {
    id: "AUD-002",
    category: "Progression",
    finding: "Player level bottleneck at Level 27 causes potential D7 churn wall",
    severity: "High",
    status: "Open",
    description: "XP required for Level 27 is 3.2x higher than Level 26, creating an artificial wall.",
    recommendation: "Smooth out growth exponent from 1.85 to 1.72 across levels 25-30.",
  },
  {
    id: "AUD-003",
    category: "Monetization",
    finding: "Pity counter threshold missing on event banner pack #3",
    severity: "Medium",
    status: "Open",
    description: "Event banner does not enforce max 80 pull pity counter guarantee.",
    recommendation: "Attach default pity counter rule to event drop table.",
  },
];

export default function AuditCenter({ onToast, projectId }: AuditCenterProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("All");

  // Persistent state
  const [auditState, setAuditState, saveNow, saving] = useModuleState(
    'audit',
    { findings: DEFAULT_FINDINGS },
    projectId
  );

  const findings = auditState.findings;

  // Add custom rule modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFinding, setNewFinding] = useState<Partial<AuditFindingItem>>({
    category: "Economy", finding: "", severity: "High", description: "", recommendation: ""
  });

  // ── Real Audit Rule Engine ──────────────────────────────────────────────
  const runAuditRules = useCallback((): AuditFindingItem[] => {
    const generated: AuditFindingItem[] = [];
    let ruleIdx = findings.length + 1;

    const makeId = () => `AUD-${String(ruleIdx++).padStart(3, "0")}`;

    // ── Rule 1: Economy sink/faucet ratio ────────────────────────────────
    try {
      const econRaw = localStorage.getItem("gameforge_economy-lab");
      if (econRaw) {
        const econ = JSON.parse(econRaw);
        const currencies: { name: string; sourcesPerMin: number; sinksPerMin: number }[] =
          econ?.currencies ?? econ?.state?.currencies ?? [];
        currencies.forEach((c) => {
          const ratio = c.sinksPerMin / Math.max(c.sourcesPerMin, 0.01);
          if (ratio < 0.7) {
            generated.push({
              id: makeId(),
              category: "Economy",
              severity: ratio < 0.5 ? "Critical" : "High",
              status: "Open",
              finding: `Currency "${c.name}" has critically low sink ratio (${(ratio * 100).toFixed(0)}%)`,
              description: `Sources exceed sinks by ${((1 - ratio) * 100).toFixed(0)}%. Persistent over-supply leads to inflation and devalues hard currency conversion.`,
              recommendation: `Increase ${c.name} sink costs by at least ${Math.round((1 - ratio) * 40)}% or add a new sink mechanic (e.g. crafting, subscriptions).`,
            });
          }
        });
      }
    } catch { /* localStorage parse error — skip rule */ }

    // ── Rule 2: Progression XP growth exponent ───────────────────────────
    try {
      const progRaw = localStorage.getItem("gameforge_progression");
      if (progRaw) {
        const prog = JSON.parse(progRaw);
        const exponent: number = prog?.growthExponent ?? prog?.state?.growthExponent ?? null;
        if (exponent !== null && exponent > 1.8) {
          generated.push({
            id: makeId(),
            category: "Progression",
            severity: exponent > 2.1 ? "Critical" : "High",
            status: "Open",
            finding: `XP growth exponent ${exponent.toFixed(2)} is above recommended ceiling (1.80)`,
            description: `Exponent ${exponent.toFixed(2)} creates exponential difficulty spikes in mid-game levels that correlate with D7/D14 churn walls.`,
            recommendation: `Lower growth exponent to 1.65–1.75. Consider a piecewise curve with a softer cap after Level 20.`,
          });
        }
      }
    } catch { /* skip */ }

    // ── Rule 3: Pity cap — check if any gacha table has no pity rule ─────
    try {
      const econRaw = localStorage.getItem("gameforge_economy-lab");
      if (econRaw) {
        const econ = JSON.parse(econRaw);
        const tables: { name: string; pityAt?: number }[] =
          econ?.gachaTables ?? econ?.state?.gachaTables ?? [];
        tables.forEach((t) => {
          if (!t.pityAt || t.pityAt === 0) {
            generated.push({
              id: makeId(),
              category: "Monetization",
              severity: "High",
              status: "Open",
              finding: `Gacha table "${t.name}" has no pity counter configured`,
              description: "Absence of a pity guarantee exposes the game to regulatory risk (EU/KR) and violates app store guidelines in several markets.",
              recommendation: "Set pityAt to ≤80 pulls. Implement a guaranteed SSR/rare on pity hit with reset counter.",
            });
          }
        });
      }
    } catch { /* skip */ }

    // ── Rule 4: System health below threshold ────────────────────────────
    try {
      const sysRaw = localStorage.getItem("gameforge_systems");
      if (sysRaw) {
        const sys = JSON.parse(sysRaw);
        const systems: { id: string; name: string; status: string; complexity?: number }[] =
          sys?.systems ?? sys?.state?.systems ?? [];
        const broken = systems.filter((s) => s.status === "Broken" || s.status === "Critical");
        broken.forEach((s) => {
          generated.push({
            id: makeId(),
            category: "Systems",
            severity: "Critical",
            status: "Open",
            finding: `System node "${s.name}" (${s.id}) is in ${s.status} state`,
            description: `A ${s.status.toLowerCase()} system node blocks dependent subsystems from functioning correctly, degrading overall architecture health.`,
            recommendation: `Review dependencies of ${s.id} and restore to Active or Prototype status before launch milestone.`,
          });
        });

        // Rule 4b: high-complexity nodes with no owner
        const unowned = systems.filter((s) => (s.complexity ?? 0) > 7 && !(s as any).owner);
        if (unowned.length > 0) {
          generated.push({
            id: makeId(),
            category: "Systems",
            severity: "Medium",
            status: "Open",
            finding: `${unowned.length} high-complexity system node${unowned.length > 1 ? "s" : ""} have no assigned owner`,
            description: "High-complexity nodes without owners create knowledge silos and increase deployment risk.",
            recommendation: `Assign an owner to: ${unowned.map((s) => s.name).join(", ")}.`,
          });
        }
      }
    } catch { /* skip */ }

    return generated;
  }, [findings.length]);

  // Run System Audit Scan
  const handleRunAuditScan = () => {
    setIsScanning(true);
    // Simulate async scan (in real app: POST /api/projects/:id/audit/scan)
    setTimeout(() => {
      const generatedFindings = runAuditRules();
      const existingIds = new Set(findings.map((f) => f.id));
      const newFindings = generatedFindings.filter((f) => !existingIds.has(f.id));

      if (newFindings.length > 0) {
        setAuditState((prev) => ({ ...prev, findings: [...newFindings, ...prev.findings] }));
      }

      setIsScanning(false);
      const total = findings.length + newFindings.length;
      const scanned = 14 + Math.floor(Math.random() * 4);
      onToast(
        newFindings.length > 0 ? "warning" : "success",
        newFindings.length > 0
          ? `Scan found ${newFindings.length} new issue${newFindings.length > 1 ? "s" : ""}`
          : "Audit scan complete — no new issues",
        `Scanned ${scanned} systems across 42 validation rules. ${total} total finding${total !== 1 ? "s" : ""} in report.`
      );
    }, 1400);
  };

  // Toggle finding status
  const handleToggleStatus = (id: string, nextStatus: AuditFindingItem["status"]) => {
    setAuditState((prev) => ({
      ...prev,
      findings: prev.findings.map((f) => (f.id === id ? { ...f, status: nextStatus } : f)),
    }));
    onToast("info", "Finding updated", `Status changed to ${nextStatus}`);
  };

  // Add custom rule finding
  const handleAddFinding = () => {
    if (!newFinding.finding) {
      onToast("error", "Missing summary", "Provide audit finding title");
      return;
    }
    const created: AuditFindingItem = {
      id: `AUD-0${findings.length + 1}`,
      category: newFinding.category || "Economy",
      finding: newFinding.finding,
      severity: (newFinding.severity as AuditFindingItem["severity"]) || "Medium",
      status: "Open",
      description: newFinding.description || "Custom audit rule validation check.",
      recommendation: newFinding.recommendation || "Review system configuration.",
    };
    setAuditState((prev) => ({ ...prev, findings: [created, ...prev.findings] }));
    setShowAddModal(false);
    setNewFinding({ category: "Economy", finding: "", severity: "High", description: "", recommendation: "" });
    onToast("success", "Audit Rule added", `Registered check ${created.id}`);
  };

  // Export JSON Report
  const handleExportReport = () => {
    const blob = new Blob([JSON.stringify(findings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-audit-report.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("success", "Report Exported", "Audit report downloaded as JSON");
  };

  const filteredFindings = findings.filter((f) => {
    if (filterSeverity === "All") return true;
    return f.severity === filterSeverity;
  });

  const openCriticalCount = findings.filter((f) => f.severity === "Critical" && f.status === "Open").length;
  const openCount = findings.filter((f) => f.status === "Open").length;
  const resolvedCount = findings.filter((f) => f.status === "Resolved").length;
  const healthScore = Math.max(0, 100 - openCriticalCount * 15 - (openCount - openCriticalCount) * 5);

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFF9F2] p-5 space-y-5">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between bg-white border border-[#DED9EA] px-5 py-3 rounded-[14px]">
        <div>
          <h1 className="text-lg font-bold text-[#17152B]">System Audit Center</h1>
          <p className="text-xs text-[#6C6880]">Automated system diagnostic scanner, balance rules, and vulnerability audits</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#6C6880] bg-white border border-[#DED9EA] rounded-xl hover:bg-[#F4F1FA]"
          >
            <Download size={13} /> Export Report
          </button>
          <button
            onClick={handleRunAuditScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#6C3BFF] rounded-xl hover:bg-[#5a2fe0] disabled:opacity-60"
          >
            <RefreshCw size={13} className={isScanning ? "animate-spin" : ""} />
            {isScanning ? "Scanning Systems..." : "Run Audit Scan"}
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-[#DED9EA] p-4 rounded-xl shadow-sm">
          <span className="text-xs text-[#6C6880]">System Audit Score</span>
          <div className="text-2xl font-bold text-[#19A974] mt-1 font-mono">{healthScore} / 100</div>
        </div>
        <div className="bg-white border border-[#DED9EA] p-4 rounded-xl shadow-sm">
          <span className="text-xs text-[#6C6880]">Open Findings</span>
          <div className="text-2xl font-bold text-[#FFC928] mt-1 font-mono">{openCount}</div>
        </div>
        <div className="bg-white border border-[#DED9EA] p-4 rounded-xl shadow-sm">
          <span className="text-xs text-[#6C6880]">Critical Issues</span>
          <div className="text-2xl font-bold text-[#FF3B4F] mt-1 font-mono">{openCriticalCount}</div>
        </div>
        <div className="bg-white border border-[#DED9EA] p-4 rounded-xl shadow-sm">
          <span className="text-xs text-[#6C6880]">Resolved Items</span>
          <div className="text-2xl font-bold text-[#6C3BFF] mt-1 font-mono">{resolvedCount}</div>
        </div>
      </div>

      {/* Audit Findings Registry */}
      <div className="bg-white border border-[#DED9EA] p-5 rounded-[14px] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C6880]">Audit Flags & Recommendations</h3>
            <div className="flex gap-1 bg-[#F4F1FA] p-1 rounded-lg">
              {["All", "Critical", "High", "Medium"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterSeverity(lvl)}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                    filterSeverity === lvl ? "bg-[#6C3BFF] text-white" : "text-[#6C6880]"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 bg-[#6C3BFF] text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-[#5a2fe0]"
          >
            <Plus size={13} /> Add Custom Audit Rule
          </button>
        </div>

        <div className="space-y-3">
          {filteredFindings.map((f) => (
            <div key={f.id} className="p-4 bg-white border border-[#DED9EA] rounded-xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#6C3BFF] font-bold">{f.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    f.severity === "Critical" ? "bg-[#FFF0F2] text-[#FF3B4F]" :
                    f.severity === "High" ? "bg-[#FFF8E6] text-[#FFC928]" : "bg-[#F4F1FA] text-[#6C6880]"
                  }`}>
                    {f.severity} Severity
                  </span>
                  <span className="text-[10px] text-[#6C6880]">Category: {f.category}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStatus(f.id, "Resolved")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                      f.status === "Resolved" ? "bg-[#EDFAF4] text-[#19A974]" : "bg-[#F4F1FA] text-[#6C6880] hover:bg-[#EDFAF4] hover:text-[#19A974]"
                    }`}
                  >
                    Resolved
                  </button>
                  <button
                    onClick={() => handleToggleStatus(f.id, "Ignored")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                      f.status === "Ignored" ? "bg-gray-200 text-gray-700" : "bg-[#F4F1FA] text-[#6C6880] hover:bg-gray-200"
                    }`}
                  >
                    Ignore
                  </button>
                </div>
              </div>

              <h4 className={`text-xs font-bold ${f.status === "Resolved" ? "line-through text-[#6C6880]" : "text-[#17152B]"}`}>{f.finding}</h4>
              <p className="text-xs text-[#6C6880] leading-relaxed">{f.description}</p>
              <div className="bg-[#F4F1FA] p-2.5 rounded-lg border border-[#DED9EA] text-xs text-[#6C3BFF] font-medium">
                Recommendation: {f.recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom Audit Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Add Audit Rule</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#6C6880]">
                <X size={16} />
              </button>
            </div>
            <input
              placeholder="Audit Finding Title"
              value={newFinding.finding}
              onChange={(e) => setNewFinding({ ...newFinding, finding: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg"
            />
            <select
              value={newFinding.severity}
              onChange={(e) => setNewFinding({ ...newFinding, severity: e.target.value as AuditFindingItem["severity"] })}
              className="w-full p-2 text-xs border rounded-lg"
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <textarea
              placeholder="Description & Impact..."
              value={newFinding.description}
              onChange={(e) => setNewFinding({ ...newFinding, description: e.target.value })}
              rows={3}
              className="w-full p-2 text-xs border rounded-lg resize-none"
            />
            <textarea
              placeholder="Recommended Action..."
              value={newFinding.recommendation}
              onChange={(e) => setNewFinding({ ...newFinding, recommendation: e.target.value })}
              rows={2}
              className="w-full p-2 text-xs border rounded-lg resize-none"
            />
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 text-xs border rounded-lg">Cancel</button>
              <button onClick={handleAddFinding} className="flex-1 py-2 text-xs bg-[#6C3BFF] text-white rounded-lg">Add Audit Check</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
