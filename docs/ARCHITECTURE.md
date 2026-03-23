# Encore Capacitor SDK — Architecture

## Overview

The Encore Capacitor SDK is a **thin bridge layer** that delegates 100% of business logic to platform-native SDKs:

- **iOS**: `encore-swift-sdk` via CocoaPods
- **Android**: `encore-android-sdk` via Maven Central

Zero business logic lives in the bridge. TypeScript types mirror the native SDK interfaces.

## Architecture Diagram

```
┌────────────────────────────────────────┐
│           Capacitor Web App            │
│    (Angular / React / Vue / Vanilla)   │
└────────────────┬───────────────────────┘
                 │  Encore.configure()
                 │  Encore.placement('demo').show()
                 │  Encore.onPurchaseRequest(handler)
                 ▼
┌────────────────────────────────────────┐
│       src/index.ts — Encore wrapper    │
│  safeBridgeCall, placement builder,    │
│  event listener subscriptions          │
└────────────────┬───────────────────────┘
                 │  EncoreCapacitorPlugin.show({ placementId })
                 │  notifyListeners('onPurchaseRequest', data)
                 ▼
┌──────────────────────┬─────────────────┐
│   iOS (CAPPlugin)    │ Android (Plugin)│
│  EncoreCapacitor-    │ EncoreCapacitor-│
│  Plugin.swift        │ Plugin.kt       │
└──────────┬───────────┴────────┬────────┘
           │                    │
           ▼                    ▼
┌──────────────────┐ ┌──────────────────┐
│  Encore.shared   │ │  Encore.shared   │
│  (Swift SDK)     │ │  (Android SDK)   │
└──────────────────┘ └──────────────────┘
```

## File Inventory

| File | LOC | Purpose |
|:-----|:----|:--------|
| `src/definitions.ts` | ~130 | Types + plugin interface |
| `src/index.ts` | ~120 | registerPlugin + Encore wrapper |
| `src/web.ts` | ~45 | Web fallback (noop stubs) |
| `ios/.../EncoreCapacitorPlugin.swift` | ~190 | iOS bridge |
| `ios/.../EncoreCapacitorPlugin.m` | ~15 | ObjC macro declarations |
| `android/.../EncoreCapacitorPlugin.kt` | ~195 | Android bridge |

## TS ↔ Native Wiring

Capacitor uses three communication mechanisms:

### 1. Method Calls (TS → Native)
```
TS: EncoreCapacitorPlugin.configure({ apiKey, logLevel })
     → Capacitor serializes to JSON
     → iOS: @objc func configure(_ call: CAPPluginCall)
     → Android: @PluginMethod fun configure(call: PluginCall)
```

### 2. Events (Native → TS)
```
iOS: self.notifyListeners("onPurchaseRequest", data: [...])
Android: notifyListeners("onPurchaseRequest", JSObject().apply { ... })
     → Capacitor deserializes
     → TS: addListener('onPurchaseRequest', handler)
```

### 3. Bidirectional Async (Purchase Request Flow)
```
1. Native SDK calls onPurchaseRequest handler
2. Bridge stores continuation (iOS) / CompletableDeferred (Android)
3. Bridge fires "onPurchaseRequest" event to TS
4. TS handler calls completePurchaseRequest({ success: true/false })
5. Bridge resumes continuation / completes deferred
6. Native SDK continues purchase flow
```

## Platform Differences

| Aspect | iOS | Android |
|:-------|:----|:--------|
| Base class | `CAPPlugin` + `CAPBridgedPlugin` | `Plugin` |
| Language | Swift | Kotlin |
| Async bridge | `CheckedContinuation<Void, Error>` | `CompletableDeferred<Boolean>` |
| Thread safety | `NSLock` | `@Volatile` + coroutine primitives |
| Event emission | `notifyListeners(_:data:)` | `notifyListeners(String, JSObject)` |
| Dependency | CocoaPods (EncoreKit) | Maven Central (com.encorekit:encore) |
| Activity | Not needed | `getActivity()` for show() |

## Design Decisions

1. **Single-object parameters**: Capacitor's fundamental constraint — all method args wrapped in one JSON object
2. **No framework bindings**: Unlike RN (hooks/provider), Capacitor apps are plain web apps — singleton export suffices
3. **Web fallback as noop**: `web.ts` warns and returns safe fallbacks; the real web SDK is a separate product
4. **Capacitor 6 target**: Current stable, iOS 14+, Android minSdk 22
