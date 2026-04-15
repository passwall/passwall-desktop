# Passwall Desktop

Cross-platform password manager desktop application built with Tauri 2, React 19, and TypeScript.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Tauri 2 (Rust + WebView) |
| Frontend | React 19, TypeScript, Vite 7 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 |
| Routing | React Router 7 (hash-based) |
| i18n | i18next (English, Turkish) |
| Icons | Lucide React |
| Crypto | Web Crypto API — PBKDF2, HKDF, AES-CBC + HMAC-SHA-256 |
| Keychain | Rust `keyring` crate — macOS Keychain, Windows Credential Manager, Linux Secret Service |

---

## Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 9+
- [Rust](https://www.rust-lang.org/tools/install) stable

### macOS

```bash
xcode-select --install
```

### Linux (Debian/Ubuntu)

```bash
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf \
  libgtk-3-dev \
  libsoup-3.0-dev \
  libjavascriptcoregtk-4.1-dev
```

### Windows

- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) — pre-installed on Windows 11

---

## Development

### Install dependencies

```bash
pnpm install
```

### Run in development mode

```bash
pnpm tauri dev
```

Opens a native Tauri window. The frontend dev server runs at `http://localhost:1420` with Hot Module Replacement. Changes to the Rust backend trigger an automatic recompile.

To run only the frontend in isolation (no Tauri, in a browser):

```bash
pnpm dev
```

> Tauri APIs are not available in this mode.

### Type checking

```bash
pnpm typecheck
```

---

## Build

### Production binary

```bash
pnpm tauri build
```

Output is placed under `src-tauri/target/release/bundle/`:

| Platform | Format | Location |
|---|---|---|
| macOS | `.dmg`, `.app` | `bundle/dmg/`, `bundle/macos/` |
| Linux | `.AppImage`, `.deb` | `bundle/appimage/`, `bundle/deb/` |
| Windows | `.exe` (NSIS), `.msi` | `bundle/nsis/`, `bundle/msi/` |

### Build for a specific target

```bash
# macOS Apple Silicon
pnpm tauri build --target aarch64-apple-darwin

# macOS Intel
pnpm tauri build --target x86_64-apple-darwin

# Linux x64
pnpm tauri build --target x86_64-unknown-linux-gnu

# Windows x64
pnpm tauri build --target x86_64-pc-windows-msvc
```

For cross-compilation, the target Rust toolchain must be installed first:

```bash
rustup target add aarch64-apple-darwin
```

---

## Project Structure

```
passwall-desktop/
├── src/                          # React frontend
│   ├── main.tsx                  # App entry point
│   ├── App.tsx                   # Router and route guards
│   ├── types/                    # TypeScript types and enums
│   ├── lib/
│   │   ├── crypto.ts             # Zero-knowledge encryption (PBKDF2, AES-CBC-HMAC)
│   │   ├── http-client.ts        # API client with token refresh
│   │   └── schemas/              # Item data normalizers
│   ├── api/                      # API service classes
│   ├── stores/                   # Zustand state management
│   │   ├── auth-store.ts         # Auth, login, keychain
│   │   ├── vault-store.ts        # Vault item CRUD
│   │   └── ui-store.ts           # UI state, notifications
│   ├── components/
│   │   ├── layout/               # AppShell, Sidebar, ItemList, ItemDetail
│   │   ├── common/               # Button, FormInput, Notifications, etc.
│   │   ├── auth/                 # LoginForm, TwoFactorForm
│   │   └── items/                # Password/Note/Card/Bank/Address forms
│   ├── pages/                    # Route pages
│   ├── hooks/                    # Custom hooks
│   └── i18n/                     # Translations (en, tr)
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── lib.rs                # Tauri commands and plugin registration
│   │   └── keystore.rs           # OS keychain integration
│   ├── capabilities/             # Permission definitions
│   ├── tauri.conf.json           # Tauri app configuration
│   └── Cargo.toml                # Rust dependencies
└── .github/workflows/
    └── build.yml                 # CI/CD: build, sign, upload to DO Spaces
```

---

## Environment Variables

No `.env` file is needed during development — all configuration lives in `src-tauri/tauri.conf.json`.

The following environment variables are used for production builds:

| Variable | Description |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | Minisign private key for updater signing |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Private key password |
| `APPLE_CERTIFICATE` | Base64-encoded `.p12` certificate |
| `APPLE_CERTIFICATE_PASSWORD` | Certificate password |
| `APPLE_ID` | Apple ID for notarization |
| `APPLE_PASSWORD` | App-specific password for notarization |
| `APPLE_TEAM_ID` | Apple Developer Team ID |

---

## Release

### Cutting a new release

```bash
# 1. Update the version in both files
#    - package.json → "version"
#    - src-tauri/tauri.conf.json → "version"

# 2. Commit and tag
git add package.json src-tauri/tauri.conf.json
git commit -m "release: v0.2.0"
git tag v0.2.0
git push && git push --tags
```

Pushing the tag triggers the GitHub Actions workflow, which:

1. Builds binaries for macOS (arm64 + x64), Linux (x64), and Windows (x64)
2. Signs and notarizes macOS binaries with the Apple certificate
3. Signs updater bundles with minisign
4. Uploads all artifacts to DigitalOcean Spaces
5. Generates `latest.json` with per-platform download URLs and signatures
6. Creates a GitHub Release

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | Updater private key |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Updater private key password |
| `APPLE_ID` | Apple ID |
| `APPLE_APP_SPECIFIC_PASSWORD` | Apple app-specific password |
| `APPLE_TEAM_ID` | Apple Team ID |
| `CSC_LINK` | Base64-encoded `.p12` certificate |
| `CSC_KEY_PASSWORD` | Certificate password |
| `DO_SPACES_KEY` | DigitalOcean Spaces access key |
| `DO_SPACES_SECRET` | DigitalOcean Spaces secret key |
| `DO_SPACES_BUCKET` | Spaces bucket name |
| `DO_SPACES_REGION` | Spaces region (e.g. `nyc3`) |
| `DO_SPACES_ENDPOINT` | Spaces endpoint (e.g. `nyc3.digitaloceanspaces.com`) |

See [SETUP.md](SETUP.md) for the full setup guide.

---

## Generating the Updater Signing Key

```bash
pnpm tauri signer generate -w ~/.tauri/passwall.key
```

Copy the printed public key into `plugins.updater.pubkey` in `src-tauri/tauri.conf.json`.
