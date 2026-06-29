import pytest
from rest_framework import status
from apps.reviews.models import Review


@pytest.mark.django_db
class TestReviewsAPI:

    def test_client_can_create_review(self, api_client, client_user, project):
        api_client.force_authenticate(user=client_user)
        data = {
            "project": project.id,
            "rating": 5,
            "comment": "Good Job!"
        }
        response = api_client.post('/api/reviews/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["project"] == project.id
        assert Review.objects.count() == 1

        review = Review.objects.get(id=response.data["id"])
        assert review.project == project
        assert review.client == client_user

    def test_client_cannot_create_review_for_other_company_project(
        self, api_client, client_user, other_company_project
    ):
        api_client.force_authenticate(user=client_user)
        data = {
            "project": other_company_project.id,
            "rating": 5,
            "comment": "Good Job!"
        }
        response = api_client.post('/api/reviews/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "company" in str(response.data)
        assert Review.objects.count() == 0

    def test_client_cannot_create_review_for_same_company_other_client_project(
        self, api_client, client_user, same_company_other_project
    ):
        api_client.force_authenticate(user=client_user)
        data = {
            "project": same_company_other_project.id,
            "rating": 5,
            "comment": "Good Job!"
        }
        response = api_client.post('/api/reviews/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "own projects" in str(response.data)
        assert Review.objects.count() == 0

    def test_client_cannot_create_review_for_nonexistent_project(
        self, api_client, client_user
    ):
        api_client.force_authenticate(user=client_user)
        data = {
            "project": 999999,
            "rating": 5,
            "comment": "Good Job!"
        }
        response = api_client.post('/api/reviews/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Review.objects.count() == 0

    def test_manager_cannot_create_review(self, api_client, manager, project):
        api_client.force_authenticate(user=manager)
        data = {
            "project": project.id,
            "rating": 5,
            "comment": "Good Job!"
        }
        response = api_client.post('/api/reviews/', data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Review.objects.count() == 0

    def test_worker_cannot_create_review(self, api_client, worker, project):
        api_client.force_authenticate(user=worker)
        data = {
            "project": project.id,
            "rating": 5,
            "comment": "Good Job!"
        }
        response = api_client.post('/api/reviews/', data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Review.objects.count() == 0

    def test_client_can_update_own_review(self, api_client, client_user, project):
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
        response = api_client.patch(f'/api/reviews/{review.id}/', data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data["rating"] == 5
        assert response.data["comment"] == "Great Job!"

    def test_client_cannot_update_someone_elses_review(self, api_client, client_user, other_client, project):
        api_client.force_authenticate(user=client_user)
        review = Review.objects.create(
            project=project,
            client=other_client,
            rating=3,
            comment="Okay"
        )
        data = {
            "rating": 5,
            "comment": "Actually, amazing!"
        }
        response = api_client.patch(f'/api/reviews/{review.id}/', data, format='json')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_client_can_delete_own_review(self, api_client, client_user, project):
        api_client.force_authenticate(user=client_user)

        review = Review.objects.create(
            project=project,
            client=client_user,
            rating=5,
            comment="Awesome!"
        )

        response = api_client.delete(f'/api/reviews/{review.id}/')

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Review.objects.filter(id=review.id).exists()

    def test_client_cannot_delete_same_company_other_client_review(
        self, api_client, client_user, same_company_client, same_company_other_project
    ):
        api_client.force_authenticate(user=client_user)

        review = Review.objects.create(
            project=same_company_other_project,
            client=same_company_client,
            rating=3,
            comment="Okay"
        )

        response = api_client.delete(f'/api/reviews/{review.id}/')

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert Review.objects.filter(id=review.id).exists()

    def test_client_cannot_create_multiple_reviews_for_same_project(self, api_client, client_user, project):
        api_client.force_authenticate(user=client_user)

        Review.objects.create(
            project=project,
            client=client_user,
            rating=5,
            comment="Awesome!"
        )

        data = {
            "project": project.id,
            "rating": 3,
            "comment": "Actually, not so good."
        }

        response = api_client.post('/api/reviews/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_manager_can_view_reviews_of_their_company(self, api_client, manager, project, client_user):
        api_client.force_authenticate(user=manager)

        Review.objects.create(
            project=project,
            client=client_user,
            rating=5,
            comment="Great!"
        )

        response = api_client.get('/api/reviews/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_manager_cannot_view_reviews_of_other_company(self, api_client, manager2, project, client_user):
        api_client.force_authenticate(user=manager2)

        Review.objects.create(
            project=project,
            client=client_user,
            rating=5,
            comment="Great!"
        )

        response = api_client.get('/api/reviews/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_client_can_view_only_own_reviews(
        self, api_client, client_user, same_company_client, project, same_company_other_project
    ):
        api_client.force_authenticate(user=client_user)

        own_review = Review.objects.create(
            project=project,
            client=client_user,
            rating=5,
            comment="Great!"
        )
        Review.objects.create(
            project=same_company_other_project,
            client=same_company_client,
            rating=3,
            comment="Okay"
        )

        response = api_client.get('/api/reviews/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["id"] == own_review.id

    def test_client_cannot_retrieve_same_company_other_client_review(
        self, api_client, client_user, same_company_client, same_company_other_project
    ):
        api_client.force_authenticate(user=client_user)

        review = Review.objects.create(
            project=same_company_other_project,
            client=same_company_client,
            rating=3,
            comment="Okay"
        )

        response = api_client.get(f'/api/reviews/{review.id}/')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_filter_reviews_by_rating(self, api_client, client_user, project):
        api_client.force_authenticate(user=client_user)

        Review.objects.create(project=project, client=client_user, rating=5, comment="Excellent")
        response = api_client.get('/api/reviews/?rating=5')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["rating"] == 5
