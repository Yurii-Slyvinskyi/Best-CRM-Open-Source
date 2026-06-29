import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationToolbar } from './notification-toolbar';

type NotificationToolbarProps = Parameters<typeof NotificationToolbar>[0];

function renderToolbar(overrides: Partial<NotificationToolbarProps> = {}) {
  const props = {
    search: '',
    emailStatusFilter: '',
    dateFilter: '',
    hasActiveFilters: false,
    filteredCount: 2,
    totalCount: 3,
    unreadCount: 1,
    isMarkingAll: false,
    actionError: '',
    onSearchChange: vi.fn(),
    onEmailStatusChange: vi.fn(),
    onDateChange: vi.fn(),
    onReset: vi.fn(),
    onMarkAllAsRead: vi.fn(),
    ...overrides,
  };

  const result = render(<NotificationToolbar {...props} />);

  return { ...props, ...result };
}

describe('NotificationToolbar', () => {
  it('sends filter changes through controlled callbacks and shows result count', async () => {
    const user = userEvent.setup();
    const props = renderToolbar({ hasActiveFilters: true });

    fireEvent.change(screen.getByPlaceholderText('Search subject or message'), {
      target: { value: 'invoice' },
    });
    await user.selectOptions(screen.getByRole('combobox'), 'not-sent');
    const dateInput = props.container.querySelector('input[type="date"]') as HTMLInputElement;

    fireEvent.change(dateInput, {
      target: { value: '2026-06-18' },
    });
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(props.container).toHaveTextContent('Showing 2 of 3 notifications');
    expect(props.onSearchChange).toHaveBeenLastCalledWith('invoice');
    expect(props.onEmailStatusChange).toHaveBeenCalledWith('not-sent');
    expect(props.onDateChange).toHaveBeenLastCalledWith('2026-06-18');
    expect(props.onReset).toHaveBeenCalled();
  });

  it('renders mark-all action only when there are unread notifications', async () => {
    const user = userEvent.setup();
    const props = renderToolbar();

    await user.click(screen.getByRole('button', { name: 'Mark all as read' }));

    expect(props.onMarkAllAsRead).toHaveBeenCalled();
  });

  it('hides mark-all action with no unread notifications and renders action error', () => {
    renderToolbar({
      unreadCount: 0,
      actionError: 'Notifications could not be marked as read.',
    });

    expect(screen.queryByRole('button', { name: 'Mark all as read' })).not.toBeInTheDocument();
    expect(screen.getByText('Notifications could not be marked as read.')).toBeInTheDocument();
  });
});
