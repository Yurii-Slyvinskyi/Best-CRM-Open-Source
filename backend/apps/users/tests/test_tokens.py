import pytest
from rest_framework import status


@pytest.mark.django_db
class TestTokenOperations:

    def test_token_obtain_pair(self, api_client, test_user):
        data = {
            'username': 'testuser',
            'password': 'StrongPass_987!'
        }
        response = api_client.post('/api/users/login/', data, format='json')
        assert response.status_code == status.HTTP_200_OK, response.data
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_token_obtain_invalid_credentials(self, api_client, test_user):
        data = {
            'username': 'testuser',
            'password': 'wrong_password'
        }
        response = api_client.post('/api/users/login/', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_token_refresh(self, api_client, test_user):
        login_data = {
            'username': 'testuser',
            'password': 'StrongPass_987!'
        }
        login_response = api_client.post('/api/users/login/', login_data, format='json')
        assert login_response.status_code == 200, login_response.data
        refresh_token = login_response.data.get('refresh')
        assert refresh_token

        response = api_client.post('/api/users/login/refresh/', {'refresh': refresh_token}, format='json')
        assert response.status_code == 200
        assert 'access' in response.data

    def test_token_refresh_invalid(self, api_client):
        response = api_client.post('/api/users/login/refresh/', {'refresh': 'invalid_token'}, format='json')
        assert response.status_code == 401

    def test_token_verify(self, api_client, access_token):
        response = api_client.post('/api/users/login/verify/', {'token': access_token}, format='json')
        assert response.status_code == 200

    def test_token_verify_invalid(self, api_client):
        response = api_client.post('/api/users/login/verify/', {'token': 'invalid_token'}, format='json')
        assert response.status_code == 401

    def test_protected_endpoint_access(self, api_client, access_token):
        response = api_client.get('/api/users/profile/', HTTP_AUTHORIZATION=f'Bearer {access_token}')
        assert response.status_code == 200

    def test_protected_endpoint_no_token(self, api_client):
        response = api_client.get('/api/users/profile/')
        assert response.status_code == 401

    def test_protected_endpoint_invalid_token(self, api_client):
        response = api_client.get('/api/users/profile/', HTTP_AUTHORIZATION='Bearer invalid_token')
        assert response.status_code == 401

    def test_token_blacklist(self, api_client, test_user):
        # Login success
        login_response = api_client.post('/api/users/login/', {
            'username': 'testuser',
            'password': 'StrongPass_987!'
        }, format='json')
        assert login_response.status_code == status.HTTP_200_OK
        refresh_token = login_response.data.get('refresh')
        assert refresh_token is not None

        # Logout (with authorization)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {login_response.data["access"]}')
        logout_response = api_client.post('/api/users/logout/', {
            'refresh': refresh_token
        }, format='json')

        # Need return 205
        assert logout_response.status_code == status.HTTP_205_RESET_CONTENT, \
            f"Expected 205, got {logout_response.status_code}. Response: {logout_response.data}"

        # Trying to reuse the refresh token
        refresh_response = api_client.post('/api/users/login/refresh/', {
            'refresh': refresh_token
        }, format='json')
        assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED
