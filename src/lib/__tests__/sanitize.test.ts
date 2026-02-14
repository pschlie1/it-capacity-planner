import { describe, it, expect } from 'vitest';
import { sanitize, sanitizeObject } from '../sanitize';

describe('sanitize', () => {
  it('strips HTML tags', () => {
    expect(sanitize('<script>alert("xss")</script>')).toBe('');
  });

  it('strips img onerror', () => {
    expect(sanitize('<img onerror="alert(1)" src="x">')).toBe('');
  });

  it('preserves plain text', () => {
    expect(sanitize('Hello World')).toBe('Hello World');
  });

  it('preserves special characters', () => {
    expect(sanitize('Cost: $100 & 50% off')).toBe('Cost: $100 & 50% off');
  });

  it('handles empty string', () => {
    expect(sanitize('')).toBe('');
  });
});

describe('sanitizeObject', () => {
  it('sanitizes string values in object', () => {
    const result = sanitizeObject({ name: '<b>Test</b>', count: 5 });
    expect(result.name).toBe('Test');
    expect(result.count).toBe(5);
  });

  it('sanitizes nested objects', () => {
    const result = sanitizeObject({ meta: { desc: '<script>x</script>Safe' } });
    expect((result.meta as Record<string, string>).desc).toBe('Safe');
  });

  it('sanitizes arrays of strings', () => {
    const result = sanitizeObject({ tags: ['<b>a</b>', 'b'] });
    expect(result.tags).toEqual(['a', 'b']);
  });

  it('preserves non-string values', () => {
    const result = sanitizeObject({ n: 42, b: true, x: null });
    expect(result.n).toBe(42);
    expect(result.b).toBe(true);
    expect(result.x).toBe(null);
  });
});
