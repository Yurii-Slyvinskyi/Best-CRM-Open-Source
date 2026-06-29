import type { Notification as ActivityNotification } from '../../../entities/notification';

export const emailStatusOptions = [
  { value: '', label: 'All email statuses' },
  { value: 'sent', label: 'Email sent' },
  { value: 'not-sent', label: 'Not sent' },
];

export type NotificationFilters = {
  search: string;
  emailStatusFilter: string;
  dateFilter: string;
};

export function getCreatedAtDay(value: string) {
  return value.slice(0, 10);
}

export function formatDay(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export function groupNotificationsByDay(notifications: ActivityNotification[]) {
  return notifications.reduce<Array<{ day: string; notifications: ActivityNotification[] }>>(
    (groups, notification) => {
      const day = getCreatedAtDay(notification.created_at);
      const currentGroup = groups[groups.length - 1];

      if (currentGroup?.day === day) {
        currentGroup.notifications.push(notification);
      } else {
        groups.push({ day, notifications: [notification] });
      }

      return groups;
    },
    [],
  );
}

export function filterNotifications(
  notifications: ActivityNotification[],
  { search, emailStatusFilter, dateFilter }: NotificationFilters,
) {
  const normalizedSearch = search.trim().toLowerCase();

  return notifications.filter((notification) => {
    const matchesSearch = !normalizedSearch || [
      notification.subject,
      notification.message,
    ].some((value) => value.toLowerCase().includes(normalizedSearch));
    const matchesEmailStatus = !emailStatusFilter
      || (emailStatusFilter === 'sent' && notification.email_sent)
      || (emailStatusFilter === 'not-sent' && !notification.email_sent);
    const matchesDate = !dateFilter || getCreatedAtDay(notification.created_at) === dateFilter;

    return matchesSearch && matchesEmailStatus && matchesDate;
  });
}

export function getNotificationCounts(notifications: ActivityNotification[]) {
  return {
    emailSent: notifications.filter((notification) => notification.email_sent).length,
    unread: notifications.filter((notification) => !notification.is_read).length,
  };
}

export function replaceReadNotification(
  notifications: ActivityNotification[],
  updatedNotification: ActivityNotification,
) {
  return notifications.map((notification) => (
    notification.id === updatedNotification.id ? updatedNotification : notification
  ));
}

export function markNotificationsReadLocally(
  notifications: ActivityNotification[],
  readAt: string,
) {
  return notifications.map((notification) => (
    notification.is_read
      ? notification
      : { ...notification, is_read: true, read_at: notification.read_at ?? readAt }
  ));
}
