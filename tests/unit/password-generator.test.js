import { describe, it, expect } from 'vitest';
import {
  generatePassword,
  generateBatch,
  estimateStrength,
  buildCharset,
} from '../../src/tools/password/generator.js';

function makeSeededRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe('buildCharset', () => {
  it('includes lowercase, uppercase, numbers, and symbols by default', () => {
    const { chars, pools } = buildCharset({
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: true,
    });
    expect(chars).toContain('a');
    expect(chars).toContain('A');
    expect(chars).toContain('1');
    expect(chars).toContain('!');
    expect(pools).toHaveLength(4);
  });

  it('excludes ambiguous characters when requested', () => {
    const { chars } = buildCharset({
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: true,
    });
    for (const c of 'il1Lo0O') {
      expect(chars).not.toContain(c);
    }
  });

  it('keeps ambiguous characters by default', () => {
    const { chars } = buildCharset({
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: false,
    });
    expect(chars).toContain('l');
    expect(chars).toContain('O');
  });

  it('returns only requested sets', () => {
    const { chars, pools } = buildCharset({
      lowercase: true,
      uppercase: false,
      numbers: false,
      symbols: false,
    });
    expect(pools).toHaveLength(1);
    for (const c of chars) {
      expect(c).toMatch(/[a-z]/);
    }
  });
});

describe('generatePassword', () => {
  const fullOptions = {
    length: 16,
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true,
  };

  it('returns a string of the requested length', () => {
    const pw = generatePassword(fullOptions, makeSeededRng(1));
    expect(typeof pw).toBe('string');
    expect(pw).toHaveLength(16);
  });

  it('is deterministic for a given seeded RNG', () => {
    const a = generatePassword(fullOptions, makeSeededRng(7));
    const b = generatePassword(fullOptions, makeSeededRng(7));
    expect(a).toBe(b);
  });

  it('returns an empty string when length is 0', () => {
    expect(generatePassword({ ...fullOptions, length: 0 }, makeSeededRng(1))).toBe('');
  });

  it('includes at least one character from each enabled set', () => {
    const pw = generatePassword(fullOptions, makeSeededRng(99));
    expect(pw).toMatch(/[a-z]/);
    expect(pw).toMatch(/[A-Z]/);
    expect(pw).toMatch(/[0-9]/);
    expect(pw).toMatch(/[^a-zA-Z0-9]/);
  });

  it('respects excludeAmbiguous', () => {
    const pw = generatePassword(
      { ...fullOptions, excludeAmbiguous: true, length: 200 },
      makeSeededRng(42),
    );
    for (const c of 'il1Lo0O') {
      expect(pw).not.toContain(c);
    }
  });

  it('generates only lowercase when only lowercase is enabled', () => {
    const pw = generatePassword(
      { length: 100, lowercase: true, uppercase: false, numbers: false, symbols: false },
      makeSeededRng(3),
    );
    expect(pw).toMatch(/^[a-z]+$/);
  });

  it('produces different output for different seeds', () => {
    const a = generatePassword(fullOptions, makeSeededRng(1));
    const b = generatePassword(fullOptions, makeSeededRng(2));
    expect(a).not.toBe(b);
  });

  it('uses Math.random by default', () => {
    const original = Math.random;
    let called = 0;
    Math.random = () => {
      called++;
      return original.call(Math);
    };
    try {
      generatePassword(fullOptions);
      expect(called).toBeGreaterThan(0);
    } finally {
      Math.random = original;
    }
  });
});

describe('generateBatch', () => {
  it('returns the requested number of passwords', () => {
    const batch = generateBatch(
      { count: 5, length: 12, lowercase: true, uppercase: true, numbers: true, symbols: true },
      makeSeededRng(1),
    );
    expect(batch).toHaveLength(5);
    for (const pw of batch) {
      expect(pw).toHaveLength(12);
    }
  });

  it('is deterministic for a given seed', () => {
    const a = generateBatch(
      { count: 3, length: 12, lowercase: true, uppercase: true, numbers: true, symbols: true },
      makeSeededRng(5),
    );
    const b = generateBatch(
      { count: 3, length: 12, lowercase: true, uppercase: true, numbers: true, symbols: true },
      makeSeededRng(5),
    );
    expect(a).toEqual(b);
  });

  it('returns an empty array when count is 0', () => {
    expect(
      generateBatch(
        { count: 0, length: 12, lowercase: true, uppercase: true, numbers: true, symbols: true },
        makeSeededRng(1),
      ),
    ).toEqual([]);
  });
});

describe('estimateStrength', () => {
  it('returns an object with bits, score, and label', () => {
    const result = estimateStrength('abcdefgh');
    expect(result).toHaveProperty('bits');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('label');
  });

  it('scores a short lowercase string as weak', () => {
    const result = estimateStrength('abc');
    expect(result.label).toBe('Weak');
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('scores a long mixed string as strong', () => {
    const result = estimateStrength('Abc123!@#xyz789XYZ');
    expect(['Strong', 'Very Strong']).toContain(result.label);
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it('increases bits with length for the same pool', () => {
    const short = estimateStrength('aaaa');
    const long = estimateStrength('aaaaaaaaaaaaaaaa');
    expect(long.bits).toBeGreaterThan(short.bits);
  });

  it('increases bits with a larger character pool', () => {
    const lowerOnly = estimateStrength('abcdefgh');
    const mixed = estimateStrength('AbCdEfGh');
    expect(mixed.bits).toBeGreaterThan(lowerOnly.bits);
  });
});
