import pytest
from rest_framework import status

from apps.notifications.models import Notification


@pytest.mark.django_db
class TestNotificationListView:

    def test_manager_can_see_own_notifications(self, api_client, manager, notifications):
        api_client.force_authenticate(user=manager)
        response = api_client.get('/api/notifications/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0

    def test_list_includes_read_state(self, api_client, manager, notifications):
        api_client.force_authenticate(user=manager)
        response = api_client.get('/api/notifications/')

        assert response.status_code == status.HTTP_200_OK
        assert 'is_read' in response.data[0]
        assert 'read_at' in response.data[0]

    def test_unread_count_counts_only_current_user(
        self,
        api_client,
        manager,
        client_user,
        foreign_user,
        company,
        company2
    ):
        Notification.objects.create(
            subject="Unread Manager Notification",
            message="Unread",
            recipient=manager,
            company=company
        )
        Notification.objects.create(
            subject="Read Manager Notification",
            message="Read",
            recipient=manager,
            company=company,
            is_read=True
        )
        Notification.objects.create(
            subject="Client Notification",
            message="Other same company user",
            recipient=client_user,
            company=company
        )
        Notification.objects.create(
            subject="Foreign Notification",
            message="Other company user",
            recipient=foreign_user,
            company=company2
        )

        api_client.force_authenticate(user=manager)
        response = api_client.get('/api/notifications/unread-count/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data == {'count': 1}

    def test_mark_read_sets_read_state(self, api_client, manager, company):
        notification = Notification.objects.create(
            subject="Unread Manager Notification",
            message="Unread",
            recipient=manager,
            company=company
        )

        api_client.force_authenticate(user=manager)
        response = api_client.post(f'/api/notifications/{notification.id}/mark-read/')

        notification.refresh_from_db()
        assert response.status_code == status.HTTP_200_OK
        assert notification.is_read is True
        assert notification.read_at is not None
        assert response.data['is_read'] is True

    def test_mark_read_other_user_notification_returns_404(self, api_client, manager, client_user, company):
        notification = Notification.objects.create(
            subject="Client Notification",
            message="Other user",
            recipient=client_user,
            company=company
        )

        api_client.force_authenticate(user=manager)
        response = api_client.post(f'/api/notifications/{notification.id}/mark-read/')

        notification.refresh_from_db()
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert notification.is_read is False
        assert notification.read_at is None

    def test_mark_all_read_updates_only_current_user(
        self,
        api_client,
        manager,
        client_user,
        foreign_user,
        company,
        company2
    ):
        own_first = Notification.objects.create(
            subject="First Manager Notification",
            message="Unread",
            recipient=manager,
            company=company
        )
        own_second = Notification.objects.create(
            subject="Second Manager Notification",
            message="Unread",
            recipient=manager,
            company=company
        )
        other_same_company = Notification.objects.create(
            subject="Client Notification",
            message="Other same company user",
            recipient=client_user,
            company=company
        )
        other_company = Notification.objects.create(
            subject="Foreign Notification",
            message="Other company user",
            recipient=foreign_user,
            company=company2
        )

        api_client.force_authenticate(user=manager)
        response = api_client.post('/api/notifications/mark-all-read/')

        own_first.refresh_from_db()
        own_second.refresh_from_db()
        other_same_company.refresh_from_db()
        other_company.refresh_from_db()
        assert response.status_code == status.HTTP_200_OK
        assert response.data == {'updated': 2}
        assert own_first.is_read is True
        assert own_first.read_at is not None
        assert own_second.is_read is True
        assert own_second.read_at is not None
        assert other_same_company.is_read is False
        assert other_same_company.read_at is None
        assert other_company.is_read is False
        assert other_company.read_at is None

    def test_client_can_see_own_notifications(self, api_client, client_user, notifications):
        api_client.force_authenticate(user=client_user)
        response = api_client.get('/api/notifications/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0

    def test_worker_can_see_own_notifications(self, api_client, worker, notifications):
        api_client.force_authenticate(user=worker)
        response = api_client.get('/api/notifications/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
