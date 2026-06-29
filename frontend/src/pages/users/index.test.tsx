import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserProfile } from '../../entities/user';
import { UsersPage } from './index';

const userMocks = vi.hoisted(() => ({
  getUsers: vi.fn(),
  registerUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock('../../entities/user', () => userMocks);

vi.mock('../../features/auth', () => ({
  useAuth: () => ({ user: { id: 1, username: 'manager_one', role: 'manager' } }),
}));

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 2,
    username: 'worker_one',
    email: 'worker@example.com',
    role: 'worker',
    phone: '555-0100',
    address: '123 Main Street',
    company: 'Acme',
    ...overrides,
  };
}

function getEditForm() {
  // Both the responsive cards and the table render an Edit trigger; either opens the
  // single modal form.
  return screen.getByLabelText('Username').closest('form') as HTMLFormElement;
}

async function openEditModal(user: ReturnType<typeof userEvent.setup>) {
  const editButtons = await screen.findAllByRole('button', { name: 'Edit' });
  await user.click(editButtons[0]);
}

describe('UsersPage editing', () => {
  beforeEach(() => {
    userMocks.getUsers.mockReset();
    userMocks.registerUser.mockReset();
    userMocks.updateUser.mockReset();
    userMocks.deleteUser.mockReset();
  });

  it('opens the edit modal prefilled with the selected user', async () => {
    const user = userEvent.setup();
    userMocks.getUsers.mockResolvedValue([makeUser()]);

    render(<UsersPage />);
    await openEditModal(user);

    const form = getEditForm();
    expect(within(form).getByLabelText('Username')).toHaveValue('worker_one');
    expect(within(form).getByLabelText('Email')).toHaveValue('worker@example.com');
    expect(within(form).getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('submits an update payload and replaces the row without reloading', async () => {
    const user = userEvent.setup();
    userMocks.getUsers.mockResolvedValue([makeUser()]);
    userMocks.updateUser.mockResolvedValue(makeUser({ username: 'worker_renamed', role: 'client' }));

    render(<UsersPage />);
    await openEditModal(user);

    const form = getEditForm();
    await user.clear(within(form).getByLabelText('Username'));
    await user.type(within(form).getByLabelText('Username'), 'worker_renamed');
    await user.selectOptions(within(form).getByLabelText('Role'), 'client');
    await user.click(within(form).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(userMocks.updateUser).toHaveBeenCalledWith(2, {
        username: 'worker_renamed',
        email: 'worker@example.com',
        phone: '555-0100',
        address: '123 Main Street',
        role: 'client',
      });
    });

    expect(await screen.findByText('User "worker_renamed" updated.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument();
    expect(userMocks.getUsers).toHaveBeenCalledTimes(1);
  });

  it('keeps the modal open and shows an error when the update fails', async () => {
    const user = userEvent.setup();
    userMocks.getUsers.mockResolvedValue([makeUser()]);
    userMocks.updateUser.mockRejectedValue(new Error('Server error'));

    render(<UsersPage />);
    await openEditModal(user);

    const form = getEditForm();
    await user.click(within(form).getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('User could not be updated.')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('deletes a user after confirmation and removes the row', async () => {
    const user = userEvent.setup();
    userMocks.getUsers.mockResolvedValue([makeUser()]);
    userMocks.deleteUser.mockResolvedValue(undefined);

    render(<UsersPage />);
    await openEditModal(user);

    const form = getEditForm();
    await user.click(within(form).getByRole('button', { name: 'Delete user' }));
    // Confirmation required before the API call.
    expect(userMocks.deleteUser).not.toHaveBeenCalled();

    await user.click(within(form).getByRole('button', { name: 'Delete user' }));

    await waitFor(() => {
      expect(userMocks.deleteUser).toHaveBeenCalledWith(2);
    });
    expect(await screen.findByText('User "worker_one" deleted.')).toBeInTheDocument();
    expect(screen.queryByText('worker@example.com')).not.toBeInTheDocument();
  });
});
