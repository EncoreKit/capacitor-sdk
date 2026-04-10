import type { PlacementResult } from '../definitions';

type Listener = (...args: unknown[]) => void;

// Faithful event-emitter mock: tracks the *active* set of listeners per event
// so tests can verify behavior (which handler actually fires) instead of
// brittle structural assertions on call counts.
const activeHandlersByEvent = new Map<string, Set<Listener>>();

const mockAddListener = jest.fn((event: string, handler: Listener) => {
  let set = activeHandlersByEvent.get(event);
  if (!set) {
    set = new Set();
    activeHandlersByEvent.set(event, set);
  }
  set.add(handler);
  return Promise.resolve({
    remove: () => {
      activeHandlersByEvent.get(event)?.delete(handler);
      return Promise.resolve();
    },
  });
});

function emit(event: string, payload: unknown): void {
  const set = activeHandlersByEvent.get(event);
  if (!set) return;
  for (const h of [...set]) h(payload);
}

// Flush microtasks so that .then(h => h.remove()) chains in the SDK resolve.
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

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

beforeEach(async () => {
  jest.clearAllMocks();
  // Clear leftover handlers from previous tests. The SDK module retains
  // current-subscription state between tests; the next on*() call will safely
  // no-op when it tries to remove a subscription whose handler is no longer
  // tracked here.
  activeHandlersByEvent.clear();
  // Allow any leftover .then(h => h.remove()) microtasks from the previous
  // test to drain before the next test starts.
  await flush();
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
// Event subscriptions — setter semantics (parity with Swift / Android / Flutter)
// ---------------------------------------------------------------------------
describe('onPurchaseRequest', () => {
  it('subscribes to the onPurchaseRequest event via addListener', async () => {
    const handler = jest.fn();
    Encore.onPurchaseRequest(handler);
    await flush();

    expect(mockAddListener).toHaveBeenCalledWith('onPurchaseRequest', handler);
  });

  it('returns an unsubscribe function that removes the listener', async () => {
    const handler = jest.fn();
    const unsubscribe = Encore.onPurchaseRequest(handler);
    await flush();

    emit('onPurchaseRequest', { productId: 'sku_1' });
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    await flush();
    emit('onPurchaseRequest', { productId: 'sku_2' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('replaces the previous handler (setter semantics)', async () => {
    const first = jest.fn();
    const second = jest.fn();

    Encore.onPurchaseRequest(first);
    Encore.onPurchaseRequest(second);
    await flush();
    emit('onPurchaseRequest', { productId: 'sku_1', placementId: 'p1' });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith({ productId: 'sku_1', placementId: 'p1' });
  });
});

describe('onPurchaseComplete', () => {
  it('subscribes to the onPurchaseComplete event via addListener', async () => {
    const handler = jest.fn();
    Encore.onPurchaseComplete(handler);
    await flush();

    expect(mockAddListener).toHaveBeenCalledWith('onPurchaseComplete', handler);
  });

  it('returns an unsubscribe function that removes the listener', async () => {
    const handler = jest.fn();
    const unsubscribe = Encore.onPurchaseComplete(handler);
    await flush();

    emit('onPurchaseComplete', { productId: 'sku_1' });
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    await flush();
    emit('onPurchaseComplete', { productId: 'sku_2' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('replaces the previous handler (setter semantics)', async () => {
    const first = jest.fn();
    const second = jest.fn();

    Encore.onPurchaseComplete(first);
    Encore.onPurchaseComplete(second);
    await flush();
    emit('onPurchaseComplete', { productId: 'sku_1', transactionId: 'tx_1' });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith({ productId: 'sku_1', transactionId: 'tx_1' });
  });
});

describe('onPassthrough', () => {
  it('subscribes to the onPassthrough event via addListener', async () => {
    const handler = jest.fn();
    Encore.onPassthrough(handler);
    await flush();

    expect(mockAddListener).toHaveBeenCalledWith('onPassthrough', handler);
  });

  it('returns an unsubscribe function that removes the listener', async () => {
    const handler = jest.fn();
    const unsubscribe = Encore.onPassthrough(handler);
    await flush();

    emit('onPassthrough', { placementId: 'p1' });
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    await flush();
    emit('onPassthrough', { placementId: 'p2' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('replaces the previous handler (setter semantics)', async () => {
    const first = jest.fn();
    const second = jest.fn();

    Encore.onPassthrough(first);
    Encore.onPassthrough(second);
    await flush();
    emit('onPassthrough', { placementId: 'p1' });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith({ placementId: 'p1' });
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
