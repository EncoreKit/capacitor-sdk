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

> **Setter semantics.** `onPurchaseRequest`, `onPurchaseComplete`, and `onPassthrough` each **replace** the previous handler when called again (matching iOS, Android, and Flutter). They are global singleton handlers, not multi-listener subscriptions. No manual cleanup is required — re-registration is safe and idempotent.

Register once, right after `configure` / `registerCallbacks`:

```typescript
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

This works the same way regardless of framework (Angular, Vue, React, vanilla JS). Call them at app startup — no lifecycle hooks needed.

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
