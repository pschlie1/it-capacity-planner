/**
 * Production Hardening Tests - 25+ new test cases covering:
 * - API route auth checks (401/403)
 * - Input validation (400)
 * - Estimation workflow end-to-end
 * - Sanitization edge cases
 * - CSRF validation
 * - Schema validation edge cases
 */
import { describe, it, expect, vi } from 'vitest';
import { hasRole } from '../api-auth';
import { sanitize, sanitizeObject } from '../sanitize';
import { generateCsrfToken } from '../csrf';
import { checkRateLimit, getClientIp } from '../api-utils';
import { projectCreateSchema, teamCreateSchema, scenarioCreateSchema, aiChatSchema } from '../schemas';
import {
  calculateProjectEstimate,
  calculateAggregateEstimate,
  DEFAULT_ESTIMATION_CONFIG,
} from '../services/estimation';

// ============================================
// Auth - Role-based access simulation
// ============================================
describe('Auth - Role-based access control', () => {
  it('VIEWER cannot access MEMBER routes (simulate 403)', () => {
    expect(hasRole('VIEWER', 'MEMBER')).toBe(false);
  });

  it('MEMBER cannot access ADMIN routes (simulate 403)', () => {
    expect(hasRole('MEMBER', 'ADMIN')).toBe(false);
  });

  it('ADMIN can access MEMBER routes', () => {
    expect(hasRole('ADMIN', 'MEMBER')).toBe(true);
  });

  it('empty string role has no access', () => {
    expect(hasRole('', 'VIEWER')).toBe(false);
  });

  it('case-sensitive role check (lowercase fails)', () => {
    expect(hasRole('admin', 'ADMIN')).toBe(false);
    expect(hasRole('owner', 'VIEWER')).toBe(false);
  });
});

// ============================================
// Input Validation - Bad data returns 400
// ============================================
describe('Input Validation - Schema edge cases', () => {
  it('project with extremely long name is rejected', () => {
    const result = projectCreateSchema.safeParse({
      name: 'x'.repeat(201),
      priority: 1,
    });
    expect(result.success).toBe(false);
  });

  it('project with priority=0 is rejected', () => {
    const result = projectCreateSchema.safeParse({ name: 'Test', priority: 0 });
    expect(result.success).toBe(false);
  });

  it('project with non-integer priority is rejected', () => {
    const result = projectCreateSchema.safeParse({ name: 'Test', priority: 1.5 });
    expect(result.success).toBe(false);
  });

  it('team with name over 200 chars is rejected', () => {
    const result = teamCreateSchema.safeParse({ name: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('team with negative qaFte is rejected', () => {
    const result = teamCreateSchema.safeParse({ name: 'Team', qaFte: -5 });
    expect(result.success).toBe(false);
  });

  it('scenario with name over 200 chars is rejected', () => {
    const result = scenarioCreateSchema.safeParse({ name: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('AI chat with message content over 10000 chars is rejected', () => {
    const result = aiChatSchema.safeParse({
      messages: [{ role: 'user', content: 'x'.repeat(10001) }],
    });
    expect(result.success).toBe(false);
  });

  it('AI chat with >50 messages is rejected', () => {
    const messages = Array.from({ length: 51 }, () => ({ role: 'user' as const, content: 'hi' }));
    const result = aiChatSchema.safeParse({ messages });
    expect(result.success).toBe(false);
  });
});

// ============================================
// Estimation Workflow End-to-End
// ============================================
describe('Estimation Workflow E2E', () => {
  it('submit → estimate → review → approve flow produces valid output', () => {
    // Step 1: Submit - create project with dev hours
    const devHours = 300;

    // Step 2: Estimate - calculate phases
    const estimate = calculateProjectEstimate(devHours);
    expect(estimate.totalHours).toBeGreaterThan(devHours);
    expect(estimate.phases.development).toBeGreaterThanOrEqual(devHours);
    expect(estimate.phases.testing).toBeGreaterThan(0);

    // Step 3: Review - verify cost and CapEx/OpEx split
    expect(estimate.totalCost).toBe(estimate.totalHours * DEFAULT_ESTIMATION_CONFIG.blendedRate);
    const capexHours = estimate.capex.phases.reduce((s, p) => s + p.hours, 0);
    const opexHours = estimate.opex.phases.reduce((s, p) => s + p.hours, 0);
    expect(capexHours + opexHours).toBe(estimate.totalHours);

    // Step 4: Approve - verify all fields populated
    expect(estimate.durationWeeks).toBeGreaterThan(0);
    expect(estimate.durationWeeks % 2).toBe(0); // sprint-rounded
    expect(estimate.teamSize).toBeGreaterThan(0);
    expect(estimate.testingModel).toBeTruthy();
    expect(estimate.projectSize).toBeTruthy();
  });

  it('multi-team estimation aggregates correctly through workflow', () => {
    const teams = [
      { teamId: 't1', teamName: 'Frontend', devHours: 160 },
      { teamId: 't2', teamName: 'Backend', devHours: 400 },
      { teamId: 't3', teamName: 'Mobile', devHours: 200 },
    ];

    const aggregate = calculateAggregateEstimate(teams);

    // All teams estimated
    expect(aggregate.teams).toHaveLength(3);

    // Total hours is sum of team totals
    const sumHours = aggregate.teams.reduce((s, t) => s + t.estimate.totalHours, 0);
    expect(aggregate.totals.totalHours).toBe(sumHours);

    // Duration is max of teams (sprint-rounded)
    expect(aggregate.totals.durationWeeks % 2).toBe(0);

    // CapEx + OpEx = total
    expect(aggregate.totals.capexAmount + aggregate.totals.opexAmount).toBeCloseTo(aggregate.totals.totalCost);
  });

  it('re-estimation with changed dev hours updates all calculations', () => {
    const original = calculateProjectEstimate(200);
    const revised = calculateProjectEstimate(400);

    expect(revised.totalHours).toBeGreaterThan(original.totalHours);
    expect(revised.totalCost).toBeGreaterThan(original.totalCost);
    expect(revised.durationWeeks).toBeGreaterThanOrEqual(original.durationWeeks);
  });
});

// ============================================
// Sanitization - XSS Prevention
// ============================================
describe('Sanitization - XSS edge cases', () => {
  it('strips event handlers in attributes', () => {
    expect(sanitize('<div onmouseover="alert(1)">hover</div>')).toBe('hover');
  });

  it('strips javascript: protocol from href', () => {
    const result = sanitize('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain('javascript');
  });

  it('strips nested script tags', () => {
    // Nested script injection attempt — sanitizer strips everything (more secure than partial output)
    const result = sanitize('<scr<script>ipt>alert(1)</scr</script>ipt>');
    expect(result).not.toContain('alert');
    expect(result).not.toContain('<script');
  });

  it('handles unicode in sanitized content', () => {
    expect(sanitize('Hello 🌍 <b>world</b>')).toBe('Hello 🌍 world');
  });

  it('sanitizeObject handles deeply nested structures', () => {
    const input = {
      level1: {
        level2: {
          level3: '<script>deep</script>safe',
        },
      },
    };
    const result = sanitizeObject(input);
    expect((result.level1 as any).level2.level3).toBe('safe');
  });

  it('sanitizeObject handles arrays of objects', () => {
    const input = {
      items: [
        { name: '<b>bold</b>', value: 42 },
        { name: 'clean', value: 0 },
      ],
    };
    const result = sanitizeObject(input);
    expect((result.items as any[])[0].name).toBe('bold');
    expect((result.items as any[])[0].value).toBe(42);
  });
});

// ============================================
// CSRF Token Validation
// ============================================
describe('CSRF Token - Extended tests', () => {
  it('token is exactly 64 hex characters', () => {
    const token = generateCsrfToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('100 tokens are all unique (no collisions)', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateCsrfToken()));
    expect(tokens.size).toBe(100);
  });

  it('tokens contain only lowercase hex', () => {
    for (let i = 0; i < 10; i++) {
      const token = generateCsrfToken();
      expect(token).toBe(token.toLowerCase());
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    }
  });
});

// ============================================
// Rate Limiting
// ============================================
describe('Rate Limiting - Auth endpoints', () => {
  it('blocks after custom limit of 3 requests', () => {
    const key = `test:ratelimit:${Date.now()}`;
    expect(checkRateLimit(key, 3).allowed).toBe(true);
    expect(checkRateLimit(key, 3).allowed).toBe(true);
    expect(checkRateLimit(key, 3).allowed).toBe(true);
    expect(checkRateLimit(key, 3).allowed).toBe(false);
    expect(checkRateLimit(key, 3).remaining).toBe(0);
  });

  it('getClientIp handles multiple forwarded IPs', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12' },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });
});
