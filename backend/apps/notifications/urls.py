from django.urls import path
from apps.notifications.views import (
    MarkAllNotificationsReadView,
    MarkNotificationReadView,
    NotificationListView,
    UnreadNotificationCountView,
)

app_name = 'notifications'

urlpatterns = [
    path('unread-count/', UnreadNotificationCountView.as_view(), name='notification-unread-count'),
    path('mark-all-read/', MarkAllNotificationsReadView.as_view(), name='notifications-mark-all-read'),
    path('<int:pk>/mark-read/', MarkNotificationReadView.as_view(), name='notification-mark-read'),
    path('', NotificationListView.as_view(), name='notifications'),
]
