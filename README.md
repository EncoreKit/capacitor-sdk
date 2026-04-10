# @encorekit/capacitor

Encore Capacitor bridge — thin native plugin layer delegating to encore-swift-sdk (iOS) and encore-android-sdk (Android).

## Installation

```bash
npm install @encorekit/capacitor
npx cap sync
```

Both SPM (default) and CocoaPods are supported for iOS. No additional configuration needed.

## Usage

```typescript
import Encore from '@encorekit/capacitor';

// 1. Configure (once, early in app lifecycle)
await Encore.configure('your-api-key', { logLevel: 'debug' });

// 2. Register callbacks (before showing placements)
await Encore.registerCallbacks();

Encore.onPurchaseRequest(async (event) => {
  console.log('Purchase requested:', event.productId);
  // Handle purchase with your billing provider...
  await Encore.completePurchaseRequest(true);
});

Encore.onPurchaseComplete((event) => {
  console.log('Purchase complete:', event);
});

Encore.onPassthrough((event) => {
  console.log('Passthrough:', event);
});

// 3. Identify user
await Encore.identify('user-123', {
  email: 'user@example.com',
  subscriptionTier: 'free',
});

// 4. Show placement
const result = await Encore.placement('onboarding').show();
if (result.status === 'granted') {
  console.log('Offer granted!');
}

// 5. Reset on logout
await Encore.reset();
```

## Registering Callbacks (Setter Semantics)

> **Register once, at app startup.** `onPurchaseRequest`, `onPurchaseComplete`, and `onPassthrough` use **setter semantics** — each call **replaces** the previous handler (matching the iOS, Android, and Flutter SDKs). They are global singleton handlers, not multi-listener event subscriptions.
>
> Register them **once per app lifetime** in your app bootstrap, **not** inside button click handlers, route guards, or per-component lifecycle hooks. Re-registering with stale closures during dev hot reloads is safe (the latest registration always wins) but registering on every route change or button press is an anti-pattern.

#### Vanilla JS / app entry point

```typescript
// main.ts — runs once when the app boots
import Encore from '@encorekit/capacitor';

await Encore.configure('your-api-key');
await Encore.registerCallbacks();

Encore.onPurchaseRequest(async ({ productId }) => {
  try {
    await Billing.purchase(productId);
    await Encore.completePurchaseRequest(true);
  } catch {
    await Encore.completePurchaseRequest(false);
  }
});

Encore.onPurchaseComplete(({ productId, transactionId }) => {
  // Optional: sync with backends that don't auto-detect StoreKit/Play Billing
});

Encore.onPassthrough(({ placementId }) => {
  // User dismissed without purchasing — resume your original flow
});
```

#### Vue 3

```vue
<!-- App.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import Encore from '@encorekit/capacitor';

let unsubPurchase: () => void;
let unsubComplete: () => void;
let unsubPassthrough: () => void;

onMounted(() => {
  unsubPurchase = Encore.onPurchaseRequest(handlePurchase);
  unsubComplete = Encore.onPurchaseComplete(handleComplete);
  unsubPassthrough = Encore.onPassthrough(handlePassthrough);
});

onUnmounted(() => {
  unsubPurchase?.();
  unsubComplete?.();
  unsubPassthrough?.();
});
</script>
```

#### Angular

```typescript
// app.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import Encore from '@encorekit/capacitor';

@Component({ selector: 'app-root', template: '<router-outlet />' })
export class AppComponent implements OnInit, OnDestroy {
  private unsubscribers: Array<() => void> = [];

  ngOnInit() {
    this.unsubscribers.push(
      Encore.onPurchaseRequest(this.handlePurchase),
      Encore.onPurchaseComplete(this.handleComplete),
      Encore.onPassthrough(this.handlePassthrough),
    );
  }

  ngOnDestroy() {
    this.unsubscribers.forEach((u) => u());
  }
}
```

#### React (via Ionic React)

```tsx
// App.tsx
import { useEffect } from 'react';
import Encore from '@encorekit/capacitor';

export default function App() {
  useEffect(() => {
    const unsubPurchase = Encore.onPurchaseRequest(handlePurchase);
    const unsubComplete = Encore.onPurchaseComplete(handleComplete);
    const unsubPassthrough = Encore.onPassthrough(handlePassthrough);
    return () => {
      unsubPurchase();
      unsubComplete();
      unsubPassthrough();
    };
  }, []);

  return <YourApp />;
}
```

#### Anti-pattern

```typescript
// DO NOT DO THIS
button.addEventListener('click', () => {
  // ❌ Re-registers on every click. Closures may capture stale state.
  Encore.onPurchaseRequest(handlePurchase);
  Encore.placement('paywall').show();
});
```

If you need per-screen behavior, store the screen state in a module-level variable or signal and read it from inside the root-level handler — don't re-register the handler itself.

## API Reference

| Method | Description |
|:-------|:------------|
| `configure(apiKey, options?)` | Initialize SDK with API key |
| `identify(userId, attributes?)` | Associate user identity |
| `setUserAttributes(attributes)` | Update user attributes |
| `reset()` | Clear user data (logout) |
| `placement(id).show()` | Present offer placement |
| `placements.setClaimEnabled(enabled)` | Control claim button |
| `registerCallbacks()` | Register native event handlers |
| `completePurchaseRequest(success)` | Complete pending purchase |
| `onPurchaseRequest(handler)` | Listen for purchase requests |
| `onPurchaseComplete(handler)` | Listen for purchase completions |
| `onPassthrough(handler)` | Listen for passthrough events |

## Types

```typescript
interface UserAttributes {
  email?: string;
  firstName?: string;
  lastName?: string;
  // ... 16 more optional fields
  custom?: Record<string, string>;
}

interface PlacementResult {
  status: 'granted' | 'not_granted' | 'completed' | 'dismissed' | 'no_offers';
  reason?: string;
  entitlement?: string;
  offerId?: string;
  campaignId?: string;
}
```

## Platform Support

| Platform | Min Version | Native SDK |
|:---------|:-----------|:-----------|
| iOS | 15.0 | EncoreKit (SPM or CocoaPods) |
| Android | API 26 | com.encorekit:encore (Maven Central) |
| Web | N/A | Noop fallback with warnings |
