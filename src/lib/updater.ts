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
  const runId = `update-check-${Date.now()}`;
  // #region agent log
  fetch("http://127.0.0.1:7424/ingest/d56ae62b-d051-4704-a2bf-8292a48c483c", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "b2cb2e",
    },
    body: JSON.stringify({
      sessionId: "b2cb2e",
      runId,
      hypothesisId: "H4",
      location: "src/lib/updater.ts:checkForAvailableUpdate:entry",
      message: "Starting updater check",
      data: {
        hasWindow: typeof window !== "undefined",
        tauriInternals:
          typeof window !== "undefined" &&
          ("__TAURI_INTERNALS__" in window || "__TAURI__" in window),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  const { check } = await import("@tauri-apps/plugin-updater");
  try {
    const update = await check();
    // #region agent log
    fetch("http://127.0.0.1:7424/ingest/d56ae62b-d051-4704-a2bf-8292a48c483c", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b2cb2e",
      },
      body: JSON.stringify({
        sessionId: "b2cb2e",
        runId,
        hypothesisId: "H2",
        location: "src/lib/updater.ts:checkForAvailableUpdate:result",
        message: "Updater check result",
        data: {
          hasUpdate: Boolean(update),
          version: update?.version ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (!update) return null;
    return update as AvailableUpdate;
  } catch (error: unknown) {
    const err = error as { message?: string; name?: string; toString?: () => string };
    // #region agent log
    fetch("http://127.0.0.1:7424/ingest/d56ae62b-d051-4704-a2bf-8292a48c483c", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b2cb2e",
      },
      body: JSON.stringify({
        sessionId: "b2cb2e",
        runId,
        hypothesisId: "H1",
        location: "src/lib/updater.ts:checkForAvailableUpdate:error",
        message: "Updater check threw error",
        data: {
          name: err?.name ?? null,
          message: err?.message ?? null,
          asString: typeof err?.toString === "function" ? err.toString() : String(error),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
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
