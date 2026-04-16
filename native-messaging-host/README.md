# Passwall Native Messaging Host

This is a Rust-based native messaging host for Passwall Desktop, enabling secure communication between the browser extension and the desktop app via Chrome/Firefox Native Messaging protocol.

## Features

- Listens for JSON messages from the browser extension via stdin/stdout
- Handles keychain operations (get, check existence)
- Responds to `PING`, `GET_USER_KEY`, `HAS_USER_KEY` requests

## Build

```sh
cd native-messaging-host
cargo build --release
```

## Usage

This binary is intended to be registered as a native messaging host for Chrome/Firefox extensions. See the browser documentation for manifest setup.

Chrome does **not** pass `--native-messaging-host` to the executable in `path`. Either register **this** `passwall-native-messaging-host` binary in the manifest, use a one-line shell wrapper that exec’s `passwall-desktop --native-messaging-host`, or install a **symlink** named `com.passwall.desktop` pointing at the Passwall Desktop binary (the desktop app detects that file name and enters native-messaging mode).

### Manifest strategy (prod vs dev)

- `native-messaging/com.passwall.desktop.json` is **prod-pinned** to official Chrome extension origin:
  - `chrome-extension://blaiihhmnjllkfnkmkidahhegbmlghmo/`
- `native-messaging/com.passwall.desktop.dev.json` is a **dev template** that accepts a custom origin.

Install manifest for your machine:

```sh
# Prod (official extension only)
pnpm native-host:install:prod

# Dev (local unpacked extension)
PASSWALL_DEV_EXTENSION_ORIGIN="chrome-extension://<your-dev-id>/" pnpm native-host:install:dev
```

## Next Steps

- Implement secure handshake and encryption (optional)
- Add support for storing/removing keys
- Integrate with Tauri app if needed
