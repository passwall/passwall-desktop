import { useTranslation } from "react-i18next";
import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useVaultStore } from "@/stores/vault-store";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore, type ThemeMode } from "@/stores/ui-store";
import {
  exportItemsToCSV,
  exportItemsToJSON,
  parseImportFile,
} from "@/lib/import-export";
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
import { exportErrorLogs, logError } from "@/lib/error-logger";
import {
  getSessionSettings,
  setSessionSettings,
  TIMEOUT_OPTIONS,
  type VaultTimeoutDuration,
  type VaultTimeoutAction,
} from "@/lib/session-settings";
import {
  isBiometricUnlockAvailable,
  isBiometricUnlockEnabled,
} from "@/lib/biometric-unlock";
import {
  ChevronDown,
  Download,
  Upload,
  Sun,
  Moon,
  Monitor,
  Shield,
} from "lucide-react";

interface ExportFilePayload {
  filename: string;
  content: string;
}

interface FlatDropdownOption {
  value: string;
  label: string;
}

interface FlatDropdownProps {
  value: string;
  options: FlatDropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  minWidth?: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

function FlatDropdown({
  value,
  options,
  onChange,
  ariaLabel,
  minWidth = "min-w-36",
}: FlatDropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`${minWidth} inline-flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary shadow-none outline-none transition-colors hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-primary/50`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={`${minWidth} absolute right-0 z-20 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-none`}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-text-primary hover:bg-surface-secondary"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [version, setVersion] = useState("");
  const [launchAtLogin, setLaunchAtLogin] = useState(false);
  const [launchAtLoginLoading, setLaunchAtLoginLoading] = useState(true);
  const [launchAtLoginSupported, setLaunchAtLoginSupported] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(isAutoUpdateChecksEnabled());
  const [checking, setChecking] = useState(false);
  const [installingUpdate, setInstallingUpdate] = useState(false);
  const [exportingLogs, setExportingLogs] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(isBiometricUnlockEnabled);
  const [biometricLoading, setBiometricLoading] = useState(true);
  const [pendingUpdateVersion, setPendingUpdateVersion] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessionSettings, setSessionSettingsState] = useState(getSessionSettings);
  const exportItems = useVaultStore((s) => s.exportItems);
  const fetchItems = useVaultStore((s) => s.fetchItems);
  const addNotification = useUiStore((s) => s.addNotification);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const userKey = useAuthStore((s) => s.userKey);
  const locked = useAuthStore((s) => s.locked);
  const enableBiometricUnlock = useAuthStore((s) => s.enableBiometricUnlock);
  const disableBiometricUnlock = useAuthStore((s) => s.disableBiometricUnlock);

  const themeOptions: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  const languageOptions = [
    { value: "en", label: t("English") },
    { value: "tr", label: t("Turkish") },
  ];

  const timeoutOptions = TIMEOUT_OPTIONS.map((opt) => ({
    value: String(opt.value),
    label: t(opt.labelKey),
  }));

  const timeoutActionOptions = [
    { value: "lock", label: t("Lock") },
    { value: "logout", label: t("Logout") },
  ];

  useEffect(() => {
    import("@tauri-apps/api/app")
      .then((mod) => mod.getVersion())
      .then(setVersion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadBiometricAvailability = async () => {
      try {
        const available = await isBiometricUnlockAvailable();
        if (mounted) {
          setBiometricAvailable(available);
          setBiometricEnabled(isBiometricUnlockEnabled());
        }
      } finally {
        if (mounted) setBiometricLoading(false);
      }
    };
    void loadBiometricAvailability();
    return () => {
      mounted = false;
    };
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

  const handleTimeoutChange = (value: string) => {
    const parsed: VaultTimeoutDuration =
      value === "on_close" || value === "never" ? value : (Number(value) as VaultTimeoutDuration);
    setSessionSettings({ vaultTimeout: parsed });
    setSessionSettingsState((s) => ({ ...s, vaultTimeout: parsed }));
  };

  const handleTimeoutActionChange = (value: string) => {
    const action = value as VaultTimeoutAction;
    setSessionSettings({ vaultTimeoutAction: action });
    setSessionSettingsState((s) => ({ ...s, vaultTimeoutAction: action }));
  };

  const handleBiometricToggle = async () => {
    const nextEnabled = !biometricEnabled;
    setBiometricLoading(true);
    try {
      if (nextEnabled) {
        await enableBiometricUnlock();
      } else {
        await disableBiometricUnlock();
      }
      setBiometricEnabled(nextEnabled);
      addNotification(
        "success",
        nextEnabled ? t("TouchIDUnlockEnabled") : t("TouchIDUnlockDisabled")
      );
    } catch (error) {
      const details = getErrorMessage(error);
      void logError(
        "settings.biometric_unlock",
        "Touch ID unlock setting update failed",
        error
      );
      addNotification(
        "error",
        details
          ? `${t("TouchIDUnlockUpdateFailed")} ${details}`
          : t("TouchIDUnlockUpdateFailed")
      );
    } finally {
      setBiometricLoading(false);
    }
  };

  const checkForUpdates = async () => {
    setChecking(true);
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
      const details =
        error instanceof Error && error.message ? ` (${error.message})` : "";
      addNotification("warning", `${t("UpdateCheckUnavailable")}${details}`);
      void logError(
        "settings.check_updates",
        "Update check failed from settings",
        error
      );
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
    } catch (error: unknown) {
      void logError(
        "settings.install_update",
        "Update install failed from settings",
        error
      );
      addNotification("error", t("UpdateFailed"));
    } finally {
      setInstallingUpdate(false);
    }
  };

  const handleExport = async () => {
    await fetchItems();
    const grouped = exportItems();
    const files = exportItemsToCSV(grouped);
    const jsonFile = exportItemsToJSON(grouped);
    if (files.length === 0) {
      addNotification("warning", "No items to export");
      return;
    }

    const targetDir = await open({
      directory: true,
      multiple: false,
      title: "Choose export folder",
    });
    if (!targetDir || Array.isArray(targetDir)) {
      return;
    }

    const exportFiles: ExportFilePayload[] = [...files, jsonFile];
    const writtenPaths = await invoke<string[]>("write_export_files", {
      targetDir,
      files: exportFiles,
    });

    const folderLabel =
      writtenPaths[0]?.split(/[\\/]/).slice(0, -1).join("/") || targetDir;
    addNotification(
      "success",
      `Exported ${writtenPaths.length} file(s) to ${folderLabel}`
    );
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = parseImportFile(file.name, text);
      if (rows.length === 0) {
        addNotification("warning", "No items found in file");
        return;
      }

      const createItem = useVaultStore.getState().createItem;
      let imported = 0;
      for (const row of rows) {
        try {
          await createItem({ type: row.type, form: row.form });
          imported++;
        } catch {
          // Skip individual failures
        }
      }

      addNotification("success", `Imported ${imported} of ${rows.length} items`);
      void useVaultStore.getState().fetchItems();
    } catch {
      addNotification("error", "Failed to parse import file");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExportLogs = async () => {
    setExportingLogs(true);
    try {
      const exported = await exportErrorLogs();
      if (!exported) {
        return;
      }
      addNotification("success", t("LogsExported"));
    } catch (error) {
      addNotification("warning", t("LogsExportFailed"));
      void logError("settings.export_logs", "Failed to export error logs", error);
    } finally {
      setExportingLogs(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-xl mx-auto">
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
                <FlatDropdown
                  value={i18n.language}
                  options={languageOptions}
                  onChange={changeLanguage}
                  ariaLabel={t("Language")}
                />
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
            <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
              <Shield size={14} className="text-text-secondary" />
              {t("Security")}
            </h3>
            <div className="bg-surface-secondary border border-border rounded-xl divide-y divide-border">
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-text-primary">{t("VaultTimeout")}</p>
                  <p className="text-xs text-text-muted">
                    {t("VaultTimeoutDesc")}
                  </p>
                </div>
                <FlatDropdown
                  value={String(sessionSettings.vaultTimeout)}
                  options={timeoutOptions}
                  onChange={handleTimeoutChange}
                  ariaLabel={t("VaultTimeout")}
                  minWidth="min-w-40"
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-text-primary">{t("VaultTimeoutAction")}</p>
                  <p className="text-xs text-text-muted">
                    {t("VaultTimeoutActionDesc")}
                  </p>
                </div>
                <FlatDropdown
                  value={sessionSettings.vaultTimeoutAction}
                  options={timeoutActionOptions}
                  onChange={handleTimeoutActionChange}
                  ariaLabel={t("VaultTimeoutAction")}
                />
              </div>
              <div className="flex items-center justify-between p-4 gap-4">
                <div>
                  <p className="text-sm text-text-primary">{t("UnlockWithTouchID")}</p>
                  <p className="text-xs text-text-muted">
                    {biometricAvailable
                      ? t("UnlockWithTouchIDDesc")
                      : t("TouchIDUnlockUnavailable")}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={biometricEnabled}
                  onChange={() => void handleBiometricToggle()}
                  disabled={
                    biometricLoading ||
                    !biometricAvailable ||
                    locked ||
                    !userKey
                  }
                  className="w-4 h-4 accent-primary rounded disabled:opacity-50"
                />
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
                  onClick={() => void handleExport()}
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
                  accept=".csv,.json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-text-primary mb-3">
              {t("Diagnostics")}
            </h3>
            <div className="bg-surface-secondary border border-border rounded-xl">
              <button
                onClick={() => void handleExportLogs()}
                disabled={exportingLogs}
                className="flex items-center gap-3 p-4 w-full text-left hover:bg-border/30 transition-colors disabled:opacity-50"
              >
                <Download size={16} className="text-text-secondary" />
                <div>
                  <p className="text-sm text-text-primary">{t("ExportLogs")}</p>
                  <p className="text-xs text-text-muted">
                    {exportingLogs ? t("ExportingLogs") : t("ExportLogsDesc")}
                  </p>
                </div>
              </button>
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
