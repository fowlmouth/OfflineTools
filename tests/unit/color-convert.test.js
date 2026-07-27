import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  relativeLuminance,
  contrastRatio,
  wcagLevel,
  isValidHex,
} from '../../src/tools/color/convert.js';

describe('isValidHex', () => {
  it('accepts a 6-digit hex', () => {
    expect(isValidHex('#ff8800')).toBe(true);
  });

  it('accepts a 6-digit hex without the hash', () => {
    expect(isValidHex('ff8800')).toBe(true);
  });

  it('accepts a 3-digit shorthand', () => {
    expect(isValidHex('#f80')).toBe(true);
  });

  it('rejects an invalid string', () => {
    expect(isValidHex('not-a-color')).toBe(false);
  });

  it('rejects the wrong length', () => {
    expect(isValidHex('#ff88')).toBe(false);
  });
});

describe('hexToRgb', () => {
  it('parses a 6-digit hex', () => {
    expect(hexToRgb('#ff8800')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('parses a 6-digit hex without the hash', () => {
    expect(hexToRgb('00ff7f')).toEqual({ r: 0, g: 255, b: 127 });
  });

  it('expands a 3-digit shorthand', () => {
    expect(hexToRgb('#f80')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('parses uppercase hex', () => {
    expect(hexToRgb('#FF8800')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('returns null for invalid input', () => {
    expect(hexToRgb('nope')).toBeNull();
  });

  it('parses black and white', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe('rgbToHex', () => {
  it('formats an RGB object as a hex string', () => {
    expect(rgbToHex({ r: 255, g: 136, b: 0 })).toBe('#ff8800');
  });

  it('pads single-digit channels', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
  });

  it('rounds non-integer channels', () => {
    expect(rgbToHex({ r: 127.6, g: 0, b: 255 })).toBe('#8000ff');
  });

  it('clamps out-of-range values', () => {
    expect(rgbToHex({ r: 300, g: -10, b: 128 })).toBe('#ff0080');
  });
});

describe('rgbToHsl', () => {
  it('converts red to hsl', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('converts green to hsl', () => {
    expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 });
  });

  it('converts blue to hsl', () => {
    expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50 });
  });

  it('converts white to hsl', () => {
    expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 });
  });

  it('converts a gray to hsl with zero saturation', () => {
    expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toEqual({ h: 0, s: 0, l: 50 });
  });
});

describe('hslToRgb', () => {
  it('converts red from hsl', () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('converts green from hsl', () => {
    expect(hslToRgb({ h: 120, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('converts blue from hsl', () => {
    expect(hslToRgb({ h: 240, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('converts white from hsl', () => {
    expect(hslToRgb({ h: 0, s: 0, l: 100 })).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('round-trips through rgbToHsl within rounding tolerance', () => {
    const original = { r: 123, g: 45, b: 200 };
    const hsl = rgbToHsl(original);
    const back = hslToRgb(hsl);
    expect(Math.abs(back.r - original.r)).toBeLessThanOrEqual(1);
    expect(Math.abs(back.g - original.g)).toBeLessThanOrEqual(1);
    expect(Math.abs(back.b - original.b)).toBeLessThanOrEqual(1);
  });
});

describe('relativeLuminance', () => {
  it('is 0 for black', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5);
  });

  it('is 1 for white', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });

  it('is between 0 and 1 for a midtone', () => {
    const l = relativeLuminance({ r: 128, g: 128, b: 128 });
    expect(l).toBeGreaterThan(0);
    expect(l).toBeLessThan(1);
  });
});

describe('contrastRatio', () => {
  it('is 1 between identical colors', () => {
    expect(contrastRatio({ r: 100, g: 100, b: 100 }, { r: 100, g: 100, b: 100 })).toBeCloseTo(1, 5);
  });

  it('is 21 between black and white', () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 0);
  });

  it('returns a value >= 1', () => {
    const ratio = contrastRatio({ r: 50, g: 50, b: 50 }, { r: 200, g: 200, b: 200 });
    expect(ratio).toBeGreaterThanOrEqual(1);
  });

  it('is order-independent', () => {
    const a = { r: 200, g: 100, b: 50 };
    const b = { r: 20, g: 80, b: 150 };
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 5);
  });
});

describe('wcagLevel', () => {
  it('fails AA below 4.5', () => {
    expect(wcagLevel(4.4).aa).toBe(false);
  });

  it('passes AA at 4.5', () => {
    expect(wcagLevel(4.5).aa).toBe(true);
  });

  it('passes AA large at 3', () => {
    expect(wcagLevel(3).aaLarge).toBe(true);
  });

  it('fails AAA below 7', () => {
    expect(wcagLevel(6.9).aaa).toBe(false);
  });

  it('passes AAA at 7', () => {
    expect(wcagLevel(7).aaa).toBe(true);
  });

  it('passes AAA large at 4.5', () => {
    expect(wcagLevel(4.5).aaaLarge).toBe(true);
  });
});
