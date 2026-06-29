from django.db import models
from apps.users.models import User
from apps.companies.models import Company


class Notification(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    subject = models.CharField(max_length=255)
    message = models.TextField()
    email_sent = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject} - {self.recipient.email}"

    class Meta:
        ordering = ["-created_at"]
