import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from apps.chats.models import ChatRoom, ChatMessage
import logging

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Connect to the chat room"""

        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.chat_group_name = f"chat_project_{self.project_id}"
        self.connected_to_group = False
        self.room = None

        logger.info(f"New WebSocket connection: Project {self.project_id}")

        user = self.scope["user"]
        if not user or not user.is_authenticated:
            logger.warning(f"Rejected unauthenticated WebSocket connection: Project {self.project_id}")
            await self.close(code=4001)
            return

        room = await self.get_room_for_project(user, self.project_id)
        if not room:
            logger.warning(f"Rejected unauthorized WebSocket connection: Project {self.project_id}, User {user}")
            await self.close(code=4003)
            return

        self.room = room

        # Join chat group
        await self.channel_layer.group_add(
            self.chat_group_name,
            self.channel_name
        )
        self.connected_to_group = True
        await self.accept()

    async def disconnect(self, close_code):
        """Leave the chat room"""
        if getattr(self, 'connected_to_group', False):
            await self.channel_layer.group_discard(
                self.chat_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """Handle incoming messages and broadcast them"""

        user = self.scope['user']
        logger.debug(f"Authenticated user: {self.scope['user']}")

        data = json.loads(text_data)
        message = data.get("message")

        if not message:
            return

        # Save message to DB
        chat_message = await self.save_message(user, self.project_id, message)

        if chat_message is None:
            await self.send(text_data=json.dumps({"error": "Chat room does not exist"}))
            return

        # Send message to chat group
        await self.channel_layer.group_send(
            self.chat_group_name,
            {
                "type": "chat_message",
                "message": {
                    "id": chat_message.id,
                    "sender": chat_message.sender.username,
                    "text": chat_message.content,
                    "timestamp": chat_message.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                }
            }
        )

    async def chat_message(self, event):
        """Send message to WebSocket"""
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def save_message(self, user, project_id, message):
        """Save a message to the database and return it"""

        try:
            room = ChatRoom.objects.select_related(
                'project',
                'project__company',
                'project__client'
            ).get(project_id=project_id)
        except ChatRoom.DoesNotExist:
            logger.error(f"ChatRoom with project_id={project_id} does not exist!")
            return None

        if not self.user_can_access_room(user, room):
            logger.warning(f"Rejected unauthorized WebSocket message: Project {project_id}, User {user}")
            return None

        return ChatMessage.objects.create(
            room=room,
            sender=user,
            content=message
        )

    @database_sync_to_async
    def get_room_for_project(self, user, project_id):
        """Return a chat room only when the user can access the project chat"""

        try:
            room = ChatRoom.objects.select_related(
                'project',
                'project__company',
                'project__client'
            ).get(project_id=project_id)
        except ChatRoom.DoesNotExist:
            logger.error(f"ChatRoom with project_id={project_id} does not exist!")
            return None

        if not self.user_can_access_room(user, room):
            return None

        return room

    def user_can_access_room(self, user, room):
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
