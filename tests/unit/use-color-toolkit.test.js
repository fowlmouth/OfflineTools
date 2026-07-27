import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useColorToolkit } from '../../src/hooks/useColorToolkit.js';

describe('useColorToolkit', () => {
  it('defaults the base color', () => {
    const { result } = renderHook(() => useColorToolkit());
    expect(result.current.base).toBe('#3b82f6');
  });

  it('parses the base color to RGB', () => {
    const { result } = renderHook(() => useColorToolkit());
    expect(result.current.rgb).toEqual({ r: 59, g: 130, b: 246 });
  });

  it('parses the base color to HSL', () => {
    const { result } = renderHook(() => useColorToolkit());
    expect(result.current.hsl).toEqual({ h: 217, s: 91, l: 60 });
  });

  it('reports valid=true for a valid base color', () => {
    const { result } = renderHook(() => useColorToolkit());
    expect(result.current.valid).toBe(true);
  });

  it('setBase updates the base color', () => {
    const { result } = renderHook(() => useColorToolkit());
    act(() => result.current.setBase('#ff0000'));
    expect(result.current.base).toBe('#ff0000');
    expect(result.current.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('reports valid=false for an invalid base color', () => {
    const { result } = renderHook(() => useColorToolkit());
    act(() => result.current.setBase('nope'));
    expect(result.current.valid).toBe(false);
    expect(result.current.rgb).toBeNull();
  });

  it('defaults the scheme to triadic', () => {
    const { result } = renderHook(() => useColorToolkit());
    expect(result.current.scheme).toBe('triadic');
  });

  it('setScheme updates the scheme', () => {
    const { result } = renderHook(() => useColorToolkit());
    act(() => result.current.setScheme('monochromatic'));
    expect(result.current.scheme).toBe('monochromatic');
  });

  it('palette reflects the base color and scheme', () => {
    const { result } = renderHook(() => useColorToolkit({ base: '#ff0000', scheme: 'triadic' }));
    expect(result.current.palette).toEqual(['#ff0000', '#00ff00', '#0000ff']);
  });

  it('defaults foreground and background', () => {
    const { result } = renderHook(() => useColorToolkit());
    expect(result.current.foreground).toBe('#000000');
    expect(result.current.background).toBe('#ffffff');
  });

  it('computes a contrast ratio for the defaults (black on white = 21)', () => {
    const { result } = renderHook(() => useColorToolkit());
    expect(result.current.contrast).toBeCloseTo(21, 0);
  });

  it('setForeground updates the contrast ratio', () => {
    const { result } = renderHook(() => useColorToolkit());
    act(() => result.current.setForeground('#777777'));
    expect(result.current.contrast).toBeLessThan(21);
    expect(result.current.contrast).toBeGreaterThanOrEqual(1);
  });

  it('reports WCAG levels for the current contrast', () => {
    const { result } = renderHook(() => useColorToolkit());
    expect(result.current.wcag.aaa).toBe(true);
  });

  it('copy writes a value to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const { result } = renderHook(() => useColorToolkit());
    await act(async () => {
      await result.current.copy('#ff0000');
    });
    expect(writeText).toHaveBeenCalledWith('#ff0000');
  });

  it('tracks which value was last copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const { result } = renderHook(() => useColorToolkit());
    await act(async () => {
      await result.current.copy('#ff0000');
    });
    expect(result.current.copiedValue).toBe('#ff0000');
  });
});
