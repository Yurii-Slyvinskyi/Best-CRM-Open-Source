import { describe, expect, it } from 'vitest';
import { hasRole } from './permissions';

describe('hasRole', () => {
  it('returns false for a null or missing user', () => {
    expect(hasRole(null, 'manager')).toBe(false);
    expect(hasRole(undefined, ['manager', 'worker'])).toBe(false);
  });

  it('allows a matching single role', () => {
    expect(hasRole({ role: 'manager' }, 'manager')).toBe(true);
  });

  it('allows a role included in multiple allowed roles', () => {
    expect(hasRole({ role: 'worker' }, ['manager', 'worker'])).toBe(true);
  });

  it('denies the wrong role', () => {
    expect(hasRole({ role: 'client' }, ['manager', 'worker'])).toBe(false);
  });
});
