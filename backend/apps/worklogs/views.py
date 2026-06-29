from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from .models import WorkLog
from .serializers import WorklogSerializer
from .permissions import CanCreateWorklog, CanManageWorklog


class WorklogViewSet(ModelViewSet):
    queryset = WorkLog.objects.none()
    serializer_class = WorklogSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), CanCreateWorklog()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), CanManageWorklog()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        qs = WorkLog.objects.select_related('worker', 'project', 'team')

        if user.is_superuser:
            scoped_qs = qs
        elif user.role == 'worker':
            scoped_qs = qs.filter(worker=user)
        elif user.role == 'manager':
            scoped_qs = qs.filter(project__company=user.company)
        elif user.role == 'client':
            raise PermissionDenied("Clients cannot view work logs.")
        else:
            scoped_qs = qs.none()

        project_id = self.request.query_params.get('project')
        if project_id:
            try:
                project_id = int(project_id)
            except ValueError:
                raise ValidationError({"detail": "Project filter must be a valid integer."})

            scoped_qs = scoped_qs.filter(project_id=project_id)

        return scoped_qs

    def perform_create(self, serializer):
        user = self.request.user

        if user.role == 'worker':
            serializer.save(worker=user)
        elif user.role == 'manager' or user.is_superuser:
            serializer.save(worker=serializer.validated_data['worker'])
        else:
            raise PermissionDenied("You do not have permission to create work logs.")
