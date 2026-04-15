import { useCallback } from "react";
import { useUiStore } from "@/stores/ui-store";
import { useTranslation } from "react-i18next";

export function useClipboard() {
  const addNotification = useUiStore((s) => s.addNotification);
  const { t } = useTranslation();

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        addNotification("success", t("Copied"));
      } catch {
        addNotification("error", t("FailedToCopy"));
      }
    },
    [addNotification, t]
  );

  return { copy };
}
