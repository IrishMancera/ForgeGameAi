import { useState } from "react";
import { ShieldCheck, X, AlertCircle, AlertTriangle, Info, CheckCircle, Zap, ChevronDown } from "lucide-react";
import { AUDIT_FINDINGS } from "../data/mockData";

interface AuditCenterProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
}

const SEV_STYLE: Record<string, string> = {
  Critical: "bg-[#FFF0F2] text-[#FF3B4F] border-[#FFB3BB]",
  High: "bg-[#FFF8E6] text-[#FFC928] border-[#FFE89A]",
  Medium: "bg-[#F4F1FA] text-[#6C6880] border-[#DED9EA]",
};

const SEV_ICON: Record<string, React.ReactNode> = {
  Critical: <AlertCircle size={13} className="text-[#FF3B4F]" />,
  High: <AlertTriangle size={13} className="text-[#FFC928]" />,
  Medium: <Info size={13} className="text-[#6C6880]" />,
};

export default function AuditCenter({ onToast }: AuditCenterProps) {
  const [selectedFinding, setSelectedFinding] = useState<typeof AUDIT_FINDINGS[0] | null>(null);
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [running, setRunning] = useState(false);
  const [findings, setFindings] = useState(AUDIT_FINDINGS);

  const runAudit = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      onToast("success", "Audit finished", "2 critical, 2 high, 3 medium findings — same as last run");
    }, 2000);
  };

  const resolve = (id: string) => {
    setFindings((prev) => prev.map((f) => f.id === id ? { ...f, status: "Resolved" } : f));
    setSelectedFinding((prev) => prev?.id === id ? { ...prev, status: "Resolved" } : prev);
    onToast("success", "Finding resolved", `${id} marked as resolved`);
  };

  const accept = (id: string) => {
    setFindings((prev) => prev.map((f) => f.id === id ? { ...f, status: "Accepted Risk" } : f));
    setSelectedFinding(null);
    onToast("info", "Risk accepted", `${id} added to accepted risk register`);
  };

  const filtered = findings.filter((f) => {
    const matchSev = severityFilter === "All" || f.severity === severityFilter;
    const matchStatus = statusFilter === "All" || f.status === statusFilter;
    return matchSev && matchStatus;
  });

  const counts = {
    Critical: findings.filter((f) => f.severity === "Critical" && f.status === "Open").length,
    High: findings.filter((f) => f.severity === "High" && f.status !== "Resolved").length,
    Medium: findings.filter((f) => f.severity === "Medium" && f.status !== "Resolved").length,
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#FFF9F2]">
      {/* Toolbar */}
      <div className="bg-white border-b border-[#DED9EA] px-5 py-3 flex items-center gap-3 flex-wrap">
        <button
          onClick={runAudit}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-[#6C3BFF] text-white text-xs font-semibold rounded-lg hover:bg-[#5a2fe0] transition-colors disabled:opacity-60"
        >
          <Zap size={13} className={running ? "animate-pulse" : ""} />
          {running ? "Running Audit…" : "Run Full Audit"}
        </button>

        <div className="flex items-center gap-3 ml-2">
          {Object.entries(counts).map(([sev, count]) => (
            <span key={sev} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${SEV_STYLE[sev]}`}>
              {SEV_ICON[sev]} {count} {sev}
            </span>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          {[
            { label: "Severity", value: severityFilter, options: ["All", "Critical", "High", "Medium"], set: setSeverityFilter },
            { label: "Status", value: statusFilter, options: ["All", "Open", "In Progress", "Resolved", "Accepted Risk"], set: setStatusFilter },
          ].map(({ label, value, options, set }) => (
            <select key={label} value={value} onChange={(e) => set(e.target.value)}
              className="text-xs bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-2.5 py-1.5 text-[#17152B] focus:outline-none focus:border-[#6C3BFF]">
              {options.map((o) => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Findings table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#F4F1FA] sticky top-0 z-10">
              <tr>
                {["ID", "Severity", "Category", "Finding", "Systems", "Confidence", "Owner", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DED9EA]">
              {filtered.map((f) => (
                <tr key={f.id} className="table-row-hover cursor-pointer" onClick={() => setSelectedFinding(f)}>
                  <td className="px-4 py-3 font-mono text-[10px] text-[#6C6880] whitespace-nowrap">{f.id}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SEV_STYLE[f.severity] ?? SEV_STYLE.Medium}`}>
                      {SEV_ICON[f.severity]} {f.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6C6880] whitespace-nowrap">{f.category}</td>
                  <td className="px-4 py-3 text-[#17152B] font-medium max-w-[220px] truncate">{f.finding}</td>
                  <td className="px-4 py-3 max-w-[120px]">
                    <div className="flex flex-wrap gap-1">
                      {f.affectedSystems.slice(0, 2).map((s) => (
                        <span key={s} className="text-[9px] bg-[#F4F1FA] text-[#6C6880] px-1.5 py-0.5 rounded-full border border-[#DED9EA] truncate max-w-[80px]">{s}</span>
                      ))}
                      {f.affectedSystems.length > 2 && <span className="text-[9px] text-[#6C6880]">+{f.affectedSystems.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[#6C6880]">{f.confidence}%</td>
                  <td className="px-4 py-3 text-[#17152B]">{f.owner}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${f.status === "Open" ? "bg-[#FFF0F2] text-[#FF3B4F]" : f.status === "Resolved" ? "bg-[#EDFAF4] text-[#19A974]" : f.status === "In Progress" ? "bg-[#EFF6FF] text-[#19C6D1]" : "bg-[#F4F1FA] text-[#6C6880]"}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFinding(f); }} className="text-[#6C3BFF] font-semibold text-[10px] hover:text-[#5a2fe0]">
                      Review →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <ShieldCheck size={36} className="text-[#19A974] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#17152B]">No findings match your filters</p>
              </div>
            </div>
          )}
        </div>

        {/* Finding detail drawer */}
        {selectedFinding && (
          <div className="w-[440px] shrink-0 bg-white border-l border-[#DED9EA] overflow-y-auto">
            <div className="px-5 py-4 border-b border-[#DED9EA] flex items-start justify-between">
              <div>
                <div className="font-mono text-[10px] text-[#6C6880] mb-1">{selectedFinding.id}</div>
                <h3 className="font-bold text-sm text-[#17152B] leading-tight">{selectedFinding.finding}</h3>
              </div>
              <button onClick={() => setSelectedFinding(null)} className="p-1 text-[#6C6880] hover:text-[#17152B] rounded hover:bg-[#F4F1FA] shrink-0">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5 text-sm">
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SEV_STYLE[selectedFinding.severity]}`}>
                  {SEV_ICON[selectedFinding.severity]} {selectedFinding.severity}
                </span>
                <span className="text-[10px] text-[#6C6880] bg-[#F4F1FA] px-2 py-0.5 rounded-full border border-[#DED9EA]">{selectedFinding.category}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${selectedFinding.status === "Open" ? "bg-[#FFF0F2] text-[#FF3B4F]" : selectedFinding.status === "Resolved" ? "bg-[#EDFAF4] text-[#19A974]" : "bg-[#F4F1FA] text-[#6C6880]"}`}>
                  {selectedFinding.status}
                </span>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider mb-1.5">Evidence</div>
                <p className="text-[#17152B] leading-relaxed text-xs">{selectedFinding.evidence}</p>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider mb-2">Affected Systems</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFinding.affectedSystems.map((s) => (
                    <span key={s} className="font-mono text-[11px] bg-[#F4F1FA] border border-[#DED9EA] px-2 py-0.5 rounded-full text-[#6C6880]">{s}</span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider mb-1.5">Expected Impact</div>
                <p className="text-[#17152B] text-xs">{selectedFinding.expectedImpact}</p>
              </div>

              <div className="bg-[#EDFAF4] border border-[#C8F0DC] rounded-xl p-4">
                <div className="text-[10px] font-semibold text-[#19A974] uppercase tracking-wider mb-1.5">Proposed Fix</div>
                <p className="text-xs text-[#17152B] leading-relaxed">{selectedFinding.proposedFix}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-[#6C6880]">
                <span>Owner: <strong className="text-[#17152B]">{selectedFinding.owner}</strong></span>
                <span>Confidence: <strong className="font-mono text-[#17152B]">{selectedFinding.confidence}%</strong></span>
              </div>

              {selectedFinding.status !== "Resolved" && (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => resolve(selectedFinding.id)}
                    className="flex-1 py-2.5 bg-[#19A974] text-white text-xs font-semibold rounded-xl hover:bg-[#148058] transition-colors">
                    Resolve
                  </button>
                  <button onClick={() => accept(selectedFinding.id)}
                    className="flex-1 py-2.5 border border-[#DED9EA] text-[#6C6880] text-xs rounded-xl hover:bg-[#F4F1FA] transition-colors">
                    Accept Risk
                  </button>
                  <button onClick={() => setSelectedFinding(null)}
                    className="flex-1 py-2.5 border border-[#DED9EA] text-[#6C6880] text-xs rounded-xl hover:bg-[#F4F1FA] transition-colors">
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
