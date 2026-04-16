import fs from "node:fs";
import path from "node:path";

const expectedOrigin = "chrome-extension://blaiihhmnjllkfnkmkidahhegbmlghmo/";
const manifestPath = path.resolve("native-messaging/com.passwall.desktop.json");

const raw = fs.readFileSync(manifestPath, "utf8");
const manifest = JSON.parse(raw);
const origins = Array.isArray(manifest.allowed_origins) ? manifest.allowed_origins : [];

if (origins.length !== 1 || origins[0] !== expectedOrigin) {
  console.error("Invalid native messaging allowed_origins.");
  console.error(`Expected exactly: [\"${expectedOrigin}\"]`);
  console.error("Actual:", JSON.stringify(origins));
  process.exit(1);
}

if (origins.includes("__CHROME_EXTENSION_ORIGIN__")) {
  console.error("Placeholder __CHROME_EXTENSION_ORIGIN__ must not be present.");
  process.exit(1);
}

console.log("Native messaging manifest origin is pinned correctly.");
