import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django_redis import get_redis_connection
from rest_framework import status


@pytest.mark.django_db
class TestChatSQLOptimization:

    def test_chat_message_list_optimization(self, api_client, worker1, chat_room1, chat_message1):
        """Test query optimization when retrieving a list of messages"""
        api_client.force_authenticate(user=worker1)

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.get(f'/api/chats/messages/?room={chat_room1.id}')

        assert response.status_code == status.HTTP_200_OK

        # Filter only SELECT queries
        select_queries = [q for q in ctx.captured_queries if q['sql'].strip().upper().startswith('SELECT')]

        assert len(select_queries) == 1, (
                f"Expected 1 SELECT query, got {len(select_queries)}\n"
                f"Executed queries:\n" + "\n".join(q['sql'] for q in select_queries)
        )

    def test_chat_message_create_optimization(self, api_client, worker1, chat_room1):
        """Test the number of queries when creating a message"""
        api_client.force_authenticate(user=worker1)
        data = {
            "room": chat_room1.id,
            "content": "Test message"
        }

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.post('/api/chats/messages/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED

        main_queries = [
            q for q in ctx.captured_queries
            if not q['sql'].strip().startswith(('SAVEPOINT', 'RELEASE'))
        ]

        assert len(main_queries) <= 3, (
                f"Too many queries: {len(main_queries)}\n"
                f"Queries:\n" + "\n".join(q['sql'] for q in main_queries)
        )

    def test_chat_room_optimization(self, api_client, worker1, chat_room1):
        """Test query optimization when retrieving a chat room"""
        api_client.force_authenticate(user=worker1)

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.get(f'/api/chats/messages/?room={chat_room1.id}')

        assert response.status_code == status.HTTP_200_OK

        # There should be only 1 SELECT query with a JOIN to the project
        select_queries = [q for q in ctx.captured_queries if q['sql'].strip().upper().startswith('SELECT')]
        assert len(select_queries) == 1
        assert 'JOIN' in select_queries[0]['sql'].upper()
