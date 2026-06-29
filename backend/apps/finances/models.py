from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.companies.models import Company
from apps.users.models import User
from apps.projects.models import Project


CURRENCY_CHOICES = (
    ('USD', 'USD'),
    ('CAD', 'CAD'),
)


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('failed', 'Failed'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='payments')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    client = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'client'},
                               related_name='client_payments')
    manager = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'manager'},
                                related_name='manager_payments')

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')
    created_at = models.DateTimeField(auto_now_add=True)

    session_id = models.CharField(max_length=255, blank=True, null=True)
    session_url = models.URLField(max_length=2000, blank=True, null=True)

    def __str__(self):
        return f"{self.client.username} - ${self.amount} ({self.status})"


class Salary(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='salaries')
    manager = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'manager'},
                                related_name='manager_salaries')
    worker = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'worker'},
                               related_name='worker_salaries')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')
    date_paid = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.worker.username} - ${self.amount} paid on {self.date_paid}"


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="transactions")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    # Set when a transaction is auto-generated from a salary, so edits/deletes stay in sync.
    salary = models.ForeignKey(
        Salary,
        on_delete=models.CASCADE,
        related_name='transactions',
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.transaction_type}: ${self.amount} - {self.description}"


class FinancialReport(models.Model):
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name="financial_report")
    start_date = models.DateField(auto_now_add=True)
    end_date = models.DateField(null=True, blank=True)
    total_income = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_expenses = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    net_profit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    generated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Current financial summary for {self.company.name}"


@receiver(post_save, sender=Transaction)
def update_financials_after_transaction(sender, instance, **kwargs):
    """Update financial report after every transaction"""
    from apps.finances.utils import update_financial_report
    update_financial_report(instance.company)
