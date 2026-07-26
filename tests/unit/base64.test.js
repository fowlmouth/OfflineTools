import { describe, it, expect } from 'vitest';
import { encodeBase64, decodeBase64 } from '../../src/tools/data/base64.js';

describe('encodeBase64', () => {
  it('encodes an ASCII string', () => {
    expect(encodeBase64('hello')).toBe('aGVsbG8=');
  });

  it('encodes an empty string', () => {
    expect(encodeBase64('')).toBe('');
  });

  it('encodes a UTF-8 string', () => {
    expect(encodeBase64('héllo wörld')).toBe('aMOpbGxvIHfDtnJsZA==');
  });

  it('encodes multi-byte emoji correctly', () => {
    expect(encodeBase64('😀')).toBe('8J+YgA==');
  });

  it('round-trips through decodeBase64', () => {
    const original = 'café — naïve — 日本語';
    expect(decodeBase64(encodeBase64(original))).toBe(original);
  });

  it('throws a TypeError for non-string input', () => {
    expect(() => encodeBase64(42)).toThrow(TypeError);
  });
});

describe('decodeBase64', () => {
  it('decodes an ASCII string', () => {
    expect(decodeBase64('aGVsbG8=')).toBe('hello');
  });

  it('decodes an empty string', () => {
    expect(decodeBase64('')).toBe('');
  });

  it('decodes a UTF-8 string', () => {
    expect(decodeBase64('aMOpbGxvIHfDtnJsZA==')).toBe('héllo wörld');
  });

  it('decodes multi-byte emoji correctly', () => {
    expect(decodeBase64('8J+YgA==')).toBe('😀');
  });

  it('decodes input with surrounding whitespace', () => {
    expect(decodeBase64('  aGVsbG8=\n')).toBe('hello');
  });

  it('throws on invalid base64 input', () => {
    expect(() => decodeBase64('!!!not-base64!!!')).toThrow();
  });

  it('throws a TypeError for non-string input', () => {
    expect(() => decodeBase64(null)).toThrow(TypeError);
  });
});
