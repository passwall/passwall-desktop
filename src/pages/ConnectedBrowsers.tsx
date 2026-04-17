import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Wifi, Info, Trash2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface PairedBrowser {
  origin: string;
  connectedAt: number;
}

function formatOrigin(origin: string): string {
  return origin
    .replace("chrome-extension://", "Chrome Extension: ")
    .replace(/\/$/, "");
}

export default function ConnectedBrowsers() {
  const { t } = useTranslation();
  const [browsers, setBrowsers] = useState<PairedBrowser[]>([]);

  const loadBrowsers = useCallback(async () => {
    try {
      const list = await invoke<PairedBrowser[]>("get_connected_browsers");
      setBrowsers(list);
    } catch {
      setBrowsers([]);
    }
  }, []);

  useEffect(() => {
    void loadBrowsers();
    const interval = setInterval(() => void loadBrowsers(), 5000);
    return () => clearInterval(interval);
  }, [loadBrowsers]);

  const removeBrowser = async (origin: string) => {
    try {
      await invoke("remove_browser", { origin });
      setBrowsers((prev) => prev.filter((b) => b.origin !== origin));
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 max-w-xl mx-auto">
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          {t("ConnectedBrowsers")}
        </h2>
        <p className="text-sm text-text-muted mb-6">
          {t("BrowserExtensionsConnected")}
        </p>

        <section className="mb-8">
          <h3 className="text-sm font-medium text-text-primary mb-3">
            {t("ActiveConnections")}
          </h3>
          {browsers.length > 0 ? (
            <div className="bg-surface-secondary border border-border rounded-xl divide-y divide-border">
              {browsers.map((b) => (
                <div
                  key={b.origin}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Globe className="text-primary shrink-0" size={18} />
                    <span className="text-sm font-medium text-text-primary truncate">
                      {formatOrigin(b.origin)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                      {t("Connected")}
                    </span>
                    <button
                      onClick={() => removeBrowser(b.origin)}
                      className="text-text-muted hover:text-red-500 transition-colors p-1 rounded"
                      title={t("Remove")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-secondary border border-border rounded-xl p-8 text-center">
              <Globe className="mx-auto mb-3 text-text-muted" size={32} />
              <p className="text-sm font-medium text-text-primary mb-1">
                {t("NoBrowsersConnected")}
              </p>
              <p className="text-xs text-text-muted max-w-xs mx-auto">
                {t("OpenExtensionHint")}
              </p>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-sm font-medium text-text-primary mb-3">
            {t("HowItWorks")}
          </h3>
          <div className="bg-surface-secondary border border-border rounded-xl divide-y divide-border">
            {[
              { icon: Globe, text: t("InstallExtension") },
              { icon: Wifi, text: t("KeepAppRunning") },
              { icon: Info, text: t("ExtensionAutoConnect") },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <step.icon size={16} />
                </div>
                <p className="text-sm text-text-primary">{step.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
