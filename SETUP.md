# Passwall Desktop v2 — Release & Update Setup

## 1. Generate Signing Keys

Tauri updater uses minisign for signature verification.

```bash
pnpm tauri signer generate -w ~/.tauri/passwall.key
```

This creates two files:
- `~/.tauri/passwall.key` — **private key** (keep secret)
- Prints the **public key** to stdout — copy it

Put the **public key** into `src-tauri/tauri.conf.json`:

```json
"plugins": {
  "updater": {
    "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbml...",
```

## 2. DigitalOcean Spaces Setup

Create a DO Space (e.g., `passwall-releases`) and enable CDN.

Your Space will have:
- **Endpoint**: `nyc3.digitaloceanspaces.com` (varies by region)
- **CDN URL**: `https://passwall-releases.nyc3.cdn.digitaloceanspaces.com`
- **Bucket name**: `passwall-releases`

### File structure on Spaces

```
passwall-releases/
  desktop/
    latest.json              ← updater checks this
    0.1.0/
      Passwall_0.1.0_aarch64.app.tar.gz
      Passwall_0.1.0_aarch64.app.tar.gz.sig
      Passwall_0.1.0_x64.app.tar.gz
      Passwall_0.1.0_x64.app.tar.gz.sig
      Passwall_0.1.0_amd64.AppImage.tar.gz
      Passwall_0.1.0_amd64.AppImage.tar.gz.sig
      Passwall_0.1.0_x64-setup.nsis.zip
      Passwall_0.1.0_x64-setup.nsis.zip.sig
      ...installers (.dmg, .deb, .exe, .msi)
    0.2.0/
      ...
```

## 3. Update `tauri.conf.json`

Replace the endpoint with your CDN URL:

```json
"plugins": {
  "updater": {
    "pubkey": "YOUR_ACTUAL_PUBKEY",
    "endpoints": [
      "https://passwall-releases.nyc3.cdn.digitaloceanspaces.com/desktop/latest.json"
    ]
  }
}
```

Also update CSP if your CDN domain is different from `*.digitaloceanspaces.com`:

```json
"connect-src": "... https://your-cdn-domain.com ..."
```

## 4. GitHub Repository Secrets

Set these in **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `TAURI_SIGNING_PRIVATE_KEY` | Content of `~/.tauri/passwall.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password you set during key generation |
| `DO_SPACES_ACCESS_KEY` | DO Spaces access key |
| `DO_SPACES_SECRET_KEY` | DO Spaces secret key |
| `DO_SPACES_BUCKET` | `passwall-releases` |
| `DO_SPACES_REGION` | `nyc3` |
| `DO_SPACES_ENDPOINT` | `nyc3.digitaloceanspaces.com` |
| `DO_SPACES_CDN_URL` | `https://passwall-releases.nyc3.cdn.digitaloceanspaces.com` |

## 5. Release Flow

1. Update `version` in both `src-tauri/tauri.conf.json` and `package.json`
2. Commit and tag: `git tag v0.1.0 && git push --tags`
3. GitHub Actions:
   - Builds for macOS (arm64 + x64), Linux (x64), Windows (x64)
   - Signs updater bundles with minisign
   - Uploads all artifacts to DO Spaces under `desktop/{version}/`
   - Generates `latest.json` with per-platform URLs and signatures
   - Uploads `latest.json` to `desktop/latest.json` (no-cache header)
   - Creates a GitHub Release with all artifacts attached

## 6. How Updates Work

```
App starts
  → UpdateNotifier checks after 3s (if auto-update not disabled)
  → Fetches latest.json from DO Spaces CDN
  → Compares version with current app version
  → If newer: shows "Update available" notification
  → User clicks Update
  → Downloads platform-specific bundle from CDN
  → Verifies minisign signature against pubkey in tauri.conf.json
  → Installs and relaunches
```

## 7. `latest.json` Format

Generated automatically by CI. Example:

```json
{
  "version": "0.2.0",
  "notes": "Passwall Desktop 0.2.0",
  "pub_date": "2026-04-04T12:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "url": "https://cdn.example.com/desktop/0.2.0/Passwall_0.2.0_aarch64.app.tar.gz",
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6..."
    },
    "darwin-x86_64": {
      "url": "https://cdn.example.com/desktop/0.2.0/Passwall_0.2.0_x64.app.tar.gz",
      "signature": "..."
    },
    "linux-x86_64": {
      "url": "https://cdn.example.com/desktop/0.2.0/Passwall_0.2.0_amd64.AppImage.tar.gz",
      "signature": "..."
    },
    "windows-x86_64": {
      "url": "https://cdn.example.com/desktop/0.2.0/Passwall_0.2.0_x64-setup.nsis.zip",
      "signature": "..."
    }
  }
}
```
