import pytest
from django_redis import get_redis_connection
from apps.users.models import User
from apps.teams.models import Team
from apps.companies.models import Company
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture(autouse=True)
def clear_redis():
    get_redis_connection("default").flushdb()


@pytest.fixture
def companies(db):
    return {
        "company1": Company.objects.create(name="First Company"),
        "company2": Company.objects.create(name="Second Company")
    }


@pytest.fixture
def users(db, companies):
    company1 = companies["company1"]
    company2 = companies["company2"]

    return {
        "manager1": User.objects.create_user(
            username="manager1", email="manager1@example.com",
            password="ManagerPass_123", role="manager", company=company1),
        "manager2": User.objects.create_user(
            username="manager2", email="manager2@example.com",
            password="ManagerPass_123", role="manager", company=company2),
        "worker1": User.objects.create_user(
            username="worker1", email="worker1@example.com",
            password="WorkerPass_123", role="worker", company=company1),
        "worker2": User.objects.create_user(
            username="worker2", email="worker2@example.com",
            password="WorkerPass_123", role="worker", company=company2),
        "client1": User.objects.create_user(
            username="client1", email="client1@example.com",
            password="ClientPass_123", role="client", company=company1),
        "client2": User.objects.create_user(
            username="client2", email="client2@example.com",
            password="ClientPass_123", role="client", company=company2),
    }


@pytest.fixture
def team(db, users, companies):
    team = Team.objects.create(name="Test Team", company=companies["company1"])
    team.workers.set([users["worker1"]])
    return team
