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

- [Node.js](https://nodejs.org) (Version 12.14.0)
- [Electron](https://www.electronjs.org)

### Node Version

Passwall desktop uses Node 12.14.0 version. For an easy Node setup, you can install NVM and change Node version easily.

```bash
# install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash

# install desired node version
nvm install 12.14.0

# change version
nvm use 12.14.0
```

### Run the app

After installing yarn, you can download dependencies and run the app with the commands below.

```bash
# install dependencies
yarn

# serve with hot reload at localhost:9080
yarn run dev

# build electron application for production
yarn run build
```

### Build From Source Code

After installing yarn, you can download dependencies and run the app with the commands below.

```bash
# auto choose platform and architecture
yarn build

# MacOS x64 (intel)
yarn build --mac --x64

# MacOS arm64 (M1)
yarn build --mac --arm64

# Linux Debian Package
yarn build --linux --x64

# Windows x64
yarn build --win --x64

# All Platforms
yarn run build -wml --arm64 --x64
```
