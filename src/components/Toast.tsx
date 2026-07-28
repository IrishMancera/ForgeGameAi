import { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: { border: "border-[#19A974]", icon: "text-[#19A974]", bg: "bg-white" },
  error: { border: "border-[#FF3B4F]", icon: "text-[#FF3B4F]", bg: "bg-white" },
  warning: { border: "border-[#FFC928]", icon: "text-[#FFC928]", bg: "bg-white" },
  info: { border: "border-[#19C6D1]", icon: "text-[#19C6D1]", bg: "bg-white" },
};

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [visible, setVisible] = useState(true);
  const Icon = icons[toast.type];
  const c = colors[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 200);
    }, toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  return (
    <div
      className={`toast-enter flex items-start gap-3 p-4 rounded-[14px] shadow-lg border-l-4 ${c.border} ${c.bg} min-w-[320px] max-w-[400px] transition-all duration-200 ${!visible ? "opacity-0 translate-x-4" : "opacity-100"}`}
      style={{ boxShadow: "0 4px 24px rgba(108, 59, 255, 0.12)" }}
    >
      <Icon size={18} className={`${c.icon} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#17152B] leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-[#6C6880] mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 200); }}
        className="text-[#6C6880] hover:text-[#17152B] transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}

interface ToastCenterProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export function ToastCenter({ toasts, onRemove }: ToastCenterProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

let toastCount = 0;
export function createToast(
  type: ToastType,
  title: string,
  message?: string,
  duration?: number
): ToastMessage {
  return { id: `toast-${++toastCount}`, type, title, message, duration };
}
