#!/usr/bin/env bash
set -euo pipefail

ARCH="${1:-arm64}"

echo "This command is kept for backward compatibility."
echo "Running sign+notarize flow..."
bash "$(dirname "$0")/mac-sign-notarize-local.sh" "$ARCH"
