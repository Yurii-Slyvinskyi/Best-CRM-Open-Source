import pytest
from django_redis import get_redis_connection
from rest_framework.test import APIClient
from apps.projects.models import Project
from apps.users.models import User
from apps.teams.models import Team
from apps.companies.models import Company


@pytest.fixture(autouse=True)
def setup_settings(settings, tmp_path):
    """Global test settings"""
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.STORAGES = {
        'default': {
            'BACKEND': 'django.core.files.storage.FileSystemStorage',
        },
        'staticfiles': {
            'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
        },
    }
    settings.MEDIA_ROOT = tmp_path
    settings.MEDIA_URL = '/media/'


@pytest.fixture(autouse=True)
def clear_redis():
    get_redis_connection("default").flushdb()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def create_companies(db):
    return {
        "company1": Company.objects.create(name="Company One"),
        "company2": Company.objects.create(name="Company Two"),
    }


@pytest.fixture
def create_users(db, create_companies):
    company1 = create_companies["company1"]
    company2 = create_companies["company2"]

    return {
        "manager1": User.objects.create_user(
            username="manager1", email="manager1@example.com", password="ManagerPass_123",
            role="manager", company=company1
        ),
        "manager2": User.objects.create_user(
            username="manager2", email="manager2@example.com", password="ManagerPass_123",
            role="manager", company=company2
        ),
        "superuser": User.objects.create_superuser(
            username="superuser", email="superuser@example.com", password="AdminPass_123"
        ),
        "staff_client": User.objects.create_user(
            username="staff_client", email="staffclient@example.com", password="ClientPass_123",
            role="client", company=company1, is_staff=True
        ),
        "client1": User.objects.create_user(
            username="client1", email="client1@example.com", password="ClientPass_123",
            role="client", company=company1
        ),
        "worker1": User.objects.create_user(
            username="worker1", email="worker1@example.com", password="WorkerPass_123",
            role="worker", company=company1
        ),
    }


@pytest.fixture
def create_teams(db, create_companies, create_users):
    team1 = Team.objects.create(name="Team One", company=create_companies["company1"])
    team1.workers.set([create_users["worker1"]])
    return {
        "team1": team1
    }


@pytest.fixture
def create_project(db, create_users, create_companies, create_teams):
    project = Project.objects.create(
        name="Test Project",
        description="Test Desc",
        status="pending",
        client=create_users["client1"],
        company=create_companies["company1"],
        address="123 Test St",
        priority="medium",
    )
    project.assigned_team.set([create_teams["team1"]])
    return project
