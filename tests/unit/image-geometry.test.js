import { describe, it, expect } from 'vitest';
import {
  degreesToRadians,
  aspectRatio,
  scaleToWidth,
  scaleToHeight,
  containDimensions,
  fitResize,
  rotateDimensions,
  rotateBoundingBox,
  clampCrop,
} from '../../src/tools/image/geometry.js';

describe('degreesToRadians', () => {
  it('converts 0 degrees to 0 radians', () => {
    expect(degreesToRadians(0)).toBe(0);
  });

  it('converts 180 degrees to π radians', () => {
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
  });

  it('converts 90 degrees to π/2 radians', () => {
    expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
  });

  it('converts negative degrees', () => {
    expect(degreesToRadians(-90)).toBeCloseTo(-Math.PI / 2);
  });
});

describe('aspectRatio', () => {
  it('returns width divided by height', () => {
    expect(aspectRatio(800, 600)).toBeCloseTo(4 / 3);
  });

  it('returns 1 for a square', () => {
    expect(aspectRatio(100, 100)).toBe(1);
  });

  it('throws when height is zero', () => {
    expect(() => aspectRatio(100, 0)).toThrow();
  });
});

describe('scaleToWidth', () => {
  it('scales height proportionally to a new width', () => {
    expect(scaleToWidth({ width: 800, height: 600, newWidth: 400 })).toEqual({ width: 400, height: 300 });
  });

  it('preserves the requested width exactly', () => {
    const result = scaleToWidth({ width: 1920, height: 1080, newWidth: 960 });
    expect(result.width).toBe(960);
    expect(result.height).toBe(540);
  });
});

describe('scaleToHeight', () => {
  it('scales width proportionally to a new height', () => {
    expect(scaleToHeight({ width: 800, height: 600, newHeight: 300 })).toEqual({ width: 400, height: 300 });
  });

  it('preserves the requested height exactly', () => {
    const result = scaleToHeight({ width: 1920, height: 1080, newHeight: 540 });
    expect(result.width).toBe(960);
    expect(result.height).toBe(540);
  });
});

describe('containDimensions', () => {
  it('scales to fit within bounds by width when that fits', () => {
    expect(containDimensions({ width: 800, height: 600, maxWidth: 400, maxHeight: 400 })).toEqual({ width: 400, height: 300 });
  });

  it('scales to fit within bounds by height for portrait sources', () => {
    expect(containDimensions({ width: 600, height: 800, maxWidth: 400, maxHeight: 400 })).toEqual({ width: 300, height: 400 });
  });

  it('returns bounds unchanged for a square source equal to bounds', () => {
    expect(containDimensions({ width: 500, height: 500, maxWidth: 400, maxHeight: 400 })).toEqual({ width: 400, height: 400 });
  });
});

describe('fitResize', () => {
  it('returns exact targets when lock is false', () => {
    expect(fitResize({ width: 800, height: 600, targetWidth: 200, targetHeight: 999, lock: false })).toEqual({ width: 200, height: 999 });
  });

  it('contains within both targets when lock is true', () => {
    expect(fitResize({ width: 800, height: 600, targetWidth: 400, targetHeight: 400, lock: true })).toEqual({ width: 400, height: 300 });
  });

  it('derives height from width when only targetWidth given and lock is true', () => {
    expect(fitResize({ width: 800, height: 600, targetWidth: 400, lock: true })).toEqual({ width: 400, height: 300 });
  });

  it('derives width from height when only targetHeight given and lock is true', () => {
    expect(fitResize({ width: 800, height: 600, targetHeight: 300, lock: true })).toEqual({ width: 400, height: 300 });
  });

  it('defaults lock to true', () => {
    expect(fitResize({ width: 800, height: 600, targetWidth: 400 })).toEqual({ width: 400, height: 300 });
  });

  it('returns original dimensions when no targets given', () => {
    expect(fitResize({ width: 800, height: 600 })).toEqual({ width: 800, height: 600 });
  });
});

describe('rotateDimensions', () => {
  it('keeps dimensions for 0 degrees', () => {
    expect(rotateDimensions({ width: 800, height: 600, degrees: 0 })).toEqual({ width: 800, height: 600 });
  });

  it('keeps dimensions for 180 degrees', () => {
    expect(rotateDimensions({ width: 800, height: 600, degrees: 180 })).toEqual({ width: 800, height: 600 });
  });

  it('keeps dimensions for 360 degrees', () => {
    expect(rotateDimensions({ width: 800, height: 600, degrees: 360 })).toEqual({ width: 800, height: 600 });
  });

  it('swaps dimensions for 90 degrees', () => {
    expect(rotateDimensions({ width: 800, height: 600, degrees: 90 })).toEqual({ width: 600, height: 800 });
  });

  it('swaps dimensions for 270 degrees', () => {
    expect(rotateDimensions({ width: 800, height: 600, degrees: 270 })).toEqual({ width: 600, height: 800 });
  });

  it('normalizes negative degrees', () => {
    expect(rotateDimensions({ width: 800, height: 600, degrees: -90 })).toEqual({ width: 600, height: 800 });
  });

  it('wraps degrees greater than 360', () => {
    expect(rotateDimensions({ width: 800, height: 600, degrees: 450 })).toEqual({ width: 600, height: 800 });
  });
});

describe('rotateBoundingBox', () => {
  it('keeps dimensions for 0 degrees', () => {
    expect(rotateBoundingBox({ width: 800, height: 600, degrees: 0 })).toEqual({ width: 800, height: 600 });
  });

  it('keeps dimensions for 180 degrees', () => {
    expect(rotateBoundingBox({ width: 800, height: 600, degrees: 180 })).toEqual({ width: 800, height: 600 });
  });

  it('swaps dimensions for 90 degrees', () => {
    expect(rotateBoundingBox({ width: 800, height: 600, degrees: 90 })).toEqual({ width: 600, height: 800 });
  });

  it('swaps dimensions for 270 degrees', () => {
    expect(rotateBoundingBox({ width: 800, height: 600, degrees: 270 })).toEqual({ width: 600, height: 800 });
  });

  it('normalizes negative degrees', () => {
    expect(rotateBoundingBox({ width: 800, height: 600, degrees: -90 })).toEqual({ width: 600, height: 800 });
  });

  it('wraps degrees greater than 360', () => {
    expect(rotateBoundingBox({ width: 800, height: 600, degrees: 450 })).toEqual({ width: 600, height: 800 });
  });

  it('computes the larger bounding box for a 45 degree square', () => {
    expect(rotateBoundingBox({ width: 100, height: 100, degrees: 45 })).toEqual({ width: 141, height: 141 });
  });

  it('computes the bounding box for an arbitrary angle on a landscape source', () => {
    expect(rotateBoundingBox({ width: 800, height: 600, degrees: 30 })).toEqual({ width: 993, height: 920 });
  });

  it('rounds results to integers', () => {
    const result = rotateBoundingBox({ width: 100, height: 100, degrees: 45 });
    expect(Number.isInteger(result.width)).toBe(true);
    expect(Number.isInteger(result.height)).toBe(true);
  });
});

describe('clampCrop', () => {
  it('returns crop unchanged when fully within bounds', () => {
    expect(clampCrop({ x: 10, y: 10, width: 100, height: 100, sourceWidth: 800, sourceHeight: 600 }))
      .toEqual({ x: 10, y: 10, width: 100, height: 100 });
  });

  it('clamps x to source width', () => {
    expect(clampCrop({ x: 900, y: 0, width: 100, height: 100, sourceWidth: 800, sourceHeight: 600 }))
      .toEqual({ x: 800, y: 0, width: 0, height: 100 });
  });

  it('clamps y to source height', () => {
    expect(clampCrop({ x: 0, y: 700, width: 100, height: 100, sourceWidth: 800, sourceHeight: 600 }))
      .toEqual({ x: 0, y: 600, width: 100, height: 0 });
  });

  it('clamps width so crop does not exceed source bounds', () => {
    expect(clampCrop({ x: 750, y: 0, width: 200, height: 100, sourceWidth: 800, sourceHeight: 600 }))
      .toEqual({ x: 750, y: 0, width: 50, height: 100 });
  });

  it('clamps height so crop does not exceed source bounds', () => {
    expect(clampCrop({ x: 0, y: 550, width: 100, height: 200, sourceWidth: 800, sourceHeight: 600 }))
      .toEqual({ x: 0, y: 550, width: 100, height: 50 });
  });

  it('clamps negative x and y to zero', () => {
    expect(clampCrop({ x: -50, y: -50, width: 100, height: 100, sourceWidth: 800, sourceHeight: 600 }))
      .toEqual({ x: 0, y: 0, width: 100, height: 100 });
  });
});
