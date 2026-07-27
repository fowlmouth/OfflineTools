import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { usePasswordGenerator } from '../../src/hooks/usePasswordGenerator.js';

describe('usePasswordGenerator', () => {
  it('has sensible defaults', () => {
    const { result } = renderHook(() => usePasswordGenerator());
    expect(result.current.length).toBe(16);
    expect(result.current.lowercase).toBe(true);
    expect(result.current.uppercase).toBe(true);
    expect(result.current.numbers).toBe(true);
    expect(result.current.symbols).toBe(true);
    expect(result.current.excludeAmbiguous).toBe(false);
  });

  it('generates a password of the default length', () => {
    const { result } = renderHook(() => usePasswordGenerator());
    act(() => {
      result.current.generate();
    });
    expect(result.current.password).toHaveLength(16);
  });

  it('generates a password when no option is enabled by enabling lowercase as fallback', () => {
    const { result } = renderHook(() =>
      usePasswordGenerator({ lowercase: false, uppercase: false, numbers: false, symbols: false }),
    );
    act(() => {
      result.current.generate();
    });
    expect(typeof result.current.password).toBe('string');
    expect(result.current.password.length).toBeGreaterThan(0);
  });

  it('generate() uses crypto.getRandomValues by default', () => {
    const spy = vi.spyOn(crypto, 'getRandomValues');
    spy.mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) arr[i] = (i * 37) % 256;
      return arr;
    });
    const { result } = renderHook(() => usePasswordGenerator());
    act(() => {
      result.current.generate();
    });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('setLength updates length and regenerates', () => {
    const { result } = renderHook(() => usePasswordGenerator());
    act(() => {
      result.current.setLength(32);
    });
    expect(result.current.length).toBe(32);
    expect(result.current.password).toHaveLength(32);
  });

  it('setLength clamps to a minimum of 1', () => {
    const { result } = renderHook(() => usePasswordGenerator());
    act(() => {
      result.current.setLength(0);
    });
    expect(result.current.length).toBe(1);
  });

  it('setLength clamps to a maximum of 128', () => {
    const { result } = renderHook(() => usePasswordGenerator());
    act(() => {
      result.current.setLength(500);
    });
    expect(result.current.length).toBe(128);
  });

  it('setOption toggles a charset flag and regenerates', () => {
    const { result } = renderHook(() =>
      usePasswordGenerator({ symbols: false, length: 50 }),
    );
    act(() => {
      result.current.setOption('symbols', true);
    });
    expect(result.current.symbols).toBe(true);
    expect(result.current.password).toMatch(/[^a-zA-Z0-9]/);
  });

  it('setExcludeAmbiguous updates the flag and regenerates', () => {
    const { result } = renderHook(() =>
      usePasswordGenerator({ length: 100, excludeAmbiguous: false }),
    );
    act(() => {
      result.current.setExcludeAmbiguous(true);
    });
    expect(result.current.excludeAmbiguous).toBe(true);
  });

  it('strength reflects the generated password', () => {
    const { result } = renderHook(() =>
      usePasswordGenerator({ length: 24 }),
    );
    act(() => {
      result.current.generate();
    });
    expect(result.current.strength).toHaveProperty('bits');
    expect(result.current.strength.bits).toBeGreaterThan(0);
  });

  it('generateBatch returns multiple passwords', () => {
    const { result } = renderHook(() => usePasswordGenerator());
    act(() => {
      result.current.generateBatch(5);
    });
    expect(result.current.batch).toHaveLength(5);
  });

  it('copies the password to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const { result } = renderHook(() => usePasswordGenerator());
    act(() => {
      result.current.generate();
    });
    await act(async () => {
      await result.current.copy();
    });
    expect(writeText).toHaveBeenCalledWith(result.current.password);
  });

  it('reports copied state after a successful copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const { result } = renderHook(() => usePasswordGenerator());
    act(() => {
      result.current.generate();
    });
    await act(async () => {
      await result.current.copy();
    });
    expect(result.current.copied).toBe(true);
  });
});
