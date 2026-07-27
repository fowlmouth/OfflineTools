/**
 * Pure palette generation from a base color.
 *
 * All schemes operate in HSL space, rotating the hue and/or adjusting
 * lightness, then convert back to hex strings.
 */

import { hexToRgb, rgbToHsl, hslToRgb, rgbToHex } from './convert.js';

export const PALETTE_SCHEMES = [
  'complementary',
  'analogous',
  'triadic',
  'tetradic',
  'monochromatic',
];

export function generatePalette(baseHex, scheme) {
  const base = hexToRgb(baseHex);
  if (!base) return [];

  switch (scheme) {
    case 'complementary':
      return complementary(base);
    case 'analogous':
      return analogous(base);
    case 'triadic':
      return triadic(base);
    case 'tetradic':
      return tetradic(base);
    case 'monochromatic':
      return monochromatic(base);
    default:
      return [rgbToHex(base)];
  }
}

function complementary(base) {
  const hsl = rgbToHsl(base);
  return [
    rgbToHex(base),
    rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 180) % 360 })),
  ];
}

function analogous(base) {
  const hsl = rgbToHsl(base);
  return [
    rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 360 - 30) % 360 })),
    rgbToHex(base),
    rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 30) % 360 })),
  ];
}

function triadic(base) {
  const hsl = rgbToHsl(base);
  return [
    rgbToHex(base),
    rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 120) % 360 })),
    rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 240) % 360 })),
  ];
}

function tetradic(base) {
  const hsl = rgbToHsl(base);
  return [
    rgbToHex(base),
    rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 90) % 360 })),
    rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 180) % 360 })),
    rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 270) % 360 })),
  ];
}

function monochromatic(base) {
  const hsl = rgbToHsl(base);
  const lightnesses = [20, 40, 60, 75, 90];
  return lightnesses.map((l) => rgbToHex(hslToRgb({ ...hsl, l })));
}
