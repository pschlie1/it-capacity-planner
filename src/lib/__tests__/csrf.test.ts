import { describe, it, expect } from 'vitest';
import { generateCsrfToken } from '../csrf';

describe('CSRF', () => {
  it('generates a 64-char hex token', () => {
    const token = generateCsrfToken();
    expect(token).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 10 }, () => generateCsrfToken()));
    expect(tokens.size).toBe(10);
  });
});
