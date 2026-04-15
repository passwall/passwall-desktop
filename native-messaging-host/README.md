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

## Next Steps
- Implement secure handshake and encryption (optional)
- Add support for storing/removing keys
- Integrate with Tauri app if needed
