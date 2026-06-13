import { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/hooks/useTheme";
import { AUTH_EXPIRED_EVENT } from "@/lib/http-client";
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
    await hydrateSecureStorage();
    await useAuthStore.getState().restoreSession();
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
    return <Navigate to="/unlock" replace />;
  }
  if (!authenticated || !userKey) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const authenticated = useAuthStore((s) => s.authenticated);
  const userKey = useAuthStore((s) => s.userKey);
  const locked = useAuthStore((s) => s.locked);

  if (authenticated && locked) {
    return <Navigate to="/unlock" replace />;
  }
  if (authenticated && userKey) {
    return <Navigate to="/passwords" replace />;
  }
  return <>{children}</>;
}

function UnlockRoute() {
  const authenticated = useAuthStore((s) => s.authenticated);
  const userKey = useAuthStore((s) => s.userKey);
  const locked = useAuthStore((s) => s.locked);
  if (!authenticated) return <Navigate to="/login" replace />;
  if (!locked && userKey) return <Navigate to="/passwords" replace />;
  if (!locked) return <Navigate to="/passwords" replace />;
  return <Unlock />;
}

function TwoFactorGuard() {
  const twoFactorRequired = useAuthStore((s) => s.twoFactorRequired);
  if (!twoFactorRequired) return <Navigate to="/login" replace />;
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

  useEffect(() => {
    const handleAuthExpired = () => {
      void logout().finally(() => {
        navigate("/login", { replace: true });
      });
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [logout, navigate]);

  useEffect(() => {
    if (!authenticated || !userKey || locked) {
      return;
    }

    const settings = getSessionSettings();

    if (settings.vaultTimeout === "on_close") {
      const appWindow = getCurrentWindow();
      const unlistenPromise = appWindow.onCloseRequested(async (event) => {
        if (closingRef.current) return;
        closingRef.current = true;
        event.preventDefault();
        if (settings.vaultTimeoutAction === "lock") {
          await lock();
        } else {
          await logout();
        }
        await appWindow.close();
      });

      return () => {
        void unlistenPromise.then((unlisten) => unlisten());
      };
    }

    const timeoutMs = getTimeoutMs(settings.vaultTimeout);

    if (timeoutMs === null) return;

    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const handleTimeout = () => {
      if (settings.vaultTimeoutAction === "lock") {
        void lock().finally(() => {
          navigate("/unlock", { replace: true });
        });
      } else {
        void logout().finally(() => {
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
