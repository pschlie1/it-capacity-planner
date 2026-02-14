import { describe, it, expect } from 'vitest';

// Extract parseJson logic from settings service for unit testing
const parseJson = (val: unknown, fallback: unknown[] = []) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return fallback;
};

describe('Settings - parseJson', () => {
  it('handles string "[]" -> []', () => {
    expect(parseJson('[]')).toEqual([]);
  });

  it('handles string with data -> parsed array', () => {
    expect(parseJson('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('handles actual array -> array (passthrough)', () => {
    const arr = [{ id: 1 }, { id: 2 }];
    expect(parseJson(arr)).toBe(arr);
  });

  it('handles null -> fallback', () => {
    expect(parseJson(null)).toEqual([]);
    expect(parseJson(null, ['default'])).toEqual(['default']);
  });

  it('handles undefined -> fallback', () => {
    expect(parseJson(undefined)).toEqual([]);
  });

  it('handles malformed string -> fallback', () => {
    expect(parseJson('not json')).toEqual([]);
    expect(parseJson('{broken', ['fallback'])).toEqual(['fallback']);
  });

  it('handles number -> fallback', () => {
    expect(parseJson(42)).toEqual([]);
  });
});
