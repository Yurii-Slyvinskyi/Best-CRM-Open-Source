import type { UserRole } from './types';

// Centralizes the "is this user one of the allowed roles?" check used for UI gating.
// Returns false when there is no user (e.g. unauthenticated), so callers don't have to
// repeat null handling. Accepts a single role or a list of roles.
export function hasRole(
  user: { role: UserRole } | null | undefined,
  roles: UserRole | UserRole[],
) {
  if (!user) {
    return false;
  }

  return Array.isArray(roles) ? roles.includes(user.role) : user.role === roles;
}
