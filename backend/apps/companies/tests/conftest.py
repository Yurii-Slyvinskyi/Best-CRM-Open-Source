import pytest
from rest_framework.test import APIClient
from apps.users.models import User
from apps.companies.models import Company


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="admin",
        email="admin@example.com",
        password="AdminPass_123"
    )


@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        username="staff",
        email="staff@example.com",
        password="StaffPass_123",
        role="manager",
        is_staff=True
    )


@pytest.fixture
def regular_user(db):
    return User.objects.create_user(
        username='testuser',
        email='testuser@example.com',
        password='StrongPass_987!'
    )


@pytest.fixture
def company(db):
    return Company.objects.create(name='Test Company', slug='test-company')
