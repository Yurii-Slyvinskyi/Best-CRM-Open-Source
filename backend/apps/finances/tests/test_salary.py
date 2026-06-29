import pytest
from rest_framework import status
from apps.finances.models import FinancialReport, Salary, Transaction


@pytest.mark.django_db
class TestSalaryAPI:

    def test_manager_can_create_salary(self, api_client, manager, worker):
        api_client.force_authenticate(user=manager)
        data = {
            "amount": 1000,
            "worker": worker.id,
            "status": "pending",
            "currency": "USD"
        }
        response = api_client.post('/api/finances/salaries/manager/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert Salary.objects.count() == 1
        assert Transaction.objects.count() == 1

        report = FinancialReport.objects.get(company=manager.company)
        assert report.total_income == 0
        assert report.total_expenses == 1000
        assert report.net_profit == -1000

    def test_manager_cannot_create_salary_for_other_company(self, api_client, manager, another_worker):
        api_client.force_authenticate(user=manager)

        data = {
            "amount": 2000,
            "worker": another_worker.id,
            "status": "pending",
            "currency": "USD"

        }
        response = api_client.post('/api/finances/salaries/manager/', data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_worker_can_view_own_salary(self, api_client, worker, salary_for_worker):
        api_client.force_authenticate(user=worker)
        response = api_client.get('/api/finances/salaries/worker/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_worker_cannot_see_others_salary(self, api_client, worker, salary_for_other_worker):
        api_client.force_authenticate(user=worker)
        response = api_client.get('/api/finances/salaries/worker/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_worker_cannot_create_salary(self, api_client, worker):
        api_client.force_authenticate(user=worker)
        data = {
            "worker": worker.id,
            "amount": 2000,
        }
        response = api_client.post('/api/finances/salaries/manager/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_superuser_can_view_all_salaries(
        self, api_client, superuser, salary_for_worker, salary_for_other_worker
    ):
        api_client.force_authenticate(user=superuser)
        response = api_client.get('/api/finances/salaries/worker/')

        assert response.status_code == status.HTTP_200_OK
        salary_ids = [salary['id'] for salary in response.data]
        assert salary_for_worker.id in salary_ids
        assert salary_for_other_worker.id in salary_ids

    def test_staff_user_cannot_view_salaries_as_superuser(self, api_client, staff_user, salary_for_worker):
        api_client.force_authenticate(user=staff_user)
        response = api_client.get('/api/finances/salaries/worker/')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_manager_can_create_salary_with_cad(self, api_client, manager, worker):
        api_client.force_authenticate(user=manager)
        data = {"amount": 1000, "worker": worker.id, "currency": "CAD"}
        response = api_client.post('/api/finances/salaries/manager/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED, response.data
        salary = Salary.objects.get(id=response.data['id'])
        assert salary.currency == 'CAD'

        expense = Transaction.objects.get(salary=salary)
        assert expense.transaction_type == 'expense'
        assert expense.currency == 'CAD'

    def test_invalid_salary_currency_returns_400(self, api_client, manager, worker):
        api_client.force_authenticate(user=manager)
        data = {"amount": 1000, "worker": worker.id, "currency": "EUR"}
        response = api_client.post('/api/finances/salaries/manager/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'currency' in response.data
