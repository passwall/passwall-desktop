import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const pkgPath = join(rootDir, "package.json");
const tauriConfPath = join(rootDir, "src-tauri", "tauri.conf.json");
const cargoPath = join(rootDir, "src-tauri", "Cargo.toml");
const nativeHostCargoPath = join(
  rootDir,
  "native-messaging-host",
  "Cargo.toml"
);

/** Update only `[package]` → `version = "..."` (not dependency versions). */
function setCargoPackageVersion(cargoToml, newVersion) {
  const lines = cargoToml.split(/\r?\n/);
  let inPackage = false;
  const out = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "[package]") {
      inPackage = true;
      out.push(line);
      continue;
    }
    if (trimmed.startsWith("[") && trimmed !== "[package]") {
      inPackage = false;
    }
    if (inPackage && /^version\s*=\s*"/.test(line)) {
      out.push(`version = "${newVersion}"`);
      continue;
    }
    out.push(line);
  }
  return out.join("\n") + (cargoToml.endsWith("\n") ? "\n" : "");
}

console.log("Running typecheck...");
execSync("pnpm typecheck", { cwd: rootDir, stdio: "inherit" });

console.log("Running tests (JS + Rust)...");
execSync("pnpm run test:all", { cwd: rootDir, stdio: "inherit" });

console.log("Verifying native messaging manifest...");
execSync("pnpm verify:native-manifest", { cwd: rootDir, stdio: "inherit" });

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [major, minor] = pkg.version.split(".").map(Number);
const newVersion = `${major}.${minor + 1}.0`;

pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

const tauriConf = JSON.parse(readFileSync(tauriConfPath, "utf8"));
tauriConf.version = newVersion;
writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + "\n");

const cargoToml = readFileSync(cargoPath, "utf8");
writeFileSync(cargoPath, setCargoPackageVersion(cargoToml, newVersion));

const nativeHostToml = readFileSync(nativeHostCargoPath, "utf8");
writeFileSync(
  nativeHostCargoPath,
  setCargoPackageVersion(nativeHostToml, newVersion)
);

console.log(
  `Bumped version to ${newVersion} (package.json, tauri.conf.json, src-tauri/Cargo.toml, native-messaging-host/Cargo.toml)`
);

console.log("Staging changes...");
execSync("git add .", { cwd: rootDir, stdio: "inherit" });

console.log("Committing...");
execSync(`git commit -m "chore: release v${newVersion}"`, {
  cwd: rootDir,
  stdio: "inherit",
});

console.log("Pushing...");
execSync("git push", { cwd: rootDir, stdio: "inherit" });

console.log(`Pre-release done. Version ${newVersion} committed and pushed.`);
