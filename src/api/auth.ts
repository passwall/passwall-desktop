import HTTPClient from "@/lib/http-client";
import type { KdfConfig, SignInResponse } from "@/types";

export default class AuthService {
  static async preLogin(email: string) {
    return HTTPClient.get<KdfConfig>(
      `/auth/prelogin?email=${encodeURIComponent(email)}`
    );
  }

  static async signIn(payload: {
    email: string;
    master_password_hash: string;
    app: string;
  }) {
    return HTTPClient.post<SignInResponse>("/auth/signin", payload);
  }

  static async verify2FA(data: {
    two_factor_token: string;
    totp_code?: string;
    recovery_code?: string;
  }) {
    return HTTPClient.post<SignInResponse>("/auth/2fa/verify", data);
  }

  static async logout() {
    return HTTPClient.post("/api/signout");
  }

  static async refresh(refreshToken: string) {
    return HTTPClient.post<{ access_token: string; refresh_token: string }>(
      "/auth/refresh",
      { refresh_token: refreshToken }
    );
  }
}
