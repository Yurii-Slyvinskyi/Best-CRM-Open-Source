from django.db.models import Prefetch
from rest_framework.viewsets import ModelViewSet
from apps.common.permissions import IsManagerOrSuperUserOrReadOnly
from .models import Team
from .serializers import TeamSerializer
from ..users.models import User
import logging

logger = logging.getLogger(__name__)


class TeamViewSet(ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsManagerOrSuperUserOrReadOnly]

    def get_queryset(self):
        """Managers and workers can only see their company's teams, the superuser can see everyone"""

        user = self.request.user
        logger.info(f"[Teams] User {user.username} ({user.role}) requested teams list.")
        workers_prefetch = Prefetch(
            'workers',
            queryset=User.objects.only('id', 'username', 'company')
        )
        queryset = Team.objects.select_related('company').prefetch_related(workers_prefetch)

        if user.is_superuser:
            return queryset
        if user.role == "worker":
            return queryset.filter(company=user.company, workers=user)
        return queryset.filter(company=user.company)

    def perform_create(self, serializer):
        """Automatically connect a team with a user's company"""
        serializer.save(company=self.request.user.company)
