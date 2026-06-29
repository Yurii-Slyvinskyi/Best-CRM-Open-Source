import { apiClient } from '../../../shared/api';
import type { MarkAllNotificationsReadResponse, Notification, UnreadNotificationsCount } from '../model/types';

export function getNotifications(): Promise<Notification[]> {
  return apiClient<Notification[]>('/api/notifications/');
}

export function getUnreadNotificationsCount(): Promise<UnreadNotificationsCount> {
  return apiClient<UnreadNotificationsCount>('/api/notifications/unread-count/');
}

export function markNotificationAsRead(id: number): Promise<Notification> {
  return apiClient<Notification>(`/api/notifications/${id}/mark-read/`, {
    method: 'POST',
  });
}

export function markAllNotificationsAsRead(): Promise<MarkAllNotificationsReadResponse> {
  return apiClient<MarkAllNotificationsReadResponse>('/api/notifications/mark-all-read/', {
    method: 'POST',
  });
}
