import pytest

from apps.companies.models import Company
from apps.users.models import User


@pytest.fixture
def other_company_user(db):
    other_company = Company.objects.create(name="Other Company")
    return User.objects.create_user(
        username='outsider',
        email='outsider@example.com',
        password='StrongPass_987!',
        role='worker',
        company=other_company,
    )


@pytest.fixture
def test_superuser(db):
    return User.objects.create_superuser(
        username='root',
        email='root@example.com',
        password='StrongPass_987!',
    )


@pytest.mark.django_db
class TestUserListAccess:
    """Access to /api/users/list/ across roles, including company-less superuser."""

    def test_superuser_without_company_can_list_users(self, api_client, test_superuser, test_manager, other_company_user):
        # Superuser has no company; this must not 500 on company dereference.
        assert test_superuser.company is None

        api_client.force_authenticate(user=test_superuser)
        response = api_client.get('/api/users/list/')

        assert response.status_code == 200
        usernames = {user['username'] for user in response.data}
        # Superuser is not company-scoped: sees users from every company.
        assert {'testmanager', 'outsider'} <= usernames

    def test_manager_only_sees_own_company_users(self, api_client, test_manager, test_worker, other_company_user):
        api_client.force_authenticate(user=test_manager)
        response = api_client.get('/api/users/list/')

        assert response.status_code == 200
        companies = {user['company'] for user in response.data}
        assert companies == {test_manager.company.name}
        usernames = {user['username'] for user in response.data}
        assert 'outsider' not in usernames

    def test_worker_cannot_list_users(self, api_client, test_worker):
        api_client.force_authenticate(user=test_worker)
        response = api_client.get('/api/users/list/')
        assert response.status_code == 403

    def test_client_cannot_list_users(self, api_client, test_client):
        api_client.force_authenticate(user=test_client)
        response = api_client.get('/api/users/list/')
        assert response.status_code == 403


@pytest.mark.django_db
class TestUserManagement:
    """Manager update/delete of company users via /api/users/manage/<pk>/."""

    def test_manager_updates_company_user(self, api_client, test_manager, test_worker):
        api_client.force_authenticate(user=test_manager)

        response = api_client.patch(
            f'/api/users/manage/{test_worker.id}/',
            {
                'username': 'updated_worker',
                'email': 'updated@example.com',
                'phone': '555-0199',
                'address': '500 Updated Ave',
                'role': 'client',
            },
            format='json',
        )

        assert response.status_code == 200
        test_worker.refresh_from_db()
        assert test_worker.username == 'updated_worker'
        assert test_worker.email == 'updated@example.com'
        assert test_worker.phone == '555-0199'
        assert test_worker.address == '500 Updated Ave'
        assert test_worker.role == 'client'

    def test_manager_updates_user_password(self, api_client, test_manager, test_worker):
        api_client.force_authenticate(user=test_manager)

        response = api_client.patch(
            f'/api/users/manage/{test_worker.id}/',
            {'password': 'BrandNew_456!'},
            format='json',
        )

        assert response.status_code == 200
        test_worker.refresh_from_db()
        assert test_worker.check_password('BrandNew_456!')

    def test_manager_cannot_assign_manager_role(self, api_client, test_manager, test_worker):
        api_client.force_authenticate(user=test_manager)

        response = api_client.patch(
            f'/api/users/manage/{test_worker.id}/',
            {'role': 'manager'},
            format='json',
        )

        assert response.status_code == 400
        test_worker.refresh_from_db()
        assert test_worker.role == 'worker'

    def test_company_cannot_be_changed_via_payload(self, api_client, test_manager, test_worker, other_company_user):
        api_client.force_authenticate(user=test_manager)
        original_company_id = test_worker.company_id

        response = api_client.patch(
            f'/api/users/manage/{test_worker.id}/',
            {'company': other_company_user.company_id},
            format='json',
        )

        assert response.status_code == 200
        test_worker.refresh_from_db()
        assert test_worker.company_id == original_company_id

    def test_manager_deletes_company_user(self, api_client, test_manager, test_worker):
        api_client.force_authenticate(user=test_manager)

        response = api_client.delete(f'/api/users/manage/{test_worker.id}/')

        assert response.status_code == 204
        assert not User.objects.filter(id=test_worker.id).exists()

    def test_manager_cannot_delete_self(self, api_client, test_manager):
        api_client.force_authenticate(user=test_manager)

        response = api_client.delete(f'/api/users/manage/{test_manager.id}/')

        assert response.status_code == 400
        assert User.objects.filter(id=test_manager.id).exists()

    def test_manager_cannot_update_other_company_user(self, api_client, test_manager, other_company_user):
        api_client.force_authenticate(user=test_manager)

        response = api_client.patch(
            f'/api/users/manage/{other_company_user.id}/',
            {'username': 'hacked'},
            format='json',
        )

        assert response.status_code == 404
        other_company_user.refresh_from_db()
        assert other_company_user.username == 'outsider'

    def test_manager_cannot_delete_other_company_user(self, api_client, test_manager, other_company_user):
        api_client.force_authenticate(user=test_manager)

        response = api_client.delete(f'/api/users/manage/{other_company_user.id}/')

        assert response.status_code == 404
        assert User.objects.filter(id=other_company_user.id).exists()

    def test_worker_cannot_manage_users(self, api_client, test_worker, test_client):
        api_client.force_authenticate(user=test_worker)

        update = api_client.patch(
            f'/api/users/manage/{test_client.id}/',
            {'role': 'worker'},
            format='json',
        )
        delete = api_client.delete(f'/api/users/manage/{test_client.id}/')

        assert update.status_code == 403
        assert delete.status_code == 403
