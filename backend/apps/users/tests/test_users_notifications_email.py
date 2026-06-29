import pytest
from django.core import mail

from apps.notifications.models import Notification
from apps.users.models import User


@pytest.mark.django_db
class TestUserNotificationEmails:

    def test_send_login_notification(self, api_client, test_manager):
        api_client.force_authenticate(user=test_manager)
        data = {
            'username': 'testmanager',
            'password': 'StrongPass_987!'
        }
        response = api_client.post('/api/users/login/', data, format='json')

        assert response.status_code == 200

        # Check email was sent
        assert len(mail.outbox) == 1
        email = mail.outbox[0]
        assert 'Login Notification' in email.subject
        assert test_manager.email in email.to

        # Check notification record
        notification = Notification.objects.filter(recipient=test_manager).first()
        assert notification is not None
        assert notification.subject == email.subject
        assert notification.email_sent is True

    def test_send_registration_notification(self, api_client, test_manager, test_company):
        api_client.force_authenticate(user=test_manager)

        data = {
            'username': 'newuser',
            'password': 'NewPass123!',
            'email': 'newuser@example.com',
            'role': 'client',
        }

        response = api_client.post('/api/users/register/', data, format='json')

        assert response.status_code == 201

        # Check email was sent
        assert len(mail.outbox) == 1
        email = mail.outbox[0]
        assert data['email'] in email.to

        # Check notification record
        user = User.objects.get(username='newuser')
        notification = Notification.objects.filter(recipient=user).first()
        assert notification is not None
        assert notification.subject == email.subject
        assert notification.email_sent is True

    def test_send_role_change_notification(self, api_client, test_manager, test_worker):
        api_client.force_authenticate(user=test_manager)

        data = {'role': 'client'}
        url = f'/api/users/update-role/{test_worker.id}/'
        response = api_client.put(url, data=data, format='json')

        assert response.status_code == 200
        assert response.data['new_role'] == 'client'

        # Check email was sent
        assert len(mail.outbox) == 1
        email = mail.outbox[0]
        assert test_worker.email in email.to

        # Check notification record
        notification = Notification.objects.filter(recipient=test_worker).first()
        assert notification is not None
        assert notification.subject == email.subject
        assert notification.email_sent is True
