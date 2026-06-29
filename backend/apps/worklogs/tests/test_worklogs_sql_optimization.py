import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from apps.worklogs.models import WorkLog


@pytest.mark.django_db
class TestWorklogSQLOptimization:

    def test_worker_worklog_query_optimized(self, api_client, worker1, team1, project1, worklog1):
        api_client.force_authenticate(user=worker1)

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.get('/api/worklogs/')

        assert response.status_code == 200
        assert len(response.data) == 1

        # Filter only SELECT queries (ignore transactions)
        select_queries = [q for q in ctx.captured_queries
                          if q['sql'].strip().upper().startswith('SELECT')]

        assert len(select_queries) == 1, (
                f"Expected 1 SELECT query, got {len(select_queries)}\n"
                f"Queries:\n" + "\n".join(q['sql'] for q in select_queries)
        )

        sql = select_queries[0]['sql'].upper()
        assert 'JOIN' in sql
        assert 'WORKER' in sql
        assert 'TEAM' in sql
        assert 'PROJECT' in sql

    def test_queryset_only_uses_one_query(self, worklog1):
        with CaptureQueriesContext(connection) as ctx:
            qs = WorkLog.objects.select_related('worker', 'project', 'team')
            list(qs)

        # Filter only SELECT queries
        select_queries = [q for q in ctx.captured_queries
                          if q['sql'].strip().upper().startswith('SELECT')]

        assert len(select_queries) == 1, (
            f"Expected 1 SELECT query, got {len(select_queries)}\n"
            f"Query: {select_queries[0]['sql'] if select_queries else 'None'}"
        )
