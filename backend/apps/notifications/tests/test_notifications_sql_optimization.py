import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext, override_settings
from apps.notifications.tasks import send_notification_task
from apps.notifications.utils import create_notification_record


@pytest.mark.django_db
class TestNotificationsSQLOptimization:

    def test_create_notification_check_sql_queries(self, api_client, manager):
        with CaptureQueriesContext(connection) as ctx:
            create_notification_record(
                recipient=manager,
                subject="Test Subject",
                message="Test Message"
            )
        select_queries = [
            q for q in ctx.captured_queries
            if q['sql'].strip().upper().startswith('SELECT')
        ]
        insert_queries = [
            q for q in ctx.captured_queries
            if q['sql'].strip().upper().startswith('INSERT')
        ]

        assert len(select_queries) <= 1, f"Too many SELECT queries: {len(select_queries)}"
        assert len(insert_queries) == 1, f"Expected one INSERT query, got {len(insert_queries)}"

    def test_notification_list_query_optimization(self, api_client, manager, notifications):
        api_client.force_authenticate(user=manager)

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.get('/api/notifications/')

        assert response.status_code == 200

        select_queries = [
            q for q in ctx.captured_queries
            if q['sql'].strip().upper().startswith('SELECT')
        ]

        assert len(select_queries) <= 2, f"Too many SELECT queries: {len(select_queries)}"
        assert "JOIN" in select_queries[0]['sql'], "Query should use JOIN for optimization"

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_notification_task_queries(self, foreign_user):
        with CaptureQueriesContext(connection) as ctx:
            result = send_notification_task(
                object_id=foreign_user.id,
                object_type='user',
                notification_type='login',
                extra_context={'ip_address': '127.0.0.1'}
            )

        assert result is True

        sql_queries = [q['sql'] for q in ctx.captured_queries]
        select_queries = [q for q in sql_queries if q.strip().upper().startswith('SELECT')]
        insert_queries = [q for q in sql_queries if q.strip().upper().startswith('INSERT')]

        assert len(select_queries) == 1, f"Expected 1 SELECT query, got {len(select_queries)}"
        assert len(insert_queries) == 1, f"Expected 1 INSERT query, got {len(insert_queries)}"
