import pytest
from django.core import mail
from unittest.mock import patch, Mock
from rest_framework import status
from apps.finances.webhooks import handle_payment_failed
from apps.finances.webhooks import handle_payment_success
from apps.notifications.models import Notification
from apps.users.models import User


@pytest.mark.django_db
class TestFinanceNotificationEmails:

    @patch("apps.finances.serializers.stripe.checkout.Session.create")
    def test_payment_created_notification(
            self, mock_stripe_create, api_client, manager, client_user, project, company
    ):
        mock_stripe_create.return_value = Mock(
            id="test_session_id",
            url="https://stripe.com/test-session-url"
        )
        manager2 = User.objects.create_user(
            username="manager2",
            email="manager2@example.com",
            password="password",
            role="manager",
            company=company,
        )

        api_client.force_authenticate(user=manager)
        mail.outbox = []

        data = {
            "client": client_user.id,
            "amount": 500,
            "project": project.id,
            "currency": "USD",
        }

        response = api_client.post("/api/finances/payments/manager/", data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert len(mail.outbox) == 2

        recipients = {email.to[0] for email in mail.outbox}
        expected = {client_user.email, manager2.email}
        assert recipients == expected

        notifications = Notification.objects.filter(subject__icontains="payment")
        assert notifications.count() == 2
        recipients = {n.recipient for n in notifications}
        assert recipients == {client_user, manager2}

    def test_payment_success_notification(self, api_client, manager, payment, client_user):
        mail.outbox = []

        session = {'id': 'test_session_id'}
        payment.session_id = session['id']
        payment.save()

        response = handle_payment_success(session)
        assert response.status_code == status.HTTP_200_OK

        assert len(mail.outbox) == 2
        recipients = {email.to[0] for email in mail.outbox}
        expected = {client_user.email, manager.email}
        assert recipients == expected

        notifications = Notification.objects.filter(subject__icontains="payment")
        assert notifications.count() == 2
        recipients = {n.recipient for n in notifications}
        assert recipients == {client_user, manager}

    def test_payment_failed_notification(self, api_client, manager, payment, client_user):
        mail.outbox = []

        session = {
            'id': 'test_session_id',
            'last_payment_error': {'message': 'Card declined'}
        }
        payment.session_id = session['id']
        payment.save()

        handle_payment_failed(session)

        # Check email was sent
        assert len(mail.outbox) == 2
        recipients = {email.to[0] for email in mail.outbox}
        expected = {client_user.email, manager.email}
        assert recipients == expected

        notifications = Notification.objects.filter(subject__icontains="payment")
        assert notifications.count() == 2
        recipients = {n.recipient for n in notifications}
        assert recipients == {client_user, manager}

    def test_salary_created_notification(self, api_client, manager, worker, company):
        # Create a second manager
        manager2 = User.objects.create_user(
            username="manager2",
            email="manager2@example.com",
            password="password",
            role="manager",
            company=company
        )

        api_client.force_authenticate(user=manager)
        mail.outbox = []

        data = {
            "worker": worker.id,
            "amount": "1500.00",
            "currency": "USD"
        }
        response = api_client.post('/api/finances/salaries/manager/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED

        # Check email was sent
        assert len(mail.outbox) == 2
        recipients = {email.to[0] for email in mail.outbox}
        expected = {worker.email, manager2.email}
        assert recipients == expected

        notifications = Notification.objects.filter(subject__icontains="payment")
        assert notifications.count() == 2
        recipients = {n.recipient for n in notifications}
        assert recipients == {worker, manager2}
