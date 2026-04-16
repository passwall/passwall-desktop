import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/hooks/useTheme";
import { AUTH_EXPIRED_EVENT } from "@/lib/http-client";
import Login from "@/pages/Login";
import TwoFactor from "@/pages/TwoFactor";
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

let _keychainRestoreAttempted = false;
const IDLE_LOCK_TIMEOUT_MS = 15 * 60 * 1000;

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authenticated = useAuthStore((s) => s.authenticated);
  const userKey = useAuthStore((s) => s.userKey);
  const [restoring, setRestoring] = useState(!_keychainRestoreAttempted);

  useEffect(() => {
    if (_keychainRestoreAttempted) return;
    _keychainRestoreAttempted = true;

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      setRestoring(false);
      return;
    }

    useAuthStore
      .getState()
      .restoreSession()
      .finally(() => setRestoring(false));
  }, []);

  if (restoring) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-secondary">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasAccessToken = !!localStorage.getItem("access_token");
  if (!authenticated || !userKey || !hasAccessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const authenticated = useAuthStore((s) => s.authenticated);
  const userKey = useAuthStore((s) => s.userKey);
  const hasAccessToken = !!localStorage.getItem("access_token");

  if (authenticated && userKey && hasAccessToken) {
    return <Navigate to="/passwords" replace />;
  }
  return <>{children}</>;
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
  const logout = useAuthStore((s) => s.logout);

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
    if (!authenticated || !userKey || !localStorage.getItem("access_token")) {
      return;
    }

    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const lockSession = () => {
      void logout().finally(() => {
        navigate("/login", { replace: true });
      });
    };

    const resetIdleTimer = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      idleTimer = setTimeout(lockSession, IDLE_LOCK_TIMEOUT_MS);
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
  }, [authenticated, userKey, logout, navigate]);

  return (
    <>
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
          path="/two-factor"
          element={<TwoFactorGuard />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/passwords" replace />} />
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <UpdateNotifier />
    </>
  );
}
