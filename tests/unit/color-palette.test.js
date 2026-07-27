import { describe, it, expect } from 'vitest';
import { generatePalette, PALETTE_SCHEMES } from '../../src/tools/color/palette.js';

describe('PALETTE_SCHEMES', () => {
  it('lists the supported schemes', () => {
    expect(PALETTE_SCHEMES).toContain('complementary');
    expect(PALETTE_SCHEMES).toContain('analogous');
    expect(PALETTE_SCHEMES).toContain('triadic');
    expect(PALETTE_SCHEMES).toContain('tetradic');
    expect(PALETTE_SCHEMES).toContain('monochromatic');
  });
});

describe('generatePalette', () => {
  it('returns an array of hex strings', () => {
    const palette = generatePalette('#ff0000', 'complementary');
    expect(Array.isArray(palette)).toBe(true);
    expect(palette.length).toBeGreaterThan(0);
    for (const color of palette) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('includes the base color for complementary', () => {
    const palette = generatePalette('#ff0000', 'complementary');
    expect(palette).toContain('#ff0000');
  });

  it('complementary returns exactly 2 colors', () => {
    expect(generatePalette('#336699', 'complementary')).toHaveLength(2);
  });

  it('complementary second color is roughly opposite hue', () => {
    const palette = generatePalette('#ff0000', 'complementary');
    expect(palette[1]).toBe('#00ffff');
  });

  it('analogous returns exactly 3 colors', () => {
    expect(generatePalette('#336699', 'analogous')).toHaveLength(3);
  });

  it('analogous includes the base color', () => {
    expect(generatePalette('#ff0000', 'analogous')).toContain('#ff0000');
  });

  it('triadic returns exactly 3 colors', () => {
    expect(generatePalette('#336699', 'triadic')).toHaveLength(3);
  });

  it('triadic for red returns the expected set', () => {
    const palette = generatePalette('#ff0000', 'triadic');
    expect(palette[0]).toBe('#ff0000');
    expect(palette[1]).toBe('#00ff00');
    expect(palette[2]).toBe('#0000ff');
  });

  it('tetradic returns exactly 4 colors', () => {
    expect(generatePalette('#336699', 'tetradic')).toHaveLength(4);
  });

  it('monochromatic returns 5 shades', () => {
    expect(generatePalette('#336699', 'monochromatic')).toHaveLength(5);
  });

  it('monochromatic keeps the same hue across shades', () => {
    const palette = generatePalette('#ff0000', 'monochromatic');
    expect(palette.every((c) => c === palette[0])).toBe(false);
  });

  it('accepts a hex without a hash', () => {
    const a = generatePalette('ff0000', 'complementary');
    const b = generatePalette('#ff0000', 'complementary');
    expect(a).toEqual(b);
  });

  it('is deterministic for the same input', () => {
    const a = generatePalette('#336699', 'triadic');
    const b = generatePalette('#336699', 'triadic');
    expect(a).toEqual(b);
  });
});
