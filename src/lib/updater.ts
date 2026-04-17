export const AUTO_UPDATE_CHECKS_KEY = "passwall_auto_update";
const DEBUG_RUN_ID = "update-check-investigation-1";

function sendDebugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
) {
  fetch("http://127.0.0.1:7424/ingest/d56ae62b-d051-4704-a2bf-8292a48c483c", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "21998d" }, body: JSON.stringify({ sessionId: "21998d", runId: DEBUG_RUN_ID, hypothesisId, location, message, data, timestamp: Date.now() }) }).catch(() => {});
}

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
  // #region agent log
  sendDebugLog("H3", "src/lib/updater.ts:checkForAvailableUpdate:entry", "Updater check requested", {
    autoUpdateChecksEnabled: isAutoUpdateChecksEnabled(),
  });
  // #endregion

  let check: (() => Promise<unknown>) | undefined;
  try {
    const updaterModule = await import("@tauri-apps/plugin-updater");
    check = updaterModule.check as () => Promise<unknown>;
    // #region agent log
    sendDebugLog("H1", "src/lib/updater.ts:checkForAvailableUpdate:import", "Updater plugin imported", {
      hasCheckFunction: typeof check === "function",
    });
    // #endregion
  } catch (error) {
    // #region agent log
    sendDebugLog("H1", "src/lib/updater.ts:checkForAvailableUpdate:import_error", "Updater plugin import failed", {
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    // #endregion
    throw error;
  }

  try {
    // #region agent log
    sendDebugLog("H2", "src/lib/updater.ts:checkForAvailableUpdate:before_check", "Calling updater check()", {});
    // #endregion

    const update = await check();

    // #region agent log
    sendDebugLog("H4", "src/lib/updater.ts:checkForAvailableUpdate:after_check", "Updater check() resolved", {
      hasUpdate: !!update,
      updateVersion:
        update && typeof update === "object" && "version" in update
          ? String((update as { version?: unknown }).version ?? "")
          : "",
      hasDownloadAndInstall:
        !!update &&
        typeof update === "object" &&
        "downloadAndInstall" in update &&
        typeof (update as { downloadAndInstall?: unknown }).downloadAndInstall ===
          "function",
    });
    // #endregion

    if (!update) return null;
    return update as AvailableUpdate;
  } catch (error) {
    const isMacRuntime =
      typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent);

    if (isMacRuntime) {
      // #region agent log
      sendDebugLog(
        "H6",
        "src/lib/updater.ts:checkForAvailableUpdate:retry_arm64",
        "Retrying updater check() with darwin-arm64 target on macOS",
        { originalError: error instanceof Error ? error.message : String(error) }
      );
      // #endregion
      try {
        const update = await (
          check as (options?: { target?: string }) => Promise<unknown>
        )({ target: "darwin-arm64" });
        // #region agent log
        sendDebugLog(
          "H6",
          "src/lib/updater.ts:checkForAvailableUpdate:retry_arm64_result",
          "Updater check() with darwin-arm64 target resolved",
          {
            hasUpdate: !!update,
            updateVersion:
              update && typeof update === "object" && "version" in update
                ? String((update as { version?: unknown }).version ?? "")
                : "",
          }
        );
        // #endregion
        if (!update) return null;
        return update as AvailableUpdate;
      } catch (retryError) {
        // #region agent log
        sendDebugLog(
          "H6",
          "src/lib/updater.ts:checkForAvailableUpdate:retry_arm64_error",
          "Updater check() with darwin-arm64 target failed",
          {
            errorName:
              retryError instanceof Error ? retryError.name : typeof retryError,
            errorMessage:
              retryError instanceof Error
                ? retryError.message
                : String(retryError),
          }
        );
        // #endregion
        throw retryError;
      }
    }
    // #region agent log
    sendDebugLog("H2", "src/lib/updater.ts:checkForAvailableUpdate:check_error", "Updater check() threw error", {
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
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
