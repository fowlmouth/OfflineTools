import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useWakeLock } from '../../src/hooks/useWakeLock.js';

function createMockWakeLock() {
  const sentinels = [];
  const api = {
    request: vi.fn((type) => {
      const sentinel = {
        type,
        released: false,
        release: vi.fn(() => {
          sentinel.released = true;
        }),
      };
      sentinels.push(sentinel);
      return Promise.resolve(sentinel);
    }),
  };
  return { api, sentinels };
}

function createMockDoc(visibilityState = 'visible') {
  const listeners = {};
  const doc = {
    visibilityState,
    addEventListener: vi.fn((event, cb) => {
      (listeners[event] ||= []).push(cb);
    }),
    removeEventListener: vi.fn((event, cb) => {
      listeners[event] = (listeners[event] || []).filter((l) => l !== cb);
    }),
    _emit(event) {
      (listeners[event] || []).forEach((cb) => cb());
    },
  };
  return doc;
}

function renderWakeHook(overrides = {}) {
  const { api, sentinels } = createMockWakeLock();
  const doc = createMockDoc();
  const result = renderHook(() =>
    useWakeLock({ document: doc, getWakeLockApi: () => api, ...overrides }),
  );
  return { ...result, api, sentinels, doc };
}

describe('useWakeLock', () => {
  it('reports supported as true when the Wake Lock API is available', () => {
    const { result } = renderWakeHook();
    expect(result.current.supported).toBe(true);
  });

  it('reports supported as false when the API is unavailable', () => {
    const { result } = renderWakeHook({ getWakeLockApi: () => null });
    expect(result.current.supported).toBe(false);
  });

  it('is not active initially', () => {
    const { result } = renderWakeHook();
    expect(result.current.active).toBe(false);
  });

  it('request() requests a "screen" wake lock', async () => {
    const { result, api } = renderWakeHook();
    await act(async () => {
      result.current.request();
    });
    expect(api.request).toHaveBeenCalledWith('screen');
  });

  it('request() sets active to true once the lock is acquired', async () => {
    const { result } = renderWakeHook();
    await act(async () => {
      result.current.request();
    });
    expect(result.current.active).toBe(true);
  });

  it('release() releases the sentinel and sets active to false', async () => {
    const { result, sentinels } = renderWakeHook();
    await act(async () => {
      result.current.request();
    });
    act(() => {
      result.current.release();
    });
    expect(sentinels[0].release).toHaveBeenCalledTimes(1);
    expect(result.current.active).toBe(false);
  });

  it('release() before any request is a safe no-op', () => {
    const { result } = renderWakeHook();
    expect(() => act(() => result.current.release())).not.toThrow();
    expect(result.current.active).toBe(false);
  });

  it('request() on an unsupported browser does not throw and stays inactive', async () => {
    const { result } = renderWakeHook({ getWakeLockApi: () => null });
    await act(async () => {
      result.current.request();
    });
    expect(result.current.active).toBe(false);
  });

  it('re-acquires the lock when the page becomes visible again', async () => {
    const { result, api, doc } = renderWakeHook();
    await act(async () => {
      result.current.request();
    });
    expect(api.request).toHaveBeenCalledTimes(1);

    await act(async () => {
      doc._emit('visibilitychange');
    });
    expect(api.request).toHaveBeenCalledTimes(2);
  });

  it('does not re-acquire on visibility change when not enabled', async () => {
    const { api, doc } = renderWakeHook();
    await act(async () => {
      doc._emit('visibilitychange');
    });
    expect(api.request).not.toHaveBeenCalled();
  });

  it('removes the visibilitychange listener on unmount', () => {
    const { doc, unmount } = renderWakeHook();
    unmount();
    expect(doc.removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );
  });

  it('releases the lock on unmount', async () => {
    const { result, sentinels, unmount } = renderWakeHook();
    await act(async () => {
      result.current.request();
    });

    unmount();

    expect(sentinels[0].release).toHaveBeenCalledTimes(1);
  });
});
