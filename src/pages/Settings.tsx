import { useTranslation } from "react-i18next";
import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
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
import { errorFields, exportAppLogs, getAppLogPath, logger } from "@/lib/logger";
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
  Copy,
  FolderOpen,
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
  const [appLogPath, setAppLogPath] = useState<string | null>(null);
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
    getAppLogPath()
      .then(setAppLogPath)
      .catch(() => setAppLogPath(null));
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
    const previousLanguage = i18n.language;
    i18n.changeLanguage(lng);
    localStorage.setItem("passwall_desktop_locale", lng);
    void logger.info("settings.language_changed", "Language setting changed", {
      previous_language: previousLanguage,
      new_language: lng,
    });
  };

  const toggleAutoUpdate = () => {
    const newVal = !autoUpdate;
    setAutoUpdate(newVal);
    setAutoUpdateChecksEnabled(newVal);
    void logger.info("settings.auto_update_changed", "Auto update setting changed", {
      enabled: newVal,
    });
  };

  const toggleLaunchAtLogin = async () => {
    const newVal = !launchAtLogin;
    void logger.info("settings.launch_at_login_change_requested", "Launch at login change requested", {
      enabled: newVal,
    });
    setLaunchAtLoginLoading(true);
    try {
      await setStartOnLoginEnabled(newVal);
      setLaunchAtLogin(newVal);
      void logger.info("settings.launch_at_login_changed", "Launch at login setting changed", {
        enabled: newVal,
      });
      addNotification("success", newVal ? t("LaunchAtLoginEnabled") : t("LaunchAtLoginDisabled"));
    } catch (error) {
      void logger.error("settings.launch_at_login_change_failed", "Launch at login setting update failed", {
        ...errorFields(error),
        requested_enabled: newVal,
      });
      addNotification("error", t("LaunchAtLoginUpdateFailed"));
    } finally {
      setLaunchAtLoginLoading(false);
    }
  };

  const handleTimeoutChange = (value: string) => {
    const previousTimeout = sessionSettings.vaultTimeout;
    const parsed: VaultTimeoutDuration =
      value === "on_close" || value === "never" ? value : (Number(value) as VaultTimeoutDuration);
    setSessionSettings({ vaultTimeout: parsed });
    setSessionSettingsState((s) => ({ ...s, vaultTimeout: parsed }));
    void logger.info("settings.vault_timeout_changed", "Vault timeout setting changed", {
      previous_timeout: previousTimeout,
      new_timeout: parsed,
    });
  };

  const handleTimeoutActionChange = (value: string) => {
    const previousAction = sessionSettings.vaultTimeoutAction;
    const action = value as VaultTimeoutAction;
    setSessionSettings({ vaultTimeoutAction: action });
    setSessionSettingsState((s) => ({ ...s, vaultTimeoutAction: action }));
    void logger.info("settings.vault_timeout_action_changed", "Vault timeout action changed", {
      previous_action: previousAction,
      new_action: action,
    });
  };

  const handleThemeChange = (nextTheme: ThemeMode) => {
    if (theme === nextTheme) return;
    setTheme(nextTheme);
    void logger.info("settings.theme_changed", "Theme setting changed", {
      previous_theme: theme,
      new_theme: nextTheme,
    });
  };

  const handleBiometricToggle = async () => {
    const nextEnabled = !biometricEnabled;
    void logger.info(
      "settings.biometric_unlock_change_requested",
      "Biometric unlock setting change requested",
      {
        enabled: nextEnabled,
      }
    );
    setBiometricLoading(true);
    try {
      if (nextEnabled) {
        await enableBiometricUnlock();
      } else {
        await disableBiometricUnlock();
      }
      setBiometricEnabled(nextEnabled);
      void logger.info("settings.biometric_unlock_changed", "Biometric unlock setting changed", {
        enabled: nextEnabled,
      });
      addNotification(
        "success",
        nextEnabled ? t("TouchIDUnlockEnabled") : t("TouchIDUnlockDisabled")
      );
    } catch (error) {
      const details = getErrorMessage(error);
      void logger.error(
        "settings.biometric_unlock_failed",
        "Touch ID unlock setting update failed",
        { ...errorFields(error) }
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
    void logger.info("settings.update_check_requested", "Manual update check requested");
    setChecking(true);
    try {
      const update = await checkForAvailableUpdate();
      if (update) {
        setPendingUpdateVersion(update.version ?? null);
        void logger.info("settings.update_available", "Update is available", {
          version: update.version ?? null,
        });
        addNotification("info", t("UpdateAvailable"));
      } else {
        setPendingUpdateVersion(null);
        void logger.info("settings.update_not_available", "No update is available");
        addNotification("success", t("AlreadyUpToDate"));
      }
    } catch (error: unknown) {
      const details =
        error instanceof Error && error.message ? ` (${error.message})` : "";
      addNotification("warning", `${t("UpdateCheckUnavailable")}${details}`);
      void logger.error("settings.update_check_failed", "Update check failed from settings", {
        ...errorFields(error),
      });
      console.error("Update check failed", error);
    } finally {
      setChecking(false);
    }
  };

  const installPendingUpdate = async () => {
    void logger.info("settings.update_install_requested", "Install update requested", {
      pending_version: pendingUpdateVersion,
    });
    setInstallingUpdate(true);
    try {
      const update = await checkForAvailableUpdate();
      if (!update) {
        setPendingUpdateVersion(null);
        void logger.info("settings.update_install_skipped", "Install update skipped because no update is available");
        addNotification("success", t("AlreadyUpToDate"));
        return;
      }
      void logger.info("settings.update_install_started", "Installing available update", {
        version: update.version ?? null,
      });
      await installUpdate(update);
    } catch (error: unknown) {
      void logger.error("settings.update_install_failed", "Update install failed from settings", {
        ...errorFields(error),
      });
      addNotification("error", t("UpdateFailed"));
    } finally {
      setInstallingUpdate(false);
    }
  };

  const handleExport = async () => {
    void logger.info("settings.export_items_requested", "Vault export requested");
    await fetchItems();
    const grouped = exportItems();
    const files = exportItemsToCSV(grouped);
    const jsonFile = exportItemsToJSON(grouped);
    if (files.length === 0) {
      void logger.info("settings.export_items_skipped", "Vault export skipped because there are no items");
      addNotification("warning", "No items to export");
      return;
    }

    const targetDir = await open({
      directory: true,
      multiple: false,
      title: "Choose export folder",
    });
    if (!targetDir || Array.isArray(targetDir)) {
      void logger.info("settings.export_items_cancelled", "Vault export cancelled by user");
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
    void logger.info("settings.export_items_succeeded", "Vault export completed", {
      exported_files_count: writtenPaths.length,
      csv_files_count: files.length,
      included_json_backup: true,
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void logger.info("settings.import_items_requested", "Vault import requested", {
      filename: file.name,
      file_size: file.size,
    });

    try {
      const text = await file.text();
      const rows = parseImportFile(file.name, text);
      if (rows.length === 0) {
        void logger.info("settings.import_items_skipped", "Vault import skipped because parsed rows are empty", {
          filename: file.name,
        });
        addNotification("warning", "No items found in file");
        return;
      }

      const createItem = useVaultStore.getState().createItem;
      let imported = 0;
      let failed = 0;
      for (const row of rows) {
        try {
          await createItem({ type: row.type, form: row.form });
          imported++;
        } catch {
          failed++;
          // Skip individual failures
        }
      }

      addNotification("success", `Imported ${imported} of ${rows.length} items`);
      void logger.info("settings.import_items_completed", "Vault import completed", {
        filename: file.name,
        total_rows: rows.length,
        imported_rows: imported,
        failed_rows: failed,
      });
      void useVaultStore.getState().fetchItems();
    } catch (error) {
      void logger.error("settings.import_items_failed", "Vault import failed", {
        filename: file.name,
        ...errorFields(error),
      });
      addNotification("error", "Failed to parse import file");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExportLogs = async () => {
    void logger.info("settings.export_logs_requested", "App log export requested");
    setExportingLogs(true);
    try {
      const exported = await exportAppLogs();
      if (!exported) {
        void logger.info("settings.export_logs_cancelled", "App log export cancelled by user");
        return;
      }
      void logger.info("settings.export_logs_succeeded", "App log export completed");
      addNotification("success", t("LogsExported"));
    } catch (error) {
      addNotification("warning", t("LogsExportFailed"));
      void logger.error("settings.export_logs_failed", "Failed to export app logs", {
        ...errorFields(error),
      });
    } finally {
      setExportingLogs(false);
    }
  };

  const handleCopyLogPath = async () => {
    if (!appLogPath) return;
    try {
      await navigator.clipboard.writeText(appLogPath);
      void logger.info("settings.log_path_copied", "App log path copied to clipboard");
      addNotification("success", t("LogsPathCopied"));
    } catch (error) {
      addNotification("warning", t("LogsPathCopyFailed"));
      void logger.error("settings.copy_log_path_failed", "Failed to copy app log path", {
        ...errorFields(error),
      });
    }
  };

  const handleRevealLogPath = async () => {
    if (!appLogPath) return;
    try {
      await revealItemInDir(appLogPath);
      void logger.info("settings.log_path_revealed", "App log path revealed in file manager");
    } catch (error) {
      addNotification("warning", t("LogsPathOpenFailed"));
      void logger.error("settings.reveal_log_path_failed", "Failed to reveal app log path", {
        ...errorFields(error),
      });
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
                      onClick={() => handleThemeChange(opt.value)}
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
              {appLogPath && (
                <div className="border-t border-border px-4 py-3">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-primary">
                        {t("LogFilePath")}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void handleCopyLogPath()}
                          className="rounded-md p-1.5 text-primary transition-colors hover:bg-primary/10"
                          title={t("Copy")}
                          aria-label={t("Copy")}
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRevealLogPath()}
                          className="rounded-md p-1.5 text-primary transition-colors hover:bg-primary/10"
                          title={t("OpenLogFolder")}
                          aria-label={t("OpenLogFolder")}
                        >
                          <FolderOpen size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="break-all font-mono text-[11px] leading-4 text-text-primary">
                      {appLogPath}
                    </p>
                  </div>
                </div>
              )}
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
