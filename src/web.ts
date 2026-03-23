// Web fallback — noop stubs with console warnings.
// Real web SDK is a separate product (web-sdk/).

import { WebPlugin } from '@capacitor/core';

import type {
  EncorePlugin,
  PlacementResult,
} from './definitions';

export class EncorePluginWeb extends WebPlugin implements EncorePlugin {
  async configure(): Promise<{ success: boolean }> {
    console.warn('[Encore] Capacitor plugin is not supported on web.');
    return { success: false };
  }

  async identify(): Promise<{ success: boolean }> {
    console.warn('[Encore] identify is not supported on web.');
    return { success: false };
  }

  async setUserAttributes(): Promise<{ success: boolean }> {
    console.warn('[Encore] setUserAttributes is not supported on web.');
    return { success: false };
  }

  async reset(): Promise<{ success: boolean }> {
    console.warn('[Encore] reset is not supported on web.');
    return { success: false };
  }

  async show(): Promise<PlacementResult> {
    console.warn('[Encore] show is not supported on web.');
    return { status: 'not_granted', reason: 'web_unsupported' };
  }

  async setClaimEnabled(): Promise<{ success: boolean }> {
    console.warn('[Encore] setClaimEnabled is not supported on web.');
    return { success: false };
  }

  async registerCallbacks(): Promise<{ success: boolean }> {
    console.warn('[Encore] registerCallbacks is not supported on web.');
    return { success: false };
  }

  async completePurchaseRequest(): Promise<{ success: boolean }> {
    console.warn('[Encore] completePurchaseRequest is not supported on web.');
    return { success: false };
  }
}
