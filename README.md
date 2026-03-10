# Passwall Desktop

<p align="center">
    <img src="https://www.yakuter.com/wp-content/yuklemeler/passwall-cover.png" alt="" width="800" height="450" />
</p>
<p align="center">
    The <strong>Passwall Desktop</strong> is an Electron Vue application that powers the web vault (https://vault.passwall.io/).
</p>

## Build/Run

If you want to use this client with official Passwall Server, please first sign up via [Passwall Signup](https://signup.passwall.io)

### Requirements

- [Node.js](https://nodejs.org) (LTS, 20+ recommended)
- [Corepack](https://nodejs.org/api/corepack.html) (bundled with modern Node.js)

### Package Manager (pnpm)

This project is configured with:

```json
"packageManager": "pnpm@10.28.1"
```

Use `pnpm` (not `yarn`) for all commands.

```bash
# one-time: enable corepack
corepack enable

# activate the project pnpm version
corepack prepare pnpm@10.28.1 --activate
```

### Node Version

For an easy Node setup, install NVM and use an LTS Node version:

```bash
# install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# install desired node version
nvm install 22

# change version
nvm use 22
```

### Run the app

Install dependencies and run development mode:

```bash
# install dependencies
pnpm install

# serve with hot reload
pnpm dev

# build electron application for production
pnpm build
```

### Build From Source Code

Platform-specific build examples:

```bash
# auto choose platform and architecture
pnpm build

# MacOS x64 (intel)
pnpm exec electron-builder --mac --x64

# MacOS arm64 (M1)
pnpm exec electron-builder --mac --arm64

# Linux Debian Package
pnpm exec electron-builder --linux --x64

# Windows x64
pnpm exec electron-builder --win --x64

# All Platforms
pnpm exec electron-builder -wml --arm64 --x64
```

### Troubleshooting

If you see this error while running `pnpm dev`:

```text
Electron failed to install correctly, please delete node_modules/electron and try installing again
```

the project now auto-checks Electron before `dev:electron` starts. You can also run this recovery flow manually:

```bash
pnpm install
pnpm rebuild electron
pnpm dev
```
