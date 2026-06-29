import type {
  RegisterUserPayload,
  UpdateUserPayload,
  UserProfile,
  UserRole,
} from '../../../entities/user';

// Managers create and edit only worker/client accounts (see backend role validation).
export type EditableUserRole = Extract<UserRole, 'worker' | 'client'>;

export type UserFormMode = 'create' | 'edit';

export type UserFormValues = {
  username: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  role: EditableUserRole;
};

export const roleFilterOptions: Array<{ value: 'all' | UserRole; label: string }> = [
  { value: 'all', label: 'All roles' },
  { value: 'worker', label: 'Workers' },
  { value: 'client', label: 'Clients' },
  { value: 'manager', label: 'Managers' },
];

export const managerRoleOptions: Array<{ value: EditableUserRole; label: string }> = [
  { value: 'worker', label: 'Worker' },
  { value: 'client', label: 'Client' },
];

function toEditableRole(role: UserRole): EditableUserRole {
  return role === 'client' ? 'client' : 'worker';
}

export function getCreateUserFormValues(): UserFormValues {
  return {
    username: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'worker',
  };
}

export function getEditUserFormValues(user: UserProfile): UserFormValues {
  return {
    username: user.username,
    email: user.email,
    // Password is write-only on the backend and never edited unless explicitly typed.
    password: '',
    phone: user.phone ?? '',
    address: user.address ?? '',
    role: toEditableRole(user.role),
  };
}

export function buildCreatePayload(values: UserFormValues): RegisterUserPayload {
  return {
    username: values.username.trim(),
    email: values.email.trim(),
    password: values.password,
    phone: values.phone.trim() || null,
    address: values.address.trim() || null,
    role: values.role,
  };
}

export function buildUpdatePayload(values: UserFormValues): UpdateUserPayload {
  const payload: UpdateUserPayload = {
    username: values.username.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    address: values.address.trim() || null,
    role: values.role,
  };

  // Only send a password when the manager actually typed a new one.
  if (values.password) {
    payload.password = values.password;
  }

  return payload;
}

export function validateUserForm(values: UserFormValues, mode: UserFormMode) {
  if (!values.username.trim()) {
    return 'Username is required.';
  }

  if (!values.email.trim()) {
    return 'Email is required.';
  }

  if (mode === 'create' && !values.password) {
    return 'Password is required.';
  }

  if (!values.role) {
    return 'Role is required.';
  }

  return '';
}

// A manager manages worker/client accounts in their company. Their own account and other
// managers are not editable/deletable here (self-delete is also blocked by the backend).
export function canManageUser(user: UserProfile, currentUserId: number | undefined) {
  return user.id !== currentUserId && (user.role === 'worker' || user.role === 'client');
}
