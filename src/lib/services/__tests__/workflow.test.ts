import { describe, it, expect } from 'vitest';

// Extract workflow logic for testing
const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  submitted: ['estimating'],
  estimating: ['estimated'],
  estimated: ['cost_review'],
  cost_review: ['approved', 'estimating'],
  approved: ['prioritized'],
  prioritized: ['in_progress'],
  in_progress: ['completed'],
};

function isValidTransition(from: string, to: string): boolean {
  const allowed = WORKFLOW_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

const ALL_STATUSES = [
  'submitted', 'estimating', 'estimated', 'cost_review',
  'approved', 'prioritized', 'in_progress', 'completed',
];

describe('Workflow Transitions', () => {
  describe('valid forward transitions', () => {
    it('submitted -> estimating', () => {
      expect(isValidTransition('submitted', 'estimating')).toBe(true);
    });

    it('estimating -> estimated', () => {
      expect(isValidTransition('estimating', 'estimated')).toBe(true);
    });

    it('estimated -> cost_review', () => {
      expect(isValidTransition('estimated', 'cost_review')).toBe(true);
    });

    it('cost_review -> approved', () => {
      expect(isValidTransition('cost_review', 'approved')).toBe(true);
    });

    it('approved -> prioritized', () => {
      expect(isValidTransition('approved', 'prioritized')).toBe(true);
    });

    it('prioritized -> in_progress', () => {
      expect(isValidTransition('prioritized', 'in_progress')).toBe(true);
    });

    it('in_progress -> completed', () => {
      expect(isValidTransition('in_progress', 'completed')).toBe(true);
    });
  });

  describe('invalid transitions rejected', () => {
    it('submitted -> approved should fail', () => {
      expect(isValidTransition('submitted', 'approved')).toBe(false);
    });

    it('submitted -> completed should fail', () => {
      expect(isValidTransition('submitted', 'completed')).toBe(false);
    });

    it('estimating -> approved should fail', () => {
      expect(isValidTransition('estimating', 'approved')).toBe(false);
    });
  });

  describe('backward transitions', () => {
    it('cost_review -> estimating allowed (send back)', () => {
      expect(isValidTransition('cost_review', 'estimating')).toBe(true);
    });
  });

  describe('completed has no valid transitions', () => {
    it('completed cannot go anywhere', () => {
      const allowed = WORKFLOW_TRANSITIONS['completed'];
      expect(allowed).toBeUndefined();
      expect(isValidTransition('completed', 'submitted')).toBe(false);
      expect(isValidTransition('completed', 'in_progress')).toBe(false);
    });
  });

  describe('all 8 statuses exist', () => {
    it('has exactly 8 statuses', () => {
      expect(ALL_STATUSES).toHaveLength(8);
    });

    it('7 statuses have transitions defined (completed has none)', () => {
      const definedStatuses = Object.keys(WORKFLOW_TRANSITIONS);
      expect(definedStatuses).toHaveLength(7);
      expect(definedStatuses).not.toContain('completed');
    });
  });
});
