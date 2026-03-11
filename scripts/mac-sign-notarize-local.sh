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

if ! command -v xcrun >/dev/null 2>&1; then
  echo "xcrun is required"
  exit 1
fi

echo "==> Building renderer and main"
pnpm run build:renderer
pnpm run build:main

echo "==> Packaging SIGNED DMG for $ARCH"
export CSC_IDENTITY_AUTO_DISCOVERY=true
npx electron-builder --mac dmg --"$ARCH" --publish never

DMG_PATH="$(find build -name "*.dmg" -print -quit)"
if [[ -z "$DMG_PATH" ]]; then
  echo "DMG not found in build/"
  exit 1
fi

echo "==> Produced signed DMG: $DMG_PATH"

NOTARY_PROFILE="${NOTARY_PROFILE:-passwall-notary}"

if xcrun notarytool history --keychain-profile "$NOTARY_PROFILE" >/dev/null 2>&1; then
  echo "==> Notarizing with keychain profile: $NOTARY_PROFILE"
  xcrun notarytool submit "$DMG_PATH" --keychain-profile "$NOTARY_PROFILE" --wait --timeout 30m --verbose
elif [[ -n "${APPLE_ID:-}" && -n "${APPLE_APP_SPECIFIC_PASSWORD:-}" && -n "${APPLE_TEAM_ID:-}" ]]; then
  echo "==> Notarizing with APPLE_ID credentials"
  xcrun notarytool submit "$DMG_PATH" \
    --apple-id "$APPLE_ID" \
    --password "$APPLE_APP_SPECIFIC_PASSWORD" \
    --team-id "$APPLE_TEAM_ID" \
    --wait --timeout 30m --verbose
else
  echo "Skipping notarization (missing NOTARY_PROFILE or APPLE_ID credentials)"
  echo "Set one of:"
  echo "  NOTARY_PROFILE=passwall-notary"
  echo "or"
  echo "  APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID"
  exit 0
fi

echo "==> Stapling"
xcrun stapler staple "$DMG_PATH"

echo "==> Verifying staple"
xcrun stapler validate "$DMG_PATH"

echo "Done: signed and notarized package is ready at $DMG_PATH"
