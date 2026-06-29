import pytest
from django_redis import get_redis_connection
from rest_framework.test import APIClient
from apps.chats.models import ChatRoom, ChatMessage
from apps.companies.models import Company
from apps.projects.models import Project
from apps.teams.models import Team
from apps.users.models import User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture(autouse=True)
def clear_redis():
    get_redis_connection("default").flushdb()


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
def manager1(db, company1):
    return User.objects.create_user(
        username="manager1",
        email="manager1@example.com",
        password="ManagerPass_123",
        role="manager",
        company=company1
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
def worker1(db, company1):
    return User.objects.create_user(
        username="worker1",
        email="worker1@example.com",
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
def project(db, company1, client1, worker1):
    project = Project.objects.create(
        name="Test Project",
        description="Test Desc",
        status="pending",
        client=client1,
        address="123 Test St",
        priority="medium",
        company=company1
    )
    team = Team.objects.create(name="Team One", company=company1)
    team.workers.set([worker1])
    project.assigned_team.set([team])
    return project


@pytest.fixture
def chat_room1(db, project):
    return ChatRoom.objects.create(project=project)


@pytest.fixture
def chat_message1(db, chat_room1, worker1):
    return ChatMessage.objects.create(
        room=chat_room1,
        sender=worker1,
        content="Test message"
    )
