import { describe, expect, it } from 'vitest';
import type { UserProfile } from '../../../entities/user';
import {
  buildCreatePayload,
  buildUpdatePayload,
  canManageUser,
  getEditUserFormValues,
  validateUserForm,
  type UserFormValues,
} from './users-helpers';

function makeFormValues(overrides: Partial<UserFormValues> = {}): UserFormValues {
  return {
    username: '  new_user  ',
    email: '  user@example.com  ',
    password: 'Secret123!',
    phone: '  555-0100  ',
    address: '  123 Main Street  ',
    role: 'worker',
    ...overrides,
  };
}

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 1,
    username: 'demo_user',
    email: 'user@example.com',
    role: 'worker',
    phone: null,
    address: null,
    company: 'Acme',
    ...overrides,
  };
}

describe('buildCreatePayload', () => {
  it('trims fields and includes the password', () => {
    expect(buildCreatePayload(makeFormValues())).toEqual({
      username: 'new_user',
      email: 'user@example.com',
      password: 'Secret123!',
      phone: '555-0100',
      address: '123 Main Street',
      role: 'worker',
    });
  });

  it('converts blank optional fields to null', () => {
    expect(buildCreatePayload(makeFormValues({ phone: '   ', address: '' }))).toEqual(
      expect.objectContaining({ phone: null, address: null }),
    );
  });
});

describe('buildUpdatePayload', () => {
  it('omits the password when left blank', () => {
    expect(buildUpdatePayload(makeFormValues({ password: '' }))).toEqual({
      username: 'new_user',
      email: 'user@example.com',
      phone: '555-0100',
      address: '123 Main Street',
      role: 'worker',
    });
  });

  it('includes the password only when provided', () => {
    expect(buildUpdatePayload(makeFormValues({ password: 'Changed_99!' }))).toEqual(
      expect.objectContaining({ password: 'Changed_99!' }),
    );
  });

  it('converts blank optional fields to null', () => {
    const payload = buildUpdatePayload(makeFormValues({ phone: '  ', address: '' }));
    expect(payload.phone).toBeNull();
    expect(payload.address).toBeNull();
  });
});

describe('getEditUserFormValues', () => {
  it('prefills the form from the user with an empty password', () => {
    expect(getEditUserFormValues(makeUser({
      username: 'jane',
      email: 'jane@example.com',
      role: 'client',
      phone: '555',
      address: 'Street',
    }))).toEqual({
      username: 'jane',
      email: 'jane@example.com',
      password: '',
      phone: '555',
      address: 'Street',
      role: 'client',
    });
  });

  it('normalizes null phone/address to empty strings', () => {
    const values = getEditUserFormValues(makeUser({ phone: null, address: null }));
    expect(values.phone).toBe('');
    expect(values.address).toBe('');
  });
});

describe('validateUserForm', () => {
  it('requires a password only when creating', () => {
    expect(validateUserForm(makeFormValues({ password: '' }), 'create')).toBe('Password is required.');
    expect(validateUserForm(makeFormValues({ password: '' }), 'edit')).toBe('');
  });

  it('requires username and email in both modes', () => {
    expect(validateUserForm(makeFormValues({ username: '  ' }), 'edit')).toBe('Username is required.');
    expect(validateUserForm(makeFormValues({ email: '  ' }), 'edit')).toBe('Email is required.');
  });
});

describe('canManageUser', () => {
  it('allows managing worker and client accounts that are not the current user', () => {
    expect(canManageUser(makeUser({ id: 2, role: 'worker' }), 1)).toBe(true);
    expect(canManageUser(makeUser({ id: 3, role: 'client' }), 1)).toBe(true);
  });

  it('blocks managing the current user and other managers', () => {
    expect(canManageUser(makeUser({ id: 1, role: 'worker' }), 1)).toBe(false);
    expect(canManageUser(makeUser({ id: 2, role: 'manager' }), 1)).toBe(false);
  });
});
