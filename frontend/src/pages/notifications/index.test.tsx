import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Notification as ActivityNotification } from '../../entities/notification';
import { NotificationsPage } from './index';

const notificationMocks = vi.hoisted(() => ({
  getNotifications: vi.fn(),
  getUnreadNotificationsCount: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
  markNotificationAsRead: vi.fn(),
}));

vi.mock('../../entities/notification', () => notificationMocks);

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

describe('NotificationsPage', () => {
  beforeEach(() => {
    notificationMocks.getNotifications.mockReset();
    notificationMocks.getUnreadNotificationsCount.mockReset();
    notificationMocks.markAllNotificationsAsRead.mockReset();
    notificationMocks.markNotificationAsRead.mockReset();
  });

  it('renders loading state while notifications are loading', () => {
    notificationMocks.getNotifications.mockReturnValue(new Promise(() => {}));

    render(<NotificationsPage />);

    expect(screen.getByText('Loading notifications')).toBeInTheDocument();
    expect(screen.getByText('Fetching the latest activity for your account.')).toBeInTheDocument();
  });

  it('renders error state when notifications fail to load', async () => {
    notificationMocks.getNotifications.mockRejectedValue(new Error('Network failed'));

    render(<NotificationsPage />);

    expect(await screen.findByText('Unable to load notifications')).toBeInTheDocument();
    expect(screen.getByText('Notifications could not be loaded. Please try again.')).toBeInTheDocument();
  });

  it('renders empty state when there are no notifications', async () => {
    notificationMocks.getNotifications.mockResolvedValue([]);

    render(<NotificationsPage />);

    expect(await screen.findByText('No notifications found')).toBeInTheDocument();
    expect(screen.getByText('Activity created by backend notification tasks will appear here.')).toBeInTheDocument();
  });

  it('renders notifications and filters them through the page toolbar', async () => {
    const firstNotification = makeNotification({
      id: 1,
      subject: 'Invoice paid',
      message: 'Client payment received',
      created_at: '2026-06-18T10:30:00Z',
    });
    const secondNotification = makeNotification({
      id: 2,
      subject: 'Worklog submitted',
      message: 'Worker logged hours',
      email_sent: false,
      created_at: '2026-06-17T10:30:00Z',
    });
    const user = userEvent.setup();

    notificationMocks.getNotifications.mockResolvedValue([firstNotification, secondNotification]);

    const { container } = render(<NotificationsPage />);

    expect(await screen.findByText('Invoice paid')).toBeInTheDocument();
    expect(screen.getByText('Worklog submitted')).toBeInTheDocument();
    expect(screen.getByText('June 18, 2026')).toBeInTheDocument();
    expect(screen.getByText('June 17, 2026')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search subject or message'), 'invoice');

    expect(screen.getByText('Invoice paid')).toBeInTheDocument();
    expect(screen.queryByText('Worklog submitted')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('Showing 1 of 2 notifications');
  });

  it('marks an unread notification as read through the notification API', async () => {
    const user = userEvent.setup();
    const unreadNotification = makeNotification({
      id: 7,
      subject: 'Project updated',
      is_read: false,
      read_at: null,
    });
    const readNotification = {
      ...unreadNotification,
      is_read: true,
      read_at: '2026-06-18T11:00:00Z',
    };

    notificationMocks.getNotifications.mockResolvedValue([unreadNotification]);
    notificationMocks.markNotificationAsRead.mockResolvedValue(readNotification);

    render(<NotificationsPage />);

    expect(await screen.findByText('Project updated')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mark as read' }));

    await waitFor(() => {
      expect(notificationMocks.markNotificationAsRead).toHaveBeenCalledWith(7);
    });
    expect(await screen.findByText('Read')).toBeInTheDocument();
    expect(screen.getByText('No actions')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark as read' })).not.toBeInTheDocument();
  });
});
