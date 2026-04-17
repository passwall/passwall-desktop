import { invoke } from "@tauri-apps/api/core";

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

export type SecureKey = "access_token" | "refresh_token" | "user_key";

const cache = new Map<SecureKey, string>();
let keystoreAvailable: boolean | null = null;
let hydrated = false;
const KEYCHAIN_SESSION_ACCOUNT = "session_bundle_v1";
const ALL_KEYS: SecureKey[] = ["access_token", "refresh_token", "user_key"];

type SessionBundle = Partial<Record<SecureKey, string>>;

async function checkAvailable(): Promise<boolean> {
  if (keystoreAvailable !== null) return keystoreAvailable;
  try {
    keystoreAvailable = await invoke<boolean>("is_keystore_available");
  } catch {
    keystoreAvailable = false;
  }
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
  if (!(await checkAvailable())) return;
  const bundle: SessionBundle = {};
  for (const key of ALL_KEYS) {
    const value = cache.get(key);
    if (value) bundle[key] = value;
  }

  try {
    if (Object.keys(bundle).length === 0) {
      await invoke("remove_secret", { account: KEYCHAIN_SESSION_ACCOUNT });
      return;
    }
    await invoke("store_secret", {
      account: KEYCHAIN_SESSION_ACCOUNT,
      secret: JSON.stringify(bundle),
    });
  } catch {
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
  hydrated = true;
  if (!(await checkAvailable())) return;
  try {
    const rawBundle = await invoke<string | null>("get_secret", {
      account: KEYCHAIN_SESSION_ACCOUNT,
    });
    if (!rawBundle) return;
    const parsed = JSON.parse(rawBundle) as SessionBundle;
    setCacheFromBundle(parsed);
  } catch {
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
  if (!(await checkAvailable())) return;
  await invoke("remove_secret", { account: KEYCHAIN_SESSION_ACCOUNT }).catch(
    () => {}
  );
}
