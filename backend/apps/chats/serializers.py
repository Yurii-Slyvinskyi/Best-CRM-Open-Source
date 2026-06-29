from rest_framework import serializers
from apps.chats.models import ChatMessage, ChatRoom


class ChatRoomField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        request = self.context.get('request')
        cached_room = getattr(request, '_chat_room', None)

        if cached_room and str(cached_room.pk) == str(data):
            return cached_room

        return super().to_internal_value(data)


class ChatMessageSerializer(serializers.ModelSerializer):
    room = ChatRoomField(queryset=ChatRoom.objects.all())
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'room', 'sender_username', 'content', 'timestamp']

    def validate(self, attrs):
        room = attrs.get('room')
        room_was_submitted = 'room' in getattr(self, 'initial_data', {})

        if self.instance and room_was_submitted and room and room.id != self.instance.room_id:
            raise serializers.ValidationError({
                "room": "Room cannot be changed after message creation."
            })

        return attrs
