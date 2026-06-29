import pytest
from rest_framework import status
from apps.users.models import User


@pytest.mark.django_db
class TestUserRegistration:

    def test_register_user_success(self, api_client, test_manager):
        """Testing manager successful register new user"""

        api_client.force_authenticate(test_manager)
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "StrongPass_987!",
            "role": "client",
            "phone": "1234567890",
            "address": "123 Test Street",
        }
        response = api_client.post('/api/users/register/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["username"] == "newuser"
        created_user = User.objects.get(username="newuser")
        assert created_user.company_id == test_manager.company.id

    def test_register_user_invalid_email(self, api_client, test_manager):
        """Testing registration with incorrect email"""
        api_client.force_authenticate(test_manager)
        data = {
            "username": "testuser",
            "email": "invalidemail",
            "password": "password1234",
        }
        response = api_client.post('/api/users/register/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'email' in response.data

    def test_register_user_missing_field(self, api_client, test_manager):
        """Testing registration with missing required fields"""
        api_client.force_authenticate(test_manager)
        data = {
            "email": "testuser@example.com",
            "password": "password1234",
        }
        response = api_client.post('/api/users/register/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'username' in response.data

    def test_register_user_empty_username(self, api_client, test_company, test_manager):
        """Testing registration with empty username"""
        api_client.force_authenticate(test_manager)
        data = {
            "username": "",
            "email": "testuser@example.com",
            "password": "password1234",
        }
        response = api_client.post('/api/users/register/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'username' in response.data
