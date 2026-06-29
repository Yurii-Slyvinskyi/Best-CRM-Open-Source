from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.chats.models import ChatMessage
from .permissions import IsChatParticipant
from .serializers import ChatMessageSerializer


class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.none()
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated, IsChatParticipant]

    def get_queryset(self):
        queryset = ChatMessage.objects.select_related(
            'room',
            'sender',
            'room__project',
            'room__project__company',
            'room__project__client'
        )

        user = self.request.user

        if user.is_superuser:
            pass
        elif user.role == "manager":
            queryset = queryset.filter(room__project__company=user.company)
        elif user.role == "worker":
            queryset = queryset.filter(
                room__project__company=user.company,
                room__project__assigned_team__workers=user
            ).distinct()
        elif user.role == "client":
            queryset = queryset.filter(
                room__project__company=user.company,
                room__project__client=user
            )
        else:
            queryset = queryset.none()

        room_id = self.request.query_params.get('room')
        if room_id:
            queryset = queryset.filter(room_id=room_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
