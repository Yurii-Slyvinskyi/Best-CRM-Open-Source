import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Notification as ActivityNotification } from '../../../entities/notification';
import { NotificationGroup } from './notification-group';
import { NotificationTable } from './notification-table';

function makeNotification(overrides: Partial<ActivityNotification> = {}): ActivityNotification {
  return {
    id: 1,
    company: 1,
    recipient: 10,
    subject: 'Project updated',
    message: 'Project status changed',
    email_sent: true,
    is_read: false,
    read_at: null,
    created_at: '2026-06-18T10:30:00Z',
    ...overrides,
  };
}

function renderTable({
  notifications,
  markingNotificationId = null,
  isMarkingAll = false,
  onMarkAsRead = vi.fn(),
  emptyMessage,
}: {
  notifications: ActivityNotification[];
  markingNotificationId?: number | null;
  isMarkingAll?: boolean;
  onMarkAsRead?: ReturnType<typeof vi.fn>;
  emptyMessage?: string;
}) {
  render(
    <NotificationTable
      notifications={notifications}
      markingNotificationId={markingNotificationId}
      isMarkingAll={isMarkingAll}
      onMarkAsRead={onMarkAsRead}
      emptyMessage={emptyMessage}
    />,
  );

  return { onMarkAsRead };
}

describe('NotificationTable', () => {
  it('renders unread and read states with current actions', async () => {
    const user = userEvent.setup();
    const unread = makeNotification({ id: 1, subject: 'Unread notice', is_read: false });
    const read = makeNotification({ id: 2, subject: 'Read notice', is_read: true, read_at: '2026-06-18T11:00:00Z' });
    const { onMarkAsRead } = renderTable({ notifications: [unread, read] });

    expect(screen.getByText('Unread notice')).toBeInTheDocument();
    expect(screen.getByText('Read notice')).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('No actions')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mark as read' }));

    expect(onMarkAsRead).toHaveBeenCalledWith(unread);
  });

  it('renders empty message when provided', () => {
    renderTable({
      notifications: [],
      emptyMessage: 'No notifications match the selected filters.',
    });

    expect(screen.getByText('No notifications match the selected filters.')).toBeInTheDocument();
  });

  it('disables mark-as-read while a notification is marking or all are marking', () => {
    renderTable({
      notifications: [makeNotification({ id: 1 })],
      markingNotificationId: 1,
    });

    expect(screen.getByRole('button', { name: 'Marking…' })).toBeDisabled();
  });
});

describe('NotificationGroup', () => {
  it('renders a formatted day heading and grouped notification count', () => {
    render(
      <NotificationGroup
        day="2026-06-18"
        notifications={[makeNotification({ id: 1 }), makeNotification({ id: 2 })]}
        markingNotificationId={null}
        isMarkingAll={false}
        onMarkAsRead={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'June 18, 2026' })).toBeInTheDocument();
    expect(screen.getByText('2 notifications')).toBeInTheDocument();
  });
});
