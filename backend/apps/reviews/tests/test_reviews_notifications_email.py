import pytest
from django.core import mail
from rest_framework import status

from apps.notifications.models import Notification


@pytest.mark.django_db
class TestReviewNotificationEmails:

    def test_review_created_notification(self, api_client, client_user, project, worker, manager):
        """Verify that review created notifications are sent to correct recipients"""
        project.assigned_team.add(*worker.teams.all())
        project.save()

        api_client.force_authenticate(user=client_user)
        mail.outbox = []

        data = {
            "project": project.id,
            "rating": 5,
            "comment": "Great work!"
        }
        response = api_client.post('/api/reviews/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED

        # Check emails were sent to manager and worker
        assert len(mail.outbox) == 3
        recipients = {email.to[0] for email in mail.outbox}
        expected = {client_user.email, manager.email, worker.email}
        assert recipients == expected

        notifications = Notification.objects.filter(subject__icontains="review")
        assert notifications.count() == 3
        recipients = {n.recipient for n in notifications}
        assert recipients == {client_user, manager, worker}

    def test_review_updated_notification(self, api_client, client_user, project, review, worker, manager):
        """Verify that review updated notifications are sent to correct recipients"""
        project.assigned_team.add(*worker.teams.all())
        project.save()

        api_client.force_authenticate(user=client_user)
        mail.outbox = []

        updated_data = {
            "rating": 5,
            "comment": "Excellent job!"
        }
        update_response = api_client.patch(f'/api/reviews/{review.id}/', updated_data, format='json')
        assert update_response.status_code == status.HTTP_200_OK

        # Check emails
        assert len(mail.outbox) == 3
        recipients = {email.to[0] for email in mail.outbox}
        expected = {client_user.email, manager.email, worker.email}
        assert recipients == expected

        notifications = Notification.objects.filter(subject__icontains="review")
        assert notifications.count() == 3
        recipients = {n.recipient for n in notifications}
        assert recipients == {client_user, manager, worker}

    def test_review_deleted_notification(self, api_client, client_user, project, review, worker, manager):
        """Verify that review deleted notifications are sent to correct recipients"""
        project.assigned_team.add(*worker.teams.all())
        project.save()

        api_client.force_authenticate(user=client_user)
        mail.outbox = []

        delete_response = api_client.delete(f'/api/reviews/{review.id}/')
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT

        # Check emails
        assert len(mail.outbox) == 3
        recipients = {email.to[0] for email in mail.outbox}
        expected = {client_user.email, manager.email, worker.email}
        assert recipients == expected

        notifications = Notification.objects.filter(subject__icontains="review")
        assert notifications.count() == 3
        recipients = {n.recipient for n in notifications}
        assert recipients == {client_user, manager, worker}
