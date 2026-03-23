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
echo "  1. Open example/ios/App/App.xcodeproj in Xcode"
echo "  2. Select a simulator or device"
echo "  3. Press Cmd+R to run"
echo ""
echo "  Native SDK logs appear in the Xcode console."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
