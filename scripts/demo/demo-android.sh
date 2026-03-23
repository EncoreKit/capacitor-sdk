#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SDK_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Setup deps
bash "$SCRIPT_DIR/setup-example.sh"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Build complete."
echo ""
echo "  1. Open example/android/ in Android Studio"
echo "  2. Select an emulator or device"
echo "  3. Press Run (Shift+F10)"
echo ""
echo "  Native SDK logs appear in Logcat (filter: Encore)."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
