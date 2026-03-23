#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SDK_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ "${1:-}" = "--nuke" ]; then
    # Standard clean
    rm -rf "$SDK_ROOT/example/node_modules" \
           "$SDK_ROOT/example/dist" \
           "$SDK_ROOT/example/ios/App/Pods" \
           "$SDK_ROOT/example/ios/App/build" \
           "$SDK_ROOT/example/android/app/build" \
           "$SDK_ROOT/example/android/.gradle"

    # Nuke extras
    rm -rf ~/Library/Developer/Xcode/DerivedData/EncoreCapacitorExample-*
    rm -rf "$SDK_ROOT/example/ios/App/Pods" "$SDK_ROOT/example/ios/App/Podfile.lock"
    rm -rf "$SDK_ROOT/dist" "$SDK_ROOT/node_modules"

    echo ""
    echo "Nuked. Run 'make demo-ios' to rebuild from scratch."
else
    rm -rf "$SDK_ROOT/example/node_modules" \
           "$SDK_ROOT/example/dist" \
           "$SDK_ROOT/example/ios/App/Pods" \
           "$SDK_ROOT/example/ios/App/build" \
           "$SDK_ROOT/example/android/app/build" \
           "$SDK_ROOT/example/android/.gradle"

    echo "Cleaned. Run 'make setup-example' to rebuild."
fi
