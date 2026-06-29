from django.core.exceptions import ValidationError
from django.db import models

from apps.companies.models import Company
from apps.teams.models import Team
from apps.users.models import User


def validate_project_blueprint_pdf(value):
    if not value:
        return

    filename = getattr(value, 'name', '')
    content_type = getattr(value, 'content_type', None)

    if not filename.lower().endswith('.pdf'):
        raise ValidationError("Blueprint must be a PDF file.")

    if content_type and content_type != 'application/pdf':
        raise ValidationError("Blueprint file content type must be application/pdf.")


def validate_client(value):
    """Checks if the user is a client (role == 'client')"""

    user = User.objects.filter(id=value).only('id', 'role', 'username').first()

    if not user:
        raise ValidationError("User does not exist.")

    if user.role != 'client':
        raise ValidationError(f"The user {user.username} is not a client. Only clients can be assigned")


class Project(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('cancelled', 'Cancelled'),
        ('partially completed', 'Partially Completed'),
        ('completed', 'Completed'),
    )
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )

    name = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_team = models.ManyToManyField(Team, related_name="projects")
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects', validators=[validate_client])
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='projects')
    address = models.CharField(max_length=255)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    blueprint = models.FileField(
        upload_to='project_blueprints/',
        blank=True,
        null=True,
        validators=[validate_project_blueprint_pdf],
    )

    def __str__(self):
        return f"{self.name}, {self.description}"
