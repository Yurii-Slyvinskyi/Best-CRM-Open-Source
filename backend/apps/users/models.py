from django.db import models
from django.contrib.auth.models import AbstractUser
from apps.companies.models import Company


class User(AbstractUser):
    ROLE_CHOICES = (
        ('worker', 'Worker'),
        ('client', 'Client'),
        ('manager', 'Manager')
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name="users")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.username
