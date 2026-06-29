import pytest
from rest_framework import status
from apps.teams.models import Team


@pytest.mark.django_db
class TestTeamAPI:

    def test_manager_gets_own_teams(self, api_client, users, companies):
        Team.objects.create(name="Own Team", company=companies["company1"])
        api_client.force_authenticate(user=users["manager1"])
        response = api_client.get('/api/teams/')

        assert response.status_code == status.HTTP_200_OK
        assert any(team["name"] == "Own Team" for team in response.data)

    def test_manager_cannot_access_other_company_teams(self, api_client, users, team):
        api_client.force_authenticate(user=users["manager2"])
        response = api_client.get(f'/api/teams/{team.id}/')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_worker_gets_only_own_teams(self, api_client, users, companies, team):
        other_team = Team.objects.create(name="Same Company Other Team", company=companies["company1"])

        api_client.force_authenticate(user=users["worker1"])
        response = api_client.get('/api/teams/')

        assert response.status_code == status.HTTP_200_OK
        team_ids = [team_data["id"] for team_data in response.data]
        assert team.id in team_ids
        assert other_team.id not in team_ids

    def test_manager_can_create_team(self, api_client, users, companies):
        api_client.force_authenticate(user=users["manager1"])
        data = {
            "name": "New Team",
            "company": companies["company1"].id,
            "workers": [users["worker1"].id]
        }
        response = api_client.post('/api/teams/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert Team.objects.filter(name="New Team").exists()

    def test_manager_cannot_create_duplicate_team_name_in_same_company(self, api_client, users, companies):
        Team.objects.create(name="Duplicate Team", company=companies["company1"])
        api_client.force_authenticate(user=users["manager1"])
        data = {
            "name": "Duplicate Team",
            "workers": [users["worker1"].id],
        }
        response = api_client.post('/api/teams/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "name" in response.data
        assert Team.objects.filter(name="Duplicate Team", company=companies["company1"]).count() == 1

    def test_different_companies_can_use_same_team_name(self, api_client, users, companies):
        Team.objects.create(name="Shared Team Name", company=companies["company1"])

        api_client.force_authenticate(user=users["manager2"])
        data = {
            "name": "Shared Team Name",
            "workers": [users["worker2"].id],
        }
        response = api_client.post('/api/teams/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert Team.objects.filter(name="Shared Team Name").count() == 2
        created = Team.objects.get(id=response.data["id"])
        assert created.company == companies["company2"]

    def test_manager_cannot_add_workers_from_other_company(self, api_client, users, team):
        api_client.force_authenticate(user=users["manager1"])
        data = {"workers": [users["worker2"].id]}

        response = api_client.patch(f'/api/teams/{team.id}/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_client_cannot_create_team(self, api_client, users):
        api_client.force_authenticate(user=users["client1"])
        data = {
            "name": "Client Team",
            "workers": [users["worker1"].id]
        }
        response = api_client.post('/api/teams/', data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_worker_cannot_create_team(self, api_client, users):
        api_client.force_authenticate(user=users["worker1"])
        data = {"name": "Worker Team"}
        response = api_client.post('/api/teams/', data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_manager_can_delete_own_team(self, api_client, users, team):
        api_client.force_authenticate(user=users["manager1"])
        response = api_client.delete(f'/api/teams/{team.id}/')

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Team.objects.filter(id=team.id).exists()

    def test_manager_cannot_delete_other_company_teams(self, api_client, users, team):
        api_client.force_authenticate(user=users["manager2"])
        response = api_client.delete(f'/api/teams/{team.id}/')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_unauthorized_user_cannot_access_teams(self, api_client):
        response = api_client.get('/api/teams/')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
