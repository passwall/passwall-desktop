import { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/hooks/useTheme";
import { AUTH_EXPIRED_EVENT } from "@/lib/http-client";
import { logger } from "@/lib/logger";
import { hydrateSecureStorage } from "@/lib/secure-storage";
import { getSessionSettings, getTimeoutMs } from "@/lib/session-settings";
import Login from "@/pages/Login";
import TwoFactor from "@/pages/TwoFactor";
import Unlock from "@/pages/Unlock";
import Home from "@/pages/Home";
import Passwords from "@/pages/Passwords";
import Notes from "@/pages/Notes";
import Addresses from "@/pages/Addresses";
import CreditCards from "@/pages/CreditCards";
import BankAccounts from "@/pages/BankAccounts";
import PasswordGenerator from "@/pages/PasswordGenerator";
import Settings from "@/pages/Settings";
import ConnectedBrowsers from "@/pages/ConnectedBrowsers";
import UpdateNotifier from "@/components/common/UpdateNotifier";

let _bootstrapPromise: Promise<void> | null = null;
function bootstrapAuth(): Promise<void> {
  if (_bootstrapPromise) return _bootstrapPromise;
  _bootstrapPromise = (async () => {
    void logger.info("app.bootstrap_start", "Auth bootstrap started");
    await hydrateSecureStorage();
    const restored = await useAuthStore.getState().restoreSession();
    void logger.info("app.bootstrap_done", "Auth bootstrap completed", { restored });
  })();
  return _bootstrapPromise;
}

function useAuthBootstrap() {
  const [ready, setReady] = useState<boolean>(() => _bootstrapPromise !== null);
  useEffect(() => {
    let mounted = true;
    bootstrapAuth().finally(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return ready;
}

function BootstrapGate({ children }: { children: React.ReactNode }) {
  const ready = useAuthBootstrap();
  if (!ready) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-secondary">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authenticated = useAuthStore((s) => s.authenticated);
  const userKey = useAuthStore((s) => s.userKey);
  const locked = useAuthStore((s) => s.locked);

  if (locked) {
    void logger.info("route.guard_redirect", "Protected route redirected to unlock", {
      guard: "ProtectedRoute",
      to: "/unlock",
      from: window.location.hash || window.location.pathname,
      authenticated,
      locked,
      has_user_key: Boolean(userKey),
    });
    return <Navigate to="/unlock" replace />;
  }
  if (!authenticated || !userKey) {
    void logger.info("route.guard_redirect", "Protected route redirected to login", {
      guard: "ProtectedRoute",
      to: "/login",
      from: window.location.hash || window.location.pathname,
      authenticated,
      locked,
      has_user_key: Boolean(userKey),
    });
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const authenticated = useAuthStore((s) => s.authenticated);
  const userKey = useAuthStore((s) => s.userKey);
  const locked = useAuthStore((s) => s.locked);

  if (authenticated && locked) {
    void logger.info("route.guard_redirect", "Auth route redirected to unlock", {
      guard: "AuthRoute",
      to: "/unlock",
      from: window.location.hash || window.location.pathname,
      authenticated,
      locked,
      has_user_key: Boolean(userKey),
    });
    return <Navigate to="/unlock" replace />;
  }
  if (authenticated && userKey) {
    void logger.info("route.guard_redirect", "Auth route redirected to passwords", {
      guard: "AuthRoute",
      to: "/passwords",
      from: window.location.hash || window.location.pathname,
      authenticated,
      locked,
      has_user_key: Boolean(userKey),
    });
    return <Navigate to="/passwords" replace />;
  }
  return <>{children}</>;
}

function UnlockRoute() {
  const authenticated = useAuthStore((s) => s.authenticated);
  const userKey = useAuthStore((s) => s.userKey);
  const locked = useAuthStore((s) => s.locked);
  if (!authenticated) {
    void logger.info("route.guard_redirect", "Unlock route redirected to login", {
      guard: "UnlockRoute",
      to: "/login",
      from: window.location.hash || window.location.pathname,
      authenticated,
      locked,
      has_user_key: Boolean(userKey),
    });
    return <Navigate to="/login" replace />;
  }
  if (!locked && userKey) {
    void logger.info("route.guard_redirect", "Unlock route redirected to passwords", {
      guard: "UnlockRoute",
      to: "/passwords",
      from: window.location.hash || window.location.pathname,
      authenticated,
      locked,
      has_user_key: Boolean(userKey),
    });
    return <Navigate to="/passwords" replace />;
  }
  if (!locked) {
    void logger.info("route.guard_redirect", "Unlock route redirected to passwords without user key", {
      guard: "UnlockRoute",
      to: "/passwords",
      from: window.location.hash || window.location.pathname,
      authenticated,
      locked,
      has_user_key: Boolean(userKey),
    });
    return <Navigate to="/passwords" replace />;
  }
  return <Unlock />;
}

function TwoFactorGuard() {
  const twoFactorRequired = useAuthStore((s) => s.twoFactorRequired);
  if (!twoFactorRequired) {
    void logger.info("route.guard_redirect", "Two-factor route redirected to login", {
      guard: "TwoFactorGuard",
      to: "/login",
      from: window.location.hash || window.location.pathname,
      two_factor_required: twoFactorRequired,
    });
    return <Navigate to="/login" replace />;
  }
  return <TwoFactor />;
}

export default function App() {
  useTheme();
  const navigate = useNavigate();
  const authenticated = useAuthStore((s) => s.authenticated);
  const userKey = useAuthStore((s) => s.userKey);
  const locked = useAuthStore((s) => s.locked);
  const lock = useAuthStore((s) => s.lock);
  const logout = useAuthStore((s) => s.logout);
  const closingRef = useRef(false);
  const previousAuthStateRef = useRef<{
    authenticated: boolean;
    locked: boolean;
    hasUserKey: boolean;
  } | null>(null);

  useEffect(() => {
    const current = {
      authenticated,
      locked,
      hasUserKey: Boolean(userKey),
    };
    const previous = previousAuthStateRef.current;
    if (
      previous &&
      (previous.authenticated !== current.authenticated ||
        previous.locked !== current.locked ||
        previous.hasUserKey !== current.hasUserKey)
    ) {
      void logger.info("auth.state_changed", "Auth state changed", {
        previous_authenticated: previous.authenticated,
        previous_locked: previous.locked,
        previous_has_user_key: previous.hasUserKey,
        authenticated: current.authenticated,
        locked: current.locked,
        has_user_key: current.hasUserKey,
        route: window.location.hash || window.location.pathname,
      });
    }
    previousAuthStateRef.current = current;
  }, [authenticated, locked, userKey]);

  useEffect(() => {
    const handleAuthExpired = (event: Event) => {
      const state = useAuthStore.getState();
      const detail =
        event instanceof CustomEvent && typeof event.detail === "object" && event.detail !== null
          ? (event.detail as Record<string, string | number | undefined>)
          : {};
      void logger.warn("auth.expired_event_received", "Auth expired event received", {
        reason: detail.reason,
        triggering_method: detail.method,
        triggering_path: detail.path,
        triggering_status: detail.triggering_status,
        refresh_status: detail.refresh_status,
        authenticated: state.authenticated,
        locked: state.locked,
        has_user_key: Boolean(state.userKey),
        organizations_count: state.organizations.length,
      });
      void logout("auth_expired_event").finally(() => {
        navigate("/login", { replace: true });
      });
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [logout, navigate]);

  const prevTimeoutConfigRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authenticated || !userKey || locked) {
      prevTimeoutConfigRef.current = null;
      return;
    }

    const settings = getSessionSettings();
    const timeoutMs = getTimeoutMs(settings.vaultTimeout);
    const effectStartedAt = Date.now();

    const configKey = `${settings.vaultTimeout}|${settings.vaultTimeoutAction}`;
    if (prevTimeoutConfigRef.current !== configKey) {
      prevTimeoutConfigRef.current = configKey;
      void logger.info("session.timeout_effect_active", "Session timeout watcher activated", {
        vault_timeout: settings.vaultTimeout,
        vault_timeout_action: settings.vaultTimeoutAction,
        timeout_ms: timeoutMs,
        authenticated,
        locked,
        has_user_key: Boolean(userKey),
      });
    }

    if (settings.vaultTimeout === "on_close") {
      const appWindow = getCurrentWindow();
      const unlistenPromise = appWindow.onCloseRequested(async (event) => {
        if (closingRef.current) return;
        closingRef.current = true;
        event.preventDefault();
        void logger.info("session.close_requested", "Window close requested", {
          vault_timeout: settings.vaultTimeout,
          vault_timeout_action: settings.vaultTimeoutAction,
          ms_since_effect_start: Date.now() - effectStartedAt,
          authenticated,
          locked,
          has_user_key: Boolean(userKey),
        });
        if (settings.vaultTimeoutAction === "lock") {
          await lock();
        } else {
          await logout("window_close_timeout");
        }
        await appWindow.close();
      });

      return () => {
        void unlistenPromise.then((unlisten) => unlisten());
      };
    }

    if (timeoutMs === null) return;

    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const handleTimeout = () => {
      void logger.info("session.idle_timeout_fired", "Vault timeout fired", {
        vault_timeout: settings.vaultTimeout,
        vault_timeout_action: settings.vaultTimeoutAction,
        timeout_ms: timeoutMs,
        ms_since_effect_start: Date.now() - effectStartedAt,
      });
      if (settings.vaultTimeoutAction === "lock") {
        void lock().finally(() => {
          navigate("/unlock", { replace: true });
        });
      } else {
        void logout("idle_timeout").finally(() => {
          navigate("/login", { replace: true });
        });
      }
    };

    const resetIdleTimer = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      idleTimer = setTimeout(handleTimeout, timeoutMs);
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });
    resetIdleTimer();

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
    };
  }, [authenticated, userKey, locked, lock, logout, navigate]);

  return (
    <BootstrapGate>
      <Routes>
        <Route
          path="/login"
          element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          }
        />
        <Route
          path="/unlock"
          element={<UnlockRoute />}
        />
        <Route
          path="/two-factor"
          element={<TwoFactorGuard />}
        />
        <Route
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        >
          <Route index element={<Passwords />} />
          <Route path="passwords" element={<Passwords />} />
          <Route path="passwords/create" element={<Passwords />} />
          <Route path="passwords/:id" element={<Passwords />} />
          <Route path="notes" element={<Notes />} />
          <Route path="notes/create" element={<Notes />} />
          <Route path="notes/:id" element={<Notes />} />
          <Route path="addresses" element={<Addresses />} />
          <Route path="addresses/create" element={<Addresses />} />
          <Route path="addresses/:id" element={<Addresses />} />
          <Route path="credit-cards" element={<CreditCards />} />
          <Route path="credit-cards/create" element={<CreditCards />} />
          <Route path="credit-cards/:id" element={<CreditCards />} />
          <Route path="bank-accounts" element={<BankAccounts />} />
          <Route path="bank-accounts/create" element={<BankAccounts />} />
          <Route path="bank-accounts/:id" element={<BankAccounts />} />
          <Route path="password-generator" element={<PasswordGenerator />} />
          <Route path="connected-browsers" element={<ConnectedBrowsers />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Passwords />} />
        </Route>
      </Routes>
      <UpdateNotifier />
    </BootstrapGate>
  );
}
