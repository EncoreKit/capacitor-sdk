# Encore Capacitor SDK

Cross-platform mobile SDK: TypeScript / Capacitor.

## Structure

- `src/` — SDK source (TypeScript)
- `ios/` — Native iOS bridge (CAPPlugin)
- `android/` — Native Android bridge (Capacitor Plugin)
- `dist/` — Build output (CJS, ESM, IIFE)

## Key Principles

- Follow the unified Encore architecture (see root `ARCHITECTURE.md`)
- Thin bridge — zero business logic, 100% delegation to native SDKs
- Capacitor marshals a single JSON object per method call (not positional args)
- Never crash host apps — contain all errors gracefully via `safeBridgeCall`
- No framework-specific bindings — singleton export works with Angular, React, Vue

## Commands

```bash
npm install && npm run build    # Build plugin
npm test                        # Run Jest tests
make demo-ios                   # Build and open example in Xcode
make demo-android               # Build and open example in Android Studio
```

## Native SDK Versions

Pinned in `package.json` under `sdkVersions`:
- iOS: `EncoreCapacitorPlugin.podspec` reads `sdkVersions.ios.EncoreKit`
- Android: `android/build.gradle` reads `sdkVersions.android["com.encorekit:encore"]`

## Capacitor-Specific Notes

- Events use `notifyListeners()` (native) / `addListener()` (TS) — not NativeEventEmitter
- iOS bridge extends `CAPPlugin` + `CAPBridgedPlugin`
- Android bridge annotated `@CapacitorPlugin` + `@PluginMethod`
- Web fallback in `src/web.ts` returns safe noops with warnings
