import pytest
from rest_framework import status
from apps.companies.models import Company


@pytest.mark.django_db
class TestCompanies:

    def test_get_companies_list(self, api_client, admin_user, company):
        """Getting a list of companies"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/companies/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0

    def test_get_company_detail(self, api_client, admin_user, company):
        """Getting a specific company"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f"/api/companies/{company.slug}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Test Company'

    def test_create_company_success(self, api_client, admin_user):
        """Administrator can create a company"""
        api_client.force_authenticate(user=admin_user)
        data = {
            "name": "New Company",
            "slug": "new-company",
        }
        response = api_client.post('/api/companies/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Company.objects.filter(name="New Company").exists()

    def test_create_company_forbidden_for_regular_user(self, api_client, regular_user):
        api_client.force_authenticate(user=regular_user)
        data = {
            "name": "Updated Company",
            "slug": "updated-company",
        }
        response = api_client.post('/api/companies/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_staff_user_cannot_create_company(self, api_client, staff_user):
        api_client.force_authenticate(user=staff_user)
        data = {
            "name": "Staff Company",
            "slug": "staff-company",
        }
        response = api_client.post('/api/companies/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_company_success(self, api_client, admin_user, company):
        api_client.force_authenticate(user=admin_user)
        data = {
            "name": "Updated Company",
            "slug": "updated-company",
        }
        response = api_client.patch(f"/api/companies/{company.slug}/", data, format='json')
        assert response.status_code == status.HTTP_200_OK

        company.refresh_from_db()
        assert company.name == 'Updated Company'

    def test_delete_company(self, api_client, admin_user, company):
        api_client.force_authenticate(user=admin_user)
        response = api_client.delete(f"/api/companies/{company.slug}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Company.objects.filter(id=company.id).exists()
