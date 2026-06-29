import pytest
from rest_framework import status
from apps.chats.models import ChatRoom, ChatMessage
from apps.projects.models import Project
from apps.teams.models import Team
from apps.users.models import User


@pytest.mark.django_db
class TestChatAPI:

    def create_project(self, name, company, client, workers=None):
        project = Project.objects.create(
            name=name,
            description="Test Desc",
            status="pending",
            client=client,
            address="123 Test St",
            priority="medium",
            company=company
        )
        if workers:
            team = Team.objects.create(name=f"{name} Team", company=company)
            team.workers.set(workers)
            project.assigned_team.set([team])
        return project

    def test_chatroom_creation(self, project, chat_room1):
        assert ChatRoom.objects.count() == 1
        assert chat_room1.project == project

    def test_send_message(self, api_client, worker1, chat_room1):
        api_client.force_authenticate(user=worker1)
        data = {
            "room": chat_room1.id,
            "sender": worker1.id,
            "content": "Test message"
        }
        response = api_client.post('/api/chats/messages/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert ChatMessage.objects.count() == 1

        message = ChatMessage.objects.first()
        assert message.room == chat_room1
        assert message.sender == worker1
        assert message.content == "Test message"

    def test_send_message_uses_request_user_as_sender(self, api_client, worker1, worker2, chat_room1):
        api_client.force_authenticate(user=worker1)
        data = {
            "room": chat_room1.id,
            "sender": worker2.id,
            "content": "Sender spoof attempt"
        }

        response = api_client.post('/api/chats/messages/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        message = ChatMessage.objects.get(id=response.data["id"])
        assert message.sender == worker1
        assert message.sender != worker2

    def test_unauthorized_user_cannot_send_message(self, api_client, worker2, chat_room1):
        api_client.force_authenticate(user=worker2)
        data = {
            "room": chat_room1.id,
            "sender": worker2.id,
            "content": "Unauthorized message"
        }
        response = api_client.post('/api/chats/messages/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert ChatMessage.objects.count() == 0

    def test_sender_can_update_message_content(self, api_client, worker1, chat_message1):
        original_room_id = chat_message1.room_id

        api_client.force_authenticate(user=worker1)
        response = api_client.patch(
            f'/api/chats/messages/{chat_message1.id}/',
            {"content": "Updated"},
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        chat_message1.refresh_from_db()
        assert chat_message1.content == "Updated"
        assert chat_message1.room_id == original_room_id

    def test_participant_cannot_patch_someone_elses_message(self, api_client, manager1, chat_message1):
        original_content = chat_message1.content

        api_client.force_authenticate(user=manager1)
        response = api_client.patch(
            f'/api/chats/messages/{chat_message1.id}/',
            {"content": "Manager edit attempt"},
            format='json'
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        chat_message1.refresh_from_db()
        assert chat_message1.content == original_content

    def test_message_room_cannot_be_changed_to_accessible_room(self, api_client, worker1, client1, company1, chat_message1):
        second_project = self.create_project("Second Project", company1, client1, [worker1])
        second_room = ChatRoom.objects.create(project=second_project)
        original_room_id = chat_message1.room_id

        api_client.force_authenticate(user=worker1)
        response = api_client.patch(
            f'/api/chats/messages/{chat_message1.id}/',
            {"room": second_room.id},
            format='json'
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "room" in response.data
        chat_message1.refresh_from_db()
        assert chat_message1.room_id == original_room_id

    def test_message_room_cannot_be_changed_to_unauthorized_room(self, api_client, worker1, client1, company1, chat_message1):
        other_worker = User.objects.create_user(
            username="worker3",
            email="worker3@example.com",
            password="WorkerPass_123",
            role="worker",
            company=company1
        )
        hidden_project = self.create_project("Unassigned Project", company1, client1, [other_worker])
        hidden_room = ChatRoom.objects.create(project=hidden_project)
        original_room_id = chat_message1.room_id

        api_client.force_authenticate(user=worker1)
        response = api_client.patch(
            f'/api/chats/messages/{chat_message1.id}/',
            {"room": hidden_room.id},
            format='json'
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "room" in response.data
        chat_message1.refresh_from_db()
        assert chat_message1.room_id == original_room_id

    def test_sender_can_delete_own_message(self, api_client, worker1, chat_message1):
        api_client.force_authenticate(user=worker1)
        response = api_client.delete(f'/api/chats/messages/{chat_message1.id}/')

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not ChatMessage.objects.filter(id=chat_message1.id).exists()

    def test_participant_cannot_delete_someone_elses_message(self, api_client, manager1, chat_message1):
        api_client.force_authenticate(user=manager1)
        response = api_client.delete(f'/api/chats/messages/{chat_message1.id}/')

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert ChatMessage.objects.filter(id=chat_message1.id).exists()

    def test_participant_can_retrieve_someone_elses_message_in_accessible_room(self, api_client, manager1, chat_message1):
        api_client.force_authenticate(user=manager1)
        response = api_client.get(f'/api/chats/messages/{chat_message1.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == chat_message1.id

    def test_message_list_scoped_to_user_company(self, api_client, worker1, worker2, chat_message1, company2):
        client2 = User.objects.create_user(
            username="client2",
            email="client2@example.com",
            password="ClientPass_123",
            role="client",
            company=company2
        )
        project2 = self.create_project("Other Company Project", company2, client2)
        chat_room2 = ChatRoom.objects.create(project=project2)
        chat_message2 = ChatMessage.objects.create(
            room=chat_room2,
            sender=worker2,
            content="Other company message"
        )

        api_client.force_authenticate(user=worker1)
        response = api_client.get('/api/chats/messages/')

        assert response.status_code == status.HTTP_200_OK
        message_ids = [message['id'] for message in response.data]
        assert chat_message1.id in message_ids
        assert chat_message2.id not in message_ids

    def test_manager_can_view_company_room_messages(self, api_client, manager1, chat_message1):
        api_client.force_authenticate(user=manager1)
        response = api_client.get('/api/chats/messages/')

        assert response.status_code == status.HTTP_200_OK
        message_ids = [message['id'] for message in response.data]
        assert chat_message1.id in message_ids

    def test_worker_can_view_assigned_project_room_messages(self, api_client, worker1, chat_message1):
        api_client.force_authenticate(user=worker1)
        response = api_client.get('/api/chats/messages/')

        assert response.status_code == status.HTTP_200_OK
        message_ids = [message['id'] for message in response.data]
        assert chat_message1.id in message_ids

    def test_worker_cannot_view_same_company_unassigned_room_messages(self, api_client, worker1, client1, company1):
        other_worker = User.objects.create_user(
            username="worker3",
            email="worker3@example.com",
            password="WorkerPass_123",
            role="worker",
            company=company1
        )
        hidden_project = self.create_project("Unassigned Project", company1, client1, [other_worker])
        hidden_room = ChatRoom.objects.create(project=hidden_project)
        hidden_message = ChatMessage.objects.create(
            room=hidden_room,
            sender=other_worker,
            content="Unassigned project message"
        )

        api_client.force_authenticate(user=worker1)
        response = api_client.get('/api/chats/messages/')
        filtered_response = api_client.get(f'/api/chats/messages/?room={hidden_room.id}')

        assert response.status_code == status.HTTP_200_OK
        message_ids = [message['id'] for message in response.data]
        assert hidden_message.id not in message_ids
        assert filtered_response.status_code == status.HTTP_200_OK
        assert filtered_response.data == []

    def test_worker_cannot_post_to_same_company_unassigned_room(self, api_client, worker1, client1, company1):
        other_worker = User.objects.create_user(
            username="worker3",
            email="worker3@example.com",
            password="WorkerPass_123",
            role="worker",
            company=company1
        )
        hidden_project = self.create_project("Unassigned Project", company1, client1, [other_worker])
        hidden_room = ChatRoom.objects.create(project=hidden_project)

        api_client.force_authenticate(user=worker1)
        response = api_client.post('/api/chats/messages/', {
            "room": hidden_room.id,
            "content": "Unauthorized message"
        }, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_client_can_view_own_project_room_messages(self, api_client, client1, chat_message1):
        api_client.force_authenticate(user=client1)
        response = api_client.get('/api/chats/messages/')

        assert response.status_code == status.HTTP_200_OK
        message_ids = [message['id'] for message in response.data]
        assert chat_message1.id in message_ids

    def test_client_cannot_view_same_company_other_client_room_messages(self, api_client, client1, company1):
        other_client = User.objects.create_user(
            username="client3",
            email="client3@example.com",
            password="ClientPass_123",
            role="client",
            company=company1
        )
        hidden_project = self.create_project("Other Client Project", company1, other_client)
        hidden_room = ChatRoom.objects.create(project=hidden_project)
        hidden_message = ChatMessage.objects.create(
            room=hidden_room,
            sender=other_client,
            content="Other client message"
        )

        api_client.force_authenticate(user=client1)
        response = api_client.get('/api/chats/messages/')
        filtered_response = api_client.get(f'/api/chats/messages/?room={hidden_room.id}')

        assert response.status_code == status.HTTP_200_OK
        message_ids = [message['id'] for message in response.data]
        assert hidden_message.id not in message_ids
        assert filtered_response.status_code == status.HTTP_200_OK
        assert filtered_response.data == []

    def test_client_cannot_post_to_same_company_other_client_room(self, api_client, client1, company1):
        other_client = User.objects.create_user(
            username="client3",
            email="client3@example.com",
            password="ClientPass_123",
            role="client",
            company=company1
        )
        hidden_project = self.create_project("Other Client Project", company1, other_client)
        hidden_room = ChatRoom.objects.create(project=hidden_project)

        api_client.force_authenticate(user=client1)
        response = api_client.post('/api/chats/messages/', {
            "room": hidden_room.id,
            "content": "Unauthorized message"
        }, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_superuser_can_view_all_room_messages(self, api_client, admin, worker2, chat_message1, company2):
        client2 = User.objects.create_user(
            username="client2",
            email="client2@example.com",
            password="ClientPass_123",
            role="client",
            company=company2
        )
        project2 = self.create_project("Other Company Project", company2, client2, [worker2])
        chat_room2 = ChatRoom.objects.create(project=project2)
        chat_message2 = ChatMessage.objects.create(
            room=chat_room2,
            sender=worker2,
            content="Other company message"
        )

        api_client.force_authenticate(user=admin)
        response = api_client.get('/api/chats/messages/')

        assert response.status_code == status.HTTP_200_OK
        message_ids = [message['id'] for message in response.data]
        assert chat_message1.id in message_ids
        assert chat_message2.id in message_ids

    def test_message_list_filters_by_room(self, api_client, worker1, client1, company1, chat_room1, chat_message1):
        project2 = self.create_project("Second Project", company1, client1, [worker1])
        chat_room2 = ChatRoom.objects.create(project=project2)
        chat_message2 = ChatMessage.objects.create(
            room=chat_room2,
            sender=worker1,
            content="Second room message"
        )

        api_client.force_authenticate(user=worker1)
        response = api_client.get(f'/api/chats/messages/?room={chat_room1.id}')

        assert response.status_code == status.HTTP_200_OK
        message_ids = [message['id'] for message in response.data]
        assert message_ids == [chat_message1.id]
        assert chat_message2.id not in message_ids

    def test_message_list_other_company_room_returns_empty_list(self, api_client, worker1, worker2, company2):
        client2 = User.objects.create_user(
            username="client2",
            email="client2@example.com",
            password="ClientPass_123",
            role="client",
            company=company2
        )
        project2 = self.create_project("Other Company Project", company2, client2)
        chat_room2 = ChatRoom.objects.create(project=project2)
        ChatMessage.objects.create(
            room=chat_room2,
            sender=worker2,
            content="Other company message"
        )

        api_client.force_authenticate(user=worker1)
        response = api_client.get(f'/api/chats/messages/?room={chat_room2.id}')

        assert response.status_code == status.HTTP_200_OK
        assert response.data == []
