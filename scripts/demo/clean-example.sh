#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SDK_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Standard clean — remove all build artifacts and generated native projects
rm -rf "$SDK_ROOT/node_modules" \
       "$SDK_ROOT/dist" \
       "$SDK_ROOT/package-lock.json" \
       "$SDK_ROOT/example/node_modules" \
       "$SDK_ROOT/example/dist" \
       "$SDK_ROOT/example/ios" \
       "$SDK_ROOT/example/android" \
       "$SDK_ROOT/example/package-lock.json"

if [ "${1:-}" = "--nuke" ]; then
    # Nuke Xcode DerivedData and SPM caches
    rm -rf ~/Library/Developer/Xcode/DerivedData/App-*
    rm -rf ~/Library/Caches/org.swift.swiftpm
    echo "Nuked. Run 'make demo-ios' to rebuild from scratch."
else
    echo "Cleaned. Run 'make demo-ios' to rebuild from scratch."
fi
