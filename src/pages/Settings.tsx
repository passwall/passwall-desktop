import { useTranslation } from "react-i18next";
import { useEffect, useState, useRef } from "react";
import { useVaultStore } from "@/stores/vault-store";
import { useUiStore, type ThemeMode } from "@/stores/ui-store";
import { exportItemsToCSV, parseCSV, detectTypeFromFilename } from "@/lib/import-export";
import {
  checkForAvailableUpdate,
  installUpdate,
  isAutoUpdateChecksEnabled,
  setAutoUpdateChecksEnabled,
} from "@/lib/updater";
import {
  isStartOnLoginEnabled,
  isStartOnLoginSupported,
  setStartOnLoginEnabled,
} from "@/lib/autostart";
import { Download, Upload, Sun, Moon, Monitor } from "lucide-react";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [version, setVersion] = useState("");
  const [launchAtLogin, setLaunchAtLogin] = useState(false);
  const [launchAtLoginLoading, setLaunchAtLoginLoading] = useState(true);
  const [launchAtLoginSupported, setLaunchAtLoginSupported] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(isAutoUpdateChecksEnabled());
  const [checking, setChecking] = useState(false);
  const [installingUpdate, setInstallingUpdate] = useState(false);
  const [pendingUpdateVersion, setPendingUpdateVersion] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportItems = useVaultStore((s) => s.exportItems);
  const addNotification = useUiStore((s) => s.addNotification);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  const themeOptions: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  useEffect(() => {
    import("@tauri-apps/api/app")
      .then((mod) => mod.getVersion())
      .then(setVersion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadLaunchAtLogin = async () => {
      try {
        const supported = await isStartOnLoginSupported();
        if (!mounted) return;
        setLaunchAtLoginSupported(supported);
        if (!supported) {
          setLaunchAtLogin(false);
          return;
        }
        const enabled = await isStartOnLoginEnabled();
        if (mounted) setLaunchAtLogin(enabled);
      } catch {
        if (mounted) {
          setLaunchAtLoginSupported(false);
          setLaunchAtLogin(false);
        }
      } finally {
        if (mounted) setLaunchAtLoginLoading(false);
      }
    };
    void loadLaunchAtLogin();
    return () => {
      mounted = false;
    };
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("passwall_desktop_locale", lng);
  };

  const toggleAutoUpdate = () => {
    const newVal = !autoUpdate;
    setAutoUpdate(newVal);
    setAutoUpdateChecksEnabled(newVal);
  };

  const toggleLaunchAtLogin = async () => {
    const newVal = !launchAtLogin;
    setLaunchAtLoginLoading(true);
    try {
      await setStartOnLoginEnabled(newVal);
      setLaunchAtLogin(newVal);
      addNotification("success", newVal ? t("LaunchAtLoginEnabled") : t("LaunchAtLoginDisabled"));
    } catch {
      addNotification("error", t("LaunchAtLoginUpdateFailed"));
    } finally {
      setLaunchAtLoginLoading(false);
    }
  };

  const checkForUpdates = async () => {
    setChecking(true);
    // #region agent log
    fetch("http://127.0.0.1:7424/ingest/d56ae62b-d051-4704-a2bf-8292a48c483c", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "21998d" }, body: JSON.stringify({ sessionId: "21998d", runId: "update-check-investigation-1", hypothesisId: "H5", location: "src/pages/Settings.tsx:checkForUpdates:start", message: "Settings update check button triggered", data: { checkingStateBefore: checking, autoUpdate }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion
    try {
      const update = await checkForAvailableUpdate();
      if (update) {
        setPendingUpdateVersion(update.version ?? null);
        addNotification("info", t("UpdateAvailable"));
      } else {
        setPendingUpdateVersion(null);
        addNotification("success", t("AlreadyUpToDate"));
      }
    } catch (error: unknown) {
      // #region agent log
      fetch("http://127.0.0.1:7424/ingest/d56ae62b-d051-4704-a2bf-8292a48c483c", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "21998d" }, body: JSON.stringify({ sessionId: "21998d", runId: "update-check-investigation-1", hypothesisId: "H5", location: "src/pages/Settings.tsx:checkForUpdates:catch", message: "Settings update check failed", data: { errorName: error instanceof Error ? error.name : typeof error, errorMessage: error instanceof Error ? error.message : String(error) }, timestamp: Date.now() }) }).catch(() => {});
      // #endregion
      const details =
        error instanceof Error && error.message ? ` (${error.message})` : "";
      addNotification("warning", `${t("UpdateCheckUnavailable")}${details}`);
      console.error("Update check failed", error);
    } finally {
      setChecking(false);
    }
  };

  const installPendingUpdate = async () => {
    setInstallingUpdate(true);
    try {
      const update = await checkForAvailableUpdate();
      if (!update) {
        setPendingUpdateVersion(null);
        addNotification("success", t("AlreadyUpToDate"));
        return;
      }
      await installUpdate(update);
    } catch {
      addNotification("error", t("UpdateFailed"));
    } finally {
      setInstallingUpdate(false);
    }
  };

  const handleExport = () => {
    const grouped = exportItems();
    const files = exportItemsToCSV(grouped);
    if (files.length === 0) {
      addNotification("warning", "No items to export");
      return;
    }

    for (const file of files) {
      const blob = new Blob([file.content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    addNotification("success", `Exported ${files.length} file(s)`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = detectTypeFromFilename(file.name);
    if (!type) {
      addNotification("error", "Could not determine item type from filename");
      return;
    }

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        addNotification("warning", "No items found in file");
        return;
      }

      const createItem = useVaultStore.getState().createItem;
      let imported = 0;
      for (const row of rows) {
        try {
          await createItem({ type, form: row });
          imported++;
        } catch {
          // Skip individual failures
        }
      }

      addNotification("success", `Imported ${imported} of ${rows.length} items`);
      useVaultStore.getState().fetchItems();
    } catch {
      addNotification("error", "Failed to parse import file");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex-1 min-h-0">
      <div className="p-6 max-w-xl mx-auto h-full overflow-y-auto">
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          {t("Settings")}
        </h2>
        <p className="text-sm text-text-muted mb-6">{t("AppPreferences")}</p>

        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-medium text-text-primary mb-3">
              {t("General")}
            </h3>
            <div className="bg-surface-secondary border border-border rounded-xl divide-y divide-border">
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-text-primary">{t("LaunchAtLogin")}</p>
                  <p className="text-xs text-text-muted">
                    {launchAtLoginSupported
                      ? t("LaunchAtLoginDesc")
                      : t("LaunchAtLoginUnsupported")}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={launchAtLogin}
                  onChange={() => void toggleLaunchAtLogin()}
                  disabled={launchAtLoginLoading || !launchAtLoginSupported}
                  className="w-4 h-4 accent-primary rounded disabled:opacity-50"
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-text-primary">{t("Language")}</p>
                  <p className="text-xs text-text-muted">
                    {t("ChooseLanguage")}
                  </p>
                </div>
                <select
                  value={i18n.language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary"
                >
                  <option value="en">{t("English")}</option>
                  <option value="tr">{t("Turkish")}</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-text-primary">Theme</p>
                  <p className="text-xs text-text-muted">
                    Choose appearance mode
                  </p>
                </div>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                        theme === opt.value
                          ? "bg-primary text-white"
                          : "bg-surface text-text-secondary hover:bg-surface-secondary"
                      }`}
                    >
                      <opt.icon size={13} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-text-primary mb-3">
              {t("Updates")}
            </h3>
            <div className="bg-surface-secondary border border-border rounded-xl divide-y divide-border">
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-text-primary">
                    {t("AutoUpdateChecks")}
                  </p>
                  <p className="text-xs text-text-muted">
                    {t("AutoCheckUpdatesDesc")}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoUpdate}
                  onChange={toggleAutoUpdate}
                  className="w-4 h-4 accent-primary rounded"
                />
              </div>
              <div className="p-4">
                <button
                  onClick={checkForUpdates}
                  disabled={checking || installingUpdate}
                  className="text-sm text-primary hover:text-primary-hover disabled:opacity-50"
                >
                  {checking ? t("Checking") : t("CheckForUpdates")}
                </button>
                {pendingUpdateVersion && (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-text-muted">
                      {t("UpdateToVersion")} {pendingUpdateVersion}
                    </p>
                    <button
                      onClick={installPendingUpdate}
                      disabled={installingUpdate || checking}
                      className="text-xs bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {installingUpdate ? t("Checking") : t("InstallUpdate")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-text-primary mb-3">
              Import / Export
            </h3>
            <div className="bg-surface-secondary border border-border rounded-xl divide-y divide-border">
              <button
                onClick={handleExport}
                className="flex items-center gap-3 p-4 w-full text-left hover:bg-border/30 transition-colors"
              >
                <Download size={16} className="text-text-secondary" />
                <div>
                  <p className="text-sm text-text-primary">Export Vault</p>
                  <p className="text-xs text-text-muted">
                    Download all items as CSV files
                  </p>
                </div>
              </button>
              <label className="flex items-center gap-3 p-4 cursor-pointer hover:bg-border/30 transition-colors">
                <Upload size={16} className="text-text-secondary" />
                <div>
                  <p className="text-sm text-text-primary">Import Items</p>
                  <p className="text-xs text-text-muted">
                    Import items from a CSV file
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </section>

          {version && (
            <p className="text-xs text-text-muted text-center">
              Passwall Desktop v{version}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
