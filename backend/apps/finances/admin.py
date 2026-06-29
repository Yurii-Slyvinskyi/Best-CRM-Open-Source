from django.contrib import admin
from .models import Payment, Salary, Transaction, FinancialReport


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    pass


@admin.register(Salary)
class SalaryAdmin(admin.ModelAdmin):
    pass


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    pass


@admin.register(FinancialReport)
class FinancialReportAdmin(admin.ModelAdmin):
    pass
