import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Wifi, Info, Trash2, RefreshCw } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface PairedBrowser {
  origin: string;
  connectedAt: number;
}

interface NativeHostWindowsRegistryDiagnostics {
  chromeKeyExists: boolean;
  chromeValue: string | null;
  chromeMatchesManifestPath: boolean;
  edgeKeyExists: boolean;
  edgeValue: string | null;
  edgeMatchesManifestPath: boolean;
}

interface NativeHostDiagnostics {
  manifestPath: string;
  manifestExists: boolean;
  hostPath: string | null;
  hostExists: boolean;
  allowedOrigins: string[];
  expectedOrigins: string[];
  windowsRegistry: NativeHostWindowsRegistryDiagnostics | null;
}

function formatOrigin(origin: string): string {
  return origin
    .replace("chrome-extension://", "Chrome Extension: ")
    .replace(/\/$/, "");
}

export default function ConnectedBrowsers() {
  const { t } = useTranslation();
  const [browsers, setBrowsers] = useState<PairedBrowser[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<NativeHostDiagnostics | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);

  const loadBrowsers = useCallback(async () => {
    try {
      const list = await invoke<PairedBrowser[]>("get_connected_browsers");
      setBrowsers(list);
    } catch {
      setBrowsers([]);
    }
  }, []);

  const loadDiagnostics = useCallback(async () => {
    setDiagnosticsLoading(true);
    try {
      const data = await invoke<NativeHostDiagnostics>("get_native_host_diagnostics");
      setDiagnostics(data);
      setDiagnosticsError(null);
    } catch {
      setDiagnostics(null);
      setDiagnosticsError(t("NativeHostDiagnosticsUnavailable"));
    } finally {
      setDiagnosticsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadBrowsers();
    if (showDiagnostics) {
      void loadDiagnostics();
    }
    const interval = setInterval(() => {
      void loadBrowsers();
      if (showDiagnostics) {
        void loadDiagnostics();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [loadBrowsers, loadDiagnostics, showDiagnostics]);

  const removeBrowser = async (origin: string) => {
    try {
      await invoke("remove_browser", { origin });
      setBrowsers((prev) => prev.filter((b) => b.origin !== origin));
    } catch {
      // ignore
    }
  };

  return (
    <div className="h-full overflow-y-auto">
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

        <section className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-text-primary">
              {t("NativeHostDiagnostics")}
            </h3>
            <div className="inline-flex items-center gap-3">
              <button
                onClick={() => {
                  const next = !showDiagnostics;
                  setShowDiagnostics(next);
                  if (next) void loadDiagnostics();
                }}
                className="text-xs text-text-muted hover:text-text-primary transition-colors"
                title={showDiagnostics ? t("Hide") : t("Show")}
              >
                {showDiagnostics ? t("Hide") : t("Show")}
              </button>
              {showDiagnostics ? (
                <button
                  onClick={() => void loadDiagnostics()}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1"
                  title={t("Refresh")}
                >
                  <RefreshCw size={12} />
                  {t("Refresh")}
                </button>
              ) : null}
            </div>
          </div>
          {showDiagnostics ? (
            <>
              <p className="text-xs text-text-muted mb-3">
                {t("NativeHostDiagnosticsDesc")}
              </p>
              {diagnosticsError ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400">
                  {diagnosticsError}
                </div>
              ) : diagnostics ? (
                <div className="bg-surface-secondary border border-border rounded-xl divide-y divide-border">
                  <div className="p-3">
                    <div className="text-xs text-text-muted mb-1">{t("ManifestPath")}</div>
                    <code className="text-xs text-text-primary break-all">
                      {diagnostics.manifestPath}
                    </code>
                  </div>

                  <div className="p-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-text-muted">{t("ManifestStatus")}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        diagnostics.manifestExists
                          ? "text-green-500 bg-green-500/10"
                          : "text-red-400 bg-red-500/10"
                      }`}
                    >
                      {diagnostics.manifestExists ? t("Present") : t("Missing")}
                    </span>
                  </div>

                  <div className="p-3">
                    <div className="text-xs text-text-muted mb-1">{t("HostExecutablePath")}</div>
                    <code className="text-xs text-text-primary break-all">
                      {diagnostics.hostPath || t("NotAvailable")}
                    </code>
                  </div>

                  <div className="p-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-text-muted">{t("HostExecutableStatus")}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        diagnostics.hostExists
                          ? "text-green-500 bg-green-500/10"
                          : "text-red-400 bg-red-500/10"
                      }`}
                    >
                      {diagnostics.hostExists ? t("Present") : t("Missing")}
                    </span>
                  </div>

                  <div className="p-3">
                    <div className="text-xs text-text-muted mb-1">{t("AllowedOrigins")}</div>
                    {diagnostics.allowedOrigins.length > 0 ? (
                      <div className="space-y-1">
                        {diagnostics.allowedOrigins.map((origin) => (
                          <code key={origin} className="block text-xs text-text-primary break-all">
                            {origin}
                          </code>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-text-muted">{t("NotAvailable")}</div>
                    )}
                  </div>

                  {diagnostics.windowsRegistry ? (
                    <div className="p-3 space-y-3">
                      <div className="text-xs text-text-muted">{t("WindowsRegistryStatus")}</div>

                      <div className="space-y-1">
                        <div className="text-xs text-text-primary">{t("ChromeRegistryKey")}</div>
                        <div className="text-xs">
                          <span className="text-text-muted">{t("RegistryKeyStatus")}: </span>
                          <span
                            className={
                              diagnostics.windowsRegistry.chromeKeyExists
                                ? "text-green-500"
                                : "text-red-400"
                            }
                          >
                            {diagnostics.windowsRegistry.chromeKeyExists
                              ? t("Present")
                              : t("Missing")}
                          </span>
                        </div>
                        <div className="text-xs text-text-muted">
                          {diagnostics.windowsRegistry.chromeValue || t("NotAvailable")}
                        </div>
                        <div className="text-xs">
                          <span className="text-text-muted">{t("MatchesManifestPath")}: </span>
                          <span
                            className={
                              diagnostics.windowsRegistry.chromeMatchesManifestPath
                                ? "text-green-500"
                                : "text-red-400"
                            }
                          >
                            {diagnostics.windowsRegistry.chromeMatchesManifestPath
                              ? t("Yes")
                              : t("No")}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs text-text-primary">{t("EdgeRegistryKey")}</div>
                        <div className="text-xs">
                          <span className="text-text-muted">{t("RegistryKeyStatus")}: </span>
                          <span
                            className={
                              diagnostics.windowsRegistry.edgeKeyExists
                                ? "text-green-500"
                                : "text-red-400"
                            }
                          >
                            {diagnostics.windowsRegistry.edgeKeyExists
                              ? t("Present")
                              : t("Missing")}
                          </span>
                        </div>
                        <div className="text-xs text-text-muted">
                          {diagnostics.windowsRegistry.edgeValue || t("NotAvailable")}
                        </div>
                        <div className="text-xs">
                          <span className="text-text-muted">{t("MatchesManifestPath")}: </span>
                          <span
                            className={
                              diagnostics.windowsRegistry.edgeMatchesManifestPath
                                ? "text-green-500"
                                : "text-red-400"
                            }
                          >
                            {diagnostics.windowsRegistry.edgeMatchesManifestPath
                              ? t("Yes")
                              : t("No")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="bg-surface-secondary border border-border rounded-xl p-3 text-xs text-text-muted">
                  {diagnosticsLoading ? t("Checking") : t("NativeHostDiagnosticsUnavailable")}
                </div>
              )}
            </>
          ) : (
            <div className="bg-surface-secondary border border-border rounded-xl p-3 text-xs text-text-muted">
              {t("NativeHostDiagnosticsDesc")}
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
