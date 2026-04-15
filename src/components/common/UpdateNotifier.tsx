import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Download, X, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

type UpdateState = "idle" | "available" | "downloading" | "ready" | "error";

export default function UpdateNotifier() {
  const { t } = useTranslation();
  const [state, setState] = useState<UpdateState>("idle");
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const checkForUpdate = useCallback(async () => {
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (update) {
        setState("available");
      }
    } catch {
      // Updater not available in dev or no endpoint configured
    }
  }, []);

  useEffect(() => {
    const autoUpdateDisabled =
      localStorage.getItem("passwall_auto_update") === "false";
    if (autoUpdateDisabled) return;

    const timer = setTimeout(checkForUpdate, 3000);
    return () => clearTimeout(timer);
  }, [checkForUpdate]);

  const handleDownloadAndInstall = async () => {
    setState("downloading");
    setProgress(0);

    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (!update) {
        setState("idle");
        return;
      }

      let totalBytes = 0;
      let receivedBytes = 0;

      await update.downloadAndInstall((event) => {
        if (event.event === "Started" && event.data.contentLength) {
          totalBytes = event.data.contentLength;
        } else if (event.event === "Progress") {
          receivedBytes += event.data.chunkLength;
          if (totalBytes > 0) {
            setProgress(Math.round((receivedBytes / totalBytes) * 100));
          }
        } else if (event.event === "Finished") {
          setProgress(100);
        }
      });

      setState("ready");

      setTimeout(async () => {
        try {
          const { relaunch } = await import("@tauri-apps/plugin-process");
          await relaunch();
        } catch {
          // Relaunch may fail silently
        }
      }, 1500);
    } catch {
      setState("error");
    }
  };

  const handleRetry = () => {
    setState("idle");
    setProgress(0);
    checkForUpdate();
  };

  if (state === "idle" || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-sidebar-bg text-white px-4 py-3 rounded-xl shadow-2xl border border-white/10 w-80">
      {state === "available" && (
        <div className="flex items-center gap-3">
          <Download size={18} className="text-primary-light shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{t("UpdateAvailable")}</p>
          </div>
          <button
            onClick={handleDownloadAndInstall}
            className="text-xs bg-primary hover:bg-primary-hover px-3 py-1.5 rounded-lg transition-colors font-medium shrink-0"
          >
            {t("Updates")}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {state === "downloading" && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <RefreshCw size={16} className="animate-spin text-primary-light shrink-0" />
            <span className="text-sm flex-1">
              {progress > 0 ? `${progress}%` : t("Checking")}
            </span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {state === "ready" && (
        <div className="flex items-center gap-3">
          <CheckCircle size={18} className="text-green-400 shrink-0" />
          <span className="text-sm">Restarting...</span>
        </div>
      )}

      {state === "error" && (
        <div className="flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <span className="text-sm flex-1">Update failed</span>
          <button
            onClick={handleRetry}
            className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
