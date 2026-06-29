from django.db import models
from apps.companies.models import Company
from apps.users.models import User


class Team(models.Model):
    name = models.CharField(max_length=255)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='teams'
    )
    workers = models.ManyToManyField(
        User,
        related_name='teams',
        limit_choices_to={'role': 'worker'},
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name}, {self.company}"

    class Meta:
        indexes = [
            models.Index(fields=['name', 'company']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['company', 'name'],
                name='unique_team_name_per_company',
            ),
        ]
