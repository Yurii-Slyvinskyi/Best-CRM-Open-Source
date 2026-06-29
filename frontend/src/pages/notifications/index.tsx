import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type Notification as ActivityNotification,
} from '../../entities/notification';
import { getApiErrorMessage } from '../../shared/api';
import { formatDateTime } from '../../shared/lib/format';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { LoadingState } from '../../shared/ui/loading-state';
import { PageShell } from '../../shared/ui/page-shell';
import {
  filterNotifications,
  getNotificationCounts,
  groupNotificationsByDay,
  markNotificationsReadLocally,
  replaceReadNotification,
} from './lib/notifications-helpers';
import { NotificationGroup } from './ui/notification-group';
import { NotificationStats } from './ui/notification-stats';
import { NotificationTable } from './ui/notification-table';
import { NotificationToolbar } from './ui/notification-toolbar';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [emailStatusFilter, setEmailStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [actionError, setActionError] = useState('');
  const [markingNotificationId, setMarkingNotificationId] = useState<number | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await getNotifications();
      setNotifications(result);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Notifications could not be loaded. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  function resetFilters() {
    setSearch('');
    setEmailStatusFilter('');
    setDateFilter('');
  }

  async function handleMarkAsRead(notification: ActivityNotification) {
    if (notification.is_read) {
      return;
    }

    setActionError('');
    setMarkingNotificationId(notification.id);

    try {
      const updatedNotification = await markNotificationAsRead(notification.id);
      setNotifications((currentNotifications) => replaceReadNotification(currentNotifications, updatedNotification));
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Notification could not be marked as read. Please try again.'));
    } finally {
      setMarkingNotificationId(null);
    }
  }

  async function handleMarkAllAsRead() {
    setActionError('');
    setIsMarkingAll(true);

    try {
      await markAllNotificationsAsRead();
      const readAt = new Date().toISOString();
      setNotifications((currentNotifications) => markNotificationsReadLocally(currentNotifications, readAt));
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Notifications could not be marked as read. Please try again.'));
    } finally {
      setIsMarkingAll(false);
    }
  }

  const filteredNotifications = useMemo(() => {
    return filterNotifications(notifications, { search, emailStatusFilter, dateFilter });
  }, [dateFilter, emailStatusFilter, notifications, search]);

  const groupedNotifications = useMemo(
    () => groupNotificationsByDay(filteredNotifications),
    [filteredNotifications],
  );

  const notificationCounts = useMemo(() => getNotificationCounts(notifications), [notifications]);

  const latestNotificationDate = notifications[0]
    ? formatDateTime(notifications[0].created_at)
    : '—';

  const hasActiveFilters = Boolean(search || emailStatusFilter || dateFilter);

  return (
    <PageShell
      title="Notifications"
      subtitle="Read-only activity feed for project, payment, worklog, and review events."
      width="wide"
    >
      {isLoading && (
        <LoadingState
          title="Loading notifications"
          description="Fetching the latest activity for your account."
        />
      )}

      {!isLoading && error && (
        <ErrorState title="Unable to load notifications" message={error} />
      )}

      {!isLoading && !error && notifications.length === 0 && (
        <EmptyState
          icon={Bell}
          title="No notifications found"
          description="Activity created by backend notification tasks will appear here."
        />
      )}

      {!isLoading && !error && notifications.length > 0 && (
        <>
          <NotificationStats
            total={notifications.length}
            unread={notificationCounts.unread}
            emailSent={notificationCounts.emailSent}
            latestDate={latestNotificationDate}
          />

          <NotificationToolbar
            search={search}
            emailStatusFilter={emailStatusFilter}
            dateFilter={dateFilter}
            hasActiveFilters={hasActiveFilters}
            filteredCount={filteredNotifications.length}
            totalCount={notifications.length}
            unreadCount={notificationCounts.unread}
            isMarkingAll={isMarkingAll}
            actionError={actionError}
            onSearchChange={setSearch}
            onEmailStatusChange={setEmailStatusFilter}
            onDateChange={setDateFilter}
            onReset={resetFilters}
            onMarkAllAsRead={handleMarkAllAsRead}
          />

          {filteredNotifications.length === 0 ? (
            <NotificationTable
              notifications={[]}
              markingNotificationId={markingNotificationId}
              isMarkingAll={isMarkingAll}
              onMarkAsRead={handleMarkAsRead}
              emptyMessage="No notifications match the selected filters."
            />
          ) : (
            <div className="space-y-5">
              {groupedNotifications.map((group) => (
                <NotificationGroup
                  key={group.day}
                  day={group.day}
                  notifications={group.notifications}
                  markingNotificationId={markingNotificationId}
                  isMarkingAll={isMarkingAll}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
