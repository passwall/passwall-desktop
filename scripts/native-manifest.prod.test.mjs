/**
 * Regression: production Chrome native manifest must stay pinned to the Web Store extension ID.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const expectedOrigin =
  "chrome-extension://blaiihhmnjllkfnkmkidahhegbmlghmo/";
const manifestPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../native-messaging/com.passwall.desktop.json"
);

describe("native-messaging/com.passwall.desktop.json (prod)", () => {
  it("has exactly one allowed origin matching the official extension", () => {
    const raw = fs.readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(raw);
    expect(Array.isArray(manifest.allowed_origins)).toBe(true);
    expect(manifest.allowed_origins).toEqual([expectedOrigin]);
    expect(manifest.allowed_origins).not.toContain("__CHROME_EXTENSION_ORIGIN__");
  });

  it("uses placeholder for host path (filled at install time)", () => {
    const raw = fs.readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(raw);
    expect(manifest.path).toBe("__NATIVE_MESSAGING_HOST_PATH__");
    expect(manifest.name).toBe("com.passwall.desktop");
    expect(manifest.type).toBe("stdio");
  });
});
