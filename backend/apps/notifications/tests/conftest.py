import pytest
from django_redis import get_redis_connection
from rest_framework.test import APIClient

from apps.finances.models import Payment, Salary
from apps.projects.models import Project
from apps.reviews.models import Review
from apps.teams.models import Team
from apps.users.models import User
from apps.notifications.models import Notification
from apps.users.models import Company


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
    client = APIClient()
    client.credentials(HTTP_X_TEST_MODE='true')
    return client


@pytest.fixture
def company(db):
    return Company.objects.create(name="Test Company")


@pytest.fixture
def company2(db):
    return Company.objects.create(name="Another Company")


@pytest.fixture
def manager(db, company):
    return User.objects.create_user(
        username="manager",
        email="manager@example.com",
        password="password123",
        role="manager",
        company=company
    )


@pytest.fixture
def client_user(db, company):
    return User.objects.create_user(
        username="client",
        email="client@example.com",
        password="password123",
        role="client",
        company=company
    )


@pytest.fixture
def worker(db, company):
    return User.objects.create_user(
        username="worker",
        email="worker@example.com",
        password="password",
        role="worker",
        company=company
    )


@pytest.fixture
def worker2(db, company):
    return User.objects.create_user(
        username="worker2",
        email="worker2@example.com",
        password="password",
        role="worker",
        company=company
    )


@pytest.fixture
def foreign_user(db, company2):
    return User.objects.create_user(
        username="foreign",
        email="foreign@example.com",
        password="password123",
        role="client",
        company=company2
    )


@pytest.fixture
def team(db, worker, worker2, company):
    team = Team.objects.create(name="Test Team", company=company)
    team.workers.set([worker, worker2])
    return team


@pytest.fixture
def project(db, manager, client_user, company, team):
    project = Project.objects.create(
        name="Test Project",
        description="Test Desc",
        status="pending",
        client=client_user,
        company=company,
        address="123 Test St",
        priority="medium",
    )
    project.assigned_team.set([team])
    return project


@pytest.fixture
def payment(db, manager, client_user, project, company):
    return Payment.objects.create(
        amount=100,
        currency="USD",
        created_at="2025-05-07 12:00",
        project=project,
        client=client_user,
        manager=manager,
        company=company
    )


@pytest.fixture
def salary(db, manager, worker, company):
    return Salary.objects.create(
        amount=1000,
        currency="USD",
        date_paid="2025-05-07",
        worker=worker,
        manager=manager,
        company=company
    )


@pytest.fixture
def review(db, project, client_user):
    return Review.objects.create(
        project=project,
        client=client_user,
        rating=4.5,
        comment="Great project, well done!",
        created_at="2025-05-07 12:00"
    )


@pytest.fixture
def notifications(db, manager, client_user, worker, foreign_user, company, company2):
    return [
        Notification.objects.create(
            subject="Manager Notification",
            message="Hello Manager",
            recipient=manager,
            company=company
        ),
        Notification.objects.create(
            subject="Client Notification",
            message="Hello Client",
            recipient=client_user,
            company=company
        ),
        Notification.objects.create(
            subject="Worker Notification",
            message="Hello Worker",
            recipient=worker,
            company=company
        ),
        Notification.objects.create(
            subject="Foreign Notification",
            message="You shouldn't see this",
            recipient=foreign_user,
            company=company2
        ),
    ]
