import pytest
from rest_framework import status
from apps.notifications.models import Notification
from django.core import mail


@pytest.mark.django_db
class TestProjectNotificationEmails:
    def test_send_project_created_notification(self, api_client, create_users, create_teams):
        """Verify project creation notifications are sent to correct recipients"""
        manager = create_users["manager1"]
        client = create_users["client1"]
        worker = create_users["worker1"]
        team = create_teams["team1"]

        # Add worker to team
        team.workers.add(worker)
        team.save()

        api_client.force_authenticate(user=manager)
        mail.outbox = []

        data = {
            "name": "Test Project",
            "description": "Description",
            "client": client.id,
            "company": client.company.id,
            "assigned_team": [team.id],
            "address": "Some Address",
            "priority": "high",
            "budget": 50000,
        }
        response = api_client.post('/api/projects/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED

        assert len(mail.outbox) == 3
        recipients = {email.to[0] for email in mail.outbox}
        expected = {client.email, manager.email, worker.email}
        assert recipients == expected

        notifications = Notification.objects.filter(subject__icontains="project")
        assert notifications.count() == 3
        recipients = {n.recipient for n in notifications}
        assert recipients == {client, manager, worker}

    def test_send_project_updated_notification(self, api_client, create_project, create_users):
        """Verify project update notifications are sent"""
        manager = create_users["manager1"]
        project = create_project
        worker = create_users["worker1"]

        api_client.force_authenticate(user=manager)
        mail.outbox = []

        data = {
            "name": "Updated Project Name",
            "description": "Updated Description"
        }
        response = api_client.patch(f'/api/projects/{project.id}/', data, format='json')

        assert response.status_code == status.HTTP_200_OK

        assert len(mail.outbox) == 3
        recipients = {email.to[0] for email in mail.outbox}
        expected = {project.client.email, manager.email, worker.email}
        assert recipients == expected

        notifications = Notification.objects.filter(subject__icontains="updated")
        assert notifications.count() == 3
        recipients = {n.recipient for n in notifications}
        assert recipients == {project.client, manager, worker}

    def test_send_project_status_updated_notification(self, api_client, create_project, create_users):
        """Verify status update notifications are sent"""
        worker = create_users["worker1"]
        project = create_project
        manager = create_users["manager1"]

        api_client.force_authenticate(user=worker)
        mail.outbox = []

        data = {"status": "completed"}
        response = api_client.patch(f'/api/projects/{project.id}/', data, format='json')

        assert response.status_code == status.HTTP_200_OK

        assert len(mail.outbox) == 3
        recipients = {email.to[0] for email in mail.outbox}
        expected = {project.client.email, manager.email, worker.email}
        assert recipients == expected

        notifications = Notification.objects.filter(subject__icontains="Project Updated")
        assert notifications.count() == 3
        recipients = {n.recipient for n in notifications}
        assert recipients == {project.client, manager, worker}

    def test_send_project_deleted_notification(self, api_client, create_project, create_users):
        """Verify project deletion notifications are sent to correct recipients"""
        manager = create_users["manager1"]
        project = create_project
        worker = create_users["worker1"]

        api_client.force_authenticate(user=manager)
        mail.outbox = []

        response = api_client.delete(f'/api/projects/{project.id}/')

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Check emails were sent
        assert len(mail.outbox) == 3  # client + manager + worker
        recipients = [email.to[0] for email in mail.outbox]
        assert project.client.email in recipients
        assert manager.email in recipients
        assert worker.email in recipients

        # Check notification records
        deleted_notifications = Notification.objects.filter(
            subject__contains="Project Deleted"
        )
        assert deleted_notifications.count() == 3
