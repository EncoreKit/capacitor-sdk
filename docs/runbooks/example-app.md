# Example App Runbook

## Quick Start

```bash
make demo-ios       # Setup + build, prints Xcode instructions
make demo-android   # Setup + build, prints Android Studio instructions
```

## Prerequisites

| Tool | Version | Notes |
|:-----|:--------|:------|
| Node.js | >= 20 | `node --version` |
| Xcode | >= 15 | For iOS builds |
| CocoaPods | >= 1.14 | `pod --version` |
| Android Studio | Latest | For Android builds |
| JDK | 17 | `java -version` |

## How It Works

### Plugin Linking

The example app links to the parent plugin via `file:..` in `package.json`:

```json
"@encorekit/capacitor": "file:.."
```

`npx cap sync` copies the built plugin into the native projects.

### Local Development Setup

The example app targets **production** by default. To target a local backend, add these overrides:

**iOS** — edit `example/ios/App/App/Info.plist` and add:
```xml
<key>EncoreEnvironment</key>
<string>local</string>
```

**Android** — create `example/android/app/src/debug/AndroidManifest.xml` and add:
```xml
<meta-data
    android:name="com.encorekit.environment"
    android:value="local" />
```

Android emulator maps `10.0.2.2` → host `localhost` for local backend.

### Opening the Project

**iOS**: Open `example/ios/App/App.xcodeproj` in Xcode, select a simulator, press Cmd+R.

**Android**: Open `example/android/` in Android Studio, select a device, press Run.

## Makefile Targets

| Target | Description |
|:-------|:------------|
| `make setup-example` | Install deps, build plugin, cap sync |
| `make demo-ios` | Full setup + print Xcode instructions |
| `make demo-android` | Full setup + print Android Studio instructions |
| `make demo-all` | Both platforms |
| `make clean-example` | Remove build artifacts |
| `make nuke` | Full clean (DerivedData, Pods, node_modules) |

## Smoke Test Checklist

- [ ] App launches without crash
- [ ] `configure()` succeeds (check logs)
- [ ] `identify()` succeeds
- [ ] "Show Placement" presents offer sheet
- [ ] Dismissing triggers `onPassthrough` in event log
- [ ] Accepting triggers `onPurchaseRequest` in event log
- [ ] "Reset SDK" clears user data
- [ ] "Disable Claim" / "Enable Claim" toggles correctly

## Troubleshooting

### Pod not found
```bash
make nuke && make demo-ios
```

### Stale native code
After changing plugin TypeScript or native code:
```bash
cd example && npx cap sync
```

### Android build fails
Ensure `ANDROID_HOME` is set:
```bash
export ANDROID_HOME=~/Library/Android/sdk
```
