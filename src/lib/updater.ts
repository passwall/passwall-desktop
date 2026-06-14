import { errorFields, logger } from "@/lib/logger";

export const AUTO_UPDATE_CHECKS_KEY = "passwall_auto_update";

export type UpdateProgressEvent =
  | { event: "Started"; data: { contentLength?: number } }
  | { event: "Progress"; data: { chunkLength: number } }
  | { event: "Finished"; data: Record<string, never> };

export interface AvailableUpdate {
  version: string;
  downloadAndInstall: (
    onEvent?: (event: UpdateProgressEvent) => void
  ) => Promise<void>;
}

export function isAutoUpdateChecksEnabled(): boolean {
  return localStorage.getItem(AUTO_UPDATE_CHECKS_KEY) !== "false";
}

export function setAutoUpdateChecksEnabled(enabled: boolean): void {
  localStorage.setItem(AUTO_UPDATE_CHECKS_KEY, String(enabled));
}

export async function checkForAvailableUpdate(): Promise<AvailableUpdate | null> {
  let check: ((options?: { target?: string }) => Promise<unknown>) | undefined;
  try {
    const updaterModule = await import("@tauri-apps/plugin-updater");
    check = updaterModule.check as (options?: { target?: string }) => Promise<unknown>;
  } catch (error: unknown) {
    await logger.error("updater.module_import_failed", "Failed to import updater module", {
      ...errorFields(error),
    });
    throw error;
  }

  try {
    const isMacRuntime =
      typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent);
    const checkOptions = isMacRuntime ? { target: "darwin-arm64" } : undefined;

    const update = await check(checkOptions);

    if (!update) return null;
    return update as AvailableUpdate;
  } catch (error: unknown) {
    await logger.error("updater.check_failed", "Update check failed", {
      ...errorFields(error),
    });
    throw error;
  }
}

export async function installUpdate(
  update: AvailableUpdate,
  onEvent?: (event: UpdateProgressEvent) => void
): Promise<void> {
  try {
    await update.downloadAndInstall(onEvent);
    const { relaunch } = await import("@tauri-apps/plugin-process");
    await relaunch();
  } catch (error: unknown) {
    await logger.error("updater.install_failed", "Update download/install failed", {
      ...errorFields(error),
    });
    throw error;
  }
}
