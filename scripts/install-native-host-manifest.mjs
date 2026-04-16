import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const OFFICIAL_ORIGIN = "chrome-extension://blaiihhmnjllkfnkmkidahhegbmlghmo/";
const ORIGIN_RE = /^chrome-extension:\/\/[a-p]{32}\/$/;

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [k, v = "true"] = arg.slice(2).split("=");
    out[k] = v;
  }
  return out;
}

function chromeManifestPath() {
  const home = os.homedir();
  switch (process.platform) {
    case "darwin":
      return path.join(
        home,
        "Library/Application Support/Google/Chrome/NativeMessagingHosts/com.passwall.desktop.json",
      );
    case "linux":
      return path.join(
        home,
        ".config/google-chrome/NativeMessagingHosts/com.passwall.desktop.json",
      );
    case "win32": {
      const appData = process.env.APPDATA;
      if (!appData) throw new Error("APPDATA is not set on Windows.");
      return path.join(
        appData,
        "Google/Chrome/NativeMessagingHosts/com.passwall.desktop.json",
      );
    }
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

function toAbsoluteHostPath(hostPath) {
  if (path.isAbsolute(hostPath)) return hostPath;
  return path.resolve(process.cwd(), hostPath);
}

const args = parseArgs(process.argv.slice(2));
const mode = args.mode || "prod";

if (!["prod", "dev"].includes(mode)) {
  console.error("Invalid mode. Use --mode=prod or --mode=dev");
  process.exit(1);
}

const repoRoot = process.cwd();
const templateFile =
  mode === "prod"
    ? "native-messaging/com.passwall.desktop.json"
    : "native-messaging/com.passwall.desktop.dev.json";
const templatePath = path.join(repoRoot, templateFile);

if (!fs.existsSync(templatePath)) {
  console.error(`Template not found: ${templatePath}`);
  process.exit(1);
}

const hostPath = toAbsoluteHostPath(
  args["host-path"] || "native-messaging-host/target/debug/passwall-native-messaging-host",
);
if (!fs.existsSync(hostPath)) {
  console.error(`Native host binary not found: ${hostPath}`);
  process.exit(1);
}

const origin =
  mode === "prod"
    ? OFFICIAL_ORIGIN
    : args.origin || process.env.PASSWALL_DEV_EXTENSION_ORIGIN || "";

if (!ORIGIN_RE.test(origin)) {
  console.error(
    "Invalid Chrome extension origin. Expected format: chrome-extension://<32-char-id>/",
  );
  if (mode === "dev") {
    console.error(
      "Pass dev origin with --origin=chrome-extension://<id>/ or PASSWALL_DEV_EXTENSION_ORIGIN.",
    );
  }
  process.exit(1);
}

if (mode === "prod" && origin !== OFFICIAL_ORIGIN) {
  console.error("Prod mode must use official Passwall Chrome extension origin.");
  process.exit(1);
}

const template = fs.readFileSync(templatePath, "utf8");
const rendered = template
  .replaceAll("__NATIVE_MESSAGING_HOST_PATH__", hostPath)
  .replaceAll("__CHROME_EXTENSION_ORIGIN__", origin);

const outputPath = chromeManifestPath();
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${rendered}\n`, "utf8");

console.log(`Installed manifest (${mode}) -> ${outputPath}`);
console.log(`Host path: ${hostPath}`);
console.log(`Allowed origin: ${origin}`);
