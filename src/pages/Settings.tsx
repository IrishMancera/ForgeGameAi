import { useState, useRef, useCallback } from "react";
import {
  User, Key, Users, CreditCard, ShieldCheck, Bell, Save,
  Plus, Trash2, Eye, EyeOff, Copy, Check, Cloud, ChevronDown,
  Lock, Globe, Zap, AlertTriangle, RefreshCw, Mail,
  Smartphone, LogOut, Info, ArrowRight, TrendingUp, Calendar,
  CheckCircle, Clock, X, Edit2,
} from "lucide-react";
import { useModuleState } from "../services/useModuleState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingsProps {
  onToast: (type: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
  projectId?: string;
}

type ApiScope = "read" | "write" | "admin";

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;          // permanent: "fg_live_9f82a1••••"
  scopes: ApiScope[];
  created: string;
  lastUsed: string;
  status: "Active" | "Revoked";
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Editor" | "Viewer";
  status: "Active" | "Pending";
  isYou?: boolean;
}

type SettingsTab = "profile" | "api" | "team" | "billing" | "security" | "notifications";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_META: Record<TeamMember["role"], { label: string; desc: string; color: string; bg: string }> = {
  Owner:  { label: "Owner",  desc: "Full access, can transfer ownership & delete workspace", color: "#8B5CF6", bg: "#EDE9FE" },
  Admin:  { label: "Admin",  desc: "Manage team, billing, and all project settings",         color: "#F59E0B", bg: "#FEF3C7" },
  Editor: { label: "Editor", desc: "Edit all modules; cannot change team or billing",         color: "#3B82F6", bg: "#EFF6FF" },
  Viewer: { label: "Viewer", desc: "Read-only access to all modules",                        color: "#6B7280", bg: "#F3F4F6" },
};

const SCOPE_META: Record<ApiScope, { label: string; color: string; bg: string }> = {
  read:  { label: "Read",  color: "#3B82F6", bg: "#EFF6FF" },
  write: { label: "Write", color: "#F59E0B", bg: "#FEF3C7" },
  admin: { label: "Admin", color: "#EF4444", bg: "#FEF2F2" },
};

const TIMEZONES = [
  "UTC−12:00 — Baker Island", "UTC−08:00 — Pacific Time (US)",
  "UTC−05:00 — Eastern Time (US)", "UTC+00:00 — London / UTC",
  "UTC+01:00 — Central Europe", "UTC+05:30 — India Standard Time",
  "UTC+08:00 — Philippine Standard Time", "UTC+09:00 — Japan Standard Time",
  "UTC+10:00 — AEST (Australia)", "UTC+12:00 — NZST (New Zealand)",
];

const LOCALES = ["en-US (English)", "en-GB (English UK)", "ja-JP (Japanese)", "zh-CN (Chinese Simplified)", "ko-KR (Korean)", "de-DE (German)", "fr-FR (French)"];

function generateSecureKey(prefix: "fg_live" | "fg_dev" | "fg_test"): string {
  const arr = new Uint8Array(18);
  crypto.getRandomValues(arr);
  return `${prefix}_${Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32)}`;
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ["#6C3BFF", "#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#8B5CF6", "#F97316"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Shared UI Atoms ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-[#6C6880] mb-3">{children}</p>;
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-[#17152B] block">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-[#6C6880]">{hint}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2.5 bg-[#F4F1FA] border border-[#DED9EA] rounded-xl text-xs text-[#17152B] outline-none focus:border-[#6C3BFF] focus:ring-1 focus:ring-[#6C3BFF]/20 transition-all placeholder:text-[#B0ABCC] ${props.className ?? ""}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full appearance-none px-3 py-2.5 bg-[#F4F1FA] border border-[#DED9EA] rounded-xl text-xs text-[#17152B] outline-none focus:border-[#6C3BFF] pr-8 ${props.className ?? ""}`}
      />
      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6C6880] pointer-events-none" />
    </div>
  );
}

function ProgressBar({ value, max, color = "#6C3BFF" }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full h-2 bg-[#DED9EA] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${checked ? "bg-[#6C3BFF]" : "bg-[#DED9EA]"}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

// ─── Confirmation Dialog ──────────────────────────────────────────────────────

interface ConfirmDialogProps {
  title: string;
  message: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
function ConfirmDialog({ title, message, danger, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl ${danger ? "bg-red-50" : "bg-amber-50"}`}>
            <AlertTriangle size={18} className={danger ? "text-red-500" : "text-amber-500"} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#17152B]">{title}</h3>
            <p className="text-xs text-[#6C6880] mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onCancel} className="flex-1 py-2 text-xs font-semibold border border-[#DED9EA] rounded-xl text-[#6C6880] hover:bg-[#F4F1FA] transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl text-white transition-colors ${danger ? "bg-red-500 hover:bg-red-600" : "bg-[#6C3BFF] hover:bg-[#5a2fe0]"}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── One-Time Key Reveal Modal ────────────────────────────────────────────────

interface OneTimeKeyModalProps {
  keyValue: string;
  keyName: string;
  onClose: () => void;
}
function OneTimeKeyModal({ keyValue, keyName, onClose }: OneTimeKeyModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(keyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-xl"><CheckCircle size={18} className="text-green-500" /></div>
          <div>
            <h3 className="font-bold text-sm text-[#17152B]">API Key Created — Copy Now</h3>
            <p className="text-xs text-[#6C6880]">"{keyName}" — this key is shown <span className="font-bold text-red-500">once only</span>. Store it safely.</p>
          </div>
        </div>

        <div className="bg-[#17152B] rounded-xl p-4 flex items-center justify-between gap-3">
          <code className="text-green-400 font-mono text-xs break-all flex-1 select-all">{keyValue}</code>
          <button onClick={handleCopy} className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${copied ? "bg-green-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
            {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">Once you close this dialog, the full key cannot be retrieved. Only a masked prefix will be shown.</p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 text-xs font-bold rounded-xl bg-[#6C3BFF] text-white hover:bg-[#5a2fe0] transition-colors"
        >
          I've Saved My Key — Close
        </button>
      </div>
    </div>
  );
}

// ─── Generate Key Modal ───────────────────────────────────────────────────────

interface GenerateKeyModalProps {
  onGenerate: (name: string, env: "fg_live" | "fg_dev" | "fg_test", scopes: ApiScope[]) => string;
  onClose: () => void;
}
function GenerateKeyModal({ onGenerate, onClose }: GenerateKeyModalProps) {
  const [name, setName] = useState("");
  const [env, setEnv] = useState<"fg_live" | "fg_dev" | "fg_test">("fg_live");
  const [scopes, setScopes] = useState<ApiScope[]>(["read"]);
  const [nameError, setNameError] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const toggleScope = (s: ApiScope) => {
    setScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleGenerate = () => {
    if (!name.trim()) { setNameError("Key name is required."); return; }
    if (scopes.length === 0) return;
    const key = onGenerate(name.trim(), env, scopes);
    setCreatedKey(key);
  };

  if (createdKey) {
    return <OneTimeKeyModal keyValue={createdKey} keyName={name} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-[#17152B]">Generate API Key</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F1FA]"><X size={16} /></button>
        </div>

        <FormField label="Key Name" hint="e.g. Production LiveOps Integration">
          <Input
            placeholder="Enter a descriptive identifier"
            value={name}
            onChange={e => { setName(e.target.value); setNameError(""); }}
            autoFocus
          />
          {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
        </FormField>

        <FormField label="Environment">
          <Select value={env} onChange={e => setEnv(e.target.value as typeof env)}>
            <option value="fg_live">Production (fg_live_)</option>
            <option value="fg_dev">Development (fg_dev_)</option>
            <option value="fg_test">Test / Staging (fg_test_)</option>
          </Select>
        </FormField>

        <div>
          <label className="text-xs font-semibold text-[#17152B] block mb-2">Scopes</label>
          <div className="flex gap-2">
            {(["read", "write", "admin"] as ApiScope[]).map(s => {
              const meta = SCOPE_META[s];
              const active = scopes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleScope(s)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all ${active ? "border-[#6C3BFF] bg-[#6C3BFF]/10 text-[#6C3BFF]" : "border-[#DED9EA] text-[#6C6880] hover:border-[#6C3BFF]/40"}`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
          {scopes.length === 0 && <p className="text-[10px] text-red-500 mt-1">Select at least one scope.</p>}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 text-xs font-semibold border border-[#DED9EA] rounded-xl text-[#6C6880] hover:bg-[#F4F1FA]">Cancel</button>
          <button
            onClick={handleGenerate}
            disabled={!name.trim() || scopes.length === 0}
            className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#6C3BFF] text-white hover:bg-[#5a2fe0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Generate Key
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Invite Member Modal ──────────────────────────────────────────────────────

type InviteRole = "Admin" | "Editor" | "Viewer";

interface InviteModalProps {
  onInvite: (name: string, email: string, role: InviteRole) => void;
  onClose: () => void;
}
function InviteModal({ onInvite, onClose }: InviteModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("Editor");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");

  const handleSubmit = () => {
    let valid = true;
    if (!name.trim()) { setNameError("Full name is required."); valid = false; }
    if (!isValidEmail(email)) { setEmailError("Enter a valid email address."); valid = false; }
    if (!valid) return;
    onInvite(name.trim(), email.trim().toLowerCase(), role);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-[#17152B]">Invite Team Member</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F1FA]"><X size={16} /></button>
        </div>

        <FormField label="Full Name">
          <Input placeholder="e.g. Sarah Mitchell" value={name} onChange={e => { setName(e.target.value); setNameError(""); }} autoFocus />
          {nameError && <p className="text-xs text-red-500">{nameError}</p>}
        </FormField>

        <FormField label="Email Address">
          <Input type="email" placeholder="e.g. sarah@studio.com" value={email} onChange={e => { setEmail(e.target.value); setEmailError(""); }} />
          {emailError && <p className="text-xs text-red-500">{emailError}</p>}
        </FormField>

        <div>
          <label className="text-xs font-semibold text-[#17152B] block mb-2">Role</label>
          <div className="space-y-2">
            {(["Admin", "Editor", "Viewer"] as InviteRole[]).map(r => {
              const meta = ROLE_META[r];
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${role === r ? "border-[#6C3BFF] bg-[#6C3BFF]/5" : "border-[#DED9EA] hover:border-[#6C3BFF]/30"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                    {role === r && <Check size={12} className="text-[#6C3BFF] ml-auto" />}
                  </div>
                  <p className="text-[10px] text-[#6C6880] mt-1">{meta.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 text-xs font-semibold border border-[#DED9EA] rounded-xl text-[#6C6880] hover:bg-[#F4F1FA]">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#6C3BFF] text-white hover:bg-[#5a2fe0] flex items-center justify-center gap-1.5">
            <Mail size={13} /> Send Invite
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Settings Component ──────────────────────────────────────────────────

const DEFAULT_KEYS: ApiKeyItem[] = [
  {
    id: "KEY-01", name: "Production LiveOps API Key",
    keyPrefix: "fg_live_9f82a104••••••••••••••••••••••",
    scopes: ["read", "write"], created: "Jul 18, 2026", lastUsed: "3 hours ago", status: "Active",
  },
  {
    id: "KEY-02", name: "Development Analytics Ingestion",
    keyPrefix: "fg_dev_3b11e920••••••••••••••••••••••••",
    scopes: ["read"], created: "Jun 30, 2026", lastUsed: "2 days ago", status: "Active",
  },
];

const DEFAULT_TEAM: TeamMember[] = [
  { id: "TM-01", name: "Jordan K.", email: "jordan@phantomgames.com", role: "Owner", status: "Active", isYou: true },
  { id: "TM-02", name: "Sarah M.", email: "sarah@phantomgames.com", role: "Admin", status: "Active" },
  { id: "TM-03", name: "Alex R.", email: "alex@phantomgames.com", role: "Editor", status: "Active" },
  { id: "TM-04", name: "Casey L.", email: "casey@external.io", role: "Viewer", status: "Pending" },
];

export default function Settings({ onToast, projectId }: SettingsProps) {
  const [tab, setTab] = useState<SettingsTab>("profile");

  const [settingsState, setSettingsState, saveNow, saving] = useModuleState(
    "settings",
    {
      profile: {
        displayName: "Jordan K.",
        email: "jordan@phantomgames.com",
        studioName: "Studio Phantom Games",
        role: "Lead Systems Architect",
        timezone: "UTC+08:00 — Philippine Standard Time",
        locale: "en-US (English)",
        emailAlerts: true,
        liveOpsAlerts: true,
        weeklyDigest: false,
        teamInvites: true,
        systemErrors: true,
      },
      apiKeys: DEFAULT_KEYS as ApiKeyItem[],
      team: DEFAULT_TEAM as TeamMember[],
      twoFAEnabled: false,
    },
    projectId
  );

  const profile   = settingsState.profile;
  const apiKeys   = settingsState.apiKeys  as ApiKeyItem[];
  const team      = settingsState.team     as TeamMember[];
  const twoFAEnabled = settingsState.twoFAEnabled as boolean;

  // Track unsaved changes
  const [unsaved, setUnsaved] = useState(false);

  // ── Modals & Dialogs ─────────────────────────────────────────────────────
  const [showGenerateKeyModal, setShowGenerateKeyModal] = useState(false);
  const [showInviteModal, setShowInviteModal]           = useState(false);

  // Confirm dialog
  const [confirm, setConfirm] = useState<null | {
    title: string; message: string; danger?: boolean; onConfirm: () => void;
  }>(null);

  // Password change
  const [pwCurrentVal, setPwCurrentVal] = useState("");
  const [pwNewVal,     setPwNewVal]     = useState("");
  const [pwConfirmVal, setPwConfirmVal] = useState("");
  const [showPw, setShowPw]             = useState({ cur: false, new: false, con: false });

  // Role editing in Team tab
  const [editingRole, setEditingRole] = useState<string | null>(null);

  // ── Mutators ─────────────────────────────────────────────────────────────

  const mutate = useCallback(<K extends keyof typeof settingsState>(key: K, val: typeof settingsState[K]) => {
    setSettingsState(prev => ({ ...prev, [key]: val }));
    setUnsaved(true);
  }, [setSettingsState]);

  const handleProfileChange = (key: string, val: unknown) => {
    mutate("profile", { ...profile, [key]: val });
  };

  const handleSave = async () => {
    await saveNow();
    setUnsaved(false);
    onToast("success", "Settings saved", "All workspace settings updated");
  };

  // Password change handler
  const handlePasswordChange = () => {
    if (!pwCurrentVal) { onToast("error", "Current password required", ""); return; }
    if (pwNewVal.length < 8) { onToast("error", "New password too short", "Must be at least 8 characters"); return; }
    if (pwNewVal !== pwConfirmVal) { onToast("error", "Passwords don't match", "New password and confirmation differ"); return; }
    setPwCurrentVal(""); setPwNewVal(""); setPwConfirmVal("");
    onToast("success", "Password updated", "Your password has been changed");
  };

  // API key generation (CSPRNG)
  const handleGenerateKey = (name: string, env: "fg_live" | "fg_dev" | "fg_test", scopes: ApiScope[]): string => {
    const fullKey = generateSecureKey(env);
    const newKey: ApiKeyItem = {
      id: `KEY-${Date.now()}`,
      name,
      keyPrefix: `${fullKey.slice(0, 20)}••••••••••••`,
      scopes,
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      lastUsed: "Never",
      status: "Active",
    };
    mutate("apiKeys", [...apiKeys, newKey]);
    return fullKey;   // shown once in OneTimeKeyModal
  };

  const confirmRevokeKey = (k: ApiKeyItem) => {
    setConfirm({
      title: "Revoke API Key",
      message: `"${k.name}" will be permanently revoked. Any integrations using this key will stop working immediately.`,
      danger: true,
      onConfirm: () => {
        mutate("apiKeys", apiKeys.filter(x => x.id !== k.id));
        onToast("info", "Key revoked", `"${k.name}" has been removed`);
        setConfirm(null);
      },
    });
  };

  // Team
  const handleInvite = (name: string, email: string, role: InviteRole) => {
    if (team.some(m => m.email.toLowerCase() === email.toLowerCase())) {
      onToast("error", "Already a member", `${email} is already in the workspace`);
      return;
    }
    const member: TeamMember = {
      id: `TM-${Date.now()}`,
      name, email,
      role: role as TeamMember["role"],
      status: "Pending",
    };
    mutate("team", [...team, member]);
    setShowInviteModal(false);
    onToast("success", "Invitation sent", `${name} will receive an invite to join as ${role}`);
  };

  const confirmRemoveMember = (m: TeamMember) => {
    setConfirm({
      title: "Remove Member",
      message: `Remove ${m.name} (${m.email}) from the workspace? They will lose access immediately.`,
      danger: true,
      onConfirm: () => {
        mutate("team", team.filter(x => x.id !== m.id));
        onToast("info", "Member removed", `${m.name} has been removed`);
        setConfirm(null);
      },
    });
  };

  const handleRoleChange = (id: string, newRole: TeamMember["role"]) => {
    mutate("team", team.map(m => m.id === id ? { ...m, role: newRole } : m));
    setEditingRole(null);
    onToast("success", "Role updated", `Role changed to ${newRole}`);
  };

  // ── Tab Definitions ───────────────────────────────────────────────────────

  const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "profile",       label: "Profile",       icon: <User size={13} /> },
    { id: "api",           label: "API Keys",       icon: <Key size={13} /> },
    { id: "team",          label: "Team",           icon: <Users size={13} /> },
    { id: "billing",       label: "Billing",        icon: <CreditCard size={13} /> },
    { id: "security",      label: "Security",       icon: <ShieldCheck size={13} /> },
    { id: "notifications", label: "Notifications",  icon: <Bell size={13} /> },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFF9F2] p-5 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-[#DED9EA] px-5 py-3 rounded-[14px]">
        <div>
          <h1 className="text-lg font-bold text-[#17152B]">Studio &amp; Account Settings</h1>
          <p className="text-xs text-[#6C6880]">Manage user profile, API credentials, studio team access, and subscription plans</p>
        </div>
        <div className="flex items-center gap-3">
          {unsaved && (
            <div className="flex items-center gap-1.5 text-amber-500 text-xs font-semibold">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Unsaved changes
            </div>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#6C3BFF] rounded-xl hover:bg-[#5a2fe0] transition-colors disabled:opacity-50"
            disabled={saving}
          >
            {saving ? <Cloud size={13} className="animate-pulse" /> : <Save size={13} />} Save Changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-xl border border-[#DED9EA] w-fit overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              tab === t.id ? "bg-[#6C3BFF] text-white" : "text-[#6C6880] hover:text-[#17152B] hover:bg-[#F4F1FA]"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ─────────────────────────────────────────────────── */}
      {tab === "profile" && (
        <div className="max-w-2xl space-y-4">

          {/* Avatar + identity */}
          <div className="bg-white border border-[#DED9EA] p-6 rounded-[14px] shadow-sm space-y-4">
            <SectionLabel>Personal Identity</SectionLabel>

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl cursor-pointer select-none hover:opacity-80 transition-opacity"
                style={{ background: getAvatarColor(profile.displayName) }}
                title="Avatar (click to upload)"
              >
                {getInitials(profile.displayName)}
              </div>
              <div>
                <p className="text-xs font-bold text-[#17152B]">{profile.displayName}</p>
                <p className="text-xs text-[#6C6880]">{profile.email}</p>
                <button className="mt-1.5 text-[10px] font-semibold text-[#6C3BFF] hover:underline flex items-center gap-1">
                  <ArrowRight size={10} /> Upload photo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Display Name">
                <Input value={profile.displayName} onChange={e => handleProfileChange("displayName", e.target.value)} />
              </FormField>
              <FormField label="Your Role / Title">
                <Input value={profile.role} onChange={e => handleProfileChange("role", e.target.value)} placeholder="e.g. Lead Systems Architect" />
              </FormField>
              <FormField label="Email Address" hint="Used for sign-in and notifications">
                <Input type="email" value={profile.email} onChange={e => handleProfileChange("email", e.target.value)} />
              </FormField>
              <FormField label="Timezone">
                <Select value={profile.timezone} onChange={e => handleProfileChange("timezone", e.target.value)}>
                  {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
                </Select>
              </FormField>
              <FormField label="Locale / Language">
                <Select value={profile.locale} onChange={e => handleProfileChange("locale", e.target.value)}>
                  {LOCALES.map(l => <option key={l}>{l}</option>)}
                </Select>
              </FormField>
            </div>
          </div>

          {/* Studio */}
          <div className="bg-white border border-[#DED9EA] p-6 rounded-[14px] shadow-sm space-y-3">
            <SectionLabel>Studio Workspace</SectionLabel>
            <FormField label="Studio Name" hint="Used as workspace display name across the platform">
              <Input value={profile.studioName} onChange={e => handleProfileChange("studioName", e.target.value)} />
            </FormField>
          </div>

          {/* Password change */}
          <div className="bg-white border border-[#DED9EA] p-6 rounded-[14px] shadow-sm space-y-3">
            <SectionLabel>Change Password</SectionLabel>
            <div className="space-y-2">
              {([
                { key: "cur" as const, label: "Current Password", val: pwCurrentVal, set: setPwCurrentVal },
                { key: "new" as const, label: "New Password",     val: pwNewVal,     set: setPwNewVal },
                { key: "con" as const, label: "Confirm New Password", val: pwConfirmVal, set: setPwConfirmVal },
              ]).map(({ key, label, val, set }) => (
                <div key={key} className="relative">
                  <label className="text-xs font-semibold text-[#17152B] block mb-1">{label}</label>
                  <div className="relative">
                    <Input type={showPw[key] ? "text" : "password"} value={val} onChange={e => set(e.target.value)} placeholder="••••••••" />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6C6880] hover:text-[#17152B]"
                    >
                      {showPw[key] ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handlePasswordChange} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#6C3BFF] border border-[#6C3BFF]/30 bg-[#6C3BFF]/5 rounded-xl hover:bg-[#6C3BFF]/10 transition-colors">
              <Lock size={13} /> Update Password
            </button>
          </div>
        </div>
      )}

      {/* ── API Keys Tab ──────────────────────────────────────────────────── */}
      {tab === "api" && (
        <div className="bg-white border border-[#DED9EA] p-6 rounded-[14px] shadow-sm max-w-3xl space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <SectionLabel>API Keys &amp; Access Tokens</SectionLabel>
              <p className="text-xs text-[#6C6880] -mt-2">Use keys to integrate external LiveOps pipelines and CI/CD balance tests. Keys are shown <span className="font-semibold">once</span> at creation.</p>
            </div>
            <button
              onClick={() => setShowGenerateKeyModal(true)}
              className="flex items-center gap-1.5 bg-[#6C3BFF] text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#5a2fe0] shrink-0 transition-colors"
            >
              <Plus size={13} /> Generate Key
            </button>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2 bg-[#F4F1FA] rounded-xl text-[10px] font-bold uppercase tracking-wider text-[#6C6880]">
            <span>Key / Prefix</span>
            <span>Scopes</span>
            <span>Last Used</span>
            <span>Actions</span>
          </div>

          {apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
              <Key size={32} className="text-[#DED9EA]" />
              <p className="text-sm font-semibold text-[#6C6880]">No API keys yet</p>
              <p className="text-xs text-[#B0ABCC]">Generate a key to connect external services</p>
            </div>
          ) : (
            <div className="space-y-2">
              {apiKeys.map(k => (
                <div key={k.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center p-4 bg-[#F4F1FA] border border-[#DED9EA] rounded-xl">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-[#17152B]">{k.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${k.status === "Active" ? "text-[#19A974] bg-[#EDFAF4]" : "text-[#6C6880] bg-[#F4F1FA]"}`}>
                        {k.status}
                      </span>
                    </div>
                    <code className="font-mono text-[10px] text-[#6C6880]">{k.keyPrefix}</code>
                    <p className="text-[10px] text-[#B0ABCC] mt-0.5">Created {k.created}</p>
                  </div>

                  <div className="flex gap-1 flex-wrap">
                    {k.scopes.map(s => {
                      const sm = SCOPE_META[s];
                      return (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ color: sm.color, background: sm.bg }}>
                          {sm.label}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-[#6C6880]">
                    <Clock size={10} /> {k.lastUsed}
                  </div>

                  <button
                    onClick={() => confirmRevokeKey(k)}
                    className="flex items-center gap-1 text-[#FF3B4F] hover:bg-red-50 text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} /> Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Team Tab ───────────────────────────────────────────────────────── */}
      {tab === "team" && (
        <div className="bg-white border border-[#DED9EA] p-6 rounded-[14px] shadow-sm max-w-3xl space-y-4">
          <div className="flex justify-between items-center">
            <SectionLabel>Studio Team Members</SectionLabel>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-1.5 bg-[#6C3BFF] text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#5a2fe0] transition-colors"
            >
              <Plus size={13} /> Invite Member
            </button>
          </div>

          {/* Legend */}
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(ROLE_META) as [TeamMember["role"], typeof ROLE_META[TeamMember["role"]]][]).map(([role, meta]) => (
              <div key={role} className="flex items-center gap-1.5 text-[10px]">
                <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                <span className="text-[#6C6880] font-semibold">{meta.label}</span>
                <span className="text-[#B0ABCC]">— {meta.desc}</span>
              </div>
            ))}
          </div>

          {team.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center space-y-2">
              <Users size={32} className="text-[#DED9EA]" />
              <p className="text-sm font-semibold text-[#6C6880]">No team members yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#DED9EA] border border-[#DED9EA] rounded-xl overflow-hidden">
              {team.map(m => {
                const meta = ROLE_META[m.role];
                const avatarColor = getAvatarColor(m.name);
                return (
                  <div key={m.id} className="p-4 flex items-center justify-between bg-white hover:bg-[#F4F1FA]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                           style={{ background: avatarColor }}>
                        {getInitials(m.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-[#17152B]">{m.name}</h4>
                          {m.isYou && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-[#6C3BFF]/10 text-[#6C3BFF] rounded font-semibold">You</span>
                          )}
                          {m.status === "Pending" && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-500 rounded font-semibold flex items-center gap-0.5">
                              <Clock size={9} /> Pending
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#6C6880]">{m.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Role badge / editable */}
                      {editingRole === m.id && m.role !== "Owner" ? (
                        <div className="relative">
                          <select
                            value={m.role}
                            onChange={e => handleRoleChange(m.id, e.target.value as TeamMember["role"])}
                            className="text-xs border border-[#6C3BFF] rounded-lg px-2 py-1 bg-white outline-none"
                            autoFocus
                            onBlur={() => setEditingRole(null)}
                          >
                            {(["Admin", "Editor", "Viewer"] as TeamMember["role"][]).map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                            style={{ color: meta.color, background: meta.bg }}
                            title={meta.desc}
                          >
                            {meta.label}
                          </span>
                          {!m.isYou && m.role !== "Owner" && (
                            <button
                              onClick={() => setEditingRole(m.id)}
                              className="p-1 rounded hover:bg-[#DED9EA] text-[#6C6880] transition-colors"
                              title="Edit role"
                            >
                              <Edit2 size={11} />
                            </button>
                          )}
                        </div>
                      )}

                      {!m.isYou && m.role !== "Owner" && (
                        <button
                          onClick={() => confirmRemoveMember(m)}
                          className="flex items-center gap-1 text-[#FF3B4F] hover:bg-red-50 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors"
                        >
                          <Trash2 size={10} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ownership transfer notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
            <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700">
              To transfer workspace ownership, contact support or use the <span className="font-bold">Transfer Ownership</span> option in Studio Settings → Advanced.
            </p>
          </div>
        </div>
      )}

      {/* ── Billing Tab ───────────────────────────────────────────────────── */}
      {tab === "billing" && (
        <div className="max-w-2xl space-y-4">

          {/* Plan Card */}
          <div className="bg-white border border-[#DED9EA] p-6 rounded-[14px] shadow-sm space-y-4">
            <SectionLabel>Subscription Plan</SectionLabel>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#6C3BFF]/10 to-[#9B6DFF]/5 border border-[#6C3BFF]/20 rounded-xl">
              <div>
                <span className="text-xs text-[#6C6880] block">Current Plan</span>
                <span className="text-lg font-bold text-[#6C3BFF]">Studio Pro</span>
                <span className="text-xs text-[#6C6880] block">$99 / month</span>
              </div>
              <div className="text-right space-y-1.5">
                <span className="text-xs font-bold text-[#19A974] bg-[#EDFAF4] px-3 py-1 rounded-full border border-[#C8F0DC] block">Active</span>
                <div className="flex gap-1.5">
                  <button className="text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-[#DED9EA] hover:bg-[#F4F1FA] text-[#6C6880] transition-colors">Downgrade</button>
                  <button className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#6C3BFF] text-white hover:bg-[#5a2fe0] transition-colors">Upgrade</button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6C6880]">
              <Calendar size={13} className="text-[#6C3BFF]" />
              <span>Next billing date: <strong className="text-[#17152B]">Aug 31, 2026</strong></span>
            </div>
          </div>

          {/* Usage */}
          <div className="bg-white border border-[#DED9EA] p-6 rounded-[14px] shadow-sm space-y-4">
            <SectionLabel>Usage This Cycle</SectionLabel>
            {[
              { label: "API Calls",      used: 182400, max: 500000, unit: "calls",   color: "#6C3BFF" },
              { label: "AI Credits",     used: 3820,   max: 10000,  unit: "credits", color: "#F59E0B" },
              { label: "Active Sessions",used: 7,      max: 50,     unit: "sessions",color: "#10B981" },
              { label: "Data Storage",   used: 4.2,    max: 10,     unit: "GB",      color: "#3B82F6" },
            ].map(u => (
              <div key={u.label} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#17152B]">{u.label}</span>
                  <span className="text-[#6C6880]">{u.used.toLocaleString()} / {u.max.toLocaleString()} {u.unit}</span>
                </div>
                <ProgressBar value={u.used} max={u.max} color={u.color} />
              </div>
            ))}
          </div>

          {/* Payment & invoices */}
          <div className="bg-white border border-[#DED9EA] p-6 rounded-[14px] shadow-sm space-y-3">
            <SectionLabel>Payment Method</SectionLabel>
            <div className="flex items-center justify-between p-3 bg-[#F4F1FA] rounded-xl">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white rounded-lg border border-[#DED9EA]">
                  <CreditCard size={16} className="text-[#6C3BFF]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#17152B]">Visa •••• •••• •••• 4242</p>
                  <p className="text-[10px] text-[#6C6880]">Expires 09/2028</p>
                </div>
              </div>
              <button className="text-[10px] font-semibold text-[#6C3BFF] hover:underline">Update</button>
            </div>

            <SectionLabel>Invoice History</SectionLabel>
            {[
              { date: "Jul 1, 2026",  amount: "$99.00", status: "Paid" },
              { date: "Jun 1, 2026",  amount: "$99.00", status: "Paid" },
              { date: "May 1, 2026",  amount: "$99.00", status: "Paid" },
            ].map(inv => (
              <div key={inv.date} className="flex justify-between items-center py-2 border-b border-[#DED9EA] last:border-0">
                <div>
                  <p className="text-xs font-semibold text-[#17152B]">{inv.date}</p>
                  <p className="text-[10px] text-[#6C6880]">{inv.amount}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-[#19A974] bg-[#EDFAF4] px-2 py-0.5 rounded-full">{inv.status}</span>
                  <button className="text-[10px] font-semibold text-[#6C3BFF] hover:underline">Download</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Security Tab ──────────────────────────────────────────────────── */}
      {tab === "security" && (
        <div className="max-w-2xl space-y-4">

          {/* 2FA */}
          <div className="bg-white border border-[#DED9EA] p-6 rounded-[14px] shadow-sm space-y-4">
            <SectionLabel>Two-Factor Authentication</SectionLabel>
            <div className="flex items-center justify-between p-4 bg-[#F4F1FA] rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${twoFAEnabled ? "bg-green-50" : "bg-[#DED9EA]"}`}>
                  <Smartphone size={16} className={twoFAEnabled ? "text-green-500" : "text-[#6C6880]"} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#17152B]">Authenticator App (TOTP)</p>
                  <p className="text-[10px] text-[#6C6880]">{twoFAEnabled ? "2FA is active — your account is protected" : "Protect your account with a TOTP app"}</p>
                </div>
              </div>
              <Toggle checked={twoFAEnabled} onChange={v => { mutate("twoFAEnabled", v); onToast(v ? "success" : "warning", v ? "2FA Enabled" : "2FA Disabled", v ? "Your account is now more secure" : "Re-enable 2FA to keep your account safe"); }} />
            </div>
          </div>

          {/* Active sessions */}
          <div className="bg-white border border-[#DED9EA] p-6 rounded-[14px] shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <SectionLabel>Active Sessions</SectionLabel>
              <button className="text-[10px] font-semibold text-[#FF3B4F] hover:underline flex items-center gap-1">
                <LogOut size={10} /> Sign out all other sessions
              </button>
            </div>
            {[
              { device: "Chrome — Windows 11", ip: "203.0.113.42", time: "Current session", current: true },
              { device: "Safari — macOS Ventura", ip: "198.51.100.18", time: "Last active 2h ago", current: false },
              { device: "Figma Desktop App", ip: "192.0.2.7", time: "Last active 5 days ago", current: false },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#F4F1FA] rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-[#17152B]">{s.device}</p>
                  <p className="text-[10px] text-[#6C6880]">{s.ip} · {s.time}</p>
                </div>
                {s.current
                  ? <span className="text-[10px] font-bold text-[#19A974] bg-[#EDFAF4] px-2 py-0.5 rounded-full">This device</span>
                  : <button className="text-[10px] font-semibold text-[#FF3B4F] hover:underline">Revoke</button>
                }
              </div>
            ))}
          </div>

          {/* Audit log */}
          <div className="bg-white border border-[#DED9EA] p-6 rounded-[14px] shadow-sm space-y-3">
            <SectionLabel>Recent Security Events</SectionLabel>
            {[
              { event: "Password changed",        time: "Jul 30, 2026 · 14:22",  icon: <Lock size={12} className="text-[#6C3BFF]" /> },
              { event: "New API key generated",   time: "Jul 28, 2026 · 09:41",  icon: <Key size={12} className="text-amber-500" /> },
              { event: "Team member invited",     time: "Jul 25, 2026 · 17:05",  icon: <Users size={12} className="text-[#3B82F6]" /> },
              { event: "Sign-in from new device", time: "Jul 20, 2026 · 22:14",  icon: <Smartphone size={12} className="text-[#EF4444]" /> },
              { event: "2FA enabled",             time: "Jul 15, 2026 · 08:33",  icon: <ShieldCheck size={12} className="text-[#10B981]" /> },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-[#DED9EA] last:border-0">
                <div className="p-1.5 bg-[#F4F1FA] rounded-lg">{e.icon}</div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[#17152B]">{e.event}</p>
                  <p className="text-[10px] text-[#6C6880]">{e.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Notifications Tab ─────────────────────────────────────────────── */}
      {tab === "notifications" && (
        <div className="bg-white border border-[#DED9EA] p-6 rounded-[14px] shadow-sm max-w-2xl space-y-4">
          <SectionLabel>Notification Preferences</SectionLabel>
          <p className="text-xs text-[#6C6880] -mt-2">Control which events send you email or in-app notifications.</p>

          {[
            {
              group: "LiveOps & Game Systems",
              items: [
                { key: "liveOpsAlerts",  label: "LiveOps alerts",            desc: "Balance anomalies, gacha risk spikes, and economy warnings" },
                { key: "systemErrors",   label: "System errors",             desc: "Critical errors, API failures, and sync issues" },
              ],
            },
            {
              group: "Team & Account",
              items: [
                { key: "teamInvites",   label: "Team invites & role changes", desc: "When someone is invited, accepts, or has their role changed" },
                { key: "emailAlerts",   label: "Security alerts",            desc: "Sign-ins from new devices, password changes, and 2FA events" },
              ],
            },
            {
              group: "Digests & Reports",
              items: [
                { key: "weeklyDigest",  label: "Weekly summary digest",     desc: "A weekly email summarising your studio's activity and metrics" },
              ],
            },
          ].map(group => (
            <div key={group.group} className="space-y-2">
              <p className="text-[10px] font-bold text-[#B0ABCC] uppercase tracking-wider">{group.group}</p>
              <div className="divide-y divide-[#DED9EA] border border-[#DED9EA] rounded-xl overflow-hidden">
                {group.items.map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-white hover:bg-[#F4F1FA]/40 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-[#17152B]">{item.label}</p>
                      <p className="text-[10px] text-[#6C6880]">{item.desc}</p>
                    </div>
                    <Toggle
                      checked={!!(profile as Record<string, unknown>)[item.key]}
                      onChange={v => handleProfileChange(item.key, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {showGenerateKeyModal && (
        <GenerateKeyModal
          onGenerate={(name, env, scopes) => {
            const key = handleGenerateKey(name, env, scopes);
            return key;
          }}
          onClose={() => setShowGenerateKeyModal(false)}
        />
      )}

      {showInviteModal && (
        <InviteModal onInvite={handleInvite} onClose={() => setShowInviteModal(false)} />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
