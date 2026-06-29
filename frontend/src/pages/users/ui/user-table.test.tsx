import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { UserProfile } from '../../../entities/user';
import { UserTable } from './user-table';

function renderTable(ui: Parameters<typeof render>[0]) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 1,
    username: 'worker_one',
    email: 'worker@example.com',
    role: 'worker',
    phone: null,
    address: null,
    company: 'Acme',
    ...overrides,
  };
}

describe('UserTable', () => {
  it('shows the role as read-only text without inline select or save controls', () => {
    renderTable(<UserTable users={[makeUser()]} currentUserId={99} onEdit={vi.fn()} />);

    expect(screen.getByText('Worker')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('renders an Edit button that triggers onEdit for manageable users', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const worker = makeUser({ id: 5 });

    renderTable(<UserTable users={[worker]} currentUserId={99} onEdit={onEdit} />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(onEdit).toHaveBeenCalledWith(worker);
  });

  it('does not offer a modal Edit for other managers', () => {
    renderTable(
      <UserTable
        users={[makeUser({ id: 1, role: 'manager' })]}
        currentUserId={2}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('links the current user to their profile instead of the edit modal', () => {
    renderTable(
      <UserTable
        users={[makeUser({ id: 2, role: 'manager' })]}
        currentUserId={2}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/profile');
  });
});
