# =============================================================================
# Encore Capacitor SDK - Development Commands
# =============================================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help

# =============================================================================
# Help
# =============================================================================

.PHONY: help
help:
	@echo "Encore Capacitor SDK"
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Development:"
	@echo "  test                       Run Jest tests"
	@echo "  lint                       Run ESLint"
	@echo "  typecheck                  Run TypeScript typecheck"
	@echo "  build                      Build plugin (TS + rollup)"
	@echo "  clean                      Remove build artifacts (simulate fresh checkout)"
	@echo "  nuke                       Clean + nuke Xcode DerivedData and SPM caches"
	@echo ""
	@echo "Example App:"
	@echo "  setup-example              Install deps + cap sync for example app"
	@echo "  demo-ios                   Build example app for iOS"
	@echo "  demo-android               Build example app for Android"
	@echo "  demo-all                   Build for both iOS and Android"
	@echo ""
	@echo "Release:"
	@echo "  release                    Run interactive release workflow"
	@echo ""

# =============================================================================
# Development
# =============================================================================

.PHONY: test
test:
	@npm test

.PHONY: lint
lint:
	@npm run lint

.PHONY: typecheck
typecheck:
	@npm run typecheck

.PHONY: build
build:
	@npm run build

.PHONY: clean
clean:
	@bash scripts/demo/clean-example.sh

.PHONY: nuke
nuke:
	@bash scripts/demo/clean-example.sh --nuke

# =============================================================================
# Release
# =============================================================================

.PHONY: release
release:
	@bash scripts/release/publish-release.sh

# =============================================================================
# Example App
# =============================================================================

.PHONY: setup-example
setup-example:
	@bash scripts/demo/setup-example.sh

.PHONY: demo-ios
demo-ios:
	@bash scripts/demo/demo-ios.sh

.PHONY: demo-android
demo-android:
	@bash scripts/demo/demo-android.sh

.PHONY: demo-all
demo-all: demo-ios demo-android

