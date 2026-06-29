import pytest
from django.test.utils import CaptureQueriesContext
from django.db import connection
from rest_framework import status
from apps.teams.models import Team


@pytest.mark.django_db
class TestTeamSQLOptimization:

    def test_retrieve_team_is_sql_optimized(self, api_client, users, team):
        """Team retrieve view should not trigger extra queries."""
        api_client.force_authenticate(user=users["manager1"])

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.get(f'/api/teams/{team.id}/')

        assert response.status_code == status.HTTP_200_OK

        select_queries = [q for q in ctx.captured_queries if q['sql'].startswith('SELECT')]
        assert len(select_queries) <= 3, f"Too many SELECTs: {len(select_queries)}"

        company_joins = [q for q in ctx.captured_queries if 'JOIN' in q['sql'] and 'companies_company' in q['sql']]
        assert len(company_joins) == 1, "Missing or excessive JOINs with company"

        prefetch_workers = [q for q in ctx.captured_queries if 'teams_team_workers' in q['sql']]
        assert len(prefetch_workers) == 1, "Missing or excessive prefetch for workers"

    def test_list_teams_is_sql_optimized(self, api_client, users, companies):
        """Team list view should avoid N+1 problems."""
        company = companies["company1"]
        manager = users["manager1"]
        Team.objects.bulk_create([Team(name=f"Team {i}", company=company) for i in range(3)])

        api_client.force_authenticate(user=manager)

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.get('/api/teams/')

        assert response.status_code == status.HTTP_200_OK

        queries = [q['sql'] for q in ctx.captured_queries]

        team_selects = [q for q in queries if 'SELECT' in q and 'teams_team' in q]
        assert len(team_selects) == 2, "Expected SELECTs: one for teams, one for workers"

        assert any('JOIN' in q and 'companies_company' in q for q in team_selects), "Missing JOIN with company"
        assert any(f'company_id" = {company.id}' in q for q in team_selects), "No filtering by company"

        prefetch = [q for q in queries if 'teams_team_workers' in q]
        assert len(prefetch) == 1, "Expected 1 prefetch query for workers"

    def test_create_team_is_sql_optimized(self, api_client, users, companies):
        """Team creation should execute minimal SQL queries."""
        manager = users["manager1"]
        worker = users["worker1"]
        api_client.force_authenticate(user=manager)

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.post(
                '/api/teams/',
                {'name': 'New Team', 'workers': [worker.id]},
                format='json'
            )

        assert response.status_code == status.HTTP_201_CREATED

        queries = [q['sql'] for q in ctx.captured_queries]

        worker_selects = [q for q in queries if 'SELECT' in q and 'users_user' in q]
        assert len(worker_selects) <= 3, f"Too many worker SELECTs: {len(worker_selects)}"

        team_inserts = [q for q in queries if 'INSERT INTO "teams_team"' in q]
        m2m_inserts = [q for q in queries if 'INSERT' in q and 'teams_team_workers' in q]

        assert len(team_inserts) == 1, "Expected 1 INSERT into teams_team"
        assert len(m2m_inserts) == 1, "Expected 1 INSERT into M2M table"

        assert len(team_inserts + m2m_inserts) == 2, "Expected 2 INSERTs total (team + M2M)"

        company_selects = [q for q in queries if 'SELECT' in q and 'companies_company' in q]
        assert not company_selects, "Unexpected SELECTs from companies_company (possible N+1)"
