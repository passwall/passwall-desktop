import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import AuthLayout from "@/components/auth/AuthLayout";
import { useUiStore } from "@/stores/ui-store";
import { errorFields, exportAppLogs, logger } from "@/lib/logger";

export default function Login() {
  const { t } = useTranslation();
  const addNotification = useUiStore((s) => s.addNotification);
  const [version, setVersion] = useState("");
  const [exportingLogs, setExportingLogs] = useState(false);

  useEffect(() => {
    import("@tauri-apps/api/app")
      .then((mod) => mod.getVersion())
      .then(setVersion)
      .catch(() => {});
  }, []);

  const handleExportLogs = async () => {
    void logger.info("login.export_logs_requested", "App log export requested from login");
    setExportingLogs(true);
    try {
      const exported = await exportAppLogs();
      if (exported) {
        void logger.info("login.export_logs_succeeded", "App log export completed from login");
        addNotification("success", t("LogsExported"));
      } else {
        void logger.info("login.export_logs_cancelled", "App log export cancelled from login");
      }
    } catch (error) {
      addNotification("warning", t("LogsExportFailed"));
      void logger.error("login.export_logs_failed", "Failed to export app logs from login", {
        ...errorFields(error),
      });
    } finally {
      setExportingLogs(false);
    }
  };

  return (
    <AuthLayout>
      <LoginForm />
      <div className="mt-6 flex items-center justify-between gap-3 text-xs text-text-muted">
        <span>{version ? `Passwall Desktop v${version}` : "Passwall Desktop"}</span>
        <button
          type="button"
          onClick={() => void handleExportLogs()}
          disabled={exportingLogs}
          className="inline-flex items-center gap-1.5 text-text-muted transition-colors hover:text-text-secondary disabled:opacity-50"
        >
          <Download size={13} />
          {exportingLogs ? t("ExportingLogs") : t("ExportLogs")}
        </button>
      </div>
    </AuthLayout>
  );
}
