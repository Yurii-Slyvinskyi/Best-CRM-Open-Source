from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsClient
from apps.reviews.models import Review
from apps.reviews.serializers import ReviewSerializer
from apps.notifications.mixins import ReviewsNotificationMixin
from apps.users.models import User


class ReviewViewSet(ModelViewSet, ReviewsNotificationMixin):
    queryset = Review.objects.none()
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [IsClient()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filtering reviews by user role and company with query optimization"""
        user = self.request.user

        queryset = Review.objects.select_related(
            'client',
            'project__company'
        ).prefetch_related(
            'project__assigned_team__workers'
        )

        if user.is_superuser:
            return queryset

        if user.role == "worker":
            return queryset.filter(
                project__company=user.company,
                project__assigned_team__workers=user
            ).distinct()

        if user.role == "client":
            return queryset.filter(
                project__company=user.company,
                client=user
            )

        return queryset.filter(project__company=user.company)

    def perform_create(self, serializer):
        review = serializer.save(client=self.request.user)
        # Send review created
        self.send_review_created_notification(review)

    def update(self, request, *args, **kwargs):
        """Handles both PUT and PATCH requests"""
        review = self.get_object()

        if review.client != request.user:
            return Response({"detail": "You can only edit your own reviews"},
                            status=status.HTTP_403_FORBIDDEN)

        response = super().update(request, *args, **kwargs)
        # Send review updated
        self.send_review_updated_notification(review)
        return response

    def destroy(self, request, *args, **kwargs):
        review = self.get_queryset().filter(pk=kwargs['pk']).first()

        if not review:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if review.client != request.user:
            return Response(
                {"detail": "You can only delete your own reviews"},
                status=status.HTTP_403_FORBIDDEN
            )

        project_name = review.project.name
        client = review.client
        company = review.project.company
        team_workers = User.objects.filter(
            teams__in=review.project.assigned_team.all()
        ).distinct()

        review.delete()

        self.send_review_deleted_notification(
            project_name=project_name,
            client=client,
            company=company,
            team_workers=team_workers
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
