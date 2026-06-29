from unittest.mock import patch
import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from apps.reviews.models import Review
from rest_framework import status


@pytest.mark.django_db
class TestReviewSQLOptimization:

    @patch('apps.notifications.mixins.ReviewsNotificationMixin.send_review_created_notification')
    def test_create_review_check_sql_queries(self, mock_notify, api_client, access_token, client_user, project):
        """Test that creating a review performs the correct SQL queries (insert and select)."""
        mock_notify.return_value = None

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.post(
                '/api/reviews/',
                data={'project': project.id, 'rating': 5, 'comment': 'Great project'},
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )

        select_queries = [q for q in ctx.captured_queries if q['sql'].strip().upper().startswith('SELECT')]
        insert_queries = [q for q in ctx.captured_queries if q['sql'].strip().upper().startswith('INSERT')]

        assert response.status_code == status.HTTP_201_CREATED
        assert len(select_queries) <= 3, f"Too many SELECT queries: {len(select_queries)}"
        assert len(insert_queries) == 1, f"Expected one INSERT query, got {len(insert_queries)}"

    @patch('apps.notifications.mixins.ReviewsNotificationMixin.send_review_updated_notification')
    def test_update_review_check_sql_queries(self, mock_notify, api_client, client_user, project):
        """Test that updating a review performs the correct SQL queries (select and update)."""
        mock_notify.return_value = None

        api_client.force_authenticate(user=client_user)
        review = Review.objects.create(
            project=project,
            client=client_user,
            rating=4,
            comment="Not bad"
        )
        data = {
            "rating": 5,
            "comment": "Great Job!"
        }

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.patch(f'/api/reviews/{review.id}/', data, format='json')

        select_queries = [
            q for q in ctx.captured_queries
            if q['sql'].strip().upper().startswith('SELECT')
        ]
        update_queries = [
            q for q in ctx.captured_queries
            if q['sql'].strip().upper().startswith('UPDATE')
        ]

        assert response.status_code == status.HTTP_200_OK
        assert len(select_queries) <= 6, f"Too many SELECT queries: {len(select_queries)}"
        assert len(update_queries) == 1, f"Expected one UPDATE query, got {len(update_queries)}"

    @patch('apps.notifications.mixins.ReviewsNotificationMixin.send_review_deleted_notification')
    def test_delete_review_check_sql_queries(self, mock_notify, api_client, access_token, client_user, review):
        """Test that deleting a review performs the correct SQL queries (select and delete)."""
        mock_notify.return_value = None

        with CaptureQueriesContext(connection) as ctx:
            response = api_client.delete(
                f'/api/reviews/{review.id}/',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )

        select_queries = [
            q for q in ctx.captured_queries
            if q['sql'].strip().upper().startswith('SELECT')
        ]
        delete_queries = [
            q for q in ctx.captured_queries
            if q['sql'].strip().upper().startswith('DELETE')
        ]

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert len(select_queries) <= 5, f"Too many SELECT queries: {len(select_queries)}"
        assert len(delete_queries) == 1, f"Expected one DELETE query, got {len(delete_queries)}"
