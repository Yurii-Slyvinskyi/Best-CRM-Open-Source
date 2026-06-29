import pytest
from rest_framework import status


@pytest.mark.django_db
class TestUserLogin:

    def test_login_user_success(self, api_client, test_user):
        data = {
            'username': 'testuser',
            'password': 'StrongPass_987!'
        }
        response = api_client.post('/api/users/login/', data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data

        access_token = response.data['access']
        protected_response = api_client.get(
            '/api/users/profile/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        assert protected_response.status_code == status.HTTP_200_OK
        assert protected_response.data['username'] == 'testuser'

    def test_login_user_unsuccessful(self, api_client):
        data = {
            'username': 'user',
            'password': 'wrongpassword'
        }
        response = api_client.post('/api/users/login/', data, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'access' not in response.data

    def test_login_user_missing_field(self, api_client):
        data = {
            'username': 'user',
        }
        response = api_client.post('/api/users/login/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
        assert response.data['error'] == 'Both username and password are required'

    def test_login_disabled_user(self, api_client, disabled_user):
        data = {
            'username': 'disableduser',
            'password': 'StrongPass_987!'
        }
        response = api_client.post('/api/users/login/', data, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
