from unittest.mock import patch
import pytest
from django.test.utils import CaptureQueriesContext
from django.db import connection
from rest_framework import status
from apps.projects.models import Project


@pytest.mark.django_db
class TestProjectSQLOptimization:
    # apps.notifications.mixins.ProjectNotificationsMixin.send_project_updated_notification

    def test_project_list_sql_queries(self, api_client, create_users, create_companies, create_teams, create_project):
        """Test that retrieving the project list performs the correct SQL queries."""
        user = create_users["manager1"]
        company = create_companies["company1"]
        client = create_users["client1"]
        team = create_teams["team1"]

        # Create multiple projects
        for i in range(5):
            project = Project.objects.create(
                name=f"Project {i}",
                description="Test",
                company=company,
                client=client,
            )
            project.assigned_team.add(team)

        api_client.force_authenticate(user=user)

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.get(f'/api/projects/')

        select_queries = [q for q in ctx.captured_queries if q['sql'].strip().upper().startswith('SELECT')]

        assert response.status_code == status.HTTP_200_OK
        assert len(select_queries) <= 6, f"Too many SELECT queries: {len(select_queries)}"

    @patch('apps.notifications.mixins.ProjectNotificationsMixin.send_project_created_notification')
    def test_project_retrieve_sql_queries(self, mock_notify, api_client, create_users, create_project):
        """Test that retrieving a project performs the correct SQL queries."""
        mock_notify.return_value = None

        user = create_users["manager1"]
        api_client.force_authenticate(user=user)

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.get(f'/api/projects/{create_project.id}/')

        select_queries = [q for q in ctx.captured_queries if q['sql'].strip().upper().startswith('SELECT')]

        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == create_project.name
        assert len(select_queries) <= 3, f"Too many SELECT queries: {len(select_queries)}"

    @patch('apps.notifications.mixins.ProjectNotificationsMixin.send_project_deleted_notification')
    def test_project_destroy_minimal_sql(self, mock_notify, api_client, create_users, create_project):
        """Test that deleting a project performs minimal SQL queries."""
        mock_notify.return_value = None

        user = create_users["manager1"]
        api_client.force_authenticate(user=user)

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.delete(f'/api/projects/{create_project.id}/')

        select_queries = [q for q in ctx.captured_queries if q['sql'].strip().upper().startswith('SELECT')]
        delete_queries = [q for q in ctx.captured_queries if q['sql'].strip().upper().startswith('DELETE')]

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert len(select_queries) <= 7, f"Too many SELECT queries: {len(select_queries)}"
        assert len(delete_queries) == 5, f"Too many DELETE queries: {len(delete_queries)}"

    @patch('apps.notifications.mixins.ProjectNotificationsMixin.send_project_updated_notification')
    def test_worker_can_update_status_with_min_queries(self, mock_notify, api_client, create_users, create_project):
        """Test that a worker can update project status with minimal SQL queries."""
        mock_notify.return_value = None

        worker = create_users["worker1"]
        api_client.force_authenticate(user=worker)

        data = {"status": "completed"}

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.patch(f'/api/projects/{create_project.id}/', data, format='json')

        select_queries = [q for q in ctx.captured_queries if q['sql'].strip().upper().startswith('SELECT')]
        updates_queries = [q for q in ctx.captured_queries if q['sql'].strip().upper().startswith('UPDATE')]

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "completed"
        assert len(select_queries) <= 14, f"Too many SELECT queries: {len(select_queries)}"
        assert len(updates_queries) == 4, f"Too many UPDATE queries: {len(updates_queries)}"
