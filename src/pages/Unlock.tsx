import { useEffect, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import Button from "@/components/common/Button";
import FormInput from "@/components/common/FormInput";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import AuthLayout from "@/components/auth/AuthLayout";
import { logger } from "@/lib/logger";
import {
  isBiometricUnlockAvailable,
  isBiometricUnlockEnabled,
} from "@/lib/biometric-unlock";

export default function Unlock() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const unlock = useAuthStore((s) => s.unlock);
  const unlockWithBiometrics = useAuthStore((s) => s.unlockWithBiometrics);
  const logout = useAuthStore((s) => s.logout);
  const addNotification = useUiStore((s) => s.addNotification);

  const email = localStorage.getItem("email") || "";
  const [masterPassword, setMasterPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showBiometricUnlock, setShowBiometricUnlock] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadBiometricState = async () => {
      const available = await isBiometricUnlockAvailable();
      if (mounted) {
        setShowBiometricUnlock(available && isBiometricUnlockEnabled());
      }
    };
    void loadBiometricState();
    return () => {
      mounted = false;
    };
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword) {
      setError(t("Please fill all the necessary fields"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      await unlock(masterPassword);
      navigate("/passwords", { replace: true });
    } catch {
      const message = t("InvalidLoginCredentials");
      setError(message);
      addNotification("error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (event: MouseEvent<HTMLButtonElement>) => {
    const state = useAuthStore.getState();
    const eventFields = {
      event_type: event.type,
      is_trusted: event.nativeEvent.isTrusted,
      detail: event.detail,
      button: event.button,
      route: window.location.hash || window.location.pathname,
      active_element_tag: document.activeElement?.tagName.toLowerCase() ?? null,
    };
    void logger.info("ui.unlock_logout_clicked", "Unlock screen logout button activated", {
      ...eventFields,
      authenticated: state.authenticated,
      locked: state.locked,
      has_user_key: Boolean(state.userKey),
    });
    await logout("unlock_screen", eventFields);
    navigate("/login", { replace: true });
  };

  const handleBiometricUnlock = async () => {
    setBiometricLoading(true);
    setError("");

    try {
      await unlockWithBiometrics();
      navigate("/passwords", { replace: true });
    } catch {
      const message = t("BiometricUnlockFailed");
      setError(message);
      addNotification("warning", message);
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleUnlock} className="space-y-5">
        <div className="text-center mb-2">
          <p className="text-sm text-text-muted">{email}</p>
        </div>

        {showBiometricUnlock && (
          <div className="space-y-2">
            <Button
              type="button"
              variant="secondary"
              loading={biometricLoading}
              disabled={loading}
              className="w-full"
              size="lg"
              onClick={() => void handleBiometricUnlock()}
            >
              {t("UnlockWithTouchID")}
            </Button>
            <p className="text-xs text-text-muted text-center">
              {t("MasterPasswordFallbackAvailable")}
            </p>
          </div>
        )}

        <FormInput
          label={t("MasterPassword")}
          type="password"
          value={masterPassword}
          onChange={(e) => setMasterPassword(e.target.value)}
          showToggle
          autoFocus={!showBiometricUnlock}
        />

        {error && (
          <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          loading={loading}
          disabled={biometricLoading}
          className="w-full"
          size="lg"
        >
          {t("Unlock")}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={(event) => void handleLogout(event)}
            className="text-xs text-text-muted hover:text-text-secondary"
          >
            {t("SignOutDifferentAccount")}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
