/** True when running Vite dev in a normal browser (not Tauri webview). */
export function detectBrowserDevMode(): boolean {
  return (
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    !("__TAURI_INTERNALS__" in window) &&
    !("__TAURI__" in window)
  );
}

/**
 * Normalize server URL for login. Empty string is allowed (Vite proxy in browser dev).
 * @param isBrowserDevMode — override for tests; defaults to `detectBrowserDevMode()`.
 */
export function normalizeServerUrl(
  server: string,
  isBrowserDevMode: boolean = detectBrowserDevMode()
): string | null {
  const trimmed = server.trim();
  if (!trimmed) return "";

  try {
    const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(withProtocol);

    const host = url.hostname;
    const isLocalhost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host === "[::1]";
    const allowHttpLocalhost = url.protocol === "http:" && isLocalhost;

    if (!isBrowserDevMode && url.protocol !== "https:" && !allowHttpLocalhost) {
      return null;
    }
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}
