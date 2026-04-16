import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import Button from "@/components/common/Button";
import FormInput from "@/components/common/FormInput";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import HTTPClient from "@/lib/http-client";
import type { ApiError } from "@/lib/http-client";
import { normalizeServerUrl } from "@/lib/server-url";

const VAULT_SIGNUP_URL = "https://vault.passwall.io/sign-up";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const addNotification = useUiStore((s) => s.addNotification);

  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [masterPassword, setMasterPassword] = useState("");
  const [server, setServer] = useState(
    localStorage.getItem("server") || HTTPClient.getBaseURL()
  );
  const [showServer, setShowServer] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !masterPassword) {
      setError(t("Please fill all the necessary fields"));
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError(t("Please fill all the necessary fields"));
      return;
    }

    if (masterPassword.length < 8) {
      setError(t("Please fill all the necessary fields"));
      return;
    }

    const normalizedServer = normalizeServerUrl(server);
    if (normalizedServer === null) {
      setError("Please provide a valid server URL.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await login({
        email: trimmedEmail,
        master_password: masterPassword,
        server: normalizedServer,
      });

      if (result.two_factor_required) {
        navigate("/two-factor");
      } else {
        navigate("/passwords");
      }
    } catch (err) {
      const error = err as Error & { type?: string };
      const apiErr = error as unknown as ApiError;
      const status = apiErr.response?.status;
      const serverMessage = (apiErr.response?.data as Record<string, string>)?.message;
      let message: string;

      if (error.type === "REQUIRE_2FA_SETUP") {
        message = error.message;
      } else if (status === 401 || status === 400) {
        message = t("InvalidLoginCredentials");
      } else if (status === 403 && serverMessage) {
        message = serverMessage;
      } else if (
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("NetworkError") ||
        error.message?.includes("ERR_CONNECTION")
      ) {
        message = t("ServerConnectionError");
      } else {
        message = t("API500ErrorMessage");
      }

      setError(message);
      addNotification("error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    window.open(VAULT_SIGNUP_URL, "_blank");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormInput
        label={t("EMailAddress")}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@example.com"
        autoFocus
      />

      <FormInput
        label={t("MasterPassword")}
        type="password"
        value={masterPassword}
        onChange={(e) => setMasterPassword(e.target.value)}
        showToggle
      />

      {showServer && (
        <FormInput
          label={t("ServerURL")}
          type="url"
          value={server}
          onChange={(e) => setServer(e.target.value)}
        />
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        {t("Login")}
      </Button>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        size="lg"
        onClick={handleSignUp}
      >
        {t("SignUp")}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowServer(!showServer)}
          className="text-xs text-text-muted hover:text-text-secondary"
        >
          {showServer ? t("Hide") : t("Server")}
        </button>
      </div>
    </form>
  );
}
