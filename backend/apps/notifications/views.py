from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer


def get_user_notifications(user):
    return Notification.objects.select_related('recipient', 'company').filter(
        company=user.company,
        recipient=user
    )


class NotificationListView(ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_user_notifications(self.request.user).order_by('-created_at')


class UnreadNotificationCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = get_user_notifications(request.user).filter(is_read=False).count()
        return Response({'count': count})


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        notification = get_object_or_404(get_user_notifications(request.user), pk=pk)

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=['is_read', 'read_at'])

        serializer = NotificationSerializer(notification)
        return Response(serializer.data)


class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = get_user_notifications(request.user).filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'updated': updated})
