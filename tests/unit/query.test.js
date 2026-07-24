import { describe, it, expect } from 'vitest';
import { query } from '../../src/tools/data/query.js';

const data = {
  name: 'Alice',
  age: 30,
  address: {
    city: 'Berlin',
    zip: '10115',
  },
  tags: ['dev', 'admin'],
  users: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Carol' },
  ],
};

describe('query', () => {
  describe('identity', () => {
    it('returns the whole document for "."', () => {
      expect(query(data, '.')).toEqual(data);
    });

    it('returns the whole document for empty string', () => {
      expect(query(data, '')).toEqual(data);
    });
  });

  describe('field access', () => {
    it('accesses a top-level field', () => {
      expect(query(data, '.name')).toBe('Alice');
    });

    it('accesses a nested field', () => {
      expect(query(data, '.address.city')).toBe('Berlin');
    });

    it('returns undefined for a missing field', () => {
      expect(query(data, '.missing')).toBeUndefined();
    });

    it('returns undefined for a missing nested field', () => {
      expect(query(data, '.address.country')).toBeUndefined();
    });
  });

  describe('array index', () => {
    it('accesses an array element by index', () => {
      expect(query(data, '.tags[0]')).toBe('dev');
    });

    it('accesses an array element then a field', () => {
      expect(query(data, '.users[0].name')).toBe('Alice');
    });

    it('accesses a deeper array element', () => {
      expect(query(data, '.users[2].id')).toBe(3);
    });

    it('handles field then index shorthand (.tags[1])', () => {
      expect(query(data, '.tags[1]')).toBe('admin');
    });
  });

  describe('array iteration', () => {
    it('iterates all array elements with .[]', () => {
      expect(query(data, '.tags[]')).toEqual(['dev', 'admin']);
    });

    it('iterates array then accesses a field', () => {
      expect(query(data, '.users[].name')).toEqual(['Alice', 'Bob', 'Carol']);
    });

    it('iterates array then accesses a field for IDs', () => {
      expect(query(data, '.users[].id')).toEqual([1, 2, 3]);
    });
  });

  describe('edge cases', () => {
    it('returns undefined for field access on a primitive', () => {
      expect(query(data, '.name.foo')).toBeUndefined();
    });

    it('returns undefined for index on a non-array', () => {
      expect(query(data, '.name[0]')).toBeUndefined();
    });

    it('handles negative-ish index gracefully (returns undefined)', () => {
      expect(query(data, '.tags[99]')).toBeUndefined();
    });

    it('returns null/undefined data unchanged', () => {
      expect(query(null, '.name')).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('throws on invalid syntax', () => {
      expect(() => query(data, '.name@')).toThrow();
    });
  });
});
