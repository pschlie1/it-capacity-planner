import { describe, it, expect } from 'vitest';
import { projectCreateSchema, teamCreateSchema, scenarioCreateSchema, aiChatSchema } from '../schemas';

describe('projectCreateSchema', () => {
  it('validates valid project', () => {
    const result = projectCreateSchema.safeParse({ name: 'Test Project', priority: 1 });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = projectCreateSchema.safeParse({ name: '', priority: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects negative priority', () => {
    const result = projectCreateSchema.safeParse({ name: 'Test', priority: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = projectCreateSchema.safeParse({
      name: 'Test', priority: 1, tshirtSize: 'L', riskLevel: 'high', riskNotes: 'Some risk',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid tshirtSize', () => {
    const result = projectCreateSchema.safeParse({ name: 'Test', priority: 1, tshirtSize: 'XXL' });
    expect(result.success).toBe(false);
  });
});

describe('teamCreateSchema', () => {
  it('validates valid team', () => {
    const result = teamCreateSchema.safeParse({ name: 'Frontend Team' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = teamCreateSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects negative FTE', () => {
    const result = teamCreateSchema.safeParse({ name: 'Team', developerFte: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects adminPct over 100', () => {
    const result = teamCreateSchema.safeParse({ name: 'Team', adminPct: 150 });
    expect(result.success).toBe(false);
  });
});

describe('scenarioCreateSchema', () => {
  it('validates valid scenario', () => {
    expect(scenarioCreateSchema.safeParse({ name: 'Baseline' }).success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(scenarioCreateSchema.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('aiChatSchema', () => {
  it('validates chat messages', () => {
    const result = aiChatSchema.safeParse({
      messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty messages', () => {
    const result = aiChatSchema.safeParse({ messages: [] });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role', () => {
    const result = aiChatSchema.safeParse({
      messages: [{ role: 'invalid', content: 'Hello' }],
    });
    expect(result.success).toBe(false);
  });
});
