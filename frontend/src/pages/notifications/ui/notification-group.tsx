import type { Notification as ActivityNotification } from '../../../entities/notification';
import { formatDay } from '../lib/notifications-helpers';
import { NotificationTable } from './notification-table';

type NotificationGroupProps = {
  day: string;
  notifications: ActivityNotification[];
  markingNotificationId: number | null;
  isMarkingAll: boolean;
  onMarkAsRead: (notification: ActivityNotification) => void;
};

export function NotificationGroup({
  day,
  notifications,
  markingNotificationId,
  isMarkingAll,
  onMarkAsRead,
}: NotificationGroupProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-950">{formatDay(day)}</h2>
        <span className="text-xs text-gray-400">
          {notifications.length} notification{notifications.length === 1 ? '' : 's'}
        </span>
      </div>

      <NotificationTable
        notifications={notifications}
        markingNotificationId={markingNotificationId}
        isMarkingAll={isMarkingAll}
        onMarkAsRead={onMarkAsRead}
      />
    </section>
  );
}
