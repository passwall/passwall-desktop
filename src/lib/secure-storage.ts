import { invoke } from "@tauri-apps/api/core";
import { logger } from "@/lib/logger";

/**
 * Secure storage for sensitive credentials (access/refresh tokens, user key).
 *
 * Backed by the OS keychain (macOS Keychain, Windows Credential Manager,
 * libsecret on Linux) via the Tauri `keyring` crate. A synchronous in-memory
 * cache is kept alongside the keychain so that code paths which must run
 * synchronously (e.g. attaching the `Authorization` header on every HTTP
 * request) can read without awaiting.
 *
 * The process is expected to call {@link hydrateSecureStorage} once at
 * startup to populate the cache from the keychain.
 */

export type SecureKey = "access_token" | "refresh_token" | "user_key" | "protected_user_key";

const cache = new Map<SecureKey, string>();
let keystoreAvailable: boolean | null = null;
let hydrated = false;
const KEYCHAIN_SESSION_ACCOUNT = "session_bundle_v1";
const ALL_KEYS: SecureKey[] = ["access_token", "refresh_token", "user_key", "protected_user_key"];
const SIMPLE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SessionBundle = Partial<Record<SecureKey, string>>;

function getPresenceFields(bundle: SessionBundle = Object.fromEntries(cache)): {
  has_access_token: boolean;
  has_refresh_token: boolean;
  has_user_key: boolean;
  has_protected_user_key: boolean;
} {
  return {
    has_access_token: Boolean(bundle.access_token),
    has_refresh_token: Boolean(bundle.refresh_token),
    has_user_key: Boolean(bundle.user_key),
    has_protected_user_key: Boolean(bundle.protected_user_key),
  };
}

async function checkAvailable(): Promise<boolean> {
  if (keystoreAvailable !== null) return keystoreAvailable;
  try {
    keystoreAvailable = await invoke<boolean>("is_keystore_available");
  } catch {
    keystoreAvailable = false;
  }
  void logger.info("secure_storage.availability_checked", "Secure storage availability checked", {
    available: keystoreAvailable,
  });
  return keystoreAvailable;
}

export async function isSecureStorageAvailable(): Promise<boolean> {
  return checkAvailable();
}

/** Synchronous read from in-memory cache. Returns `null` when absent. */
export function getSecureSync(key: SecureKey): string | null {
  return cache.get(key) ?? null;
}

async function persistBundleToKeychain(): Promise<void> {
  const startedAt = performance.now();
  if (!(await checkAvailable())) {
    void logger.warn("secure_storage.persist_skipped", "Secure storage is unavailable");
    return;
  }
  const bundle: SessionBundle = {};
  for (const key of ALL_KEYS) {
    const value = cache.get(key);
    if (value) bundle[key] = value;
  }

  try {
    if (Object.keys(bundle).length === 0) {
      await invoke("remove_secret", { account: KEYCHAIN_SESSION_ACCOUNT });
      void logger.info("secure_storage.persist_cleared", "Persisted session bundle removed", {
        duration_ms: Math.round(performance.now() - startedAt),
      });
      return;
    }
    await invoke("store_secret", {
      account: KEYCHAIN_SESSION_ACCOUNT,
      secret: JSON.stringify(bundle),
    });
    void logger.info("secure_storage.persist_success", "Session bundle persisted", {
      ...getPresenceFields(bundle),
      duration_ms: Math.round(performance.now() - startedAt),
    });
  } catch (error) {
    void logger.warn("secure_storage.persist_failed", "Session bundle persistence failed", {
      error: error instanceof Error ? error.message : String(error),
      duration_ms: Math.round(performance.now() - startedAt),
    });
    // keychain write failed – cache remains so the session keeps working
  }
}

function setCacheFromBundle(bundle: SessionBundle): void {
  cache.clear();
  for (const key of ALL_KEYS) {
    const value = bundle[key];
    if (value) cache.set(key, value);
  }
}

async function loadBundleFromKeychain(): Promise<void> {
  if (hydrated) return;
  const startedAt = performance.now();
  void logger.info("secure_storage.hydrate_start", "Secure storage hydration started");
  hydrated = true;
  if (!(await checkAvailable())) {
    void logger.warn("secure_storage.hydrate_skipped", "Secure storage hydration skipped", {
      reason: "unavailable",
      duration_ms: Math.round(performance.now() - startedAt),
    });
    return;
  }
  try {
    const rawBundle = await invoke<string | null>("get_secret", {
      account: KEYCHAIN_SESSION_ACCOUNT,
    });
    if (!rawBundle) {
      void logger.info("secure_storage.hydrate_empty", "No persisted session bundle found", {
        duration_ms: Math.round(performance.now() - startedAt),
      });
      return;
    }
    const parsed = JSON.parse(rawBundle) as SessionBundle;
    setCacheFromBundle(parsed);
    void logger.info("secure_storage.hydrate_success", "Secure storage hydration completed", {
      ...getPresenceFields(parsed),
      duration_ms: Math.round(performance.now() - startedAt),
    });
  } catch (error) {
    void logger.warn("secure_storage.hydrate_failed", "Secure storage hydration failed", {
      error: error instanceof Error ? error.message : String(error),
      duration_ms: Math.round(performance.now() - startedAt),
    });
    // ignore malformed/missing bundle
  }
}

export async function setSecure(key: SecureKey, value: string): Promise<void> {
  cache.set(key, value);
  await persistBundleToKeychain();
}

export async function setManySecure(values: Partial<Record<SecureKey, string>>): Promise<void> {
  for (const [key, value] of Object.entries(values) as Array<[SecureKey, string | undefined]>) {
    if (!value) continue;
    cache.set(key, value);
  }
  await persistBundleToKeychain();
}

export async function removeSecure(key: SecureKey): Promise<void> {
  cache.delete(key);
  await persistBundleToKeychain();
}

export async function getSecure(key: SecureKey): Promise<string | null> {
  await loadBundleFromKeychain();
  const cached = cache.get(key);
  return cached ?? null;
}

/**
 * Populates the in-memory cache from the OS keychain. Should be awaited once
 * during application bootstrap before any code reads secrets synchronously.
 */
export async function hydrateSecureStorage(): Promise<void> {
  await loadBundleFromKeychain();
}

export function clearSecureCache(): void {
  cache.clear();
  hydrated = false;
}

export async function clearAllSecrets(): Promise<void> {
  cache.clear();
  hydrated = false;
  if (!(await checkAvailable())) {
    void logger.warn("secure_storage.clear_skipped", "Secure storage clear skipped", {
      reason: "unavailable",
    });
    return;
  }
  await invoke("remove_secret", { account: KEYCHAIN_SESSION_ACCOUNT })
    .then(() => {
      void logger.info("secure_storage.clear_success", "All session secrets cleared");
    })
    .catch((error) => {
      void logger.warn("secure_storage.clear_failed", "Failed to clear session secrets", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
}

function normalizeEmailAccount(email: string): string | null {
  const normalized = (email || "").trim().toLowerCase();
  if (!SIMPLE_EMAIL_RE.test(normalized)) return null;
  return normalized;
}

/**
 * Stores the user key in the desktop keychain entry used by native messaging
 * (`GET_USER_KEY` lookup by email). Best effort: never throws.
 */
export async function setNativeMessagingUserKey(
  email: string,
  userKeyB64: string
): Promise<void> {
  const account = normalizeEmailAccount(email);
  if (!account || !userKeyB64) return;
  if (!(await checkAvailable())) {
    void logger.warn("native_messaging.user_key_set_skipped", "Native messaging user key write skipped", {
      reason: "secure_storage_unavailable",
      email_present: Boolean(email),
    });
    return;
  }

  await invoke("store_secret", {
    account,
    secret: userKeyB64,
  })
    .then(() => {
      void logger.info("native_messaging.user_key_set", "Native messaging user key stored", {
        email_present: Boolean(email),
      });
    })
    .catch((error) => {
      void logger.warn("native_messaging.user_key_set_failed", "Native messaging user key store failed", {
        email_present: Boolean(email),
        error: error instanceof Error ? error.message : String(error),
      });
    });
}

/**
 * Removes native messaging keychain entry for the given email. Best effort.
 */
export async function removeNativeMessagingUserKey(email: string): Promise<void> {
  const account = normalizeEmailAccount(email);
  if (!account) return;
  if (!(await checkAvailable())) {
    void logger.warn("native_messaging.user_key_remove_skipped", "Native messaging user key remove skipped", {
      reason: "secure_storage_unavailable",
      email_present: Boolean(email),
    });
    return;
  }

  await invoke("remove_secret", {
    account,
  })
    .then(() => {
      void logger.info("native_messaging.user_key_removed", "Native messaging user key removed", {
        email_present: Boolean(email),
      });
    })
    .catch((error) => {
      void logger.warn("native_messaging.user_key_remove_failed", "Native messaging user key remove failed", {
        email_present: Boolean(email),
        error: error instanceof Error ? error.message : String(error),
      });
    });
}
