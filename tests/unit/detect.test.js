import { describe, it, expect } from 'vitest';
import { detectFormat } from '../../src/tools/data/detect.js';

describe('detectFormat', () => {
  describe('JSON detection', () => {
    it('detects a simple JSON object', () => {
      expect(detectFormat('{"key": "value"}')).toBe('json');
    });

    it('detects a JSON array', () => {
      expect(detectFormat('[1, 2, 3]')).toBe('json');
    });

    it('detects nested JSON', () => {
      expect(detectFormat('{"a": {"b": [1, 2]}}')).toBe('json');
    });

    it('detects JSON with leading/trailing whitespace', () => {
      expect(detectFormat('  {"key": "value"}  ')).toBe('json');
    });

    it('detects JSON with leading newlines', () => {
      expect(detectFormat('\n\n  {"key": "value"}')).toBe('json');
    });
  });

  describe('XML detection', () => {
    it('detects a simple XML element', () => {
      expect(detectFormat('<root><item>value</item></root>')).toBe('xml');
    });

    it('detects XML with declaration', () => {
      expect(detectFormat('<?xml version="1.0"?><root/>')).toBe('xml');
    });

    it('detects XML with leading whitespace', () => {
      expect(detectFormat('  <root>\n  <child/>\n</root>')).toBe('xml');
    });

    it('detects self-closing XML', () => {
      expect(detectFormat('<root/>')).toBe('xml');
    });
  });

  describe('YAML detection', () => {
    it('detects simple key-value YAML', () => {
      expect(detectFormat('name: test\nage: 30')).toBe('yaml');
    });

    it('detects YAML with nested keys', () => {
      expect(detectFormat('parent:\n  child: value')).toBe('yaml');
    });

    it('detects YAML list', () => {
      expect(detectFormat('- item1\n- item2\n- item3')).toBe('yaml');
    });

    it('detects YAML with leading whitespace before key', () => {
      expect(detectFormat('  key: value')).toBe('yaml');
    });
  });

  describe('edge cases', () => {
    it('returns unknown for empty string', () => {
      expect(detectFormat('')).toBe('unknown');
    });

    it('returns unknown for whitespace-only string', () => {
      expect(detectFormat('   \n  \t  ')).toBe('unknown');
    });

    it('returns unknown for plain text', () => {
      expect(detectFormat('just some text')).toBe('unknown');
    });

    it('returns unknown for a number alone', () => {
      expect(detectFormat('42')).toBe('unknown');
    });

    it('returns unknown for a bare string', () => {
      expect(detectFormat('hello world')).toBe('unknown');
    });
  });

  describe('format disambiguation', () => {
    it('prefers JSON over YAML for curly-brace content', () => {
      expect(detectFormat('{name: test}')).toBe('json');
    });

    it('detects YAML that looks like a URL (contains colon but not JSON/XML)', () => {
      expect(detectFormat('url: https://example.com')).toBe('yaml');
    });
  });
});
