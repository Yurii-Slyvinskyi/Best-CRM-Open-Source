import pytest
from rest_framework import status
from apps.finances.models import FinancialReport, Transaction


@pytest.mark.django_db
class TestFinancialReportAPI:

    def test_financial_report_updates_after_transaction(self, api_client, company, manager):
        api_client.force_authenticate(user=manager)

        Transaction.objects.create(company=company, amount=1000, transaction_type="income")
        Transaction.objects.create(company=company, amount=500, transaction_type="expense")

        response = api_client.get("/api/finances/reports/")
        assert response.status_code == status.HTTP_200_OK

        report = FinancialReport.objects.get(company=company)
        assert report.total_income == 1000
        assert report.total_expenses == 500
        assert report.net_profit == 500

    def test_manager_can_see_financial_report(self, api_client, company, manager):
        report = FinancialReport.objects.create(
            company=company,
            total_income=1000,
            total_expenses=500,
            net_profit=500
        )

        api_client.force_authenticate(user=manager)

        response = api_client.get("/api/finances/reports/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["id"] == report.id

    def test_canonical_reports_route_is_available(self, api_client, manager):
        api_client.force_authenticate(user=manager)
        response = api_client.get("/api/finances/reports/")

        assert response.status_code == status.HTTP_200_OK

    def test_duplicate_reports_route_is_not_registered(self, api_client, manager):
        api_client.force_authenticate(user=manager)
        response = api_client.get("/api/finances/finances/reports/")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_manager_sees_only_their_company_report(self, api_client, company, company2, manager):
        report = FinancialReport.objects.create(
            company=company,
            total_income=1000,
            total_expenses=500,
            net_profit=500
        )
        other_report = FinancialReport.objects.create(
            company=company2,
            total_income=2000,
            total_expenses=700,
            net_profit=1300
        )

        api_client.force_authenticate(user=manager)
        response = api_client.get("/api/finances/reports/")

        assert response.status_code == status.HTTP_200_OK
        report_ids = [report['id'] for report in response.data]
        assert report.id in report_ids
        assert other_report.id not in report_ids

    def test_repeated_post_refreshes_current_company_summary(self, api_client, company, manager):
        Transaction.objects.create(company=company, amount=1000, transaction_type="income")
        FinancialReport.objects.filter(company=company).update(
            total_income=0,
            total_expenses=0,
            net_profit=0
        )

        api_client.force_authenticate(user=manager)
        response = api_client.post("/api/finances/reports/", {}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert FinancialReport.objects.filter(company=company).count() == 1

        report = FinancialReport.objects.get(company=company)
        assert report.total_income == 1000
        assert report.total_expenses == 0
        assert report.net_profit == 1000

        Transaction.objects.create(company=company, amount=250, transaction_type="expense")
        FinancialReport.objects.filter(company=company).update(
            total_income=0,
            total_expenses=0,
            net_profit=0
        )
        response = api_client.post("/api/finances/reports/", {}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert FinancialReport.objects.filter(company=company).count() == 1

        report.refresh_from_db()
        assert report.total_income == 1000
        assert report.total_expenses == 250
        assert report.net_profit == 750

    def test_report_post_rejects_date_range_fields(self, api_client, manager):
        api_client.force_authenticate(user=manager)
        data = {
            "start_date": "2025-01-01",
            "end_date": "2025-12-31"
        }
        response = api_client.post("/api/finances/reports/", data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "current company summaries" in response.data["detail"]

    def test_superuser_post_requires_company(self, api_client, superuser):
        api_client.force_authenticate(user=superuser)
        response = api_client.post("/api/finances/reports/", {}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "company" in response.data

    def test_superuser_can_refresh_specific_company_report(self, api_client, superuser, company2):
        Transaction.objects.create(company=company2, amount=2000, transaction_type="income")

        api_client.force_authenticate(user=superuser)
        response = api_client.post(
            "/api/finances/reports/",
            {"company": company2.id},
            format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        report = FinancialReport.objects.get(company=company2)
        assert response.data["id"] == report.id
        assert report.total_income == 2000
        assert report.total_expenses == 0
        assert report.net_profit == 2000

    def test_client_cannot_see_financial_report(self, api_client, client_user):
        api_client.force_authenticate(user=client_user)

        response = api_client.get("/api/finances/reports/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_worker_cannot_see_financial_report(self, api_client, worker):
        api_client.force_authenticate(user=worker)

        response = api_client.get("/api/finances/reports/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_manager_cannot_delete_financial_report_of_other_company(self, api_client, manager, company2):
        api_client.force_authenticate(user=manager)
        report = FinancialReport.objects.create(
            company=company2,
            total_income=1000,
            total_expenses=500,
            net_profit=500
        )
        response = api_client.delete(f'/api/finances/reports/{report.id}/')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_superuser_can_view_all_financial_reports(self, api_client, superuser, company, company2):
        report = FinancialReport.objects.create(
            company=company,
            total_income=1000,
            total_expenses=500,
            net_profit=500
        )
        other_report = FinancialReport.objects.create(
            company=company2,
            total_income=2000,
            total_expenses=700,
            net_profit=1300
        )

        api_client.force_authenticate(user=superuser)
        response = api_client.get("/api/finances/reports/")

        assert response.status_code == status.HTTP_200_OK
        report_ids = [report['id'] for report in response.data]
        assert report.id in report_ids
        assert other_report.id in report_ids

    def test_staff_user_cannot_view_financial_reports_as_superuser(self, api_client, staff_user):
        api_client.force_authenticate(user=staff_user)
        response = api_client.get("/api/finances/reports/")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_totals_by_currency_separates_usd_and_cad(self, api_client, company, manager):
        Transaction.objects.create(company=company, amount=1000, transaction_type='income', currency='USD', description='usd in')
        Transaction.objects.create(company=company, amount=200, transaction_type='expense', currency='USD', description='usd out')
        Transaction.objects.create(company=company, amount=500, transaction_type='income', currency='CAD', description='cad in')
        Transaction.objects.create(company=company, amount=100, transaction_type='expense', currency='CAD', description='cad out')

        api_client.force_authenticate(user=manager)
        response = api_client.get("/api/finances/reports/")

        assert response.status_code == status.HTTP_200_OK
        totals = response.data[0]['totals_by_currency']
        assert totals['USD'] == {'total_income': '1000.00', 'total_expenses': '200.00', 'net_profit': '800.00'}
        assert totals['CAD'] == {'total_income': '500.00', 'total_expenses': '100.00', 'net_profit': '400.00'}

    def test_totals_by_currency_returns_zeros_for_missing_currency(self, api_client, company, manager):
        Transaction.objects.create(company=company, amount=1000, transaction_type='income', currency='USD', description='usd in')

        api_client.force_authenticate(user=manager)
        response = api_client.get("/api/finances/reports/")

        assert response.status_code == status.HTTP_200_OK
        totals = response.data[0]['totals_by_currency']
        assert totals['USD']['total_income'] == '1000.00'
        assert totals['CAD'] == {'total_income': '0.00', 'total_expenses': '0.00', 'net_profit': '0.00'}

    def test_report_refresh_still_works_with_currencies(self, api_client, company, manager):
        Transaction.objects.create(company=company, amount=1000, transaction_type='income', currency='USD', description='usd in')
        Transaction.objects.create(company=company, amount=500, transaction_type='income', currency='CAD', description='cad in')

        api_client.force_authenticate(user=manager)
        response = api_client.post("/api/finances/reports/", {}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data['totals_by_currency']['USD']['total_income'] == '1000.00'
        assert response.data['totals_by_currency']['CAD']['total_income'] == '500.00'
