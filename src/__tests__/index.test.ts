import type { PlacementResult } from '../definitions';

const mockRemove = jest.fn();
const mockAddListener = jest.fn().mockResolvedValue({ remove: mockRemove });

const mockPlugin = {
  configure: jest.fn().mockResolvedValue({ success: true }),
  identify: jest.fn().mockResolvedValue({ success: true }),
  setUserAttributes: jest.fn().mockResolvedValue({ success: true }),
  reset: jest.fn().mockResolvedValue({ success: true }),
  show: jest.fn().mockResolvedValue({ status: 'granted', entitlement: 'freeTrial' }),
  setClaimEnabled: jest.fn().mockResolvedValue({ success: true }),
  registerCallbacks: jest.fn().mockResolvedValue({ success: true }),
  completePurchaseRequest: jest.fn().mockResolvedValue({ success: true }),
  addListener: mockAddListener,
  removeAllListeners: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@capacitor/core', () => ({
  registerPlugin: jest.fn(() => mockPlugin),
  WebPlugin: class {},
}));

import Encore from '../index';

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// configure
// ---------------------------------------------------------------------------
describe('configure', () => {
  it('passes apiKey and logLevel through to the native plugin', async () => {
    const result = await Encore.configure('test-api-key', {
      logLevel: 'debug',
    });

    expect(mockPlugin.configure).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      logLevel: 'debug',
    });
    expect(result).toEqual({ success: true });
  });

  it('defaults options to an empty object when omitted', async () => {
    await Encore.configure('key-only');

    expect(mockPlugin.configure).toHaveBeenCalledWith({
      apiKey: 'key-only',
      logLevel: undefined,
    });
  });
});

// ---------------------------------------------------------------------------
// identify
// ---------------------------------------------------------------------------
describe('identify', () => {
  it('passes userId and attributes to the native plugin', async () => {
    const attrs = { email: 'user@example.com', firstName: 'Ada' };
    const result = await Encore.identify('user-123', attrs);

    expect(mockPlugin.identify).toHaveBeenCalledWith({
      userId: 'user-123',
      attributes: attrs,
    });
    expect(result).toEqual({ success: true });
  });

  it('sends undefined when attributes are omitted', async () => {
    await Encore.identify('user-456');

    expect(mockPlugin.identify).toHaveBeenCalledWith({
      userId: 'user-456',
      attributes: undefined,
    });
  });
});

// ---------------------------------------------------------------------------
// setUserAttributes
// ---------------------------------------------------------------------------
describe('setUserAttributes', () => {
  it('passes the attributes dictionary to the native plugin', async () => {
    const attrs = { city: 'Austin', state: 'TX' };
    const result = await Encore.setUserAttributes(attrs);

    expect(mockPlugin.setUserAttributes).toHaveBeenCalledWith({
      attributes: attrs,
    });
    expect(result).toEqual({ success: true });
  });
});

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------
describe('reset', () => {
  it('calls native reset and resolves', async () => {
    const result = await Encore.reset();

    expect(mockPlugin.reset).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true });
  });
});

// ---------------------------------------------------------------------------
// show (via placement builder)
// ---------------------------------------------------------------------------
describe('placement().show()', () => {
  it('returns a typed PlacementResult from the native plugin', async () => {
    const result: PlacementResult = await Encore.placement('placement-1').show();

    expect(mockPlugin.show).toHaveBeenCalledWith({ placementId: 'placement-1' });
    expect(result).toEqual({
      status: 'granted',
      entitlement: 'freeTrial',
    });
  });
});

// ---------------------------------------------------------------------------
// show (deprecated direct call)
// ---------------------------------------------------------------------------
describe('show', () => {
  it('calls native show with placementId', async () => {
    const result: PlacementResult = await Encore.show('placement-2');

    expect(mockPlugin.show).toHaveBeenCalledWith({ placementId: 'placement-2' });
    expect(result).toEqual({
      status: 'granted',
      entitlement: 'freeTrial',
    });
  });
});

// ---------------------------------------------------------------------------
// registerCallbacks
// ---------------------------------------------------------------------------
describe('registerCallbacks', () => {
  it('calls native registerCallbacks once', async () => {
    const result = await Encore.registerCallbacks();

    expect(mockPlugin.registerCallbacks).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true });
  });
});

// ---------------------------------------------------------------------------
// completePurchaseRequest
// ---------------------------------------------------------------------------
describe('completePurchaseRequest', () => {
  it('calls native plugin with success boolean', async () => {
    const result = await Encore.completePurchaseRequest(true);

    expect(mockPlugin.completePurchaseRequest).toHaveBeenCalledWith({
      success: true,
    });
    expect(result).toEqual({ success: true });
  });

  it('forwards a failure boolean correctly', async () => {
    await Encore.completePurchaseRequest(false);

    expect(mockPlugin.completePurchaseRequest).toHaveBeenCalledWith({
      success: false,
    });
  });
});

// ---------------------------------------------------------------------------
// setClaimEnabled
// ---------------------------------------------------------------------------
describe('placements.setClaimEnabled', () => {
  it('calls native plugin with enabled boolean', async () => {
    const result = await Encore.placements.setClaimEnabled(true);

    expect(mockPlugin.setClaimEnabled).toHaveBeenCalledWith({ enabled: true });
    expect(result).toEqual({ success: true });
  });

  it('forwards false correctly', async () => {
    await Encore.placements.setClaimEnabled(false);

    expect(mockPlugin.setClaimEnabled).toHaveBeenCalledWith({ enabled: false });
  });
});

// ---------------------------------------------------------------------------
// Event subscriptions
// ---------------------------------------------------------------------------
describe('onPurchaseRequest', () => {
  it('subscribes to the onPurchaseRequest event via addListener', () => {
    const handler = jest.fn();
    Encore.onPurchaseRequest(handler);

    expect(mockAddListener).toHaveBeenCalledWith('onPurchaseRequest', handler);
  });

  it('returns an unsubscribe function that removes the listener', async () => {
    const handler = jest.fn();
    const unsubscribe = Encore.onPurchaseRequest(handler);

    expect(mockRemove).not.toHaveBeenCalled();
    unsubscribe();
    // Allow the promise chain to resolve
    await new Promise((r) => setTimeout(r, 0));
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});

describe('onPurchaseComplete', () => {
  it('subscribes to the onPurchaseComplete event via addListener', () => {
    const handler = jest.fn();
    Encore.onPurchaseComplete(handler);

    expect(mockAddListener).toHaveBeenCalledWith('onPurchaseComplete', handler);
  });

  it('returns an unsubscribe function that removes the listener', async () => {
    const handler = jest.fn();
    const unsubscribe = Encore.onPurchaseComplete(handler);

    expect(mockRemove).not.toHaveBeenCalled();
    unsubscribe();
    await new Promise((r) => setTimeout(r, 0));
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});

describe('onPassthrough', () => {
  it('subscribes to the onPassthrough event via addListener', () => {
    const handler = jest.fn();
    Encore.onPassthrough(handler);

    expect(mockAddListener).toHaveBeenCalledWith('onPassthrough', handler);
  });

  it('returns an unsubscribe function that removes the listener', async () => {
    const handler = jest.fn();
    const unsubscribe = Encore.onPassthrough(handler);

    expect(mockRemove).not.toHaveBeenCalled();
    unsubscribe();
    await new Promise((r) => setTimeout(r, 0));
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Crash safety — native rejections return safe fallbacks
// ---------------------------------------------------------------------------
describe('crash safety', () => {
  const nativeError = new Error('native crash');

  it('configure returns { success: false } on rejection', async () => {
    mockPlugin.configure.mockRejectedValueOnce(nativeError);
    const result = await Encore.configure('key');
    expect(result).toEqual({ success: false });
  });

  it('identify returns { success: false } on rejection', async () => {
    mockPlugin.identify.mockRejectedValueOnce(nativeError);
    const result = await Encore.identify('user-1');
    expect(result).toEqual({ success: false });
  });

  it('setUserAttributes returns { success: false } on rejection', async () => {
    mockPlugin.setUserAttributes.mockRejectedValueOnce(nativeError);
    const result = await Encore.setUserAttributes({ city: 'Austin' });
    expect(result).toEqual({ success: false });
  });

  it('reset returns { success: false } on rejection', async () => {
    mockPlugin.reset.mockRejectedValueOnce(nativeError);
    const result = await Encore.reset();
    expect(result).toEqual({ success: false });
  });

  it('show returns not_granted fallback on rejection', async () => {
    mockPlugin.show.mockRejectedValueOnce(nativeError);
    const result = await Encore.show('placement-1');
    expect(result).toEqual({ status: 'not_granted', reason: 'sdk_error' });
  });

  it('placement().show() returns not_granted fallback on rejection', async () => {
    mockPlugin.show.mockRejectedValueOnce(nativeError);
    const result = await Encore.placement('placement-1').show();
    expect(result).toEqual({ status: 'not_granted', reason: 'sdk_error' });
  });

  it('registerCallbacks returns { success: false } on rejection', async () => {
    mockPlugin.registerCallbacks.mockRejectedValueOnce(nativeError);
    const result = await Encore.registerCallbacks();
    expect(result).toEqual({ success: false });
  });

  it('completePurchaseRequest returns { success: false } on rejection', async () => {
    mockPlugin.completePurchaseRequest.mockRejectedValueOnce(nativeError);
    const result = await Encore.completePurchaseRequest(true);
    expect(result).toEqual({ success: false });
  });

  it('setClaimEnabled returns { success: false } on rejection', async () => {
    mockPlugin.setClaimEnabled.mockRejectedValueOnce(nativeError);
    const result = await Encore.placements.setClaimEnabled(true);
    expect(result).toEqual({ success: false });
  });

  it('logs a warning on rejection', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockPlugin.show.mockRejectedValueOnce(nativeError);
    await Encore.show('placement-1');
    expect(warnSpy).toHaveBeenCalledWith('[Encore] show failed:', nativeError);
    warnSpy.mockRestore();
  });
});
