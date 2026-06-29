from django.db.models import Prefetch
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.chats.models import ChatRoom
from apps.common.permissions import IsManagerOrSuperUser
from .models import Project
from .serializers import ProjectSerializer
from apps.notifications.mixins import ProjectNotificationsMixin
from apps.teams.models import Team
import logging

logger = logging.getLogger(__name__)


class ProjectViewSet(ModelViewSet, ProjectNotificationsMixin):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.action in ["create", "destroy", "delete_blueprint"]:
            return [IsManagerOrSuperUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        """Filtering projects by user role"""
        user = self.request.user

        base_queryset = Project.objects.select_related(
            'client',
            'company',
            'chat'
        ).prefetch_related(
            Prefetch('assigned_team', queryset=Team.objects.select_related('company')),
            'assigned_team__workers'
        )

        if user.is_superuser:
            return base_queryset
        if user.role == "worker":
            return base_queryset.filter(
                company=user.company,
                assigned_team__workers=user
            ).distinct()
        if user.role == "client":
            return base_queryset.filter(
                company=user.company,
                client=user
            )
        return base_queryset.filter(company=user.company)

    def perform_create(self, serializer):
        user = self.request.user
        project = serializer.save(
            client=user if user.role == "client" else serializer.validated_data.get("client"),
            company=user.company
        )
        ChatRoom.objects.get_or_create(project=project)
        logger.info(f"Project '{project.name}' created by user {user.username} (id={user.id}) in company {user.company.name}")
        self.send_project_created_notification(project)

    def perform_update(self, serializer):
        user = self.request.user
        project = self.get_object()

        if user.role == "worker" and project.company == user.company:
            if set(serializer.validated_data.keys()) <= {"status"}:
                project = serializer.save()
                logger.info(f"Project '{project.name}' status updated to '{project.status}' by worker {user.username} (id={user.id})")
                self.send_project_status_updated_notification(project, project.status)
            else:
                logger.warning(f"User {user.username} (id={user.id}, role=worker) tried to update forbidden fields on project '{project.name}'")
                raise PermissionDenied("Workers can only update the status field.")

        elif user.role == "client":
            logger.warning(f"Client {user.username} (id={user.id}) tried to update project '{project.name}'")
            raise PermissionDenied("Clients cannot update projects.")

        elif user.role == "manager" or user.is_superuser:
            project = serializer.save()
            logger.info(f"Project '{project.name}' updated by user {user.username} (id={user.id})")
            self.send_project_updated_notification(project)

        else:
            logger.warning(f"User {user.username} (id={user.id}, role={user.role}) tried to update project '{project.name}'")
            raise PermissionDenied("You do not have permission to update projects.")

    @action(detail=True, methods=["delete"], url_path="blueprint")
    def delete_blueprint(self, request, pk=None):
        project = self.get_object()

        if project.blueprint:
            project.blueprint.delete(save=False)
            project.blueprint = None
            project.save(update_fields=["blueprint", "updated_at"])

        return Response(status=status.HTTP_204_NO_CONTENT)

    def destroy(self, request, *args, **kwargs):
        project = self.get_object()

        if project.status == "completed":
            logger.warning(f"Attempt to delete completed project '{project.name}' by user {request.user.username} (id={request.user.id}) denied")
            raise ValidationError("Completed projects cannot be deleted.")

        # Save data before deletion for notification
        project_name = project.name
        client = project.client
        company = project.company
        team_members = list(project.assigned_team.all())

        # Delete the project
        response = super().destroy(request, *args, **kwargs)
        logger.info(f"Project '{project_name}' deleted by user {request.user.username} (id={request.user.id})")
        self.send_project_deleted_notification(project_name, client, company, team_members)
        return response
