import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

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

function emitAuthExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    Accept: "application/json, text/plain, */*",
  };
  const token = localStorage.getItem("access_token") || "";
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
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

  if (opts.params && Object.keys(opts.params).length) {
    const qs = new URLSearchParams(opts.params).toString();
    url += `?${qs}`;
  }

  const headers = { ...getAuthHeaders(), ...opts.headers };

  const fetchOpts: RequestInit = { method, headers };
  if (opts.data !== undefined && opts.data !== null) {
    fetchOpts.body =
      typeof opts.data === "string" ? opts.data : JSON.stringify(opts.data);
  }

  let res: globalThis.Response;
  try {
    res = await httpFetch(url, fetchOpts);
  } catch (fetchErr: unknown) {
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

  if (response.status < 200 || response.status >= 300) {
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

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      emitAuthExpired();
      isRefreshing = false;
      throw error;
    }

    try {
      const refreshResponse = await request<{
        access_token: string;
        refresh_token?: string;
      }>("POST", "/auth/refresh", {
        data: { refresh_token: refreshToken },
      });

      const newAccessToken = refreshResponse.data.access_token;
      const newRefreshToken =
        refreshResponse.data.refresh_token || refreshToken;

      localStorage.setItem("access_token", newAccessToken);
      localStorage.setItem("refresh_token", newRefreshToken);

      processQueue(null, newAccessToken);

      opts.headers = {
        ...opts.headers,
        Authorization: `Bearer ${newAccessToken}`,
      };
      opts._retry = true;
      return await request<T>(method, path, opts);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      emitAuthExpired();
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
    const trimmed = (url || "").trim();
    if (!trimmed) {
      baseURL = DEFAULT_BASE_URL;
      return;
    }

    if (isBrowserDevMode) {
      try {
        const parsed = new URL(trimmed);
        if (parsed.hostname === "api.passwall.io") {
          baseURL = "";
          return;
        }
      } catch {
        // fall through and keep provided value
      }
    }

    baseURL = trimmed.replace(/\/+$/, "");
  }

  static getBaseURL(): string {
    return baseURL;
  }
}
