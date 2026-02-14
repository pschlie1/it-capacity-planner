import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, getClientIp } from '../api-utils';

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Rate limit uses a global map; use unique IPs per test
  });

  it('allows first request', () => {
    const result = checkRateLimit('test-ip-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19);
  });

  it('allows up to max requests', () => {
    const ip = 'test-ip-limit-' + Date.now();
    for (let i = 0; i < 20; i++) {
      const r = checkRateLimit(ip);
      expect(r.allowed).toBe(true);
    }
  });

  it('blocks after max requests exceeded', () => {
    const ip = 'test-ip-block-' + Date.now();
    for (let i = 0; i < 20; i++) checkRateLimit(ip);
    const r = checkRateLimit(ip);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it('respects custom max', () => {
    const ip = 'test-ip-custom-' + Date.now();
    for (let i = 0; i < 5; i++) checkRateLimit(ip, 5);
    const r = checkRateLimit(ip, 5);
    expect(r.allowed).toBe(false);
  });
});

describe('getClientIp', () => {
  it('extracts from x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('returns unknown when no header', () => {
    const req = new Request('http://localhost');
    expect(getClientIp(req)).toBe('unknown');
  });
});
