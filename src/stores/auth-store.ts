import { create } from "zustand";
import {
  cryptoService,
  SymmetricKey,
  PBKDF2_MIN_ITERATIONS,
} from "@/lib/crypto";
import AuthService from "@/api/auth";
import HTTPClient from "@/lib/http-client";
import {
  clearAllSecrets,
  getSecure,
  getSecureSync,
  removeNativeMessagingUserKey,
  removeSecure,
  setNativeMessagingUserKey,
  setManySecure,
  setSecure,
} from "@/lib/secure-storage";
import {
  disableBiometricUnlock as disableBiometricUnlockKey,
  enableBiometricUnlock as enableBiometricUnlockKey,
  getBiometricUnlockKey,
  isBiometricUnlockEnabled,
  removeBiometricUnlockKey,
} from "@/lib/biometric-unlock";
import type {
  User,
  Organization,
  LoginPayload,
  SignInResponse,
  KdfConfig,
} from "@/types";
import { useVaultStore } from "./vault-store";

const KDF_CONFIG_PREFIX = "passwall_kdf_config:";
const LOCAL_STORAGE_KEYS_TO_KEEP_ON_LOGOUT = new Set([
  "email",
  "server",
  "passwall_auto_update",
  "passwall_biometric_unlock_enabled",
  "passwall_desktop_locale",
  "passwall_session_settings",
  "passwall_theme",
]);

interface AuthState {
  authenticated: boolean;
  locked: boolean;
  user: User | null;
  userKey: SymmetricKey | null;
  organizations: Organization[];
  defaultOrgId: number | null;
  orgKeys: Record<number, SymmetricKey>;
  twoFactorRequired: boolean;
  twoFactorToken: string | null;
  _pendingMasterKey: Uint8Array | null;

  isAuthenticated: () => boolean;
  hasProPlan: () => boolean;
  login: (payload: LoginPayload) => Promise<{ two_factor_required?: boolean }>;
  verifyTwoFactor: (code: string, isRecovery?: boolean) => Promise<void>;
  completeLogin: (
    data: SignInResponse,
    email: string,
    server: string,
    masterKey: Uint8Array
  ) => Promise<void>;
  lock: () => Promise<void>;
  unlock: (masterPassword: string) => Promise<void>;
  unlockWithBiometrics: () => Promise<void>;
  enableBiometricUnlock: () => Promise<void>;
  disableBiometricUnlock: () => Promise<void>;
  logout: () => Promise<void>;
  fetchOrganizations: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
}

function resolveDefaultOrgId(orgs: Organization[]): number | null {
  const personal = orgs.find((o) => o.is_personal);
  if (personal) return personal.id;
  return orgs[0]?.id ?? null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getKdfConfigKey(email: string): string {
  return `${KDF_CONFIG_PREFIX}${normalizeEmail(email)}`;
}

function storeKdfConfig(email: string, config: KdfConfig): void {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  localStorage.setItem(getKdfConfigKey(normalized), JSON.stringify(config));
}

function getStoredKdfConfig(email: string): KdfConfig | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  try {
    const raw = localStorage.getItem(getKdfConfigKey(normalized));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<KdfConfig>;
    if (
      typeof parsed.kdf_type !== "number" ||
      typeof parsed.kdf_salt !== "string"
    ) {
      return null;
    }
    return parsed as KdfConfig;
  } catch {
    return null;
  }
}

async function refreshBiometricUnlockKeyIfEnabled(
  email: string,
  userKeyB64: string
): Promise<void> {
  if (!email || !userKeyB64 || !isBiometricUnlockEnabled()) return;
  await enableBiometricUnlockKey(email, userKeyB64).catch(() => {
    // Keep normal login working if the biometric keychain entry cannot refresh.
  });
}

export const useAuthStore = create<AuthState>((set, get) => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? (JSON.parse(userStr) as User) : null;

  let organizations: Organization[] = [];
  try {
    const orgsJson = localStorage.getItem("organizations");
    if (orgsJson) organizations = JSON.parse(orgsJson);
  } catch {
    organizations = [];
  }

  return {
    // Populated by restoreSession() during bootstrap once the secure cache
    // has been hydrated from the OS keychain.
    authenticated: false,
    locked: false,
    user,
    userKey: null,
    organizations,
    defaultOrgId: resolveDefaultOrgId(organizations),
    orgKeys: {},
    twoFactorRequired: false,
    twoFactorToken: null,
    _pendingMasterKey: null,

    isAuthenticated: () => {
      const s = get();
      return (
        s.authenticated && !!s.userKey && !!getSecureSync("access_token")
      );
    },

    hasProPlan: () => {
      const s = get();
      if (!s.user) return false;
      const org =
        s.organizations.find((o) => o.id === s.defaultOrgId) ||
        s.organizations.find((o) => o.is_personal) ||
        s.organizations[0];
      if (!org) return false;
      const status = org.subscription_status;
      if (status === "expired" || status === "canceled") return false;
      const plan = (org.plan || "free").split("-")[0].toLowerCase();
      return plan !== "free";
    },

    async login(payload: LoginPayload) {
      const { email, master_password, server } = payload;
      HTTPClient.setBaseURL(server);

      const { data: kdfConfig } = await AuthService.preLogin(email);
      storeKdfConfig(email, kdfConfig);

      if (
        kdfConfig.kdf_type === 0 &&
        kdfConfig.kdf_iterations < PBKDF2_MIN_ITERATIONS
      ) {
        throw new Error(
          `KDF iterations too low (${kdfConfig.kdf_iterations}). Minimum required: ${PBKDF2_MIN_ITERATIONS}.`
        );
      }

      const masterKey = await cryptoService.makeMasterKey(
        master_password,
        kdfConfig.kdf_salt,
        kdfConfig
      );

      const authKey = await cryptoService.hashMasterKey(masterKey);
      const authKeyBase64 = cryptoService.arrayToBase64(authKey);

      let data: SignInResponse;
      try {
        const response = await AuthService.signIn({
          email,
          master_password_hash: authKeyBase64,
          app: "desktop",
        });
        data = response.data;
      } catch (error: unknown) {
        const err = error as { response?: { status: number; data?: { error?: string } } };
        if (
          err.response?.status === 403 &&
          err.response?.data?.error === "two_factor_setup_required"
        ) {
          throw Object.assign(
            new Error(
              "Two-factor authentication setup is required by your organization. Please set it up in the Passwall Vault web app."
            ),
            { type: "REQUIRE_2FA_SETUP" }
          );
        }
        throw error;
      }

      if (data.two_factor_required) {
        set({
          twoFactorRequired: true,
          twoFactorToken: data.two_factor_token || null,
          _pendingMasterKey: masterKey,
        });
        localStorage.setItem("email", email);
        localStorage.setItem("server", server);
        return { two_factor_required: true };
      }

      if (data.require_two_factor_setup?.is_mandatory) {
        throw Object.assign(
          new Error(
            "Two-factor authentication setup is required by your organization. Please set it up in the Passwall Vault web app."
          ),
          { type: "REQUIRE_2FA_SETUP" }
        );
      }

      await get().completeLogin(data, email, server, masterKey);
      return {};
    },

    async verifyTwoFactor(code: string, isRecovery = false) {
      const { twoFactorToken, _pendingMasterKey } = get();
      if (!twoFactorToken || !_pendingMasterKey) {
        throw new Error("No pending 2FA session");
      }

      const { data } = await AuthService.verify2FA({
        two_factor_token: twoFactorToken,
        ...(isRecovery ? { recovery_code: code } : { totp_code: code }),
      });

      if (data.require_two_factor_setup?.is_mandatory) {
        set({
          twoFactorRequired: false,
          twoFactorToken: null,
          _pendingMasterKey: null,
        });
        throw Object.assign(
          new Error(
            "Two-factor authentication setup is required. Please set it up in the Passwall Vault web app."
          ),
          { type: "REQUIRE_2FA_SETUP" }
        );
      }

      const masterKey = _pendingMasterKey;
      set({
        twoFactorRequired: false,
        twoFactorToken: null,
        _pendingMasterKey: null,
      });

      const email = localStorage.getItem("email") || "";
      const server = localStorage.getItem("server") || "";
      await get().completeLogin(data, email, server, masterKey);
    },

    async completeLogin(
      data: SignInResponse,
      email: string,
      server: string,
      masterKey: Uint8Array
    ) {
      const stretchedMasterKey =
        await cryptoService.stretchMasterKey(masterKey);
      const userKey = await cryptoService.unwrapUserKey(
        data.protected_user_key,
        stretchedMasterKey
      );

      localStorage.setItem("email", email);
      localStorage.setItem("server", server);
      localStorage.setItem("user", JSON.stringify(data.user || {}));

      const userKeyB64 = cryptoService.arrayToBase64(userKey.toBytes());
      await setManySecure({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user_key: userKeyB64,
        protected_user_key: data.protected_user_key,
      });
      await setNativeMessagingUserKey(email, userKeyB64);
      await refreshBiometricUnlockKeyIfEnabled(email, userKeyB64);

      set({
        userKey,
        authenticated: true,
        locked: false,
        user: data.user,
      });

      await get().fetchOrganizations();
    },

    async lock() {
      const emailForNativeHost = (localStorage.getItem("email") || "").trim();
      await removeNativeMessagingUserKey(emailForNativeHost);
      await removeSecure("user_key");
      useVaultStore.getState().clearItems();

      set({
        userKey: null,
        locked: true,
        orgKeys: {},
      });
    },

    async unlock(masterPassword: string) {
      const email = localStorage.getItem("email") || "";
      const server = localStorage.getItem("server") || "";
      if (server) HTTPClient.setBaseURL(server);

      const protectedUserKey = await getSecure("protected_user_key");
      if (!protectedUserKey) {
        throw new Error("No protected user key available. Please sign in again.");
      }

      let kdfConfig = getStoredKdfConfig(email);
      if (!kdfConfig) {
        const { data } = await AuthService.preLogin(email);
        kdfConfig = data;
        storeKdfConfig(email, data);
      }
      const masterKey = await cryptoService.makeMasterKey(
        masterPassword,
        kdfConfig.kdf_salt,
        kdfConfig
      );
      const stretchedMasterKey = await cryptoService.stretchMasterKey(masterKey);
      const userKey = await cryptoService.unwrapUserKey(
        protectedUserKey,
        stretchedMasterKey
      );

      const userKeyB64 = cryptoService.arrayToBase64(userKey.toBytes());
      await setSecure("user_key", userKeyB64);
      await setNativeMessagingUserKey(email, userKeyB64);
      await refreshBiometricUnlockKeyIfEnabled(email, userKeyB64);

      set({
        userKey,
        locked: false,
        authenticated: true,
      });

      await get().fetchOrganizations();
    },

    async unlockWithBiometrics() {
      const email = localStorage.getItem("email") || "";
      const server = localStorage.getItem("server") || "";
      if (server) HTTPClient.setBaseURL(server);

      const userKeyB64 = await getBiometricUnlockKey(email);
      if (!userKeyB64) {
        throw new Error("Biometric unlock failed");
      }

      const userKeyBytes = cryptoService.base64ToArray(userKeyB64);
      const userKey = SymmetricKey.fromBytes(userKeyBytes);
      await setSecure("user_key", userKeyB64);
      await setNativeMessagingUserKey(email, userKeyB64);

      set({
        userKey,
        locked: false,
        authenticated: true,
      });

      await get().fetchOrganizations();
    },

    async enableBiometricUnlock() {
      const { userKey, locked } = get();
      const email = localStorage.getItem("email") || "";
      if (locked || !userKey || !email) {
        throw new Error("Biometric unlock requires an unlocked session");
      }

      const userKeyB64 = cryptoService.arrayToBase64(userKey.toBytes());
      await enableBiometricUnlockKey(email, userKeyB64);
    },

    async disableBiometricUnlock() {
      const email = localStorage.getItem("email") || "";
      await disableBiometricUnlockKey(email);
    },

    async logout() {
      const emailForNativeHost = (localStorage.getItem("email") || "").trim();
      try {
        await AuthService.logout();
      } catch {
        // Ignore server-side logout errors
      }

      await clearAllSecrets();
      await removeNativeMessagingUserKey(emailForNativeHost);
      await removeBiometricUnlockKey(emailForNativeHost);
      useVaultStore.getState().clearItems();

      set({
        userKey: null,
        user: null,
        authenticated: false,
        locked: false,
        twoFactorToken: null,
        twoFactorRequired: false,
        _pendingMasterKey: null,
        organizations: [],
        defaultOrgId: null,
        orgKeys: {},
      });

      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (!LOCAL_STORAGE_KEYS_TO_KEEP_ON_LOGOUT.has(key)) {
          localStorage.removeItem(key);
        }
      });
    },

    async fetchOrganizations() {
      try {
        const { data } = await OrganizationsService.getAll();
        const orgs = Array.isArray(data) ? data : [];

        const orgKeys = { ...get().orgKeys };
        const userKey = get().userKey;

        if (userKey) {
          for (const org of orgs) {
            if (org.encrypted_org_key && !orgKeys[org.id]) {
              try {
                const { unwrapOrgKeyWithUserKey } = await import(
                  "@/lib/crypto"
                );
                const orgKey = await unwrapOrgKeyWithUserKey(
                  org.encrypted_org_key,
                  userKey
                );
                orgKeys[org.id] = orgKey;
              } catch (error) {
                console.error(
                  `Failed to unwrap org key for org ${org.id}:`,
                  (error as Error).message
                );
              }
            }
          }
        }

        set({
          organizations: orgs,
          defaultOrgId: resolveDefaultOrgId(orgs),
          orgKeys,
        });

        localStorage.setItem("organizations", JSON.stringify(orgs));
      } catch (error) {
        console.error(
          "Failed to fetch organizations:",
          (error as Error).message
        );
      }
    },

    async restoreSession(): Promise<boolean> {
      const accessToken = await getSecure("access_token");
      const userKeyB64 = await getSecure("user_key");
      const protectedUserKey = await getSecure("protected_user_key");
      if (!accessToken) return false;

      const savedServer = localStorage.getItem("server");
      if (savedServer) {
        HTTPClient.setBaseURL(savedServer);
      }

      if (!get().user) {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            set({ user: JSON.parse(userStr) as User });
          } catch {
            // corrupted user data
          }
        }
      }

      if (!userKeyB64 && protectedUserKey) {
        set({
          authenticated: true,
          locked: true,
          userKey: null,
          orgKeys: {},
        });
        return true;
      }

      if (!userKeyB64) return false;

      try {
        const userKeyBytes = cryptoService.base64ToArray(userKeyB64);
        const userKey = SymmetricKey.fromBytes(userKeyBytes);
        set({ userKey, authenticated: true, locked: false });
      } catch {
        return false;
      }

      const savedEmail = localStorage.getItem("email");
      if (savedEmail) {
        await setNativeMessagingUserKey(savedEmail, userKeyB64);
      }

      await get().fetchOrganizations();
      return true;
    },
  };
});

// Imported at module level — Zustand's lazy getState() pattern prevents
// circular initialization issues at runtime.
import OrganizationsService from "@/api/organizations";
