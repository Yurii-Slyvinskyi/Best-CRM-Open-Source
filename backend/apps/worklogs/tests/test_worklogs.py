import pytest
from datetime import date
from django.utils import timezone
from rest_framework import status
from apps.projects.models import Project
from apps.worklogs.models import WorkLog


@pytest.mark.django_db
class TestWorklogAPI:

    def test_unauthenticated_user_cannot_access_worklogs(self, api_client):
        response = api_client.get('/api/worklogs/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_worker_create_worklog(self, api_client, worker1, team1, project1):
        api_client.force_authenticate(user=worker1)
        data = {
            'team': team1.id,
            'project': project1.id,
            'hours_worked': 8,
            'description': 'Installed siding',
        }
        response = api_client.post('/api/worklogs/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['worker'] == worker1.id

        worklog = WorkLog.objects.get(id=response.data['id'])
        assert worklog.worker == worker1

    def test_worker_can_create_worklog_with_explicit_date(self, api_client, worker1, team1, project1):
        api_client.force_authenticate(user=worker1)
        data = {
            'team': team1.id,
            'project': project1.id,
            'date': '2026-06-15',
            'hours_worked': 8,
            'description': 'Installed siding',
        }
        response = api_client.post('/api/worklogs/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['date'] == '2026-06-15'

        worklog = WorkLog.objects.get(id=response.data['id'])
        assert worklog.date == date(2026, 6, 15)

    def test_worker_can_create_worklog_without_date(self, api_client, worker1, team1, project1):
        api_client.force_authenticate(user=worker1)
        data = {
            'team': team1.id,
            'project': project1.id,
            'hours_worked': 8,
            'description': 'Installed siding',
        }
        response = api_client.post('/api/worklogs/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['date'] == timezone.localdate().isoformat()

        worklog = WorkLog.objects.get(id=response.data['id'])
        assert worklog.date == timezone.localdate()

    def test_worker_cannot_create_worklog_for_another_worker(self, api_client, worker1, worker3, team1, project1):
        team1.workers.add(worker3)

        api_client.force_authenticate(user=worker1)
        data = {
            'worker': worker3.id,
            'team': team1.id,
            'project': project1.id,
            'hours_worked': 8,
            'description': 'Installed siding',
        }
        response = api_client.post('/api/worklogs/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert WorkLog.objects.count() == 0

    def test_worker_get_their_worklog(self, api_client, worker1, worklog1):
        api_client.force_authenticate(user=worker1)
        response = api_client.get('/api/worklogs/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0

    def test_worker_cannot_see_others_worklogs(self, api_client, worker2, worklog1):
        api_client.force_authenticate(user=worker2)
        response = api_client.get('/api/worklogs/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_worker_can_filter_own_worklogs_by_project(self, api_client, worker1, client1, team1, project1, worklog1):
        other_project = Project.objects.create(
            name="Second Project",
            description="Test Desc",
            status="pending",
            client=client1,
            address="789 Test St",
            priority="medium",
            company=worker1.company
        )
        other_project.assigned_team.set([team1])
        other_worklog = WorkLog.objects.create(
            worker=worker1,
            team=team1,
            project=other_project,
            hours_worked=3,
            description="Other project work"
        )

        api_client.force_authenticate(user=worker1)
        response = api_client.get(f'/api/worklogs/?project={project1.id}')

        assert response.status_code == status.HTTP_200_OK
        worklog_ids = [worklog['id'] for worklog in response.data]
        assert worklog_ids == [worklog1.id]
        assert other_worklog.id not in worklog_ids

    def test_worker_can_update_own_worklog(self, api_client, worker1, worklog1):
        api_client.force_authenticate(user=worker1)
        data = {
            'hours_worked': 7,
            'description': 'Updated work'
        }
        response = api_client.patch(f'/api/worklogs/{worklog1.id}/', data, format='json')

        assert response.status_code == status.HTTP_200_OK
        worklog1.refresh_from_db()
        assert worklog1.hours_worked == 7
        assert worklog1.description == 'Updated work'

    def test_worker_can_update_own_worklog_date(self, api_client, worker1, worklog1):
        api_client.force_authenticate(user=worker1)
        response = api_client.patch(
            f'/api/worklogs/{worklog1.id}/',
            {'date': '2026-06-16'},
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['date'] == '2026-06-16'

        worklog1.refresh_from_db()
        assert worklog1.date == date(2026, 6, 16)

    def test_invalid_worklog_date_returns_400(self, api_client, worker1, team1, project1, worklog1):
        api_client.force_authenticate(user=worker1)
        data = {
            'team': team1.id,
            'project': project1.id,
            'date': 'not-a-date',
            'hours_worked': 8,
            'description': 'Installed siding',
        }
        response = api_client.post('/api/worklogs/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'date' in response.data

        response = api_client.patch(
            f'/api/worklogs/{worklog1.id}/',
            {'date': 'not-a-date'},
            format='json'
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'date' in response.data

    def test_worker_can_delete_own_worklog(self, api_client, worker1, worklog1):
        api_client.force_authenticate(user=worker1)
        response = api_client.delete(f'/api/worklogs/{worklog1.id}/')

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not WorkLog.objects.filter(id=worklog1.id).exists()

    def test_worker_cannot_update_another_workers_worklog(self, api_client, worker1, worker3, team1, project1):
        team1.workers.add(worker3)
        other_worklog = WorkLog.objects.create(
            worker=worker3,
            team=team1,
            project=project1,
            hours_worked=4,
            description="Other worker work"
        )

        api_client.force_authenticate(user=worker1)
        response = api_client.patch(
            f'/api/worklogs/{other_worklog.id}/',
            {'description': 'Hacked work'},
            format='json'
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        other_worklog.refresh_from_db()
        assert other_worklog.description == "Other worker work"

    def test_worker_cannot_delete_another_workers_worklog(self, api_client, worker1, worker3, team1, project1):
        team1.workers.add(worker3)
        other_worklog = WorkLog.objects.create(
            worker=worker3,
            team=team1,
            project=project1,
            hours_worked=4,
            description="Other worker work"
        )

        api_client.force_authenticate(user=worker1)
        response = api_client.delete(f'/api/worklogs/{other_worklog.id}/')

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert WorkLog.objects.filter(id=other_worklog.id).exists()

    def test_manager_can_see_company_worklogs(self, api_client, manager1, worklog1, worklog2):
        api_client.force_authenticate(user=manager1)
        response = api_client.get('/api/worklogs/')
        assert response.status_code == status.HTTP_200_OK
        worklog_ids = [worklog['id'] for worklog in response.data]
        assert worklog1.id in worklog_ids
        assert worklog2.id not in worklog_ids

    def test_client_cannot_access_worklogs(self, api_client, client1, worklog1, team1, project1):
        api_client.force_authenticate(user=client1)

        response = api_client.get('/api/worklogs/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data == {"detail": "Clients cannot view work logs."}

        response = api_client.get(f'/api/worklogs/{worklog1.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

        data = {
            'team': team1.id,
            'project': project1.id,
            'hours_worked': 8,
            'description': 'Client work',
        }
        response = api_client.post('/api/worklogs/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

        response = api_client.patch(
            f'/api/worklogs/{worklog1.id}/',
            {'description': 'Client changed work'},
            format='json'
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

        response = api_client.delete(f'/api/worklogs/{worklog1.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert WorkLog.objects.filter(id=worklog1.id).exists()

    def test_manager_can_create_worklog_for_company_worker(self, api_client, manager1, worker1, team1, project1):
        api_client.force_authenticate(user=manager1)
        data = {
            'worker': worker1.id,
            'team': team1.id,
            'project': project1.id,
            'hours_worked': 6,
            'description': 'Manager entered work',
        }
        response = api_client.post('/api/worklogs/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        worklog = WorkLog.objects.get(id=response.data['id'])
        assert worklog.worker == worker1

    def test_manager_cannot_create_worklog_without_worker(self, api_client, manager1, team1, project1):
        api_client.force_authenticate(user=manager1)
        data = {
            'team': team1.id,
            'project': project1.id,
            'hours_worked': 6,
            'description': 'Manager entered work',
        }
        response = api_client.post('/api/worklogs/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'worker' in response.data

    def test_manager_cannot_create_worklog_for_other_company_worker(self, api_client, manager1, worker2, team2, project2):
        api_client.force_authenticate(user=manager1)
        data = {
            'worker': worker2.id,
            'team': team2.id,
            'project': project2.id,
            'hours_worked': 6,
            'description': 'Other company work',
        }
        response = api_client.post('/api/worklogs/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert WorkLog.objects.count() == 0

    def test_manager_cannot_create_worklog_with_other_company_team(self, api_client, manager1, worker1, team2, project1):
        api_client.force_authenticate(user=manager1)
        data = {
            'worker': worker1.id,
            'team': team2.id,
            'project': project1.id,
            'hours_worked': 6,
            'description': 'Wrong team work',
        }
        response = api_client.post('/api/worklogs/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert WorkLog.objects.count() == 0

    def test_manager_cannot_create_worklog_with_other_company_project(self, api_client, manager1, worker1, team1, project2):
        api_client.force_authenticate(user=manager1)
        data = {
            'worker': worker1.id,
            'team': team1.id,
            'project': project2.id,
            'hours_worked': 6,
            'description': 'Wrong project work',
        }
        response = api_client.post('/api/worklogs/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert WorkLog.objects.count() == 0

    def test_manager_can_update_company_worklog(self, api_client, manager1, worklog1):
        api_client.force_authenticate(user=manager1)
        response = api_client.patch(
            f'/api/worklogs/{worklog1.id}/',
            {'description': 'Manager updated work'},
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        worklog1.refresh_from_db()
        assert worklog1.description == 'Manager updated work'

    def test_manager_can_delete_company_worklog(self, api_client, manager1, worklog1):
        api_client.force_authenticate(user=manager1)
        response = api_client.delete(f'/api/worklogs/{worklog1.id}/')

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not WorkLog.objects.filter(id=worklog1.id).exists()

    def test_manager_cannot_update_other_company_worklog(self, api_client, manager1, worklog2):
        api_client.force_authenticate(user=manager1)
        response = api_client.patch(
            f'/api/worklogs/{worklog2.id}/',
            {'description': 'Manager changed other company work'},
            format='json'
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        worklog2.refresh_from_db()
        assert worklog2.description == "Other company work"

    def test_manager_cannot_delete_other_company_worklog(self, api_client, manager1, worklog2):
        api_client.force_authenticate(user=manager1)
        response = api_client.delete(f'/api/worklogs/{worklog2.id}/')

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert WorkLog.objects.filter(id=worklog2.id).exists()

    def test_worklog_hours_validation(self, api_client, worker1, team1, project1):
        api_client.force_authenticate(user=worker1)
        data = {
            'team': team1.id,
            'project': project1.id,
            'hours_worked': -1,
            'description': 'Worked on installation'
        }
        response = api_client.post('/api/worklogs/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'hours_worked' in response.data

    def test_worker_can_only_create_for_their_company(self, api_client, worker2, team1, project1):
        api_client.force_authenticate(user=worker2)
        data = {
            'team': team1.id,
            'project': project1.id,
            'hours_worked': 8,
            'description': 'Worked on installation'
        }
        response = api_client.post('/api/worklogs/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_worker_cannot_create_worklog_for_completed_project(self, api_client, worker1, team1, project1):
        project1.status = 'completed'
        project1.save()

        api_client.force_authenticate(user=worker1)
        data = {
            'team': team1.id,
            'project': project1.id,
            'hours_worked': 8,
            'description': 'Worked on completed project'
        }
        response = api_client.post('/api/worklogs/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_superuser_can_see_all_worklogs(self, api_client, admin, worklog1):
        api_client.force_authenticate(user=admin)
        response = api_client.get('/api/worklogs/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0

    def test_superuser_can_create_worklog_for_worker(self, api_client, admin, worker1, team1, project1):
        api_client.force_authenticate(user=admin)
        data = {
            'worker': worker1.id,
            'team': team1.id,
            'project': project1.id,
            'hours_worked': 5,
            'description': 'Superuser entered work',
        }
        response = api_client.post('/api/worklogs/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        worklog = WorkLog.objects.get(id=response.data['id'])
        assert worklog.worker == worker1

    def test_staff_user_cannot_access_worklogs_as_superuser(self, api_client, staff_user, worklog1):
        api_client.force_authenticate(user=staff_user)
        response = api_client.get('/api/worklogs/')

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data == {"detail": "Clients cannot view work logs."}

    def test_manager_can_filter_worklogs_by_project(self, api_client, manager1, worker1, client1, team1, project1, worklog1):
        other_project = Project.objects.create(
            name="Second Project",
            description="Test Desc",
            status="pending",
            client=client1,
            address="789 Test St",
            priority="medium",
            company=manager1.company
        )
        other_project.assigned_team.set([team1])
        other_worklog = WorkLog.objects.create(
            worker=worker1,
            team=team1,
            project=other_project,
            hours_worked=3,
            description="Other project work"
        )

        api_client.force_authenticate(user=manager1)
        response = api_client.get(f'/api/worklogs/?project={project1.id}')

        assert response.status_code == status.HTTP_200_OK
        worklog_ids = [worklog['id'] for worklog in response.data]
        assert worklog_ids == [worklog1.id]
        assert other_worklog.id not in worklog_ids

    def test_manager_project_filter_does_not_cross_company(self, api_client, manager1, project2, worklog2):
        api_client.force_authenticate(user=manager1)
        response = api_client.get(f'/api/worklogs/?project={project2.id}')

        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    def test_manager_project_filter_rejects_invalid_value(self, api_client, manager1):
        api_client.force_authenticate(user=manager1)
        response = api_client.get('/api/worklogs/?project=abc')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["detail"] == "Project filter must be a valid integer."
