import { describe, it, expect } from 'vitest';
import { generateBrownNoise } from '../../src/tools/brown-noise/generator.js';

// Deterministic LCG so test outcomes are reproducible.
function makeSeededRng(seed) {
  let state = seed >>> 0;
  return () => {
    // Numerical Recipes constants
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe('generateBrownNoise', () => {
  it('returns a Float32Array of the requested length', () => {
    const samples = generateBrownNoise(1000, { random: makeSeededRng(1) });
    expect(samples).toBeInstanceOf(Float32Array);
    expect(samples.length).toBe(1000);
  });

  it('returns an empty array when length is 0', () => {
    const samples = generateBrownNoise(0, { random: makeSeededRng(1) });
    expect(samples.length).toBe(0);
  });

  it('returns a single sample when length is 1', () => {
    const samples = generateBrownNoise(1, { random: makeSeededRng(1) });
    expect(samples.length).toBe(1);
  });

  it('keeps all samples within [-1, 1]', () => {
    const samples = generateBrownNoise(10000, { random: makeSeededRng(42) });
    for (let i = 0; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(-1);
      expect(samples[i]).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic for a given seeded RNG', () => {
    const a = generateBrownNoise(500, { random: makeSeededRng(7) });
    const b = generateBrownNoise(500, { random: makeSeededRng(7) });
    for (let i = 0; i < a.length; i++) {
      expect(a[i]).toBeCloseTo(b[i], 6);
    }
  });

  it('produces consecutive samples that are correlated (brown noise characteristic)', () => {
    // Brown noise is an integral of white noise, so adjacent samples should be
    // much closer to each other than independent white-noise samples would be.
    const n = 20000;
    const samples = generateBrownNoise(n, { random: makeSeededRng(123) });

    let sumStep = 0;
    for (let i = 1; i < n; i++) {
      sumStep += Math.abs(samples[i] - samples[i - 1]);
    }
    const meanAdjacentStep = sumStep / (n - 1);

    // For uniformly distributed independent samples in [-1, 1] the expected
    // mean absolute difference is ~0.667. Brown noise adjacent steps should be
    // an order of magnitude smaller.
    expect(meanAdjacentStep).toBeLessThan(0.1);
  });

  it('uses Math.random by default', () => {
    const original = Math.random;
    let called = 0;
    Math.random = () => {
      called++;
      return original.call(Math);
    };
    try {
      generateBrownNoise(50);
      expect(called).toBe(50);
    } finally {
      Math.random = original;
    }
  });
});
