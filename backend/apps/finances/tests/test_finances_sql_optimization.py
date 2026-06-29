from unittest.mock import patch, MagicMock
import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext



@pytest.mark.django_db
class TestFinancesSQLOptimization:

    @patch('stripe.checkout.Session.create')
    @patch('apps.notifications.mixins.FinancialNotificationsMixin.send_payment_created_notification')
    def test_create_payment_check_sql_queries(self, mock_notify, mock_stripe, api_client, manager, client_user, project):
        mock_notify.return_value = None

        class MockSession:
            id = 'cs_test_mocked_session'
            url = 'https://example.com/session'

        mock_stripe.return_value = MockSession()

        data = {
            "client": client_user.id,
            "amount": 500,
            "project": project.id,
            "currency": "USD"
        }

        api_client.force_authenticate(user=manager)
        with CaptureQueriesContext(connection) as ctx:
            response = api_client.post('/api/finances/payments/manager/', data, format='json')

        assert response.status_code == 201

        select_queries = [
            q for q in ctx.captured_queries
            if q['sql'].strip().upper().startswith('SELECT')
        ]
        assert len(select_queries) <= 5, f"Too many SELECT queries: {len(select_queries)}"

        insert_queries = [
            q for q in ctx.captured_queries
            if q['sql'].strip().upper().startswith('INSERT')
        ]
        assert len(insert_queries) == 1, f"Too many INSERT queries: {len(insert_queries)}"


    @patch('apps.notifications.mixins.FinancialNotificationsMixin.send_salary_created_notification')
    def test_create_salary_check_sql_queries(self, mock_notify, api_client, manager, worker):
        mock_notify.return_value = None

        data = {
            'worker': worker.id,
            'amount': 1500.00,
            'currency': 'USD',
        }

        api_client.force_authenticate(user=manager)
        with CaptureQueriesContext(connection) as ctx:
            response = api_client.post('/api/finances/salaries/manager/', data, format='json')

        assert response.status_code == 201

        select_queries = [q for q in ctx.captured_queries if q['sql'].strip().upper().startswith('SELECT')]
        assert len(select_queries) <= 6, f"Too many SELECT queries: {len(select_queries)}"

        insert_queries = [q for q in ctx.captured_queries if q['sql'].strip().upper().startswith('INSERT')]
        assert len(insert_queries) == 3, f"Too many INSERT queries: {len(insert_queries)}"

    def test_create_transaction_check_sql_queries(self, api_client, manager):
        data = {
            'amount': 100.00,
            'transaction_type': 'expense',
            'description': 'Test expense transaction',
        }

        api_client.force_authenticate(user=manager)
        with CaptureQueriesContext(connection) as ctx:
            response = api_client.post('/api/finances/transactions/', data, format='json')

        assert response.status_code == 201

        select_queries = [q for q in ctx.captured_queries if q['sql'].strip().upper().startswith('SELECT')]
        assert len(select_queries) <= 2, f"Too many SELECT queries: {len(select_queries)}"

        insert_queries = [q for q in ctx.captured_queries if q['sql'].strip().upper().startswith('INSERT')]
        assert len(insert_queries) == 2, f"Too many INSERT queries: {len(insert_queries)}"
