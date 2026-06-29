import pytest
from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from django.contrib.auth.models import AnonymousUser
from django.urls import path
from rest_framework_simplejwt.tokens import AccessToken

from apps.chats.consumers import ChatConsumer
from apps.chats.middleware import JWTAuthMiddleware
from apps.chats.models import ChatRoom, ChatMessage
from apps.projects.models import Project
from apps.teams.models import Team
from apps.users.models import User


@database_sync_to_async
def get_chat_message(message_id):
    return ChatMessage.objects.select_related('room__project', 'sender').get(id=message_id)


@pytest.fixture(autouse=True)
def in_memory_channel_layer(settings):
    settings.CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        },
    }


@pytest.fixture
def websocket_application():
    return URLRouter([
        path("ws/chat/<int:project_id>/", ChatConsumer.as_asgi()),
    ])


@pytest.fixture
def jwt_application(websocket_application):
    return JWTAuthMiddleware(
        AuthMiddlewareStack(websocket_application)
    )


@pytest.fixture
def client2(db, company2):
    return User.objects.create_user(
        username="client2",
        email="client2@example.com",
        password="ClientPass_123",
        role="client",
        company=company2
    )


@pytest.fixture
def client3(db, company1):
    return User.objects.create_user(
        username="client3",
        email="client3@example.com",
        password="ClientPass_123",
        role="client",
        company=company1
    )


@pytest.fixture
def worker3(db, company1):
    return User.objects.create_user(
        username="worker3",
        email="worker3@example.com",
        password="WorkerPass_123",
        role="worker",
        company=company1
    )


@pytest.fixture
def other_project(db, company2, client2):
    return Project.objects.create(
        name="Other Company Project",
        description="Test Desc",
        status="pending",
        client=client2,
        address="123 Test St",
        priority="medium",
        company=company2
    )


@pytest.fixture
def other_chat_room(db, other_project):
    return ChatRoom.objects.create(project=other_project)


@pytest.fixture
def unassigned_chat_room(db, company1, client1, worker3):
    team = Team.objects.create(name="Other Worker Team", company=company1)
    team.workers.set([worker3])
    project = Project.objects.create(
        name="Unassigned Same Company Project",
        description="Test Desc",
        status="pending",
        client=client1,
        address="123 Test St",
        priority="medium",
        company=company1
    )
    project.assigned_team.set([team])
    return ChatRoom.objects.create(project=project)


@pytest.fixture
def other_client_chat_room(db, company1, client3):
    project = Project.objects.create(
        name="Other Client Project",
        description="Test Desc",
        status="pending",
        client=client3,
        address="123 Test St",
        priority="medium",
        company=company1
    )
    return ChatRoom.objects.create(project=project)


@pytest.fixture
def mismatched_chat_room(db, company1, client1):
    project = Project.objects.create(
        id=900001,
        name="Project ID Contract",
        description="Test Desc",
        status="pending",
        client=client1,
        address="123 Test St",
        priority="medium",
        company=company1
    )
    return ChatRoom.objects.create(project=project)


def auth_headers(user):
    return [(b"authorization", f"Bearer {AccessToken.for_user(user)}".encode())]


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
class TestChatWebSocketAuthorization:

    def chat_path(self, chat_room):
        return f"/ws/chat/{chat_room.project_id}/"

    async def assert_rejected(self, communicator, close_code):
        connected, code = await communicator.connect()
        assert connected is False
        assert code == close_code
        await communicator.wait()

    async def test_anonymous_websocket_connection_is_rejected(self, websocket_application, chat_room1):
        communicator = WebsocketCommunicator(
            websocket_application,
            self.chat_path(chat_room1)
        )
        communicator.scope["user"] = AnonymousUser()

        await self.assert_rejected(communicator, 4001)

    async def test_missing_jwt_anonymous_user_is_rejected(self, jwt_application, chat_room1):
        communicator = WebsocketCommunicator(
            jwt_application,
            self.chat_path(chat_room1)
        )

        await self.assert_rejected(communicator, 4001)

    async def test_invalid_jwt_anonymous_user_is_rejected(self, jwt_application, chat_room1):
        communicator = WebsocketCommunicator(
            jwt_application,
            self.chat_path(chat_room1),
            headers=[(b"authorization", b"Bearer invalid-token")]
        )

        await self.assert_rejected(communicator, 4001)

    async def test_other_company_user_is_rejected(self, jwt_application, worker1, other_chat_room):
        communicator = WebsocketCommunicator(
            jwt_application,
            self.chat_path(other_chat_room),
            headers=auth_headers(worker1)
        )

        await self.assert_rejected(communicator, 4003)

    async def test_assigned_worker_can_connect(self, jwt_application, worker1, chat_room1):
        communicator = WebsocketCommunicator(
            jwt_application,
            self.chat_path(chat_room1),
            headers=auth_headers(worker1)
        )

        connected, _ = await communicator.connect()

        assert connected is True

        await communicator.disconnect()

    async def test_same_company_unassigned_worker_is_rejected(self, jwt_application, worker1, unassigned_chat_room):
        communicator = WebsocketCommunicator(
            jwt_application,
            self.chat_path(unassigned_chat_room),
            headers=auth_headers(worker1)
        )

        await self.assert_rejected(communicator, 4003)

    async def test_project_client_can_connect(self, jwt_application, client1, chat_room1):
        communicator = WebsocketCommunicator(
            jwt_application,
            self.chat_path(chat_room1),
            headers=auth_headers(client1)
        )

        connected, _ = await communicator.connect()

        assert connected is True

        await communicator.disconnect()

    async def test_same_company_other_client_is_rejected(self, jwt_application, client1, other_client_chat_room):
        communicator = WebsocketCommunicator(
            jwt_application,
            self.chat_path(other_client_chat_room),
            headers=auth_headers(client1)
        )

        await self.assert_rejected(communicator, 4003)

    async def test_manager_same_company_can_connect(self, jwt_application, manager1, chat_room1):
        communicator = WebsocketCommunicator(
            jwt_application,
            self.chat_path(chat_room1),
            headers=auth_headers(manager1)
        )

        connected, _ = await communicator.connect()

        assert connected is True

        await communicator.disconnect()

    async def test_chat_room_id_route_value_is_not_assumed_valid(self, jwt_application, worker1, mismatched_chat_room):
        assert mismatched_chat_room.id != mismatched_chat_room.project_id

        communicator = WebsocketCommunicator(
            jwt_application,
            f"/ws/chat/{mismatched_chat_room.id}/",
            headers=auth_headers(worker1)
        )

        await self.assert_rejected(communicator, 4003)

    async def test_nonexistent_project_is_rejected(self, jwt_application, worker1):
        communicator = WebsocketCommunicator(
            jwt_application,
            "/ws/chat/999999/",
            headers=auth_headers(worker1)
        )

        await self.assert_rejected(communicator, 4003)

    async def test_authorized_user_can_send_and_receive_message(self, jwt_application, worker1, chat_room1):
        communicator = WebsocketCommunicator(
            jwt_application,
            self.chat_path(chat_room1),
            headers=auth_headers(worker1)
        )

        connected, _ = await communicator.connect()
        assert connected is True

        await communicator.send_json_to({"message": "Hello websocket"})
        response = await communicator.receive_json_from()

        assert response["sender"] == worker1.username
        assert response["text"] == "Hello websocket"
        assert "id" in response
        assert "timestamp" in response

        chat_message = await get_chat_message(response["id"])
        assert chat_message.sender_id == worker1.id
        assert chat_message.room_id == chat_room1.id
        assert chat_message.room.project_id == chat_room1.project_id
        assert chat_message.content == "Hello websocket"

        await communicator.disconnect()
