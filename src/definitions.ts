// Encore Capacitor Plugin — type definitions.
// All types mirror the React Native SDK for cross-platform parity.

import type { PluginListenerHandle } from '@capacitor/core';

// -- Types --

export type LogLevel = 'none' | 'error' | 'warn' | 'info' | 'debug';

export interface UserAttributes {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  countryCode?: string;
  latitude?: string;
  longitude?: string;
  dateOfBirth?: string;
  gender?: string;
  language?: string;
  subscriptionTier?: string;
  monthsSubscribed?: string;
  billingCycle?: string;
  lastPaymentAmount?: string;
  lastActiveDate?: string;
  totalSessions?: string;
  custom?: Record<string, string>;
}

export interface PlacementResult {
  status: 'granted' | 'not_granted' | 'completed' | 'dismissed' | 'no_offers';
  reason?: string;
  entitlement?: string;
  offerId?: string;
  campaignId?: string;
}

export interface PurchaseRequestEvent {
  productId: string;
  placementId?: string;
  promoOfferId?: string;
}

export interface PurchaseCompleteEvent {
  productId: string;
  transactionId?: string;
  purchaseToken?: string;
  orderId?: string;
}

export interface PassthroughEvent {
  placementId?: string;
}

// -- Plugin Interface --
// Capacitor marshals a single JSON object per method call (not positional args).

export interface EncorePlugin {
  configure(options: {
    apiKey: string;
    logLevel?: LogLevel;
  }): Promise<{ success: boolean }>;

  identify(options: {
    userId: string;
    attributes?: UserAttributes;
  }): Promise<{ success: boolean }>;

  setUserAttributes(options: {
    attributes: UserAttributes;
  }): Promise<{ success: boolean }>;

  reset(): Promise<{ success: boolean }>;

  show(options: {
    placementId: string;
  }): Promise<PlacementResult>;

  setClaimEnabled(options: {
    enabled: boolean;
  }): Promise<{ success: boolean }>;

  registerCallbacks(): Promise<{ success: boolean }>;

  completePurchaseRequest(options: {
    success: boolean;
  }): Promise<{ success: boolean }>;

  addListener(
    eventName: 'onPurchaseRequest',
    handler: (event: PurchaseRequestEvent) => void,
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'onPurchaseComplete',
    handler: (event: PurchaseCompleteEvent) => void,
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'onPassthrough',
    handler: (event: PassthroughEvent) => void,
  ): Promise<PluginListenerHandle>;

  removeAllListeners(): Promise<void>;
}

// -- High-level SDK Interface --
// Matches the React Native SDK's EncoreSDK shape for cross-platform parity.

export interface ConfigureOptions {
  logLevel?: LogLevel;
}

export interface PlacementBuilder {
  show(): Promise<PlacementResult>;
}

export interface EncorePlacements {
  setClaimEnabled(enabled: boolean): Promise<{ success: boolean }>;
}

export interface EncoreSDK {
  configure(apiKey: string, options?: ConfigureOptions): Promise<{ success: boolean }>;
  identify(userId: string, attributes?: UserAttributes): Promise<{ success: boolean }>;
  setUserAttributes(attributes: UserAttributes): Promise<{ success: boolean }>;
  reset(): Promise<{ success: boolean }>;
  placement(placementId: string): PlacementBuilder;
  /** @deprecated Use `Encore.placement(placementId).show()` instead. */
  show(placementId: string): Promise<PlacementResult>;
  placements: EncorePlacements;
  registerCallbacks(): Promise<{ success: boolean }>;
  completePurchaseRequest(success: boolean): Promise<{ success: boolean }>;
  onPurchaseRequest(handler: (event: PurchaseRequestEvent) => void): () => void;
  onPurchaseComplete(handler: (event: PurchaseCompleteEvent) => void): () => void;
  onPassthrough(handler: (event: PassthroughEvent) => void): () => void;
}
