import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from apps.chats.models import ChatRoom
from apps.projects.models import Project
from apps.teams.models import Team
from apps.users.models import User


def create_pdf_file(name="blueprint.pdf"):
    return SimpleUploadedFile(
        name,
        b"%PDF-1.4\n% project blueprint\n%%EOF\n",
        content_type="application/pdf",
    )


def create_project_for_client(client, team, name="Client Project"):
    project = Project.objects.create(
        name=name,
        description="Client project description",
        status="pending",
        client=client,
        company=client.company,
        address="123 Client St",
        priority="medium",
    )
    project.assigned_team.set([team])
    return project


@pytest.mark.django_db
class TestProjectAPI:

    def test_manager_can_create_project(self, api_client, create_users, create_teams):
        api_client.force_authenticate(user=create_users["manager1"])
        data = {
            "name": "New Project",
            "description": "Description",
            "client": create_users["client1"].id,
            "assigned_team": [create_teams["team1"].id],
            "address": "Some Address",
            "priority": "high",
            "budget": 50000,
        }
        response = api_client.post('/api/projects/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        project = Project.objects.get(id=response.data["id"])
        assert project.company == create_users["manager1"].company
        assert response.data["company"] == create_users["manager1"].company.id

    def test_manager_submitted_company_is_ignored_on_create(self, api_client, create_users, create_companies, create_teams):
        api_client.force_authenticate(user=create_users["manager1"])
        data = {
            "name": "Company Ignored Project",
            "description": "Description",
            "client": create_users["client1"].id,
            "company": create_companies["company2"].id,
            "assigned_team": [create_teams["team1"].id],
            "address": "Some Address",
            "priority": "high",
            "budget": 50000,
        }
        response = api_client.post('/api/projects/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        project = Project.objects.get(id=response.data["id"])
        assert project.company == create_users["manager1"].company
        assert project.company != create_companies["company2"]
        assert response.data["company"] == create_users["manager1"].company.id

    def test_manager_project_create_creates_one_chat_room(self, api_client, create_users, create_companies, create_teams):
        api_client.force_authenticate(user=create_users["manager1"])
        data = {
            "name": "Project With Chat",
            "description": "Description",
            "client": create_users["client1"].id,
            "company": create_companies["company1"].id,
            "assigned_team": [create_teams["team1"].id],
            "address": "Some Address",
            "priority": "high",
            "budget": 50000,
        }
        response = api_client.post('/api/projects/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        project = Project.objects.get(id=response.data["id"])
        chat_room = ChatRoom.objects.get(project=project)
        assert response.data["chat_room"] == chat_room.id

        retrieve_response = api_client.get(f'/api/projects/{project.id}/')
        assert retrieve_response.status_code == status.HTTP_200_OK
        assert retrieve_response.data["chat_room"] == chat_room.id

    def test_project_response_includes_chat_room_id(self, api_client, create_users, create_project):
        chat_room = ChatRoom.objects.create(project=create_project)
        api_client.force_authenticate(user=create_users["manager1"])

        response = api_client.get(f'/api/projects/{create_project.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data["chat_room"] == chat_room.id

    def test_worker_cannot_create_project(self, api_client, create_users, create_companies, create_teams):
        api_client.force_authenticate(user=create_users["worker1"])
        data = {
            "name": "New Project",
            "description": "Description",
            "client": create_users["client1"].id,
            "company": create_users["client1"].company.id,
            "assigned_team": [create_teams["team1"].id],
            "address": "Some Address",
            "priority": "high",
            "budget": 50000,
        }
        response = api_client.post('/api/projects/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_client_cannot_create_project(self, api_client, create_users, create_companies, create_teams):
        api_client.force_authenticate(user=create_users["client1"])
        data = {
            "name": "New Project",
            "description": "Description",
            "client": create_users["client1"].id,
            "company": create_users["client1"].company.id,
            "assigned_team": [create_teams["team1"].id],
            "address": "Some Address",
            "priority": "high",
            "budget": 50000,
        }
        response = api_client.post('/api/projects/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_staff_client_cannot_create_project_as_superuser(self, api_client, create_users, create_teams):
        api_client.force_authenticate(user=create_users["staff_client"])
        data = {
            "name": "New Project",
            "description": "Description",
            "client": create_users["client1"].id,
            "company": create_users["client1"].company.id,
            "assigned_team": [create_teams["team1"].id],
            "address": "Some Address",
            "priority": "high",
            "budget": 50000,
        }
        response = api_client.post('/api/projects/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_manager_cannot_assign_team_from_other_company(self, api_client, create_users, create_companies):
        api_client.force_authenticate(user=create_users["manager1"])
        team_other = Team.objects.create(name="Team Two", company=create_companies["company2"])

        data = {
            "name": "Invalid Project",
            "description": "Test",
            "client": create_users["client1"].id,
            "company": create_users["client1"].company.id,
            "assigned_team": [team_other.id],
            "address": "Invalid address",
            "priority": "low",
            "budget": 1000,
        }
        response = api_client.post('/api/projects/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_manager_can_create_project_with_client_from_same_company(self, api_client, create_users, create_teams):
        api_client.force_authenticate(user=create_users["manager1"])
        data = {
            "name": "Same Company Client Project",
            "description": "Description",
            "client": create_users["client1"].id,
            "assigned_team": [create_teams["team1"].id],
            "address": "Some Address",
            "priority": "high",
            "budget": 50000,
        }
        response = api_client.post('/api/projects/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        project = Project.objects.get(id=response.data["id"])
        assert project.client == create_users["client1"]
        assert project.client.company == create_users["manager1"].company

    def test_manager_cannot_create_project_with_client_from_other_company(self, api_client, create_users, create_companies, create_teams):
        other_client = User.objects.create_user(
            username="client_company2",
            email="client_company2@example.com",
            password="ClientPass_123",
            role="client",
            company=create_companies["company2"],
        )
        api_client.force_authenticate(user=create_users["manager1"])
        data = {
            "name": "Cross Company Client Project",
            "description": "Description",
            "client": other_client.id,
            "assigned_team": [create_teams["team1"].id],
            "address": "Some Address",
            "priority": "high",
            "budget": 50000,
        }
        response = api_client.post('/api/projects/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "client" in response.data
        assert not Project.objects.filter(name="Cross Company Client Project").exists()

    def test_manager_cannot_update_project_to_client_from_other_company(self, api_client, create_users, create_companies, create_project):
        other_client = User.objects.create_user(
            username="client_company2",
            email="client_company2@example.com",
            password="ClientPass_123",
            role="client",
            company=create_companies["company2"],
        )
        original_client = create_project.client

        api_client.force_authenticate(user=create_users["manager1"])
        response = api_client.patch(
            f'/api/projects/{create_project.id}/',
            {"client": other_client.id},
            format='json'
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "client" in response.data
        create_project.refresh_from_db()
        assert create_project.client == original_client

    def test_manager_can_edit_project(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["manager1"])
        data = {
            "name": "Updated Name",
            "description": "Updated Description",
            "priority": "high"
        }
        response = api_client.patch(f'/api/projects/{create_project.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        create_project.refresh_from_db()
        assert create_project.name == "Updated Name"
        assert create_project.description == "Updated Description"
        assert create_project.priority == "high"

    def test_superuser_can_edit_project(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["superuser"])
        data = {
            "name": "Updated By Superuser",
            "description": "Updated Description",
            "priority": "high"
        }
        response = api_client.patch(f'/api/projects/{create_project.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        create_project.refresh_from_db()
        assert create_project.name == "Updated By Superuser"
        assert create_project.description == "Updated Description"
        assert create_project.priority == "high"

    def test_client_cannot_edit_project(self, api_client, create_users, create_project):
        original_description = create_project.description
        original_budget = create_project.budget
        original_priority = create_project.priority

        api_client.force_authenticate(user=create_users["client1"])
        data = {
            "description": "Client changed description",
            "budget": 75000,
            "priority": "high",
        }
        response = api_client.patch(f'/api/projects/{create_project.id}/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

        create_project.refresh_from_db()
        assert create_project.description == original_description
        assert create_project.budget == original_budget
        assert create_project.priority == original_priority

    def test_worker_cannot_edit_project(self, api_client, create_users, create_project):
        original_name = create_project.name

        api_client.force_authenticate(user=create_users["worker1"])
        data = {"name": "Hacked Name"}
        response = api_client.patch(f'/api/projects/{create_project.id}/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        create_project.refresh_from_db()
        assert create_project.name == original_name

    def test_manager_can_delete_project_if_not_completed(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["manager1"])
        response = api_client.delete(f'/api/projects/{create_project.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Project.objects.filter(id=create_project.id).exists()

    def test_manager_cannot_delete_completed_project(self, api_client, create_users, create_project):
        create_project.status = "completed"
        create_project.save()

        api_client.force_authenticate(user=create_users["manager1"])
        response = api_client.delete(f'/api/projects/{create_project.id}/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_client_cannot_delete_project(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["client1"])
        response = api_client.delete(f'/api/projects/{create_project.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_worker_cannot_delete_project(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["worker1"])
        response = api_client.delete(f'/api/projects/{create_project.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_project_isolated_by_company(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["manager2"])
        response = api_client.get(f'/api/projects/{create_project.id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_project_status_update(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["worker1"])
        data = {"status": "completed"}
        response = api_client.patch(f'/api/projects/{create_project.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "completed"
        create_project.refresh_from_db()
        assert create_project.status == "completed"

    def test_manager_can_upload_pdf_blueprint(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["manager1"])
        response = api_client.patch(
            f'/api/projects/{create_project.id}/',
            {"blueprint": create_pdf_file()},
            format='multipart'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["blueprint"]
        assert response.data["blueprint"].endswith(".pdf")
        create_project.refresh_from_db()
        assert create_project.blueprint.name.startswith("project_blueprints/")

    def test_manager_can_replace_pdf_blueprint(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["manager1"])
        first_response = api_client.patch(
            f'/api/projects/{create_project.id}/',
            {"blueprint": create_pdf_file("first.pdf")},
            format='multipart'
        )
        second_response = api_client.patch(
            f'/api/projects/{create_project.id}/',
            {"blueprint": create_pdf_file("second.pdf")},
            format='multipart'
        )

        assert first_response.status_code == status.HTTP_200_OK
        assert second_response.status_code == status.HTTP_200_OK
        create_project.refresh_from_db()
        assert "second" in create_project.blueprint.name
        assert second_response.data["blueprint"]

    def test_manager_can_delete_blueprint(self, api_client, create_users, create_project):
        create_project.blueprint.save("blueprint.pdf", create_pdf_file(), save=True)
        api_client.force_authenticate(user=create_users["manager1"])

        response = api_client.delete(f'/api/projects/{create_project.id}/blueprint/')

        assert response.status_code == status.HTTP_204_NO_CONTENT
        create_project.refresh_from_db()
        assert not create_project.blueprint

    def test_worker_cannot_upload_blueprint(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["worker1"])
        response = api_client.patch(
            f'/api/projects/{create_project.id}/',
            {"blueprint": create_pdf_file()},
            format='multipart'
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        create_project.refresh_from_db()
        assert not create_project.blueprint

    def test_client_cannot_upload_blueprint(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["client1"])
        response = api_client.patch(
            f'/api/projects/{create_project.id}/',
            {"blueprint": create_pdf_file()},
            format='multipart'
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        create_project.refresh_from_db()
        assert not create_project.blueprint

    def test_non_pdf_blueprint_upload_is_rejected(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["manager1"])
        text_file = SimpleUploadedFile(
            "blueprint.txt",
            b"not a pdf",
            content_type="text/plain",
        )

        response = api_client.patch(
            f'/api/projects/{create_project.id}/',
            {"blueprint": text_file},
            format='multipart'
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Blueprint must be a PDF file." in str(response.data["blueprint"])

    def test_wrong_blueprint_content_type_is_rejected(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["manager1"])
        text_file = SimpleUploadedFile(
            "blueprint.pdf",
            b"not a pdf",
            content_type="text/plain",
        )

        response = api_client.patch(
            f'/api/projects/{create_project.id}/',
            {"blueprint": text_file},
            format='multipart'
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Blueprint file content type must be application/pdf." in str(response.data["blueprint"])

    def test_project_response_includes_blueprint(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["manager1"])

        response = api_client.get(f'/api/projects/{create_project.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert "blueprint" in response.data

    def test_manager_can_view_projects(self, api_client, create_users):
        api_client.force_authenticate(user=create_users["manager1"])
        response = api_client.get('/api/projects/')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)

    def test_worker_can_view_assigned_projects(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["worker1"])
        response = api_client.get('/api/projects/')
        assert response.status_code == status.HTTP_200_OK
        assert create_project.id in [project["id"] for project in response.data]

    def test_worker_cannot_view_same_company_project_without_assigned_team(self, api_client, create_users, create_project):
        other_worker = User.objects.create_user(
            username="worker2",
            email="worker2@example.com",
            password="WorkerPass_123",
            role="worker",
            company=create_users["worker1"].company
        )
        other_team = Team.objects.create(name="Other Worker Team", company=create_users["worker1"].company)
        other_team.workers.set([other_worker])
        hidden_project = Project.objects.create(
            name="Hidden Project",
            description="Hidden Desc",
            status="pending",
            client=create_users["client1"],
            company=create_users["worker1"].company,
            address="456 Hidden St",
            priority="medium",
        )
        hidden_project.assigned_team.set([other_team])

        api_client.force_authenticate(user=create_users["worker1"])
        response = api_client.get('/api/projects/')

        assert response.status_code == status.HTTP_200_OK
        project_ids = [project["id"] for project in response.data]
        assert create_project.id in project_ids
        assert hidden_project.id not in project_ids

    def test_worker_retrieve_unassigned_project_returns_404(self, api_client, create_users):
        unassigned_project = Project.objects.create(
            name="Unassigned Project",
            description="Unassigned Desc",
            status="pending",
            client=create_users["client1"],
            company=create_users["worker1"].company,
            address="789 Unassigned St",
            priority="medium",
        )

        api_client.force_authenticate(user=create_users["worker1"])
        response = api_client.get(f'/api/projects/{unassigned_project.id}/')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_worker_project_list_does_not_duplicate_multi_team_project(self, api_client, create_users, create_project):
        second_team = Team.objects.create(name="Second Worker Team", company=create_users["worker1"].company)
        second_team.workers.set([create_users["worker1"]])
        create_project.assigned_team.add(second_team)

        api_client.force_authenticate(user=create_users["worker1"])
        response = api_client.get('/api/projects/')

        assert response.status_code == status.HTTP_200_OK
        project_ids = [project["id"] for project in response.data]
        assert project_ids.count(create_project.id) == 1

    def test_client_can_view_projects(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["client1"])
        response = api_client.get('/api/projects/')
        assert response.status_code == status.HTTP_200_OK
        assert create_project.id in [project["id"] for project in response.data]

    def test_client_cannot_view_same_company_project_for_other_client(self, api_client, create_users, create_project, create_teams):
        other_client = User.objects.create_user(
            username="client2",
            email="client2@example.com",
            password="ClientPass_123",
            role="client",
            company=create_users["client1"].company
        )
        other_project = create_project_for_client(other_client, create_teams["team1"], "Other Client Project")

        api_client.force_authenticate(user=create_users["client1"])
        response = api_client.get('/api/projects/')

        assert response.status_code == status.HTTP_200_OK
        project_ids = [project["id"] for project in response.data]
        assert create_project.id in project_ids
        assert other_project.id not in project_ids

    def test_client_can_retrieve_visible_project(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["client1"])
        response = api_client.get(f'/api/projects/{create_project.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == create_project.id

    def test_client_retrieve_same_company_other_client_project_returns_404(self, api_client, create_users, create_teams):
        other_client = User.objects.create_user(
            username="client2",
            email="client2@example.com",
            password="ClientPass_123",
            role="client",
            company=create_users["client1"].company
        )
        other_project = create_project_for_client(other_client, create_teams["team1"], "Other Client Project")

        api_client.force_authenticate(user=create_users["client1"])
        response = api_client.get(f'/api/projects/{other_project.id}/')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_manager_can_view_projects_for_all_clients_in_company(self, api_client, create_users, create_project, create_teams):
        other_client = User.objects.create_user(
            username="client2",
            email="client2@example.com",
            password="ClientPass_123",
            role="client",
            company=create_users["manager1"].company
        )
        other_project = create_project_for_client(other_client, create_teams["team1"], "Other Client Project")

        api_client.force_authenticate(user=create_users["manager1"])
        response = api_client.get('/api/projects/')

        assert response.status_code == status.HTTP_200_OK
        project_ids = [project["id"] for project in response.data]
        assert create_project.id in project_ids
        assert other_project.id in project_ids

    def test_manager_cannot_view_other_company_projects(self, api_client, create_users, create_project):
        api_client.force_authenticate(user=create_users["manager2"])
        response = api_client.get('/api/projects/')
        assert response.status_code == status.HTTP_200_OK
        assert create_project.id not in [p["id"] for p in response.data]

    def test_unauthenticated_user_cannot_access_projects(self, api_client):
        response = api_client.get('/api/projects/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
