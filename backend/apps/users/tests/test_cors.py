import pytest
from rest_framework import status


@pytest.mark.django_db
class TestCORSConfiguration:
    def test_preflight_request(self, api_client):
        """Test OPTIONS preflight request with allowed origin"""
        response = api_client.options(
            '/api/users/login/',
            HTTP_ORIGIN='http://127.0.0.1:3000',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS='content-type'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response['Access-Control-Allow-Origin'] == 'http://127.0.0.1:3000'
        assert 'POST' in response['Access-Control-Allow-Methods']
        assert 'content-type' in response['Access-Control-Allow-Headers']

    def test_actual_request(self, api_client):
        """Test actual request with CORS headers"""
        response = api_client.get(
            '/api/users/profile/',
            HTTP_ORIGIN='http://127.0.0.1:3000'
        )

        assert 'Access-Control-Allow-Origin' in response.headers
        assert response.headers['Access-Control-Allow-Origin'] == 'http://127.0.0.1:3000'

    def test_disallowed_origin(self, api_client):
        """Test request from disallowed origin"""
        response = api_client.options(
            '/api/users/login/',
            HTTP_ORIGIN='http://malicious-site.com',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST'
        )

        assert (
                response.status_code == status.HTTP_403_FORBIDDEN or
                response.headers.get('Access-Control-Allow-Origin') != 'http://malicious-site.com'
        )

    def test_credentials_support(self, api_client):
        """Test that credentials are supported"""
        response = api_client.options(
            '/api/users/login/',
            HTTP_ORIGIN='http://127.0.0.1:3000',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
            HTTP_ACCESS_CONTROL_REQUEST_CREDENTIALS='true'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.headers.get('Access-Control-Allow-Credentials') == 'true'

    def test_multiple_allowed_origins(self, api_client, settings):
        """Test multiple allowed origins configuration"""
        settings.CORS_ALLOWED_ORIGINS = [
            "http://127.0.0.1:3000",
            "http://localhost:3000",  # Додано для зворотньої сумісності
            "https://frontend.example.com"
        ]

        for origin in settings.CORS_ALLOWED_ORIGINS:
            response = api_client.options(
                '/api/users/login/',
                HTTP_ORIGIN=origin,
                HTTP_ACCESS_CONTROL_REQUEST_METHOD='GET'
            )
            assert response.status_code == status.HTTP_200_OK
            assert origin in response.headers['Access-Control-Allow-Origin']

    def test_cors_with_authentication(self, authorized_client):
        """Test CORS works with authenticated requests"""
        response = authorized_client.get(
            '/api/users/profile/',
            HTTP_ORIGIN='http://127.0.0.1:3000'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.headers['Access-Control-Allow-Origin'] == 'http://127.0.0.1:3000'
