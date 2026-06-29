import type { UserRole } from '../../../shared/config/roles';

export type { UserRole };

// Backend currently exposes CRM role only (`manager`, `worker`, `client`);
// frontend cannot infer `is_superuser` until backend exposes it in profile/token.

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  phone: string | null;
  address: string | null;
  company: string | null;
};

export type CurrentUser = UserProfile;

export type UserProfileUpdatePayload = Partial<Pick<
  UserProfile,
  'username' | 'email' | 'phone' | 'address'
>>;

export type RegisterUserPayload = {
  username: string;
  email: string;
  password: string;
  phone?: string | null;
  address?: string | null;
  role?: UserRole;
};

export type RegisteredUser = {
  username: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: UserRole;
};

// Fields a manager can edit on a company user. `password` is optional: omit it to keep
// the current password unchanged. `company` is never sent — the backend keeps it from
// the manager context.
export type UpdateUserPayload = {
  username: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  address?: string | null;
  password?: string;
};
