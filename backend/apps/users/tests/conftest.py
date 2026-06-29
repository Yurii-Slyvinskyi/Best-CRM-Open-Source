import pytest
from rest_framework.test import APIClient
from django.core import mail
from django_redis import get_redis_connection
from apps.users.models import User
from apps.companies.models import Company
from rest_framework_simplejwt.tokens import AccessToken


@pytest.fixture(autouse=True)
def setup_settings(settings):
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
    settings.CELERY_TASK_ALWAYS_EAGER = True


@pytest.fixture(autouse=True)
def clear_redis():
    get_redis_connection("default").flushdb()


@pytest.fixture
def api_client():
    client = APIClient()
    client.credentials(HTTP_X_TEST_MODE='true')
    return client


@pytest.fixture
def test_company(db):
    return Company.objects.create(name="Test Company")


@pytest.fixture
def test_manager(db, test_company):
    return User.objects.create_user(
        username='testmanager',
        email='testmanager@example.com',
        password='StrongPass_987!',
        role='manager',
        company=test_company
    )


@pytest.fixture
def test_client(db, test_company):
    return User.objects.create_user(
        username='testclient',
        email='testclient@example.com',
        password='StrongPass_987!',
        role='client',
        company=test_company
    )


@pytest.fixture
def test_worker(db, test_company):
    return User.objects.create_user(
        username='testworker',
        email='testworker@example.com',
        password='StrongPass_987!',
        role='worker',
        company=test_company
    )


@pytest.fixture
def test_user(db, test_company):
    return User.objects.create_user(
        username='testuser',
        email='testuser@example.com',
        password='StrongPass_987!',
        company=test_company
    )


@pytest.fixture
def disabled_user(db):
    return User.objects.create_user(
        username='disableduser',
        email='disableduser@example.com',
        password='StrongPass_987!',
        is_active=False
    )


@pytest.fixture
def access_token(test_user):
    return str(AccessToken.for_user(test_user))


@pytest.fixture
def authorized_client(api_client, access_token):
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    return api_client


@pytest.fixture
def mailoutbox():
    return mail.outbox
