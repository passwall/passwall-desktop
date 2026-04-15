import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import Button from "@/components/common/Button";
import FormInput from "@/components/common/FormInput";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import type { ApiError } from "@/lib/http-client";

export default function TwoFactorForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const verifyTwoFactor = useAuthStore((s) => s.verifyTwoFactor);
  const addNotification = useUiStore((s) => s.addNotification);

  const [code, setCode] = useState("");
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();

    if (!trimmed) {
      if (isRecovery) {
        setError(t("EnterRecoveryCode"));
      }
      return;
    }

    if (!isRecovery && trimmed.length !== 6) {
      setError(t("InvalidVerificationCode"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      await verifyTwoFactor(trimmed, isRecovery);
      navigate("/passwords");
    } catch (err) {
      const error = err as Error & { type?: string; response?: ApiError["response"] };
      let message: string;

      if (error.type === "REQUIRE_2FA_SETUP") {
        message = error.message;
      } else if ((error as ApiError).response?.status === 401) {
        message = t("InvalidVerificationCode");
      } else {
        message = t("InvalidVerificationCode");
      }

      setError(message);
      addNotification("error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    useAuthStore.setState({
      twoFactorRequired: false,
      twoFactorToken: null,
      _pendingMasterKey: null,
    });
    navigate("/login");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("TwoFactorAuth")}
        </h2>
        <p className="text-sm text-text-muted mt-1">
          {isRecovery
            ? t("TwoFactorRecoverySubtitle")
            : t("TwoFactorSubtitle")}
        </p>
      </div>

      <FormInput
        label={isRecovery ? t("RecoveryCode") : t("VerificationCode")}
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={isRecovery ? t("EnterRecoveryCode") : "000000"}
        autoFocus
        maxLength={isRecovery ? 32 : 6}
      />

      {error && (
        <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        {t("Verify")}
      </Button>

      <div className="text-center space-y-2">
        <button
          type="button"
          onClick={() => {
            setIsRecovery(!isRecovery);
            setCode("");
            setError("");
          }}
          className="text-sm text-primary hover:text-primary-hover"
        >
          {isRecovery ? t("UseAuthenticatorCode") : t("UseRecoveryCode")}
        </button>
        <br />
        <button
          type="button"
          onClick={handleBack}
          className="text-sm text-text-muted hover:text-text-secondary"
        >
          &larr; {t("BackToLogin")}
        </button>
      </div>
    </form>
  );
}
