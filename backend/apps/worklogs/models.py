from django.db import models
from django.utils import timezone

from apps.projects.models import Project
from apps.teams.models import Team
from apps.users.models import User


class WorkLog(models.Model):
    worker = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'worker'},
                               related_name='worklogs')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='worklogs')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='worklogs')

    date = models.DateField(default=timezone.localdate)
    hours_worked = models.PositiveIntegerField()
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.worker.username} - {self.project.name} ({self.hours_worked}h)"
