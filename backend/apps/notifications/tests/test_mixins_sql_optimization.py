import pytest
from django.test.utils import CaptureQueriesContext
from django.db import connection
from rest_framework import status

from apps.notifications.mixins import (UserNotificationsMixin,
                                       ProjectNotificationsMixin,
                                       FinancialNotificationsMixin,
                                       ReviewsNotificationMixin)


@pytest.mark.django_db
class TestUsersMixinsSQLOptimization:

    def test_login_notification_queries(self, api_client, foreign_user):
        data = {
            'username': 'foreign',
            'password': 'password123'
        }
        with CaptureQueriesContext(connection) as ctx:
            response = api_client.post('/api/users/login/', data, format='json')
            assert response.status_code == status.HTTP_200_OK

        notification_queries = [
            q['sql'] for q in ctx.captured_queries
            if 'notification' in q['sql'].lower()
        ]

        assert len([q for q in notification_queries if q.strip().upper().startswith('INSERT')]) == 1
        assert len([q for q in notification_queries if q.strip().upper().startswith('SELECT')]) == 0

    def test_registration_notification_queries(self, foreign_user):
        mixin = UserNotificationsMixin()
        with CaptureQueriesContext(connection) as ctx:
            mixin.send_registration_notification(foreign_user)

        notification_queries = [
            q['sql'] for q in ctx.captured_queries
            if 'notification' in q['sql'].lower()
        ]

        assert len([q for q in notification_queries if q.strip().upper().startswith('INSERT')]) == 1
        assert len([q for q in notification_queries if q.strip().upper().startswith('SELECT')]) == 0

    def test_role_change_notification_queries(self, foreign_user):
        mixin = UserNotificationsMixin()
        old_role = 'client'
        foreign_user.role = 'worker'
        foreign_user.save(update_fields=['role'])

        with CaptureQueriesContext(connection) as ctx:
            mixin.send_role_change_notification(foreign_user, old_role)

        notification_queries = [
            q['sql'] for q in ctx.captured_queries
            if 'notification' in q['sql'].lower()
        ]

        assert len([q for q in notification_queries if q.strip().upper().startswith('INSERT')]) == 1
        assert len([q for q in notification_queries if q.strip().upper().startswith('SELECT')]) == 0


@pytest.mark.django_db
class TestProjectMixinsSQLOptimization:

    def test_project_created_notification_queries(self, project):
        mixin = ProjectNotificationsMixin()

        with CaptureQueriesContext(connection) as ctx:
            mixin.send_project_created_notification(project)

        notification_queries = [
            q['sql'] for q in ctx.captured_queries
            if 'notification' in q['sql'].lower()
        ]

        assert len([q for q in notification_queries if q.strip().upper().startswith('INSERT')]) >= 1
        assert len([q for q in notification_queries if q.strip().upper().startswith('SELECT')]) == 0

    def test_project_updated_notification_queries(self, project):
        mixin = ProjectNotificationsMixin()

        with CaptureQueriesContext(connection) as ctx:
            mixin.send_project_updated_notification(project)

        notification_queries = [
            q['sql'] for q in ctx.captured_queries
            if 'notification' in q['sql'].lower()
        ]

        assert len([q for q in notification_queries if q.strip().upper().startswith('INSERT')]) >= 1
        assert len([q for q in notification_queries if q.strip().upper().startswith('SELECT')]) == 0

    def test_project_status_updated_notification_queries(self, project):
        mixin = ProjectNotificationsMixin()
        new_status = "in_progress"

        with CaptureQueriesContext(connection) as ctx:
            mixin.send_project_status_updated_notification(project, new_status)

        notification_queries = [
            q['sql'] for q in ctx.captured_queries
            if 'notification' in q['sql'].lower()
        ]

        assert len([q for q in notification_queries if q.strip().upper().startswith('INSERT')]) >= 1
        assert len([q for q in notification_queries if q.strip().upper().startswith('SELECT')]) == 0

    def test_project_deleted_notification_queries(self, project):
        mixin = ProjectNotificationsMixin()
        project = project
        project_name = project.name
        client = project.client
        company = project.company
        team_workers = list(project.assigned_team.all())

        with CaptureQueriesContext(connection) as ctx:
            mixin.send_project_deleted_notification(project_name, client, company, team_workers)

        notification_queries = [
            q['sql'] for q in ctx.captured_queries
            if 'notification' in q['sql'].lower()
        ]

        assert len([q for q in notification_queries if q.strip().upper().startswith('INSERT')]) >= 1
        assert len([q for q in notification_queries if q.strip().upper().startswith('SELECT')]) == 0


@pytest.mark.django_db
class TestFinancialMixinSQLOptimization:

    def test_payment_created_notification_queries(self, payment):
        mixin = FinancialNotificationsMixin()

        with CaptureQueriesContext(connection) as ctx:
            mixin.send_payment_created_notification(payment)

        notification_queries = [
            q['sql'] for q in ctx.captured_queries
            if 'notification' in q['sql'].lower()
        ]

        assert len([q for q in notification_queries if q.strip().upper().startswith('INSERT')]) >= 1
        assert len([q for q in notification_queries if q.strip().upper().startswith('SELECT')]) == 0

    def test_payment_success_notification_queries(self, payment):
        mixin = FinancialNotificationsMixin()

        with CaptureQueriesContext(connection) as ctx:
            mixin.send_payment_success_notification(payment)

        notification_queries = [
            q['sql'] for q in ctx.captured_queries
            if 'notification' in q['sql'].lower()
        ]

        assert len([q for q in notification_queries if q.strip().upper().startswith('INSERT')]) >= 1
        assert len([q for q in notification_queries if q.strip().upper().startswith('SELECT')]) == 0

    def test_payment_failed_notification_queries(self, payment):
        mixin = FinancialNotificationsMixin()

        with CaptureQueriesContext(connection) as ctx:
            mixin.send_payment_failed_notification(payment)

        notification_queries = [
            q['sql'] for q in ctx.captured_queries
            if 'notification' in q['sql'].lower()
        ]

        assert len([q for q in notification_queries if q.strip().upper().startswith('INSERT')]) >= 1
        assert len([q for q in notification_queries if q.strip().upper().startswith('SELECT')]) == 0

    def test_salary_created_notification_queries(self, salary):
        mixin = FinancialNotificationsMixin()

        with CaptureQueriesContext(connection) as ctx:
            mixin.send_salary_created_notification(salary)

        notification_queries = [
            q['sql'] for q in ctx.captured_queries
            if 'notification' in q['sql'].lower()
        ]

        assert len([q for q in notification_queries if q.strip().upper().startswith('INSERT')]) >= 1
        assert len([q for q in notification_queries if q.strip().upper().startswith('SELECT')]) == 0


@pytest.mark.django_db
class TestReviewsMixinSQLOptimization:

    def test_review_created_notification_queries(self, review):
        mixin = ReviewsNotificationMixin()

        with CaptureQueriesContext(connection) as ctx:
            mixin.send_review_created_notification(review)

        notification_queries = [
            q['sql'] for q in ctx.captured_queries
            if 'notification' in q['sql'].lower()
        ]

        assert len([q for q in notification_queries if q.strip().upper().startswith('INSERT')]) >= 1
        assert len([q for q in notification_queries if q.strip().upper().startswith('SELECT')]) == 0

    def test_review_updated_notification_queries(self, review):
        mixin = ReviewsNotificationMixin()

        with CaptureQueriesContext(connection) as ctx:
            mixin.send_review_updated_notification(review)

        notification_queries = [
            q['sql'] for q in ctx.captured_queries
            if 'notification' in q['sql'].lower()
        ]

        assert len([q for q in notification_queries if q.strip().upper().startswith('INSERT')]) >= 1
        assert len([q for q in notification_queries if q.strip().upper().startswith('SELECT')]) == 0

    def test_review_deleted_notification_queries(self, review, project, client_user, company, team):
        mixin = ReviewsNotificationMixin()

        with CaptureQueriesContext(connection) as ctx:
            mixin.send_review_deleted_notification(
                project_name=project.name,
                client=client_user,
                company=company,
                team_workers=team.workers.all()
            )

        notification_queries = [
            q['sql'] for q in ctx.captured_queries
            if 'notification' in q['sql'].lower()
        ]

        assert len([q for q in notification_queries if q.strip().upper().startswith('INSERT')]) >= 1
        assert len([q for q in notification_queries if q.strip().upper().startswith('SELECT')]) == 0
