import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { normalizeHttpClientBaseURL } from "@/lib/http-base-url";
import {
  getSecureSync,
  removeSecure,
  setSecure,
} from "@/lib/secure-storage";
import { createFlowId, logger } from "@/lib/logger";

function isTauriRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

const isBrowserDevMode = import.meta.env.DEV && !isTauriRuntime();

// In Tauri runtime always prefer Rust-backed fetch (no CORS/origin issues).
// In pure browser dev mode keep native fetch so Vite proxy can handle /auth,/api.
const httpFetch: typeof fetch = (input, init) =>
  isTauriRuntime()
    ? (tauriFetch(input as string, init) as unknown as Promise<Response>)
    : fetch(input, init);

const DEFAULT_BASE_URL = import.meta.env.DEV
  ? "" // dev: use Vite proxy to avoid CORS
  : "https://api.passwall.io";

let baseURL = DEFAULT_BASE_URL;
export const AUTH_EXPIRED_EVENT = "passwall:auth-expired";

type AuthExpiredReason = "refresh_missing_token" | "refresh_failed";

function emitAuthExpired(detail: {
  reason: AuthExpiredReason;
  method: string;
  path: string;
  triggering_status?: number;
  refresh_status?: number;
}) {
  if (typeof window === "undefined") return;
  void logger.warn("auth.expired_event_emitted", "Auth expired event emitted", {
    ...detail,
    has_access_token: Boolean(getSecureSync("access_token")),
    has_refresh_token: Boolean(getSecureSync("refresh_token")),
  });
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail }));
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    Accept: "application/json, text/plain, */*",
  };
  const token = getSecureSync("access_token") || "";
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function getSafeBaseOrigin(url: string): string {
  if (!url) return "vite-proxy";
  try {
    return new URL(url).origin;
  } catch {
    return "invalid";
  }
}

function getErrorCategory(error: unknown): string {
  if (error instanceof Error && error.name) return error.name;
  return typeof error;
}

function shouldLogRequestLifecycle(pathBase: string): boolean {
  return (
    pathBase === "/auth/prelogin" ||
    pathBase === "/auth/signin" ||
    pathBase === "/auth/refresh" ||
    pathBase === "/api/signout" ||
    pathBase === "/api/organizations"
  );
}

interface RequestOptions {
  data?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  _retry?: boolean;
}

interface ApiResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

async function request<T = unknown>(
  method: string,
  path: string,
  opts: RequestOptions = {}
): Promise<ApiResponse<T>> {
  let url = `${baseURL}${path}`;
  const pathBase = path.split("?")[0];
  const startedAt = performance.now();
  const requestId = createFlowId("req");

  if (opts.params && Object.keys(opts.params).length) {
    const qs = new URLSearchParams(opts.params).toString();
    url += `?${qs}`;
  }

  const headers = { ...getAuthHeaders(), ...opts.headers };
  if (shouldLogRequestLifecycle(pathBase)) {
    void logger.info(
      "http.request_start",
      "HTTP request started",
      {
        method,
        path: pathBase,
        base_origin: getSafeBaseOrigin(baseURL),
        fetch_impl: isTauriRuntime() ? "tauri" : "browser",
        has_auth_header: Boolean(headers.Authorization),
      },
      { request_id: requestId }
    );
  }

  const fetchOpts: RequestInit = { method, headers };
  if (opts.data !== undefined && opts.data !== null) {
    fetchOpts.body =
      typeof opts.data === "string" ? opts.data : JSON.stringify(opts.data);
  }

  let res: globalThis.Response;
  try {
    res = await httpFetch(url, fetchOpts);
  } catch (fetchErr: unknown) {
    void logger.error(
      "http.request_failed",
      "HTTP request failed before a response was received",
      {
        method,
        path: pathBase,
        base_origin: getSafeBaseOrigin(baseURL),
        duration_ms: Math.round(performance.now() - startedAt),
        fetch_impl: isTauriRuntime() ? "tauri" : "browser",
        has_auth_header: Boolean(headers.Authorization),
        error_category: getErrorCategory(fetchErr),
        error: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
      },
      { request_id: requestId }
    );
    throw fetchErr;
  }
  let parsed: T;
  try {
    parsed = await res.json();
  } catch {
    parsed = null as T;
  }

  const response: ApiResponse<T> = {
    status: res.status,
    data: parsed,
    headers: Object.fromEntries(res.headers.entries()),
  };

  if (shouldLogRequestLifecycle(pathBase) && response.status >= 200 && response.status < 300) {
    void logger.info(
      "http.response_success",
      "HTTP request completed successfully",
      {
        method,
        path: pathBase,
        base_origin: getSafeBaseOrigin(baseURL),
        status: response.status,
        duration_ms: Math.round(performance.now() - startedAt),
        fetch_impl: isTauriRuntime() ? "tauri" : "browser",
        has_auth_header: Boolean(headers.Authorization),
        retry: Boolean(opts._retry),
      },
      { request_id: requestId }
    );
  }

  if (response.status < 200 || response.status >= 300) {
    void logger.warn(
      "http.response_non_2xx",
      "HTTP request returned a non-success status",
      {
        method,
        path: pathBase,
        base_origin: getSafeBaseOrigin(baseURL),
        status: response.status,
        duration_ms: Math.round(performance.now() - startedAt),
        fetch_impl: isTauriRuntime() ? "tauri" : "browser",
      },
      { request_id: requestId }
    );
    const err = new Error(`Request failed with status ${response.status}`);
    (err as ApiError).response = response;
    throw err;
  }

  return response;
}

export interface ApiError extends Error {
  response?: ApiResponse;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

async function requestWithRefresh<T = unknown>(
  method: string,
  path: string,
  opts: RequestOptions = {}
): Promise<ApiResponse<T>> {
  try {
    return await request<T>(method, path, opts);
  } catch (error) {
    const apiErr = error as ApiError;
    if (
      apiErr.response?.status !== 401 ||
      opts._retry ||
      path.includes("/auth/refresh")
    ) {
      throw error;
    }

    if (isRefreshing) {
      return new Promise<ApiResponse<T>>((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            opts.headers = {
              ...opts.headers,
              Authorization: `Bearer ${token}`,
            };
            opts._retry = true;
            request<T>(method, path, opts).then(resolve).catch(reject);
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    const refreshToken = getSecureSync("refresh_token");
    if (!refreshToken) {
      void logger.warn("auth.refresh_missing_token", "Refresh token is missing", {
        method,
        path: path.split("?")[0],
        status: apiErr.response?.status,
      });
      emitAuthExpired({
        reason: "refresh_missing_token",
        method,
        path: path.split("?")[0],
        triggering_status: apiErr.response?.status,
      });
      isRefreshing = false;
      throw error;
    }

    try {
      const refreshFlowId = createFlowId("refresh");
      void logger.info("auth.refresh_start", "Refreshing access token", {
        triggering_method: method,
        triggering_path: path.split("?")[0],
      }, { flow_id: refreshFlowId });

      const refreshResponse = await request<{
        access_token: string;
        refresh_token?: string;
      }>("POST", "/auth/refresh", {
        data: { refresh_token: refreshToken },
      });

      const newAccessToken = refreshResponse.data.access_token;
      const newRefreshToken =
        refreshResponse.data.refresh_token || refreshToken;

      await setSecure("access_token", newAccessToken);
      await setSecure("refresh_token", newRefreshToken);
      void logger.info("auth.refresh_success", "Access token refreshed", {
        has_new_refresh_token: Boolean(refreshResponse.data.refresh_token),
      }, { flow_id: refreshFlowId });

      processQueue(null, newAccessToken);

      opts.headers = {
        ...opts.headers,
        Authorization: `Bearer ${newAccessToken}`,
      };
      opts._retry = true;
      return await request<T>(method, path, opts);
    } catch (refreshError) {
      processQueue(refreshError, null);
      const refreshApiError = refreshError as ApiError;
      await removeSecure("access_token");
      await removeSecure("refresh_token");
      void logger.error("auth.refresh_failed", "Token refresh failed", {
        triggering_method: method,
        triggering_path: path.split("?")[0],
        triggering_status: apiErr.response?.status,
        refresh_status: refreshApiError.response?.status,
        error_category: getErrorCategory(refreshError),
        error: refreshError instanceof Error ? refreshError.message : String(refreshError),
      });
      emitAuthExpired({
        reason: "refresh_failed",
        method,
        path: path.split("?")[0],
        triggering_status: apiErr.response?.status,
        refresh_status: refreshApiError.response?.status,
      });
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }
}

export default class HTTPClient {
  static async get<T = unknown>(
    path: string,
    params?: Record<string, string>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return requestWithRefresh<T>("GET", path, { params, headers });
  }

  static async post<T = unknown>(
    path: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return requestWithRefresh<T>("POST", path, { data, headers });
  }

  static async put<T = unknown>(
    path: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return requestWithRefresh<T>("PUT", path, { data, headers });
  }

  static async delete<T = unknown>(
    path: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return requestWithRefresh<T>("DELETE", path, { data, headers });
  }

  static setBaseURL(url: string) {
    const normalized = normalizeHttpClientBaseURL(url, {
      isBrowserDevMode,
      defaultWhenEmpty: DEFAULT_BASE_URL,
    });
    void logger.info("http.base_url_set", "HTTP base URL updated", {
      input_empty: url.trim().length === 0,
      base_origin: getSafeBaseOrigin(normalized),
      browser_dev_mode: isBrowserDevMode,
      tauri_runtime: isTauriRuntime(),
    });
    baseURL = normalized;
  }

  static getBaseURL(): string {
    return baseURL;
  }
}
