import { useTranslation } from "react-i18next";
import { Globe, Wifi, Info } from "lucide-react";

export default function ConnectedBrowsers() {
  const { t } = useTranslation();

  return (
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
        <div className="bg-surface-secondary border border-border rounded-xl p-8 text-center">
          <Globe className="mx-auto mb-3 text-text-muted" size={32} />
          <p className="text-sm font-medium text-text-primary mb-1">
            {t("NoBrowsersConnected")}
          </p>
          <p className="text-xs text-text-muted max-w-xs mx-auto">
            {t("OpenExtensionHint")}
          </p>
        </div>
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
  );
}
