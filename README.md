# Passwall Desktop

Cross-platform password manager desktop application built with Tauri 2, React 19, and TypeScript.

## Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 9+
- [Rust](https://www.rust-lang.org/tools/install) stable (1.77+)
- Platform-specific dependencies (see below)

### macOS

Xcode Command Line Tools:

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
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (pre-installed on Windows 11)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development (Tauri + Vite HMR)
pnpm tauri dev
```

The app will open as a native window. The frontend dev server runs at `http://localhost:1420` with hot module replacement.

## Scripts

| Command | Description |
|---|---|
| `pnpm tauri dev` | Start the app in development mode |
| `pnpm tauri build` | Build production binaries |
| `pnpm dev` | Start only the Vite frontend (no Tauri) |
| `pnpm build` | Build only the frontend (`tsc && vite build`) |
| `pnpm typecheck` | Run TypeScript type checking |

## Project Structure

```
passwall-desktop/
  src/                         # React frontend
    main.tsx                   # App entry point
    App.tsx                    # Router and route guards
    types/                     # TypeScript types and enums
    lib/
      crypto.ts                # Zero-knowledge encryption (PBKDF2, AES-CBC-HMAC)
      http-client.ts           # API client with token refresh
      schemas/                 # Item data normalizers
    api/                       # API service classes
    stores/                    # Zustand state management
      auth-store.ts            # Auth, login, keychain
      vault-store.ts           # Vault items CRUD
      ui-store.ts              # UI state, notifications
    components/
      layout/                  # AppShell, Sidebar, ItemList, ItemDetail
      common/                  # Button, FormInput, Notifications, etc.
      auth/                    # LoginForm, TwoFactorForm
      items/                   # Password/Note/Card/Bank/Address forms
    pages/                     # Route pages
    hooks/                     # Custom hooks
    i18n/                      # Translations (en, tr)
  src-tauri/                   # Rust backend
    src/
      lib.rs                   # Tauri commands and plugin registration
      keystore.rs              # OS keychain integration (keyring)
    tauri.conf.json            # Tauri app configuration
    capabilities/              # Permission capabilities
    Cargo.toml                 # Rust dependencies
  .github/workflows/
    build.yml                  # CI/CD: build, sign, upload to DO Spaces
```

## Building for Production

```bash
pnpm tauri build
```

Output binaries are in `src-tauri/target/release/bundle/`:

- **macOS**: `.dmg` and `.app`
- **Linux**: `.AppImage` and `.deb`
- **Windows**: `.exe` (NSIS) and `.msi`

## Auto-Update Setup

The app uses Tauri's updater plugin with minisign signatures. Updates are hosted on DigitalOcean Spaces.

### 1. Generate signing keys

```bash
pnpm tauri signer generate -w ~/.tauri/passwall.key
```

Copy the public key into `src-tauri/tauri.conf.json` under `plugins.updater.pubkey`.

### 2. Configure the updater endpoint

Set the CDN URL in `src-tauri/tauri.conf.json`:

```json
"plugins": {
  "updater": {
    "pubkey": "<your-minisign-public-key>",
    "endpoints": [
      "https://your-cdn.digitaloceanspaces.com/desktop/latest.json"
    ]
  }
}
```

### 3. CI/CD

The GitHub Actions workflow (`.github/workflows/build.yml`) runs on tag push (`v*`):

1. Builds for macOS (arm64 + x64), Linux (x64), Windows (x64)
2. Signs updater bundles with minisign
3. Uploads all artifacts to DigitalOcean Spaces
4. Generates `latest.json` with per-platform download URLs and signatures
5. Creates a GitHub Release as secondary distribution

Required GitHub secrets: `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, `DO_SPACES_ACCESS_KEY`, `DO_SPACES_SECRET_KEY`, `DO_SPACES_BUCKET`, `DO_SPACES_REGION`, `DO_SPACES_ENDPOINT`, `DO_SPACES_CDN_URL`.

See [SETUP.md](SETUP.md) for the full setup guide.

## Release Flow

```bash
# 1. Update version in both files
#    - package.json: "version"
#    - src-tauri/tauri.conf.json: "version"

# 2. Commit and tag
git add -A
git commit -m "release: v0.2.0"
git tag v0.2.0
git push && git push --tags
```

## Tech Stack

- **Runtime**: [Tauri 2](https://v2.tauri.app/) (Rust backend, WebView frontend)
- **Frontend**: React 19, TypeScript, Vite 7
- **Styling**: Tailwind CSS 4
- **State**: Zustand
- **Routing**: React Router 7 (hash-based)
- **i18n**: i18next (English, Turkish)
- **Icons**: Lucide React
- **Crypto**: Web Crypto API (PBKDF2, HKDF, AES-CBC + HMAC-SHA-256)
- **Keychain**: Rust `keyring` crate (macOS Keychain, Windows Credential Manager, Linux Secret Service)
