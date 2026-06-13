export type VaultTimeoutDuration =
  | 1
  | 5
  | 15
  | 30
  | 60
  | 240
  | 480
  | "on_close"
  | "never";

export type VaultTimeoutAction = "lock" | "logout";

export interface SessionSettings {
  vaultTimeout: VaultTimeoutDuration;
  vaultTimeoutAction: VaultTimeoutAction;
}

const STORAGE_KEY = "passwall_session_settings";

const DEFAULTS: SessionSettings = {
  vaultTimeout: "never",
  vaultTimeoutAction: "lock",
};

const VALID_TIMEOUTS: VaultTimeoutDuration[] = [
  1,
  5,
  15,
  30,
  60,
  240,
  480,
  "on_close",
  "never",
];

function normalizeTimeout(value: unknown): VaultTimeoutDuration {
  if (VALID_TIMEOUTS.includes(value as VaultTimeoutDuration)) {
    return value as VaultTimeoutDuration;
  }
  return DEFAULTS.vaultTimeout;
}

function normalizeAction(value: unknown): VaultTimeoutAction {
  return value === "logout" || value === "lock"
    ? value
    : DEFAULTS.vaultTimeoutAction;
}

export function getSessionSettings(): SessionSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<SessionSettings>;
    return {
      vaultTimeout: normalizeTimeout(parsed.vaultTimeout),
      vaultTimeoutAction: normalizeAction(parsed.vaultTimeoutAction),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setSessionSettings(settings: Partial<SessionSettings>): void {
  const current = getSessionSettings();
  const merged = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function getTimeoutMs(duration: VaultTimeoutDuration): number | null {
  if (duration === "never" || duration === "on_close") return null;
  return duration * 60 * 1000;
}

export const TIMEOUT_OPTIONS: { value: VaultTimeoutDuration; labelKey: string }[] = [
  { value: 1, labelKey: "Timeout1Min" },
  { value: 5, labelKey: "Timeout5Min" },
  { value: 15, labelKey: "Timeout15Min" },
  { value: 30, labelKey: "Timeout30Min" },
  { value: 60, labelKey: "Timeout1Hour" },
  { value: 240, labelKey: "Timeout4Hours" },
  { value: 480, labelKey: "Timeout8Hours" },
  { value: "on_close", labelKey: "TimeoutOnClose" },
  { value: "never", labelKey: "TimeoutNever" },
];
