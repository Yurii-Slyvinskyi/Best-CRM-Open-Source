import { Check, MailCheck, MailX } from 'lucide-react';
import type { Notification as ActivityNotification } from '../../../entities/notification';
import { cn } from '../../../shared/lib/cn';
import { formatDateTime } from '../../../shared/lib/format';
import {
  DataTable,
  DataTableBody,
  DataTableEmptyRow,
  DataTableHeader,
  DataTableShell,
} from '../../../shared/ui/data-table';

type NotificationTableProps = {
  notifications: ActivityNotification[];
  markingNotificationId: number | null;
  isMarkingAll: boolean;
  onMarkAsRead: (notification: ActivityNotification) => void;
  emptyMessage?: string;
};

export function NotificationTable({
  notifications,
  markingNotificationId,
  isMarkingAll,
  onMarkAsRead,
  emptyMessage,
}: NotificationTableProps) {
  return (
    <DataTableShell>
      <DataTable>
        <DataTableHeader>
          <tr>
            <th className="min-w-[14rem] px-4 py-4">Subject</th>
            <th className="min-w-[24rem] px-4 py-4">Message</th>
            <th className="min-w-[12rem] px-4 py-4">Created at</th>
            <th className="min-w-[10rem] px-4 py-4">Email status</th>
            <th className="min-w-[9rem] px-4 py-4">Status</th>
            <th className="min-w-[10rem] px-4 py-4 text-right">Actions</th>
          </tr>
        </DataTableHeader>
        <DataTableBody>
          {notifications.length === 0 && emptyMessage && (
            <DataTableEmptyRow colSpan={6} message={emptyMessage} />
          )}
          {notifications.map((notification) => {
            const EmailIcon = notification.email_sent ? MailCheck : MailX;

            return (
              <tr key={notification.id} className={!notification.is_read ? 'bg-blue-50/35' : undefined}>
                <td className="min-w-[14rem] px-4 py-4 font-semibold text-gray-950">
                  <span className="flex items-center gap-2">
                    {!notification.is_read && (
                      <span className="h-2 w-2 rounded-full bg-blue-700" aria-hidden="true" />
                    )}
                    {notification.subject}
                  </span>
                </td>
                <td className="min-w-[24rem] px-4 py-4 leading-6 text-gray-700">
                  {notification.message}
                </td>
                <td className="min-w-[12rem] px-4 py-4 text-gray-700">
                  {formatDateTime(notification.created_at)}
                </td>
                <td className="min-w-[10rem] px-4 py-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold',
                      notification.email_sent
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600',
                    )}
                  >
                    <EmailIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {notification.email_sent ? 'Email sent' : 'Not sent'}
                  </span>
                </td>
                <td className="min-w-[9rem] px-4 py-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold',
                      notification.is_read
                        ? 'border-gray-200 bg-gray-50 text-gray-600'
                        : 'border-blue-200 bg-blue-50 text-blue-700',
                    )}
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {notification.is_read ? 'Read' : 'Unread'}
                  </span>
                </td>
                <td className="min-w-[10rem] px-4 py-4 text-right">
                  {!notification.is_read ? (
                    <button
                      type="button"
                      onClick={() => onMarkAsRead(notification)}
                      disabled={markingNotificationId === notification.id || isMarkingAll}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950 disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      {markingNotificationId === notification.id ? 'Marking…' : 'Mark as read'}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">No actions</span>
                  )}
                </td>
              </tr>
            );
          })}
        </DataTableBody>
      </DataTable>
    </DataTableShell>
  );
}
