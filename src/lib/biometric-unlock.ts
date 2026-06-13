import { invoke } from "@tauri-apps/api/core";

const BIOMETRIC_UNLOCK_ENABLED_KEY = "passwall_biometric_unlock_enabled";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function isBiometricUnlockAvailable(): Promise<boolean> {
  try {
    return await invoke<boolean>("is_biometric_unlock_available");
  } catch {
    return false;
  }
}

export function isBiometricUnlockEnabled(): boolean {
  return localStorage.getItem(BIOMETRIC_UNLOCK_ENABLED_KEY) === "true";
}

export function setBiometricUnlockPreference(enabled: boolean): void {
  if (enabled) {
    localStorage.setItem(BIOMETRIC_UNLOCK_ENABLED_KEY, "true");
  } else {
    localStorage.removeItem(BIOMETRIC_UNLOCK_ENABLED_KEY);
  }
}

export async function enableBiometricUnlock(
  email: string,
  userKeyB64: string
): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !userKeyB64) {
    throw new Error("Biometric unlock requires an unlocked session");
  }

  await invoke("store_biometric_unlock_key", {
    email: normalizedEmail,
    userKeyB64,
  });
  setBiometricUnlockPreference(true);
}

export async function disableBiometricUnlock(email: string): Promise<void> {
  await removeBiometricUnlockKey(email);
  setBiometricUnlockPreference(false);
}

export async function removeBiometricUnlockKey(email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) {
    await invoke("remove_biometric_unlock_key", {
      email: normalizedEmail,
    }).catch(() => {});
  }
}

export async function getBiometricUnlockKey(
  email: string
): Promise<string | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  return await invoke<string | null>("get_biometric_unlock_key", {
    email: normalizedEmail,
  });
}
