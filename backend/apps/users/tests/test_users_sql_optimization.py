from unittest.mock import patch
import pytest
from django.test.utils import CaptureQueriesContext
from django.db import connection
from apps.users.models import User


@pytest.mark.django_db
class TestUserSQLOptimization:

    def test_user_profile_query_optimized(self, api_client, access_token, test_user):
        """Test that the user profile query is optimized with minimal SQL queries."""
        with CaptureQueriesContext(connection) as ctx:
            response = api_client.get(
                '/api/users/profile/',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )

        assert response.status_code == 200

        user_queries = [q for q in ctx.captured_queries if '"users_user"' in q['sql']]
        company_joins = [
            q for q in user_queries
            if 'JOIN' in q['sql'] and 'companies_company' in q['sql']
        ]

        assert len(company_joins) <= 1, (
            f"Expected at most one JOIN for company, found {len(company_joins)}"
            f"\nQueries: {[q['sql'] for q in user_queries]}"
        )

    def test_user_register_sql_optimization(self, api_client, test_manager, test_company):
        api_client.force_authenticate(user=test_manager)

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.post('/api/users/register/', data={
                'username': 'newuser',
                'password': 'testpass123',
                'email': 'new@example.com',
                'role': 'client',
            })

        assert response.status_code == 201
        queries = [q['sql'] for q in ctx.captured_queries]
        inserts = [q for q in queries if 'INSERT INTO' in q and 'users_user' in q]
        assert len(inserts) == 1, "Expected one INSERT for new user"

    @patch('apps.notifications.mixins.UserNotificationsMixin.send_role_change_notification')
    def test_role_update_sql_optimization(self, mock_notify, api_client, test_manager, test_user):
        """Test the optimization of SQL queries when updating a user's role."""
        api_client.force_authenticate(user=test_manager)

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.patch(
                f'/api/users/update-role/{test_user.id}/',
                {'role': 'worker'},
                format='json'
            )

        assert response.status_code == 200

        queries = [q['sql'] for q in ctx.captured_queries]

        select_queries = [q for q in queries if q.strip().upper().startswith('SELECT')]
        update_queries = [q for q in queries if q.strip().upper().startswith('UPDATE')]
        company_queries = [q for q in queries if 'companies_company' in q]

        assert len(select_queries) <= 1, (
            f"Too many SELECT queries: {len(select_queries)}\n{select_queries}"
        )

        assert len(update_queries) == 1, (
            f"Expected 1 UPDATE query, got {len(update_queries)}\n{update_queries}"
        )

        update_query = update_queries[0]
        assert 'SET "role"' in update_query
        assert 'SET "password"' not in update_query

        assert len(company_queries) <= 1, (
            f"N+1 issue detected with company: {len(company_queries)} queries"
        )

    def test_user_list_query_optimization(self, api_client, test_manager, test_company):
        """Test that the user list endpoint performs optimized query with JOIN and filtering."""
        User.objects.bulk_create([
            User(username=f'user_{i}', company=test_company, role='worker')
            for i in range(3)
        ])
        api_client.force_authenticate(user=test_manager)

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.get('/api/users/list/')

        assert response.status_code == 200

        queries = [q['sql'] for q in ctx.captured_queries]
        select_queries = [q for q in queries if q.strip().upper().startswith("SELECT")]

        assert len(select_queries) == 1, (
            f"Expected one SELECT query, got {len(select_queries)}"
        )

        main_query = select_queries[0]
        assert 'JOIN' in main_query, "Expected a JOIN in the main query"
        assert 'companies_company' in main_query, "Expected JOIN with companies_company"
        assert f'company_id" = {test_company.id}' in main_query or f'."company_id" = {test_company.id}' in main_query, \
            "Expected filtering by company"
