// Encore Capacitor SDK
// Bridge-only layer — delegates to native SDKs on each platform.
// iOS: encore-swift-sdk | Android: encore-android-sdk

import { registerPlugin } from '@capacitor/core';

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
    const handle = EncoreCapacitorPlugin.addListener('onPurchaseRequest', handler);
    return () => {
      handle.then((h) => h.remove());
    };
  },

  onPurchaseComplete: (handler) => {
    const handle = EncoreCapacitorPlugin.addListener('onPurchaseComplete', handler);
    return () => {
      handle.then((h) => h.remove());
    };
  },

  onPassthrough: (handler) => {
    const handle = EncoreCapacitorPlugin.addListener('onPassthrough', handler);
    return () => {
      handle.then((h) => h.remove());
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
