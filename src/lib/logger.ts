import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";

export type LogLevel = "debug" | "info" | "warn" | "error";
type LogValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | LogValue[]
  | { [key: string]: LogValue };

export type LogFields = Record<string, LogValue>;
export type LogContext = {
  flow_id?: string;
  request_id?: string;
  route?: string;
  session_id?: string;
};

type AppLogEntry = {
  level: LogLevel;
  event: string;
  message: string;
  source?: string;
  fields?: LogFields;
  context?: LogContext;
};

const MAX_STRING_LENGTH = 8_000;
const SENSITIVE_KEY_PATTERN =
  /(access|refresh|protected)?_?token|authorization|bearer|password|master|user_?key|protected_?user_?key|secret|credential|card|cvv|iban|note|payload|private/i;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

let initialized = false;
let writeQueue: Promise<void> = Promise.resolve();
let sessionId: string | null = null;

function isTauriRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

function getSessionId(): string {
  if (sessionId) return sessionId;
  const existing = sessionStorage.getItem("passwall_log_session_id");
  if (existing) {
    sessionId = existing;
    return existing;
  }
  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem("passwall_log_session_id", generated);
  sessionId = generated;
  return generated;
}

export function createFlowId(prefix: string): string {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${suffix}`;
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

export function errorFields(error: unknown): LogFields {
  if (error instanceof Error) {
    return {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
    };
  }
  return { error_message: normalizeUnknown(error) };
}

function sanitizeString(value: string): string {
  return value
    .replace(BEARER_PATTERN, "Bearer [REDACTED]")
    .replace(JWT_PATTERN, "[REDACTED_TOKEN]")
    .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]")
    .slice(0, MAX_STRING_LENGTH);
}

function sanitizeValue(key: string, value: LogValue): LogValue {
  if (value === undefined) return undefined;
  if (
    SENSITIVE_KEY_PATTERN.test(key) &&
    typeof value !== "boolean" &&
    typeof value !== "number" &&
    value !== null
  ) {
    return "[REDACTED]";
  }
  if (typeof value === "string") return sanitizeString(value);
  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(key, item));
  }
  return Object.fromEntries(
    Object.entries(value)
      .map(([childKey, childValue]) => [childKey, sanitizeValue(childKey, childValue)])
      .filter(([, childValue]) => childValue !== undefined)
  );
}

function sanitizeFields(fields?: LogFields): LogFields | undefined {
  if (!fields) return undefined;
  return Object.fromEntries(
    Object.entries(fields)
      .map(([key, value]) => [key, sanitizeValue(key, value)])
      .filter(([, value]) => value !== undefined)
  ) as LogFields;
}

async function appendLog(entry: AppLogEntry): Promise<void> {
  const context = {
    session_id: getSessionId(),
    ...entry.context,
  };

  if (!isTauriRuntime()) {
    const method = entry.level === "error" ? "error" : entry.level === "warn" ? "warn" : "info";
    console[method](`[${entry.event}] ${entry.message}`, sanitizeFields(entry.fields));
    return;
  }

  writeQueue = writeQueue
    .then(async () => {
      await invoke("append_app_log", {
        entry: {
          ...entry,
          message: sanitizeString(entry.message),
          source: entry.source ? sanitizeString(entry.source) : undefined,
          fields: sanitizeFields(entry.fields),
          context,
        },
      });
    })
    .catch(() => {
      // Logging must never affect app behavior.
    });

  await writeQueue;
}

export const logger = {
  debug(event: string, message: string, fields?: LogFields, context?: LogContext) {
    return appendLog({ level: "debug", event, message, fields, context });
  },
  info(event: string, message: string, fields?: LogFields, context?: LogContext) {
    return appendLog({ level: "info", event, message, fields, context });
  },
  warn(event: string, message: string, fields?: LogFields, context?: LogContext) {
    return appendLog({ level: "warn", event, message, fields, context });
  },
  error(event: string, message: string, fields?: LogFields, context?: LogContext) {
    return appendLog({ level: "error", event, message, fields, context });
  },
};

export function initGlobalLogging(): void {
  if (initialized || !isTauriRuntime()) return;
  initialized = true;

  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    originalConsoleError(...args);
    const [first, ...rest] = args;
    void logger.error("runtime.console_error", normalizeUnknown(first), {
      source: "console.error",
      details: rest.length ? rest.map(normalizeUnknown).join("\n") : undefined,
    });
  };

  window.addEventListener("error", (event) => {
    void logger.error("runtime.window_error", event.message || "Unhandled window error", {
      source: "window.error",
      ...errorFields(event.error),
      location: `${event.filename}:${event.lineno}:${event.colno}`,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    void logger.error("runtime.unhandled_rejection", "Unhandled promise rejection", {
      source: "window.unhandledrejection",
      ...errorFields(event.reason),
    });
  });
}

export async function exportAppLogs(): Promise<boolean> {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const filename = `passwall-desktop-logs-${now.getFullYear()}${pad(
    now.getMonth() + 1
  )}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(
    now.getSeconds()
  )}.ndjson`;

  const selectedPath = await save({
    defaultPath: filename,
    filters: [{ name: "Log File", extensions: ["ndjson", "log", "txt"] }],
  });
  if (!selectedPath) {
    return false;
  }

  await invoke("export_app_logs_to_path", { targetPath: selectedPath });
  return true;
}

export async function getAppLogPath(): Promise<string> {
  return invoke("get_app_log_path");
}
