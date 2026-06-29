import pytest
from django_redis import get_redis_connection
from rest_framework.test import APIClient
from apps.companies.models import Company
from apps.finances.models import Salary, Payment
from apps.users.models import User
from apps.projects.models import Project
from decimal import Decimal


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
        password="password",
        role="manager",
        company=company
    )


@pytest.fixture
def superuser(db):
    return User.objects.create_superuser(
        username="superuser",
        email="superuser@example.com",
        password="password"
    )


@pytest.fixture
def staff_user(db, company):
    return User.objects.create_user(
        username="staff",
        email="staff@example.com",
        password="password",
        role="client",
        company=company,
        is_staff=True
    )


@pytest.fixture
def client_user(db, company):
    return User.objects.create_user(
        username="client",
        email="client@example.com",
        password="password",
        role="client",
        company=company
    )


@pytest.fixture
def other_client(db, company2):
    return User.objects.create_user(
        username="other_client",
        email="otherclient@example.com",
        password="password",
        role="client",
        company=company2
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
def another_worker(db, company2):
    return User.objects.create_user(
        username="worker2",
        email="worker2@example.com",
        password="password",
        role="worker",
        company=company2
    )


@pytest.fixture
def other_worker(db, company2):
    return User.objects.create_user(
        username="other_worker",
        email="other_worker@example.com",
        password="password",
        role="worker",
        company=company2
    )


@pytest.fixture
def project(db, company, client_user):
    return Project.objects.create(
        name="Test Project",
        description="Test Description",
        status="pending",
        client=client_user,
        address="123 Test St",
        priority="medium",
        company=company
    )


@pytest.fixture
def payment(db, client_user, project, company, manager):
    return Payment.objects.create(
        client=client_user,
        company=company,
        project=project,
        amount=Decimal("100.00"),
        currency="USD",
        session_id="cs_test_session_123",
        status="pending",
        manager=manager
    )


@pytest.fixture
def successful_payment(db, payment):
    payment.status = "succeeded"
    payment.save()
    return payment


@pytest.fixture
def failed_payment(db, payment):
    payment.status = "failed"
    payment.save()
    return payment


@pytest.fixture
def salary_for_worker(db, worker, manager, company):
    return Salary.objects.create(
        worker=worker,
        manager=manager,
        company=company,
        amount=Decimal("1500.00"),
        currency="USD"
    )


@pytest.fixture
def salary_for_other_worker(db, other_worker, manager, company2):
    return Salary.objects.create(
        worker=other_worker,
        manager=manager,
        company=company2,
        amount=Decimal("2000.00"),
        currency="USD"
    )
