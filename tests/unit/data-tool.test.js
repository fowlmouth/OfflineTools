import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { webcrypto } from 'node:crypto';
import dataTool from '../../src/tools/data/index.js';

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
});

const jsonInput = '{"name":"Alice","age":30}';
const yamlInput = 'name: Alice\nage: 30';
const xmlInput = '<root><name>Alice</name><age>30</age></root>';

describe('data tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detect', () => {
    it('delegates to detectFormat for JSON', () => {
      expect(dataTool.detect(jsonInput)).toBe('json');
    });

    it('delegates to detectFormat for YAML', () => {
      expect(dataTool.detect(yamlInput)).toBe('yaml');
    });

    it('delegates to detectFormat for XML', () => {
      expect(dataTool.detect(xmlInput)).toBe('xml');
    });

    it('returns unknown for empty input', () => {
      expect(dataTool.detect('')).toBe('unknown');
    });
  });

  describe('parse', () => {
    it('parses JSON into a JS object', () => {
      const { format, data } = dataTool.parse(jsonInput);
      expect(format).toBe('json');
      expect(data).toEqual({ name: 'Alice', age: 30 });
    });

    it('parses YAML into a JS object', () => {
      const { format, data } = dataTool.parse(yamlInput);
      expect(format).toBe('yaml');
      expect(data).toEqual({ name: 'Alice', age: 30 });
    });

    it('parses XML into a JS object', () => {
      const { format, data } = dataTool.parse(xmlInput);
      expect(format).toBe('xml');
      expect(data.name).toBe('Alice');
      expect(data.age).toBe('30');
    });

    it('throws on invalid JSON', () => {
      expect(() => dataTool.parse('{invalid}')).toThrow();
    });

    it('throws on invalid YAML', () => {
      expect(() => dataTool.parse('\t\tx\t: : bad')).toThrow();
    });

    it('throws on invalid XML', () => {
      expect(() => dataTool.parse('<root><unclosed>')).toThrow();
    });
  });

  describe('validate', () => {
    it('returns valid result for valid JSON', () => {
      const result = dataTool.validate(jsonInput);
      expect(result).toEqual({ format: 'json', valid: true, error: null });
    });

    it('returns invalid result for bad JSON', () => {
      const result = dataTool.validate('{bad}');
      expect(result.valid).toBe(false);
      expect(result.format).toBe('json');
      expect(result.error).toBeTruthy();
    });

    it('returns valid result for valid YAML', () => {
      const result = dataTool.validate(yamlInput);
      expect(result).toEqual({ format: 'yaml', valid: true, error: null });
    });

    it('returns valid result for valid XML', () => {
      const result = dataTool.validate(xmlInput);
      expect(result).toEqual({ format: 'xml', valid: true, error: null });
    });

    it('returns unknown format for empty input', () => {
      const result = dataTool.validate('');
      expect(result.format).toBe('unknown');
      expect(result.valid).toBe(false);
    });
  });

  describe('format', () => {
    it('formats JSON with indentation', () => {
      const result = dataTool.format(jsonInput);
      expect(result).toContain('"name": "Alice"');
      expect(result).toContain('  ');
    });

    it('formats YAML', () => {
      const result = dataTool.format(yamlInput);
      expect(result).toContain('name: Alice');
    });

    it('formats XML with indentation', () => {
      const result = dataTool.format(xmlInput);
      expect(result).toContain('<name>Alice</name>');
    });

    it('throws on invalid input', () => {
      expect(() => dataTool.format('{bad}')).toThrow();
    });
  });

  describe('toJSON', () => {
    it('converts JSON to formatted JSON', () => {
      const result = dataTool.toJSON(jsonInput);
      expect(JSON.parse(result)).toEqual({ name: 'Alice', age: 30 });
    });

    it('converts YAML to JSON', () => {
      const result = dataTool.toJSON(yamlInput);
      expect(JSON.parse(result)).toEqual({ name: 'Alice', age: 30 });
    });

    it('converts XML to JSON', () => {
      const result = dataTool.toJSON(xmlInput);
      const parsed = JSON.parse(result);
      expect(parsed.name).toBe('Alice');
    });

    it('throws on invalid input', () => {
      expect(() => dataTool.toJSON('{bad}')).toThrow();
    });
  });

  describe('queryData', () => {
    it('queries JSON data', () => {
      const result = dataTool.queryData(jsonInput, '.name');
      expect(result).toBe('"Alice"');
    });

    it('queries YAML data', () => {
      const result = dataTool.queryData(yamlInput, '.name');
      expect(result).toBe('"Alice"');
    });

    it('queries XML data', () => {
      const result = dataTool.queryData(xmlInput, '.name');
      expect(JSON.parse(result)).toBe('Alice');
    });

    it('returns the whole document for identity query', () => {
      const result = dataTool.queryData(jsonInput, '.');
      expect(JSON.parse(result)).toEqual({ name: 'Alice', age: 30 });
    });

    it('returns null JSON for undefined result', () => {
      const result = dataTool.queryData(jsonInput, '.nonexistent');
      expect(result).toBe('null');
    });

    it('throws on parse error', () => {
      expect(() => dataTool.queryData('{bad}', '.name')).toThrow();
    });

    it('throws on invalid query', () => {
      expect(() => dataTool.queryData(jsonInput, '.name@')).toThrow();
    });
  });

  describe('encodeBase64', () => {
    it('encodes input to base64', () => {
      expect(dataTool.encodeBase64('hello')).toBe('aGVsbG8=');
    });

    it('handles UTF-8 input', () => {
      expect(dataTool.encodeBase64('café')).toBe('Y2Fmw6k=');
    });
  });

  describe('decodeBase64', () => {
    it('decodes base64 input', () => {
      expect(dataTool.decodeBase64('aGVsbG8=')).toBe('hello');
    });

    it('round-trips through encodeBase64', () => {
      expect(dataTool.decodeBase64(dataTool.encodeBase64('café — 日本'))).toBe('café — 日本');
    });
  });

  describe('hash', () => {
    it('produces the SHA-256 digest of the input', async () => {
      expect(await dataTool.hash('hello', 'SHA-256')).toBe(
        '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      );
    });

    it('defaults to SHA-256', async () => {
      expect(await dataTool.hash('hello')).toBe(
        '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      );
    });

    it('rejects unsupported algorithms', async () => {
      await expect(dataTool.hash('hello', 'MD5')).rejects.toThrow(/Unsupported hash algorithm/);
    });
  });

  describe('hashAlgorithms', () => {
    it('exposes the supported algorithm list', () => {
      expect(dataTool.hashAlgorithms).toEqual(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']);
    });
  });
});
