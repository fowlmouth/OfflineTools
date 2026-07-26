import { describe, it, expect, beforeAll } from 'vitest';
import { webcrypto } from 'node:crypto';
import { hash, HASH_ALGORITHMS, isSupportedAlgorithm } from '../../src/tools/data/hash.js';

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
});

describe('HASH_ALGORITHMS', () => {
  it('lists the supported algorithms', () => {
    expect(HASH_ALGORITHMS).toEqual(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']);
  });
});

describe('isSupportedAlgorithm', () => {
  it('returns true for a supported algorithm', () => {
    expect(isSupportedAlgorithm('SHA-256')).toBe(true);
  });

  it('returns false for an unsupported algorithm', () => {
    expect(isSupportedAlgorithm('MD5')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isSupportedAlgorithm('sha-256')).toBe(true);
  });
});

describe('hash', () => {
  it('produces the known SHA-256 digest of "hello"', async () => {
    expect(await hash('hello', 'SHA-256')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });

  it('produces the known SHA-1 digest of "hello"', async () => {
    expect(await hash('hello', 'SHA-1')).toBe(
      'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d',
    );
  });

  it('produces the known SHA-512 digest of "hello"', async () => {
    expect(await hash('hello', 'SHA-512')).toBe(
      '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043',
    );
  });

  it('defaults to SHA-256 when no algorithm is given', async () => {
    expect(await hash('hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });

  it('is case-insensitive for the algorithm name', async () => {
    expect(await hash('hello', 'sha-256')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });

  it('hashes an empty string', async () => {
    expect(await hash('', 'SHA-256')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('hashes UTF-8 input correctly', async () => {
    expect(await hash('café', 'SHA-256')).toBe(
      '850f7dc43910ff890f8879c0ed26fe697c93a067ad93a7d50f466a7028a9bf4e',
    );
  });

  it('produces different digests for different algorithms', async () => {
    const sha1 = await hash('data', 'SHA-1');
    const sha256 = await hash('data', 'SHA-256');
    const sha512 = await hash('data', 'SHA-512');
    expect(new Set([sha1, sha256, sha512]).size).toBe(3);
  });

  it('returns a lowercase hex string', async () => {
    const result = await hash('hello', 'SHA-256');
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it('throws on an unsupported algorithm', async () => {
    await expect(hash('hello', 'MD5')).rejects.toThrow(/Unsupported hash algorithm/);
  });

  it('throws a TypeError for non-string input', async () => {
    await expect(hash(123, 'SHA-256')).rejects.toThrow(TypeError);
  });
});
