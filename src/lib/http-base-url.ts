/**
 * Resolves the HTTP client base URL from user/settings input (testable without Tauri fetch).
 */
export function normalizeHttpClientBaseURL(
  input: string,
  opts: {
    /** True when running Vite in a normal browser (not Tauri webview). */
    isBrowserDevMode: boolean;
    /** Used when `input` is empty after trim (matches previous HTTPClient behavior). */
    defaultWhenEmpty: string;
  }
): string {
  const trimmed = (input || "").trim();
  if (!trimmed) {
    return opts.defaultWhenEmpty;
  }
  if (opts.isBrowserDevMode) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname === "api.passwall.io") {
        return "";
      }
    } catch {
      // fall through — keep trimmed value below
    }
  }
  return trimmed.replace(/\/+$/, "");
}
