import pytest
from rest_framework import status
from apps.finances.models import FinancialReport, Transaction


@pytest.mark.django_db
class TestTransactionAPI:

    def test_manager_can_create_transaction(self, api_client, manager):
        api_client.force_authenticate(user=manager)
        data = {
            "amount": 500,
            "transaction_type": "income",
            "description": "Test Transaction"
        }
        response = api_client.post("/api/finances/transactions/", data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert Transaction.objects.count() == 1

        report = FinancialReport.objects.get(company=manager.company)
        assert report.total_income == 500
        assert report.total_expenses == 0
        assert report.net_profit == 500

    def test_client_cannot_create_transaction(self, api_client, client_user):
        api_client.force_authenticate(user=client_user)
        data = {
            "amount": 500,
            "transaction_type": "income",
            "description": "Test Transaction"
        }
        response = api_client.post("/api/finances/transactions/", data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_worker_cannot_create_transaction(self, api_client, worker):
        api_client.force_authenticate(user=worker)
        data = {
            "amount": 500,
            "transaction_type": "income",
            "description": "Test Transaction"
        }
        response = api_client.post("/api/finances/transactions/", data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_manager_cannot_view_transactions_of_other_company(self, api_client, manager, company2):
        api_client.force_authenticate(user=manager)
        Transaction.objects.create(
            company=company2,
            amount=1000,
            transaction_type="income",
            description="Test transaction"
        )
        response = api_client.get('/api/finances/transactions/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_superuser_can_view_all_transactions(self, api_client, superuser, company, company2):
        transaction = Transaction.objects.create(
            company=company,
            amount=1000,
            transaction_type="income",
            description="Company transaction"
        )
        other_transaction = Transaction.objects.create(
            company=company2,
            amount=500,
            transaction_type="expense",
            description="Other company transaction"
        )

        api_client.force_authenticate(user=superuser)
        response = api_client.get('/api/finances/transactions/')

        assert response.status_code == status.HTTP_200_OK
        transaction_ids = [transaction['id'] for transaction in response.data]
        assert transaction.id in transaction_ids
        assert other_transaction.id in transaction_ids

    def test_staff_user_cannot_create_transaction_as_superuser(self, api_client, staff_user):
        api_client.force_authenticate(user=staff_user)
        data = {
            "amount": 500,
            "transaction_type": "income",
            "description": "Test Transaction"
        }
        response = api_client.post("/api/finances/transactions/", data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_manager_can_create_transaction_with_cad(self, api_client, manager):
        api_client.force_authenticate(user=manager)
        data = {
            "amount": 500,
            "transaction_type": "income",
            "description": "CAD income",
            "currency": "CAD"
        }
        response = api_client.post("/api/finances/transactions/", data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['currency'] == 'CAD'

    def test_transaction_defaults_to_usd_currency(self, api_client, manager):
        api_client.force_authenticate(user=manager)
        data = {
            "amount": 500,
            "transaction_type": "income",
            "description": "No currency provided"
        }
        response = api_client.post("/api/finances/transactions/", data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['currency'] == 'USD'

    def test_manager_can_update_transaction_currency(self, api_client, manager):
        api_client.force_authenticate(user=manager)
        transaction = Transaction.objects.create(
            company=manager.company,
            amount=100,
            transaction_type='income',
            description='Switch me',
            currency='USD'
        )
        response = api_client.patch(
            f"/api/finances/transactions/{transaction.id}/",
            {"currency": "CAD"},
            format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        transaction.refresh_from_db()
        assert transaction.currency == 'CAD'

    def test_invalid_transaction_currency_returns_400(self, api_client, manager):
        api_client.force_authenticate(user=manager)
        data = {
            "amount": 500,
            "transaction_type": "income",
            "description": "Bad currency",
            "currency": "EUR"
        }
        response = api_client.post("/api/finances/transactions/", data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'currency' in response.data

    def test_transaction_list_returns_currency(self, api_client, manager):
        api_client.force_authenticate(user=manager)
        Transaction.objects.create(
            company=manager.company,
            amount=100,
            transaction_type='income',
            description='Has currency',
            currency='CAD'
        )
        response = api_client.get("/api/finances/transactions/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data[0]['currency'] == 'CAD'
