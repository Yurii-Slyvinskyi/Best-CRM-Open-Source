from django.db import models

from apps.projects.models import Project
from apps.users.models import User


class Review(models.Model):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]

    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="review")
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'client')

    def __str__(self):
        return f"Review by {self.client} for {self.project} ({self.rating})"
