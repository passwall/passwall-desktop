import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: "bg-green-900/30 border-green-700 text-green-300",
  error: "bg-red-900/30 border-red-700 text-red-300",
  warning: "bg-yellow-900/30 border-yellow-700 text-yellow-300",
  info: "bg-blue-900/30 border-blue-700 text-blue-300",
};

export default function Notifications() {
  const notifications = useUiStore((s) => s.notifications);
  const removeNotification = useUiStore((s) => s.removeNotification);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((n) => {
        const Icon = icons[n.type];
        return (
          <div
            key={n.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg animate-in slide-in-from-right ${colors[n.type]}`}
          >
            <Icon size={16} className="shrink-0" />
            <span className="text-sm flex-1">{n.message}</span>
            <button
              onClick={() => removeNotification(n.id)}
              className="p-0.5 hover:opacity-70"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
