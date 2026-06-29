from rest_framework.permissions import BasePermission


class IsChatParticipant(BasePermission):
    """Allows access only to chat participants"""

    def user_can_access_room(self, user, room):
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        project = room.project

        if project.company_id != user.company_id:
            return False

        if user.role == "manager":
            return True

        if user.role == "worker":
            return project.assigned_team.filter(workers=user).exists()

        if user.role == "client":
            return project.client_id == user.id

        return False

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if view.action == 'create':
            room_id = request.data.get('room')
            if not room_id:
                return False

            try:
                from apps.chats.models import ChatRoom
                room = ChatRoom.objects.select_related(
                    'project',
                    'project__company',
                    'project__client'
                ).get(id=room_id)
                request._chat_room = room
                return self.user_can_access_room(request.user, room)

            except ChatRoom.DoesNotExist:
                return False

        return True

    def has_object_permission(self, request, view, obj):
        if not self.user_can_access_room(request.user, obj.room):
            return False

        if view.action in ('update', 'partial_update', 'destroy'):
            return obj.sender_id == request.user.id

        return True
