// Encore Capacitor SDK
// Bridge-only layer — delegates to native SDKs on each platform.
// iOS: encore-swift-sdk | Android: encore-android-sdk

import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

import type {
  EncorePlugin,
  PlacementResult,
  UserAttributes,
  ConfigureOptions,
  PurchaseRequestEvent,
  PurchaseCompleteEvent,
  PassthroughEvent,
  PlacementBuilder,
  EncorePlacements,
  EncoreSDK,
} from './definitions';

const EncoreCapacitorPlugin = registerPlugin<EncorePlugin>(
  'EncoreCapacitorPlugin',
  {
    web: () => import('./web').then((m) => new m.EncorePluginWeb()),
  },
);

// Setter semantics: each on*() call replaces the previous handler instead of
// appending. Matches Swift / Android / Flutter parity. Without this, repeat
// registrations (e.g. hot reload, re-renders without cleanup) would accumulate
// listeners and cause N duplicate purchase attempts per event.
let currentPurchaseRequestHandle: Promise<PluginListenerHandle> | null = null;
let currentPurchaseCompleteHandle: Promise<PluginListenerHandle> | null = null;
let currentPassthroughHandle: Promise<PluginListenerHandle> | null = null;

function removeHandle(handle: Promise<PluginListenerHandle> | null): void {
  handle?.then((h) => h.remove()).catch(() => {
    // Swallow — listener cleanup failures must never crash host apps.
  });
}

async function safeBridgeCall<T>(
  method: string,
  call: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await call();
  } catch (error) {
    console.warn(`[Encore] ${method} failed:`, error);
    return fallback;
  }
}

// -- Typed Export --

const Encore: EncoreSDK = {
  configure: (apiKey, options = {}) =>
    safeBridgeCall(
      'configure',
      () => EncoreCapacitorPlugin.configure({ apiKey, logLevel: options.logLevel }),
      { success: false },
    ),

  identify: (userId, attributes) =>
    safeBridgeCall(
      'identify',
      () => EncoreCapacitorPlugin.identify({ userId, attributes }),
      { success: false },
    ),

  setUserAttributes: (attributes) =>
    safeBridgeCall(
      'setUserAttributes',
      () => EncoreCapacitorPlugin.setUserAttributes({ attributes }),
      { success: false },
    ),

  reset: () =>
    safeBridgeCall('reset', () => EncoreCapacitorPlugin.reset(), {
      success: false,
    }),

  placement: (placementId) => ({
    show: () =>
      safeBridgeCall(
        'show',
        () => EncoreCapacitorPlugin.show({ placementId }),
        { status: 'not_granted' as const, reason: 'sdk_error' },
      ),
  }),

  show: (placementId) =>
    safeBridgeCall(
      'show',
      () => EncoreCapacitorPlugin.show({ placementId }),
      { status: 'not_granted' as const, reason: 'sdk_error' },
    ),

  placements: {
    setClaimEnabled: (enabled) =>
      safeBridgeCall(
        'setClaimEnabled',
        () => EncoreCapacitorPlugin.setClaimEnabled({ enabled }),
        { success: false },
      ),
  },

  registerCallbacks: () =>
    safeBridgeCall(
      'registerCallbacks',
      () => EncoreCapacitorPlugin.registerCallbacks(),
      { success: false },
    ),

  completePurchaseRequest: (success) =>
    safeBridgeCall(
      'completePurchaseRequest',
      () => EncoreCapacitorPlugin.completePurchaseRequest({ success }),
      { success: false },
    ),

  onPurchaseRequest: (handler) => {
    removeHandle(currentPurchaseRequestHandle);
    const handle = EncoreCapacitorPlugin.addListener('onPurchaseRequest', handler);
    currentPurchaseRequestHandle = handle;
    return () => {
      removeHandle(handle);
      if (currentPurchaseRequestHandle === handle) {
        currentPurchaseRequestHandle = null;
      }
    };
  },

  onPurchaseComplete: (handler) => {
    removeHandle(currentPurchaseCompleteHandle);
    const handle = EncoreCapacitorPlugin.addListener('onPurchaseComplete', handler);
    currentPurchaseCompleteHandle = handle;
    return () => {
      removeHandle(handle);
      if (currentPurchaseCompleteHandle === handle) {
        currentPurchaseCompleteHandle = null;
      }
    };
  },

  onPassthrough: (handler) => {
    removeHandle(currentPassthroughHandle);
    const handle = EncoreCapacitorPlugin.addListener('onPassthrough', handler);
    currentPassthroughHandle = handle;
    return () => {
      removeHandle(handle);
      if (currentPassthroughHandle === handle) {
        currentPassthroughHandle = null;
      }
    };
  },
};

export default Encore;
export { EncoreCapacitorPlugin };
export type {
  EncorePlugin,
  PlacementResult,
  UserAttributes,
  ConfigureOptions,
  PurchaseRequestEvent,
  PurchaseCompleteEvent,
  PassthroughEvent,
  PlacementBuilder,
  EncorePlacements,
  EncoreSDK,
};
