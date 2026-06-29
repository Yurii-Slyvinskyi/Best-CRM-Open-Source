import pytest
from django.core.cache import cache
from rest_framework import status


@pytest.mark.django_db
class TestUserRegistration:

    def test_view_profile(self, api_client, access_token, test_user):
        """Test authenticated user can view their profile"""
        response = api_client.get(
            '/api/users/profile/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == test_user.username
        assert response.data['email'] == test_user.email

    def test_update_profile(self, api_client, test_user, access_token):
        """Test authenticated user can update their profile"""
        update_data = {
            'email': 'updated@example.com',
            'phone': '9876543210',
            'first_name': 'Updated',
            'last_name': 'User'
        }

        response = api_client.patch(
            '/api/users/profile/',
            data=update_data,
            HTTP_AUTHORIZATION=f'Bearer {access_token}',
            format='json'
        )

        test_user.refresh_from_db()

        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == 'updated@example.com'
        assert test_user.email == 'updated@example.com'
        assert test_user.phone == '9876543210'

    def test_update_profile_invalidates_cached_profile(self, api_client, test_user, access_token):
        """Test profile PATCH clears stale GET cache data"""
        cache_key = f"user_profile_data_{test_user.id}"

        get_response = api_client.get(
            '/api/users/profile/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )

        assert get_response.status_code == status.HTTP_200_OK
        assert get_response.data['email'] == test_user.email
        assert cache.get(cache_key)['email'] == test_user.email

        patch_response = api_client.patch(
            '/api/users/profile/',
            data={'email': 'fresh@example.com'},
            HTTP_AUTHORIZATION=f'Bearer {access_token}',
            format='json'
        )

        assert patch_response.status_code == status.HTTP_200_OK
        assert patch_response.data['email'] == 'fresh@example.com'
        assert cache.get(cache_key) is None

        second_get_response = api_client.get(
            '/api/users/profile/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )

        assert second_get_response.status_code == status.HTTP_200_OK
        assert second_get_response.data['email'] == 'fresh@example.com'
        assert cache.get(cache_key)['email'] == 'fresh@example.com'

    def test_unauthorized_access(self, api_client):
        """Test unauthenticated access to profile"""
        response = api_client.get('/api/users/profile/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
