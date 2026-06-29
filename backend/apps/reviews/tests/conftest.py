import pytest
from django_redis import get_redis_connection
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from apps.projects.models import Project
from apps.reviews.models import Review
from apps.users.models import User
from apps.teams.models import Team
from apps.companies.models import Company


@pytest.fixture(autouse=True)
def setup_settings(settings):
    """Global test settings"""
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
    settings.CELERY_TASK_ALWAYS_EAGER = True


@pytest.fixture(autouse=True)
def clear_redis():
    get_redis_connection("default").flushdb()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def company():
    return Company.objects.create(name="Company One")


@pytest.fixture
def company2():
    return Company.objects.create(name="Company Two")


@pytest.fixture
def manager(company):
    return User.objects.create_user(
        username="manager",
        email="manager@example.com",
        password="ManagerPass_123",
        role="manager",
        company=company
    )


@pytest.fixture
def manager2(company2):
    return User.objects.create_user(
        username="manager2",
        email="manager2@example.com",
        password="ManagerPass_123",
        role="manager",
        company=company2
    )


@pytest.fixture
def client_user(company):
    return User.objects.create_user(
        username="client",
        email="client@example.com",
        password="password",
        role="client",
        company=company
    )


@pytest.fixture
def other_client(company2):
    return User.objects.create_user(
        username="other_client",
        email="otherclient@example.com",
        password="password",
        role="client",
        company=company2
    )


@pytest.fixture
def same_company_client(company):
    return User.objects.create_user(
        username="same_company_client",
        email="samecompanyclient@example.com",
        password="password",
        role="client",
        company=company
    )


@pytest.fixture
def worker(company):
    return User.objects.create_user(
        username="worker",
        email="worker@example.com",
        password="password",
        role="worker",
        company=company
    )


@pytest.fixture
def team(company, worker):
    team = Team.objects.create(name="Team One", company=company)
    team.workers.set([worker])
    return team


@pytest.fixture
def project(company, client_user, team):
    project = Project.objects.create(
        name="Test Project", description="Test Desc", status="pending",
        client=client_user, address="123 Test St", priority="medium",
        company=company
    )
    project.assigned_team.set([team])
    return project


@pytest.fixture
def same_company_other_project(company, same_company_client, team):
    project = Project.objects.create(
        name="Other Client Project", description="Test Desc", status="pending",
        client=same_company_client, address="456 Test St", priority="medium",
        company=company
    )
    project.assigned_team.set([team])
    return project


@pytest.fixture
def other_company_project(company2, other_client):
    return Project.objects.create(
        name="Other Company Project", description="Test Desc", status="pending",
        client=other_client, address="789 Test St", priority="medium",
        company=company2
    )


@pytest.fixture
def review(project, client_user):
    review = Review.objects.create(
        project=project,
        client=client_user,
        rating=4,
        comment="Not bad"
    )
    return review


@pytest.fixture
def access_token(api_client, client_user):
    access_token = AccessToken.for_user(client_user)
    return str(access_token)
