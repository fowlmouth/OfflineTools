import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useTheme } from '../../src/hooks/useTheme.js';

function createMockStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    _store: store,
  };
}

function createMockMatchMedia(prefersDark = false) {
  const listeners = {};
  return {
    fn: vi.fn((query) => {
      if (query === '(prefers-color-scheme: dark)') {
        return {
          matches: prefersDark,
          media: query,
          onchange: null,
          addEventListener: vi.fn((event, cb) => {
            (listeners[event] ||= []).push(cb);
          }),
          removeEventListener: vi.fn((event, cb) => {
            listeners[event] = (listeners[event] || []).filter((l) => l !== cb);
          }),
          dispatchEvent: vi.fn(),
        };
      }
      return { matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    }),
    _emit(event, matches) {
      (listeners[event] || []).forEach((cb) => cb({ matches }));
    },
  };
}

function createMockRoot() {
  return { dataset: {} };
}

function renderThemeHook(overrides = {}) {
  const storage = overrides.storage ?? createMockStorage();
  const mm = createMockMatchMedia(overrides.prefersDark ?? false);
  const root = overrides.root ?? createMockRoot();

  const result = renderHook(() =>
    useTheme({
      storage,
      matchMedia: mm.fn,
      root,
      ...overrides,
    }),
  );

  return { ...result, storage, mm, root };
}

describe('useTheme', () => {
  describe('defaults', () => {
    it('defaults to "auto" when no preference is stored', () => {
      const { result } = renderThemeHook();
      expect(result.current.theme).toBe('auto');
    });

    it('resolves "auto" to "light" when system prefers light', () => {
      const { result } = renderThemeHook({ prefersDark: false });
      expect(result.current.effective).toBe('light');
    });

    it('resolves "auto" to "dark" when system prefers dark', () => {
      const { result } = renderThemeHook({ prefersDark: true });
      expect(result.current.effective).toBe('dark');
    });
  });

  describe('reading stored preference', () => {
    it('reads "light" from storage on mount', () => {
      const { result } = renderThemeHook({
        storage: createMockStorage({ theme: 'light' }),
      });
      expect(result.current.theme).toBe('light');
      expect(result.current.effective).toBe('light');
    });

    it('reads "dark" from storage on mount', () => {
      const { result } = renderThemeHook({
        storage: createMockStorage({ theme: 'dark' }),
      });
      expect(result.current.theme).toBe('dark');
      expect(result.current.effective).toBe('dark');
    });

    it('falls back to "auto" for invalid stored value', () => {
      const { result } = renderThemeHook({
        storage: createMockStorage({ theme: 'neon' }),
      });
      expect(result.current.theme).toBe('auto');
    });
  });

  describe('setTheme', () => {
    it('updates the theme to "dark"', () => {
      const { result } = renderThemeHook();
      act(() => result.current.setTheme('dark'));
      expect(result.current.theme).toBe('dark');
      expect(result.current.effective).toBe('dark');
    });

    it('updates the theme to "light"', () => {
      const { result } = renderThemeHook({ prefersDark: true });
      act(() => result.current.setTheme('light'));
      expect(result.current.theme).toBe('light');
      expect(result.current.effective).toBe('light');
    });

    it('updates the theme to "auto"', () => {
      const { result } = renderThemeHook({ storage: createMockStorage({ theme: 'dark' }) });
      act(() => result.current.setTheme('auto'));
      expect(result.current.theme).toBe('auto');
    });

    it('persists the preference to storage', () => {
      const { result, storage } = renderThemeHook();
      act(() => result.current.setTheme('dark'));
      expect(storage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });
  });

  describe('DOM application', () => {
    it('sets data-theme to the effective value on mount', () => {
      const { root } = renderThemeHook({ prefersDark: true });
      expect(root.dataset.theme).toBe('dark');
    });

    it('updates data-theme when setTheme is called', () => {
      const { result, root } = renderThemeHook();
      expect(root.dataset.theme).toBe('light');
      act(() => result.current.setTheme('dark'));
      expect(root.dataset.theme).toBe('dark');
    });
  });

  describe('system preference changes (auto mode)', () => {
    it('listens for system changes when in auto mode', () => {
      const { mm, root } = renderThemeHook({ prefersDark: false });
      expect(root.dataset.theme).toBe('light');
      act(() => mm._emit('change', true));
      expect(root.dataset.theme).toBe('dark');
    });

    it('does not listen for system changes when explicitly set to light', () => {
      const { mm, root } = renderThemeHook({
        storage: createMockStorage({ theme: 'light' }),
        prefersDark: false,
      });
      expect(root.dataset.theme).toBe('light');
      act(() => mm._emit('change', true));
      expect(root.dataset.theme).toBe('light');
    });

    it('does not listen for system changes when explicitly set to dark', () => {
      const { mm, root } = renderThemeHook({
        storage: createMockStorage({ theme: 'dark' }),
        prefersDark: true,
      });
      expect(root.dataset.theme).toBe('dark');
      act(() => mm._emit('change', false));
      expect(root.dataset.theme).toBe('dark');
    });
  });

  describe('cleanup', () => {
    it('removes the matchMedia listener on unmount', () => {
      const { mm, unmount } = renderThemeHook();
      unmount();
      expect(mm.fn).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });
  });
});
