from unittest.mock import patch

import pytest
from django.test import override_settings
from rest_framework import status
from apps.finances.models import Payment
from apps.projects.models import Project


@pytest.mark.django_db
class TestPaymentAPI:

    @patch('stripe.checkout.Session.create')
    def test_manager_can_create_payment(self, mock_stripe, api_client, manager, client_user, project):

        class MockSession:
            id = 'cs_test_mocked_session'
            url = 'https://example.com/session'

        mock_stripe.return_value = MockSession()

        api_client.force_authenticate(user=manager)
        data = {
            "client": client_user.id,
            "amount": 500,
            "project": project.id,
            "currency": "USD"
        }
        response = api_client.post('/api/finances/payments/manager/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED

    @override_settings(FRONTEND_BASE_URL="https://portfolio.example.com")
    @patch('stripe.checkout.Session.create')
    def test_manager_payment_checkout_redirect_urls_use_frontend_base_url(
        self, mock_stripe, api_client, manager, client_user, project
    ):

        class MockSession:
            id = 'cs_test_mocked_session'
            url = 'https://example.com/session'

        mock_stripe.return_value = MockSession()

        api_client.force_authenticate(user=manager)
        data = {
            "client": client_user.id,
            "amount": 500,
            "project": project.id,
            "currency": "USD"
        }
        response = api_client.post('/api/finances/payments/manager/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert mock_stripe.call_args.kwargs['success_url'] == "https://portfolio.example.com/success"
        assert mock_stripe.call_args.kwargs['cancel_url'] == "https://portfolio.example.com/cancel"

    @override_settings(FRONTEND_BASE_URL="https://portfolio.example.com/")
    @patch('stripe.checkout.Session.create')
    def test_manager_payment_checkout_redirect_urls_strip_frontend_base_url_slash(
        self, mock_stripe, api_client, manager, client_user, project
    ):

        class MockSession:
            id = 'cs_test_mocked_session'
            url = 'https://example.com/session'

        mock_stripe.return_value = MockSession()

        api_client.force_authenticate(user=manager)
        data = {
            "client": client_user.id,
            "amount": 500,
            "project": project.id,
            "currency": "USD"
        }
        response = api_client.post('/api/finances/payments/manager/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert mock_stripe.call_args.kwargs['success_url'] == "https://portfolio.example.com/success"
        assert mock_stripe.call_args.kwargs['cancel_url'] == "https://portfolio.example.com/cancel"

    def test_manager_can_view_company_payments(self, api_client, manager, company, client_user, project):
        api_client.force_authenticate(user=manager)
        Payment.objects.create(
            client=client_user,
            company=company,
            amount=500,
            project=project,
            manager=manager
        )
        response = api_client.get('/api/finances/payments/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_client_cannot_create_payment(self, api_client, client_user, project):
        api_client.force_authenticate(user=client_user)
        data = {
            "amount": 500,
            "project": project.id,
            "currency": "USD"
        }
        response = api_client.post('/api/finances/payments/manager/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_client_can_view_own_payments(self, api_client, client_user, company, manager, project):
        api_client.force_authenticate(user=client_user)
        payment = Payment.objects.create(
            client=client_user,
            company=company,
            manager=manager,
            amount=500,
            project=project
        )
        response = api_client.get('/api/finances/payments/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['id'] == payment.id
        assert response.data[0]['amount'] == '500.00'

    def test_client_cannot_see_others_payments(self, api_client, client_user, company2, manager, project):
        api_client.force_authenticate(user=client_user)

        Payment.objects.create(
            client=client_user,
            company=company2,
            manager=manager,
            amount=500,
            project=project
        )
        response = api_client.get('/api/finances/payments/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_superuser_can_view_all_payments(
        self, api_client, superuser, client_user, other_client, company, company2, manager, project
    ):
        payment = Payment.objects.create(
            client=client_user,
            company=company,
            manager=manager,
            amount=500,
            project=project
        )
        other_project = Project.objects.create(
            name="Other Project",
            description="Test Description",
            status="pending",
            client=other_client,
            address="456 Test St",
            priority="medium",
            company=company2
        )
        other_payment = Payment.objects.create(
            client=other_client,
            company=company2,
            manager=manager,
            amount=700,
            project=other_project
        )

        api_client.force_authenticate(user=superuser)
        response = api_client.get('/api/finances/payments/')

        assert response.status_code == status.HTTP_200_OK
        payment_ids = [payment['id'] for payment in response.data]
        assert payment.id in payment_ids
        assert other_payment.id in payment_ids

    def test_staff_user_does_not_get_superuser_payment_access(
        self, api_client, staff_user, client_user, company, manager, project
    ):
        Payment.objects.create(
            client=client_user,
            company=company,
            manager=manager,
            amount=500,
            project=project
        )

        api_client.force_authenticate(user=staff_user)
        response = api_client.get('/api/finances/payments/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    @patch('stripe.checkout.Session.create')
    def test_manager_can_create_payment_with_usd(self, mock_stripe, api_client, manager, client_user, project):

        class MockSession:
            id = 'cs_test_usd'
            url = 'https://example.com/session'

        mock_stripe.return_value = MockSession()

        api_client.force_authenticate(user=manager)
        data = {"client": client_user.id, "amount": 500, "project": project.id, "currency": "USD"}
        response = api_client.post('/api/finances/payments/manager/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        payment = Payment.objects.get(id=response.data['id'])
        assert payment.currency == 'USD'
        assert mock_stripe.call_args.kwargs['line_items'][0]['price_data']['currency'] == 'usd'

    @patch('stripe.checkout.Session.create')
    def test_manager_can_create_payment_with_cad(self, mock_stripe, api_client, manager, client_user, project):

        class MockSession:
            id = 'cs_test_cad'
            url = 'https://example.com/session'

        mock_stripe.return_value = MockSession()

        api_client.force_authenticate(user=manager)
        data = {"client": client_user.id, "amount": 500, "project": project.id, "currency": "CAD"}
        response = api_client.post('/api/finances/payments/manager/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        payment = Payment.objects.get(id=response.data['id'])
        assert payment.currency == 'CAD'
        assert mock_stripe.call_args.kwargs['line_items'][0]['price_data']['currency'] == 'cad'

    @patch('stripe.checkout.Session.create')
    def test_invalid_payment_currency_returns_400(self, mock_stripe, api_client, manager, client_user, project):

        class MockSession:
            id = 'cs_test_bad'
            url = 'https://example.com/session'

        mock_stripe.return_value = MockSession()

        api_client.force_authenticate(user=manager)
        data = {"client": client_user.id, "amount": 500, "project": project.id, "currency": "EUR"}
        response = api_client.post('/api/finances/payments/manager/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'currency' in response.data
