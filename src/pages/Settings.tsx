import { useState } from "react";
import { Settings as SettingsIcon, Users, Shield, Bell, Trash2, Plus, CreditCard, ExternalLink } from "lucide-react";
import { createCheckout, openBillingPortal } from "../services/billing";
import { TEAM_MEMBERS } from "../data/mockData";

interface SettingsProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
}

const SECTIONS = ["Project Details", "Billing & Subscription", "Game Versions", "Team & Permissions", "AI Preferences", "Export Settings", "Danger Zone"];

const ROLES = ["Organization Owner", "Project Admin", "Lead Designer", "Economy Designer", "Analyst", "Developer", "Reviewer", "Viewer"];

export default function Settings({ onToast }: SettingsProps) {
  const [activeSection, setActiveSection] = useState("Project Details");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Reviewer");
  const [billingPlan, setBillingPlan] = useState<'solo' | 'studio' | 'enterprise'>('studio');
  const [billingLoading, setBillingLoading] = useState(false);

  return (
    <div className="flex-1 overflow-hidden flex bg-[#FFF9F2]">
      {/* Section nav */}
      <div className="w-52 bg-white border-r border-[#DED9EA] py-4 shrink-0">
        {SECTIONS.map((s) => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${activeSection === s ? "text-[#6C3BFF] bg-[#F4F1FA]" : "text-[#6C6880] hover:text-[#17152B] hover:bg-[#F4F1FA]"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === "Project Details" && (
          <div className="max-w-2xl space-y-5">
            <h2 className="text-lg font-bold text-[#17152B]">Project Details</h2>
            <div className="bg-white rounded-[14px] border border-[#DED9EA] divide-y divide-[#DED9EA]" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
              {[
                { label: "Project Name", value: "Haunted Hotel" },
                { label: "Studio Name", value: "Studio Phantom Games" },
                { label: "Genre", value: "Hybrid-Casual Idle Tycoon" },
                { label: "Target Platform", value: "Mobile (iOS + Android)" },
                { label: "Target Rating", value: "PEGI 7 / ESRB E10+" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center px-5 py-4 gap-4">
                  <label className="text-xs font-semibold text-[#6C6880] uppercase tracking-wider w-40 shrink-0">{label}</label>
                  <input defaultValue={value} className="flex-1 text-sm bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] focus:outline-none focus:border-[#6C3BFF]" />
                </div>
              ))}
            </div>
            <button onClick={() => onToast("success", "Project details saved")} className="px-4 py-2 bg-[#6C3BFF] text-white text-sm font-medium rounded-lg hover:bg-[#5a2fe0]">
              Save Changes
            </button>
          </div>
        )}

        {activeSection === "Billing & Subscription" && (
          <div className="max-w-2xl space-y-5">
            <h2 className="text-lg font-bold text-[#17152B]">Billing & Subscription</h2>

            <div className="bg-white rounded-[14px] border border-[#DED9EA] p-6" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <div className="text-sm font-semibold text-[#17152B]">Current plan</div>
                  <div className="mt-1 text-xs text-[#6C6880]">Studio plan — 14-day free trial included.</div>
                </div>
                <span className="rounded-full bg-[#F4F1FA] px-3 py-1 text-[10px] font-semibold text-[#6C3BFF]">Active</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { id: 'solo', label: 'Solo Designer', price: '$29/mo' },
                  { id: 'studio', label: 'Studio', price: '$99/mo' },
                  { id: 'enterprise', label: 'Enterprise', price: 'Custom' },
                ].map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setBillingPlan(plan.id as 'solo' | 'studio' | 'enterprise')}
                    className={`rounded-[14px] border px-4 py-4 text-left transition ${billingPlan === plan.id ? 'border-[#6C3BFF] bg-[#F4F1FA]' : 'border-[#DED9EA] bg-white hover:border-[#6C3BFF]/40'}`}>
                    <div className="text-sm font-semibold text-[#17152B]">{plan.label}</div>
                    <div className="text-xs text-[#6C6880] mt-1">{plan.price}</div>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  disabled={billingLoading}
                  onClick={async () => {
                    setBillingLoading(true);
                    try {
                      const result = await createCheckout(billingPlan);
                      window.location.href = result.sessionUrl;
                    } catch (error) {
                      onToast('error', 'Checkout failed', error instanceof Error ? error.message : 'Unable to start checkout');
                    } finally {
                      setBillingLoading(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-[14px] bg-[#6C3BFF] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5a2fe0] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CreditCard size={14} /> Upgrade plan
                </button>
                <button
                  disabled={billingLoading}
                  onClick={async () => {
                    setBillingLoading(true);
                    try {
                      const result = await openBillingPortal();
                      window.location.href = result.url;
                    } catch (error) {
                      onToast('error', 'Unable to open portal', error instanceof Error ? error.message : 'Could not open billing portal');
                    } finally {
                      setBillingLoading(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-[14px] border border-[#DED9EA] bg-white px-5 py-3 text-sm font-semibold text-[#17152B] hover:bg-[#F4F1FA] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ExternalLink size={14} /> Open billing portal
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "Team & Permissions" && (
          <div className="max-w-3xl space-y-5">
            <h2 className="text-lg font-bold text-[#17152B]">Team & Permissions</h2>

            {/* Invite */}
            <div className="bg-white rounded-[14px] border border-[#DED9EA] p-5" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
              <div className="text-sm font-semibold text-[#17152B] mb-3">Invite Team Member</div>
              <div className="flex gap-3">
                <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@studio.com"
                  className="flex-1 text-sm bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] focus:outline-none focus:border-[#6C3BFF]" />
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                  className="text-sm bg-[#F4F1FA] border border-[#DED9EA] rounded-lg px-3 py-2 text-[#17152B] focus:outline-none focus:border-[#6C3BFF]">
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
                <button onClick={() => { onToast("success", "Invitation sent", `Invite sent to ${inviteEmail}`); setInviteEmail(""); }}
                  className="px-4 py-2 bg-[#6C3BFF] text-white text-sm font-medium rounded-lg hover:bg-[#5a2fe0]">
                  Invite
                </button>
              </div>
            </div>

            {/* Team table */}
            <div className="bg-white rounded-[14px] border border-[#DED9EA] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(108,59,255,0.06)" }}>
              <table className="w-full text-xs">
                <thead className="bg-[#F4F1FA]">
                  <tr>
                    {["Member", "Role", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#6C6880] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DED9EA]">
                  {TEAM_MEMBERS.map((m) => (
                    <tr key={m.name} className="table-row-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#6C3BFF] flex items-center justify-center text-white text-[10px] font-bold">{m.avatar}</div>
                          <div>
                            <div className="font-semibold text-[#17152B]">{m.name}</div>
                            <div className="text-[10px] text-[#6C6880]">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#6C6880]">{m.role}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.status === "Online" ? "bg-[#EDFAF4] text-[#19A974]" : m.status === "Away" ? "bg-[#FFF8E6] text-[#FFC928]" : "bg-[#F4F1FA] text-[#6C6880]"}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-[10px] text-[#6C3BFF] font-semibold hover:text-[#5a2fe0]">Edit role</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === "Danger Zone" && (
          <div className="max-w-2xl">
            <h2 className="text-lg font-bold text-[#17152B] mb-5">Danger Zone</h2>
            <div className="bg-white rounded-[14px] border border-[#FF3B4F]/30 overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(255,59,79,0.08)" }}>
              {[
                { label: "Reset all simulation data", desc: "Removes all simulation runs and results. Blueprint and economy data preserved." },
                { label: "Archive project", desc: "Makes the project read-only and removes it from active view." },
                { label: "Delete project", desc: "Permanently deletes this project and all its data. Cannot be undone." },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-center justify-between px-5 py-4 border-b border-[#DED9EA] last:border-0">
                  <div>
                    <div className="text-sm font-semibold text-[#17152B]">{label}</div>
                    <div className="text-xs text-[#6C6880] mt-0.5">{desc}</div>
                  </div>
                  <button
                    onClick={() => onToast("warning", `Confirm: ${label}`, "This action requires confirmation")}
                    className="px-3 py-1.5 border border-[#FF3B4F]/40 text-[#FF3B4F] text-xs font-semibold rounded-lg hover:bg-[#FFF0F2] transition-colors shrink-0 ml-4"
                  >
                    {label.startsWith("Delete") ? "Delete" : label.startsWith("Archive") ? "Archive" : "Reset"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!["Project Details", "Billing & Subscription", "Team & Permissions", "Danger Zone"].includes(activeSection) && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <SettingsIcon size={40} className="text-[#DED9EA] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#17152B]">{activeSection}</p>
              <p className="text-xs text-[#6C6880] mt-1">Configuration options will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
