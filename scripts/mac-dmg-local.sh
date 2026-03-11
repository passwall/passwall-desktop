#!/usr/bin/env bash
set -euo pipefail

ARCH="${1:-arm64}"

if [[ "$ARCH" != "arm64" && "$ARCH" != "x64" ]]; then
  echo "Usage: $0 [arm64|x64]"
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required"
  exit 1
fi

echo "==> Building renderer and main"
pnpm run build:renderer
pnpm run build:main

echo "==> Packaging unsigned DMG for $ARCH"
export CSC_IDENTITY_AUTO_DISCOVERY=false
npx electron-builder --mac dmg --"$ARCH" --publish never

DMG_PATH="$(find build -name "*.dmg" -print -quit)"
if [[ -z "$DMG_PATH" ]]; then
  echo "DMG not found in build/"
  exit 1
fi

echo "Done: unsigned DMG is ready at $DMG_PATH"
