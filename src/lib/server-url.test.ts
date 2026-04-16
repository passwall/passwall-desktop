import { describe, it, expect } from "vitest";
import { normalizeServerUrl } from "./server-url";

describe("normalizeServerUrl", () => {
  it("allows empty string (proxy / default)", () => {
    expect(normalizeServerUrl("", false)).toBe("");
    expect(normalizeServerUrl("   ", true)).toBe("");
  });

  it("in Tauri-like prod: requires https for non-localhost", () => {
    expect(normalizeServerUrl("api.passwall.io", false)).toBe("https://api.passwall.io");
    expect(normalizeServerUrl("http://evil.com", false)).toBeNull();
  });

  it("allows http only for localhost / loopback", () => {
    expect(normalizeServerUrl("http://localhost:3625", false)).toBe(
      "http://localhost:3625"
    );
    expect(normalizeServerUrl("http://127.0.0.1:8080", false)).toBe(
      "http://127.0.0.1:8080"
    );
    expect(normalizeServerUrl("http://[::1]:3000", false)).toBe("http://[::1]:3000");
  });

  it("in browser dev mode: allows http for any host (Vite dev)", () => {
    expect(normalizeServerUrl("http://example.com", true)).toBe("http://example.com");
  });

  it("strips path, query, hash", () => {
    expect(normalizeServerUrl("https://api.passwall.io/foo?x=1#h", false)).toBe(
      "https://api.passwall.io"
    );
  });

  it("returns null for invalid input", () => {
    expect(normalizeServerUrl("not a url%%%", false)).toBeNull();
  });
});
