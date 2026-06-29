import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserProfile } from '../../../entities/user';
import { UserForm } from './user-form';

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 5,
    username: 'jane_worker',
    email: 'jane@example.com',
    role: 'client',
    phone: '555-0100',
    address: '123 Main Street',
    company: 'Acme',
    ...overrides,
  };
}

describe('UserForm (create mode)', () => {
  it('requires a password before submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<UserForm mode="create" onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText('Username'), 'new_user');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    // Bypass native required validation to reach the form's own validation message.
    fireEvent.submit(screen.getByRole('button', { name: 'Create user' }).closest('form') as HTMLFormElement);

    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('UserForm (edit mode)', () => {
  it('prefills the form with the current user values and an empty password', () => {
    render(
      <UserForm
        mode="edit"
        user={makeUser()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        onDelete={vi.fn()}
        canDelete
      />,
    );

    expect(screen.getByLabelText('Username')).toHaveValue('jane_worker');
    expect(screen.getByLabelText('Email')).toHaveValue('jane@example.com');
    expect(screen.getByLabelText('Role')).toHaveValue('client');
    expect(screen.getByLabelText('New password')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('submits the edited values to onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <UserForm mode="edit" user={makeUser()} onSubmit={onSubmit} onCancel={vi.fn()} onDelete={vi.fn()} canDelete />,
    );

    await user.clear(screen.getByLabelText('Username'));
    await user.type(screen.getByLabelText('Username'), 'jane_updated');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        username: 'jane_updated',
        role: 'client',
        password: '',
      }));
    });
  });

  it('requires a confirmation step before deleting', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(
      <UserForm mode="edit" user={makeUser()} onSubmit={vi.fn()} onCancel={vi.fn()} onDelete={onDelete} canDelete />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete user' }));

    // The destructive action is not fired until the confirmation is acknowledged.
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete user' }));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  it('disables delete when the user cannot be managed', () => {
    render(
      <UserForm
        mode="edit"
        user={makeUser()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        onDelete={vi.fn()}
        canDelete={false}
        deleteDisabledReason="You cannot delete your own account."
      />,
    );

    expect(screen.getByRole('button', { name: 'Delete user' })).toBeDisabled();
    expect(screen.getByText('You cannot delete your own account.')).toBeInTheDocument();
  });
});
