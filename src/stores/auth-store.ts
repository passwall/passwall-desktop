import { create } from "zustand";
import {
  cryptoService,
  SymmetricKey,
  PBKDF2_MIN_ITERATIONS,
} from "@/lib/crypto";
import AuthService from "@/api/auth";
import OrganizationsService from "@/api/organizations";
import HTTPClient from "@/lib/http-client";
import type { ApiError } from "@/lib/http-client";
import { createFlowId, logger, type LogFields } from "@/lib/logger";
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

let lastAuthSuccessAt: number | null = null;

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
    masterKey: Uint8Array,
    flowId?: string
  ) => Promise<void>;
  lock: () => Promise<void>;
  unlock: (masterPassword: string) => Promise<void>;
  unlockWithBiometrics: () => Promise<void>;
  enableBiometricUnlock: () => Promise<void>;
  disableBiometricUnlock: () => Promise<void>;
  logout: (source?: string, metadata?: LogFields) => Promise<void>;
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
    void logger.warn(
      "auth.biometric_unlock_key_refresh_failed",
      "Biometric unlock key refresh failed"
    );
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
      const flowId = createFlowId("login");
      void logger.info(
        "auth.login_start",
        "Login flow started",
        {
          email_present: email.trim().length > 0,
          server_present: server.trim().length > 0,
        },
        { flow_id: flowId }
      );
      HTTPClient.setBaseURL(server);

      const { data: kdfConfig } = await AuthService.preLogin(email);
      storeKdfConfig(email, kdfConfig);
      void logger.info(
        "auth.prelogin_success",
        "Prelogin KDF configuration loaded",
        {
          kdf_type: kdfConfig.kdf_type,
          kdf_iterations: kdfConfig.kdf_iterations,
        },
        { flow_id: flowId }
      );

      if (
        kdfConfig.kdf_type === 0 &&
        kdfConfig.kdf_iterations < PBKDF2_MIN_ITERATIONS
      ) {
        void logger.error(
          "auth.kdf_policy_rejected",
          "KDF iterations are below the desktop minimum",
          {
            kdf_type: kdfConfig.kdf_type,
            kdf_iterations: kdfConfig.kdf_iterations,
            min_iterations: PBKDF2_MIN_ITERATIONS,
          },
          { flow_id: flowId }
        );
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
        void logger.warn(
          "auth.signin_failed",
          "Signin request failed",
          {
            status: err.response?.status,
            error_code: err.response?.data?.error,
          },
          { flow_id: flowId }
        );
        throw error;
      }

      if (data.two_factor_required) {
        void logger.info(
          "auth.signin_2fa_required",
          "Signin requires two-factor verification",
          undefined,
          { flow_id: flowId }
        );
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
        void logger.warn(
          "auth.signin_2fa_setup_required",
          "Organization requires two-factor setup",
          undefined,
          { flow_id: flowId }
        );
        throw Object.assign(
          new Error(
            "Two-factor authentication setup is required by your organization. Please set it up in the Passwall Vault web app."
          ),
          { type: "REQUIRE_2FA_SETUP" }
        );
      }

      await get().completeLogin(data, email, server, masterKey, flowId);
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
      await get().completeLogin(data, email, server, masterKey, createFlowId("2fa"));
    },

    async completeLogin(
      data: SignInResponse,
      email: string,
      server: string,
      masterKey: Uint8Array,
      flowId = createFlowId("login")
    ) {
      void logger.info(
        "auth.complete_login_start",
        "Completing login and storing session secrets",
        {
          has_user: Boolean(data.user),
          has_access_token: Boolean(data.access_token),
          has_refresh_token: Boolean(data.refresh_token),
          has_protected_user_key: Boolean(data.protected_user_key),
        },
        { flow_id: flowId }
      );
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
      try {
        await setManySecure({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user_key: userKeyB64,
          protected_user_key: data.protected_user_key,
        });
      } catch (error) {
        void logger.error(
          "auth.secure_storage_write_failed",
          "Failed to store session secrets",
          {
            error: error instanceof Error ? error.message : String(error),
          },
          { flow_id: flowId }
        );
        throw error;
      }
      void logger.info(
        "auth.secure_storage_write_success",
        "Session secrets were stored in secure storage",
        {
          has_access_token: Boolean(data.access_token),
          has_refresh_token: Boolean(data.refresh_token),
          has_user_key: Boolean(userKeyB64),
          has_protected_user_key: Boolean(data.protected_user_key),
        },
        { flow_id: flowId }
      );
      await setNativeMessagingUserKey(email, userKeyB64);
      await refreshBiometricUnlockKeyIfEnabled(email, userKeyB64);

      set({
        userKey,
        authenticated: true,
        locked: false,
        user: data.user,
      });
      lastAuthSuccessAt = Date.now();

      await get().fetchOrganizations();
      lastAuthSuccessAt = Date.now();
      void logger.info(
        "auth.complete_login_success",
        "Login flow completed",
        {
          authenticated: get().authenticated,
          locked: get().locked,
          has_user_key: Boolean(get().userKey),
          organizations_count: get().organizations.length,
        },
        { flow_id: flowId }
      );
    },

    async lock() {
      const emailForNativeHost = (localStorage.getItem("email") || "").trim();
      void logger.info("auth.lock_start", "Locking vault", {
        authenticated: get().authenticated,
        organizations_count: get().organizations.length,
      });
      await removeNativeMessagingUserKey(emailForNativeHost);
      await removeSecure("user_key");
      useVaultStore.getState().clearItems();

      set({
        userKey: null,
        locked: true,
        orgKeys: {},
      });
      void logger.info("auth.lock_success", "Vault locked", {
        authenticated: get().authenticated,
        locked: get().locked,
      });
    },

    async unlock(masterPassword: string) {
      const email = localStorage.getItem("email") || "";
      const server = localStorage.getItem("server") || "";
      const flowId = createFlowId("unlock");
      void logger.info("auth.unlock_start", "Master password unlock started", undefined, {
        flow_id: flowId,
      });
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
      lastAuthSuccessAt = Date.now();

      await get().fetchOrganizations();
      lastAuthSuccessAt = Date.now();
      void logger.info(
        "auth.unlock_success",
        "Master password unlock completed",
        {
          authenticated: get().authenticated,
          locked: get().locked,
          organizations_count: get().organizations.length,
        },
        { flow_id: flowId }
      );
    },

    async unlockWithBiometrics() {
      const email = localStorage.getItem("email") || "";
      const server = localStorage.getItem("server") || "";
      const flowId = createFlowId("biometric-unlock");
      void logger.info("auth.biometric_unlock_start", "Biometric unlock started", undefined, {
        flow_id: flowId,
      });
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
      lastAuthSuccessAt = Date.now();

      await get().fetchOrganizations();
      lastAuthSuccessAt = Date.now();
      void logger.info(
        "auth.biometric_unlock_success",
        "Biometric unlock completed",
        {
          authenticated: get().authenticated,
          locked: get().locked,
          organizations_count: get().organizations.length,
        },
        { flow_id: flowId }
      );
    },

    async enableBiometricUnlock() {
      const { userKey, locked } = get();
      const email = localStorage.getItem("email") || "";
      if (locked || !userKey || !email) {
        throw new Error("Biometric unlock requires an unlocked session");
      }

      const userKeyB64 = cryptoService.arrayToBase64(userKey.toBytes());
      await enableBiometricUnlockKey(email, userKeyB64);
      void logger.info("auth.biometric_unlock_enabled", "Biometric unlock enabled", {
        locked,
        has_user_key: Boolean(userKey),
        email_present: Boolean(email),
      });
    },

    async disableBiometricUnlock() {
      const email = localStorage.getItem("email") || "";
      await disableBiometricUnlockKey(email);
      void logger.info("auth.biometric_unlock_disabled", "Biometric unlock disabled", {
        email_present: Boolean(email),
      });
    },

    async logout(source = "unknown", metadata: LogFields = {}) {
      const emailForNativeHost = (localStorage.getItem("email") || "").trim();
      const callerStack = new Error().stack
        ?.split("\n")
        .slice(1, 8)
        .join(" | ");
      void logger.info("auth.logout_start", "Logout started", {
        source,
        ...metadata,
        caller_stack: callerStack,
        ms_since_last_auth_success:
          lastAuthSuccessAt === null ? null : Date.now() - lastAuthSuccessAt,
        authenticated: get().authenticated,
        locked: get().locked,
        has_user_key: Boolean(get().userKey),
        organizations_count: get().organizations.length,
      });
      try {
        await AuthService.logout();
      } catch (error) {
        void logger.warn("auth.logout_server_failed", "Server logout request failed", {
          source,
          error: error instanceof Error ? error.message : String(error),
        });
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
      void logger.info("auth.logout_success", "Logout completed", { source });
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
        void logger.info("org.fetch_success", "Organizations loaded", {
          organizations_count: orgs.length,
          default_org_present: Boolean(resolveDefaultOrgId(orgs)),
        });
      } catch (error) {
        const apiError = error as ApiError;
        void logger.error("org.fetch_failed", "Failed to fetch organizations", {
          status: apiError.response?.status,
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(
          "Failed to fetch organizations:",
          (error as Error).message
        );
      }
    },

    async restoreSession(): Promise<boolean> {
      const flowId = createFlowId("restore");
      void logger.info("auth.restore_start", "Session restore started", undefined, {
        flow_id: flowId,
      });
      const accessToken = await getSecure("access_token");
      const userKeyB64 = await getSecure("user_key");
      const protectedUserKey = await getSecure("protected_user_key");
      void logger.info(
        "auth.restore_secure_state",
        "Secure storage state loaded for restore",
        {
          has_access_token: Boolean(accessToken),
          has_user_key: Boolean(userKeyB64),
          has_protected_user_key: Boolean(protectedUserKey),
          has_user_before: Boolean(get().user),
          organizations_count: get().organizations.length,
        },
        { flow_id: flowId }
      );
      if (!accessToken) {
        void logger.info("auth.restore_no_session", "No access token available", undefined, {
          flow_id: flowId,
        });
        return false;
      }

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
        lastAuthSuccessAt = Date.now();
        void logger.info(
          "auth.restore_locked",
          "Session restored in locked state",
          undefined,
          { flow_id: flowId }
        );
        return true;
      }

      if (!userKeyB64) {
        void logger.warn(
          "auth.restore_missing_user_key",
          "Session restore found no user key",
          { has_protected_user_key: Boolean(protectedUserKey) },
          { flow_id: flowId }
        );
        return false;
      }

      try {
        const userKeyBytes = cryptoService.base64ToArray(userKeyB64);
        const userKey = SymmetricKey.fromBytes(userKeyBytes);
        set({ userKey, authenticated: true, locked: false });
        lastAuthSuccessAt = Date.now();
      } catch {
        void logger.error(
          "auth.restore_invalid_user_key",
          "Stored user key could not be decoded",
          undefined,
          { flow_id: flowId }
        );
        return false;
      }

      const savedEmail = localStorage.getItem("email");
      if (savedEmail) {
        await setNativeMessagingUserKey(savedEmail, userKeyB64);
      }

      await get().fetchOrganizations();
      lastAuthSuccessAt = Date.now();
      void logger.info(
        "auth.restore_unlocked",
        "Session restored in unlocked state",
        {
          authenticated: get().authenticated,
          locked: get().locked,
          has_user_key: Boolean(get().userKey),
          has_user: Boolean(get().user),
          organizations_count: get().organizations.length,
        },
        { flow_id: flowId }
      );
      return true;
    },
  };
});

