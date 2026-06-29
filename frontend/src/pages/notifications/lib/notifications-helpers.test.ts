import { describe, expect, it } from 'vitest';
import type { Notification as ActivityNotification } from '../../../entities/notification';
import {
  filterNotifications,
  formatDay,
  getCreatedAtDay,
  getNotificationCounts,
  groupNotificationsByDay,
  markNotificationsReadLocally,
  replaceReadNotification,
} from './notifications-helpers';

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

describe('notifications helpers', () => {
  it('groups notifications by adjacent created day preserving current order', () => {
    const first = makeNotification({ id: 1, created_at: '2026-06-18T10:30:00Z' });
    const second = makeNotification({ id: 2, created_at: '2026-06-18T08:30:00Z' });
    const third = makeNotification({ id: 3, created_at: '2026-06-17T12:00:00Z' });
    const fourth = makeNotification({ id: 4, created_at: '2026-06-18T07:00:00Z' });

    expect(groupNotificationsByDay([first, second, third, fourth])).toEqual([
      { day: '2026-06-18', notifications: [first, second] },
      { day: '2026-06-17', notifications: [third] },
      { day: '2026-06-18', notifications: [fourth] },
    ]);
  });

  it('filters by subject/message search, email status, and created date', () => {
    const notifications = [
      makeNotification({ id: 1, subject: 'Invoice paid', message: 'Stripe payment received', email_sent: true }),
      makeNotification({
        id: 2,
        subject: 'Worklog added',
        message: 'Worker logged hours',
        email_sent: false,
        created_at: '2026-06-17T09:00:00Z',
      }),
      makeNotification({ id: 3, subject: 'Project note', message: 'Crew changed', email_sent: false }),
    ];

    expect(filterNotifications(notifications, {
      search: ' stripe ',
      emailStatusFilter: '',
      dateFilter: '',
    })).toEqual([notifications[0]]);

    expect(filterNotifications(notifications, {
      search: '',
      emailStatusFilter: 'not-sent',
      dateFilter: '2026-06-18',
    })).toEqual([notifications[2]]);
  });

  it('computes read and email counts according to current behavior', () => {
    expect(getNotificationCounts([
      makeNotification({ id: 1, is_read: false, email_sent: true }),
      makeNotification({ id: 2, is_read: true, email_sent: true }),
      makeNotification({ id: 3, is_read: false, email_sent: false }),
    ])).toEqual({
      emailSent: 2,
      unread: 2,
    });
  });

  it('replaces a single read notification with the backend response', () => {
    const original = [
      makeNotification({ id: 1, is_read: false }),
      makeNotification({ id: 2, is_read: false }),
    ];
    const updated = makeNotification({ id: 2, is_read: true, read_at: '2026-06-18T11:00:00Z' });

    expect(replaceReadNotification(original, updated)).toEqual([original[0], updated]);
  });

  it('marks unread notifications as read locally without overwriting existing read_at', () => {
    const alreadyRead = makeNotification({
      id: 1,
      is_read: true,
      read_at: '2026-06-17T11:00:00Z',
    });
    const unread = makeNotification({ id: 2, is_read: false, read_at: null });

    expect(markNotificationsReadLocally([alreadyRead, unread], '2026-06-18T11:00:00Z')).toEqual([
      alreadyRead,
      { ...unread, is_read: true, read_at: '2026-06-18T11:00:00Z' },
    ]);
  });

  it('formats day labels and preserves invalid day strings', () => {
    expect(getCreatedAtDay('2026-06-18T10:30:00Z')).toBe('2026-06-18');
    expect(formatDay('2026-06-18')).toBe('June 18, 2026');
    expect(formatDay('not-a-day')).toBe('not-a-day');
  });
});
