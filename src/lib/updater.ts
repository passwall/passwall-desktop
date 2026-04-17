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
  const { check } = await import("@tauri-apps/plugin-updater");
  try {
    const update = await check();
    if (!update) return null;
    return update as AvailableUpdate;
  } catch (error) {
    throw error;
  }
}

export async function installUpdate(
  update: AvailableUpdate,
  onEvent?: (event: UpdateProgressEvent) => void
): Promise<void> {
  await update.downloadAndInstall(onEvent);
  const { relaunch } = await import("@tauri-apps/plugin-process");
  await relaunch();
}
