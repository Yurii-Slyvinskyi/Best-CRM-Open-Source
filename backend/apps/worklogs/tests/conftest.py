import pytest
from django_redis import get_redis_connection
from rest_framework.test import APIClient

from apps.companies.models import Company
from apps.projects.models import Project
from apps.teams.models import Team
from apps.users.models import User
from apps.worklogs.models import WorkLog


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
def company1(db):
    return Company.objects.create(name="Company One")


@pytest.fixture
def company2(db):
    return Company.objects.create(name="Company Two")


@pytest.fixture
def admin(db, company1):
    return User.objects.create_superuser(
        username="admin",
        email="admin@example.com",
        password="AdminPass_123",
        company=company1
    )


@pytest.fixture
def staff_user(db, company1):
    return User.objects.create_user(
        username="staff",
        email="staff@example.com",
        password="StaffPass_123",
        role="client",
        company=company1,
        is_staff=True
    )


@pytest.fixture
def manager1(db, company1):
    return User.objects.create_user(
        username="manager1",
        email="manager1@example.com",
        password="ManagerPass_123",
        role="manager",
        company=company1
    )


@pytest.fixture
def manager2(db, company2):
    return User.objects.create_user(
        username="manager2",
        email="manager2@example.com",
        password="ManagerPass_123",
        role="manager",
        company=company2
    )


@pytest.fixture
def client1(db, company1):
    return User.objects.create_user(
        username="client1",
        email="client1@example.com",
        password="ClientPass_123",
        role="client",
        company=company1
    )


@pytest.fixture
def client2(db, company2):
    return User.objects.create_user(
        username="client2",
        email="client2@example.com",
        password="ClientPass_123",
        role="client",
        company=company2
    )


@pytest.fixture
def worker1(db, company1):
    return User.objects.create_user(
        username="worker1",
        email="worker1@example.com",
        password="WorkerPass_123",
        role="worker",
        company=company1
    )


@pytest.fixture
def worker3(db, company1):
    return User.objects.create_user(
        username="worker3",
        email="worker3@example.com",
        password="WorkerPass_123",
        role="worker",
        company=company1
    )


@pytest.fixture
def worker2(db, company2):
    return User.objects.create_user(
        username="worker2",
        email="worker2@example.com",
        password="WorkerPass_123",
        role="worker",
        company=company2
    )


@pytest.fixture
def team1(db, company1, worker1):
    team = Team.objects.create(name="Team One", company=company1)
    team.workers.set([worker1])
    return team


@pytest.fixture
def team2(db, company2, worker2):
    team = Team.objects.create(name="Team Two", company=company2)
    team.workers.set([worker2])
    return team


@pytest.fixture
def project1(db, company1, client1, team1):
    project = Project.objects.create(
        name="Test Project",
        description="Test Desc",
        status="pending",
        client=client1,
        address="123 Test St",
        priority="medium",
        company=company1
    )
    project.assigned_team.set([team1])
    return project


@pytest.fixture
def project2(db, company2, client2, team2):
    project = Project.objects.create(
        name="Other Project",
        description="Test Desc",
        status="pending",
        client=client2,
        address="456 Test St",
        priority="medium",
        company=company2
    )
    project.assigned_team.set([team2])
    return project


@pytest.fixture
def worklog1(db, worker1, team1, project1):
    return WorkLog.objects.create(
        worker=worker1,
        team=team1,
        project=project1,
        hours_worked=8,
        description="Worked on installation"
    )


@pytest.fixture
def worklog2(db, worker2, team2, project2):
    return WorkLog.objects.create(
        worker=worker2,
        team=team2,
        project=project2,
        hours_worked=6,
        description="Other company work"
    )
