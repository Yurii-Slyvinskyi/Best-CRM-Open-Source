import pytest
from rest_framework import status

"""
    After connected Docker test failed. Need to fix.
"""


@pytest.mark.django_db(transaction=True)
class TestThrottling:

    def test_login_throttling(self, api_client):
        """Test that after 20 failed attempts, the 21st returns 429"""

        api_client.defaults['REMOTE_ADDR'] = f'127.0.0.7'
        for i in range(10):
            response = api_client.post('/api/users/login/', {
                'username': f'non_existent_user_{i}',
                'password': 'wrong_password',
            }, format='json')

            assert response.status_code == status.HTTP_401_UNAUTHORIZED

        # 21st attempt (11 for now)
        response = api_client.post('/api/users/login/', {
            'username': 'any_username',
            'password': 'any_password',
        }, format='json')
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
