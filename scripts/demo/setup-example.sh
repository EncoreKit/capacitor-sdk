#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SDK_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "==> npm install (plugin)"
cd "$SDK_ROOT" && npm install

echo "==> npm run build (plugin)"
cd "$SDK_ROOT" && npm run build

echo "==> npm install (example)"
cd "$SDK_ROOT/example" && npm install

echo "==> vite build (example)"
cd "$SDK_ROOT/example" && npx vite build

echo "==> cap add platforms (if needed)"
cd "$SDK_ROOT/example"
if [ ! -d "ios" ]; then
    npx cap add ios
fi
if [ ! -d "android" ]; then
    npx cap add android
fi

echo "==> cap sync"
cd "$SDK_ROOT/example" && npx cap sync

echo "==> Setup complete."
