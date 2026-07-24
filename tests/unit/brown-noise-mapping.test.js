import { describe, it, expect } from 'vitest';
import {
  sliderToCutoff,
  cutoffToSlider,
  CUTOFF_MIN,
  CUTOFF_MAX,
} from '../../src/tools/brown-noise/mapping.js';

describe('sliderToCutoff', () => {
  it('maps 0 to the minimum frequency', () => {
    expect(sliderToCutoff(0)).toBe(CUTOFF_MIN);
  });

  it('maps 1 to the maximum frequency', () => {
    expect(sliderToCutoff(1)).toBe(CUTOFF_MAX);
  });

  it('maps 0.5 to the geometric mean (perceptual midpoint)', () => {
    const geometricMean = Math.sqrt(CUTOFF_MIN * CUTOFF_MAX);
    expect(sliderToCutoff(0.5)).toBeCloseTo(geometricMean, 1);
  });

  it('clamps values below 0 to the minimum', () => {
    expect(sliderToCutoff(-1)).toBe(CUTOFF_MIN);
  });

  it('clamps values above 1 to the maximum', () => {
    expect(sliderToCutoff(2)).toBe(CUTOFF_MAX);
  });
});

describe('cutoffToSlider', () => {
  it('maps the minimum frequency to 0', () => {
    expect(cutoffToSlider(CUTOFF_MIN)).toBeCloseTo(0, 6);
  });

  it('maps the maximum frequency to 1', () => {
    expect(cutoffToSlider(CUTOFF_MAX)).toBeCloseTo(1, 6);
  });

  it('is the inverse of sliderToCutoff', () => {
    for (const t of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
      expect(cutoffToSlider(sliderToCutoff(t))).toBeCloseTo(t, 6);
    }
  });
});
