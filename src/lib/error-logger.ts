import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";

type ErrorLogEntry = {
  source: string;
  message: string;
  details?: string;
};

const MAX_DETAILS_LENGTH = 8_000;

let initialized = false;
let writeQueue: Promise<void> = Promise.resolve();

function isTauriRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

function normalizeUnknown(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ""}`;
  }
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function redactSensitive(input: string): string {
  return input
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED]")
    .replace(/"access_token"\s*:\s*"[^"]*"/gi, '"access_token":"[REDACTED]"')
    .replace(/"refresh_token"\s*:\s*"[^"]*"/gi, '"refresh_token":"[REDACTED]"')
    .replace(
      /"master_password(?:_hash)?"\s*:\s*"[^"]*"/gi,
      '"master_password":"[REDACTED]"'
    );
}

async function appendErrorLog(entry: ErrorLogEntry): Promise<void> {
  if (!isTauriRuntime()) return;
  writeQueue = writeQueue
    .then(async () => {
      try {
        const details = entry.details
          ? redactSensitive(entry.details).slice(0, MAX_DETAILS_LENGTH)
          : undefined;
        await invoke("append_error_log", {
          entry: {
            source: entry.source,
            message: redactSensitive(entry.message),
            details,
          },
        });
      } catch {
        // Logging failures should never affect app flow.
      }
    })
    .catch(() => {});

  await writeQueue;
}

export async function logError(
  source: string,
  message: string,
  details?: unknown
): Promise<void> {
  await appendErrorLog({
    source,
    message,
    details: details === undefined ? undefined : normalizeUnknown(details),
  });
}

export function initGlobalErrorLogging(): void {
  if (initialized || !isTauriRuntime()) return;
  initialized = true;

  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    originalConsoleError(...args);
    const [first, ...rest] = args;
    void appendErrorLog({
      source: "console.error",
      message: normalizeUnknown(first),
      details: rest.length ? rest.map(normalizeUnknown).join("\n") : undefined,
    });
  };

  window.addEventListener("error", (event) => {
    void appendErrorLog({
      source: "window.error",
      message: event.message || "Unhandled window error",
      details: event.error
        ? normalizeUnknown(event.error)
        : `${event.filename}:${event.lineno}:${event.colno}`,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    void appendErrorLog({
      source: "window.unhandledrejection",
      message: "Unhandled promise rejection",
      details: normalizeUnknown(event.reason),
    });
  });
}

export async function exportErrorLogs(): Promise<boolean> {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const filename = `passwall-desktop-errors-${now.getFullYear()}${pad(
    now.getMonth() + 1
  )}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(
    now.getSeconds()
  )}.log`;

  const selectedPath = await save({
    defaultPath: filename,
    filters: [{ name: "Log File", extensions: ["log", "txt"] }],
  });
  if (!selectedPath) {
    return false;
  }

  await invoke("export_error_logs_to_path", { targetPath: selectedPath });
  return true;
}
