import { describe, it, expect } from 'vitest';
import { hasRole } from '../api-auth';

// We test the pure hasRole function directly (no mocking needed)
// The requireAuth function requires next-auth mocking which is integration-level

describe('API Auth - Role Hierarchy', () => {
  describe('hasRole checks', () => {
    it('OWNER has all roles', () => {
      expect(hasRole('OWNER', 'VIEWER')).toBe(true);
      expect(hasRole('OWNER', 'MEMBER')).toBe(true);
      expect(hasRole('OWNER', 'ADMIN')).toBe(true);
      expect(hasRole('OWNER', 'OWNER')).toBe(true);
    });

    it('ADMIN has MEMBER and VIEWER but not OWNER', () => {
      expect(hasRole('ADMIN', 'VIEWER')).toBe(true);
      expect(hasRole('ADMIN', 'MEMBER')).toBe(true);
      expect(hasRole('ADMIN', 'ADMIN')).toBe(true);
      expect(hasRole('ADMIN', 'OWNER')).toBe(false);
    });

    it('MEMBER has VIEWER but not ADMIN', () => {
      expect(hasRole('MEMBER', 'VIEWER')).toBe(true);
      expect(hasRole('MEMBER', 'MEMBER')).toBe(true);
      expect(hasRole('MEMBER', 'ADMIN')).toBe(false);
    });

    it('VIEWER only has VIEWER', () => {
      expect(hasRole('VIEWER', 'VIEWER')).toBe(true);
      expect(hasRole('VIEWER', 'MEMBER')).toBe(false);
      expect(hasRole('VIEWER', 'ADMIN')).toBe(false);
      expect(hasRole('VIEWER', 'OWNER')).toBe(false);
    });

    it('unknown role has no access', () => {
      expect(hasRole('UNKNOWN', 'VIEWER')).toBe(false);
    });
  });
});
