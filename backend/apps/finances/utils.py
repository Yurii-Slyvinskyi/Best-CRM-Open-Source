import logging
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from apps.finances.models import CURRENCY_CHOICES, Transaction, FinancialReport
from django.db.models import Q

logger = logging.getLogger(__name__)


def totals_by_currency(company):
    """Return income/expense/net totals grouped by currency (USD and CAD always present)."""
    result = {
        code: {'total_income': '0.00', 'total_expenses': '0.00', 'net_profit': '0.00'}
        for code, _ in CURRENCY_CHOICES
    }

    rows = Transaction.objects.filter(company=company).values('currency').annotate(
        total_income=Sum('amount', filter=Q(transaction_type='income')),
        total_expenses=Sum('amount', filter=Q(transaction_type='expense')),
    )

    for row in rows:
        income = row['total_income'] or Decimal('0')
        expenses = row['total_expenses'] or Decimal('0')
        result[row['currency']] = {
            'total_income': f"{income:.2f}",
            'total_expenses': f"{expenses:.2f}",
            'net_profit': f"{income - expenses:.2f}",
        }

    return result


def update_financial_report(company):
    with transaction.atomic():
        aggregates = Transaction.objects.filter(
            company=company
        ).aggregate(
            total_income=Sum('amount', filter=Q(transaction_type='income')),
            total_expenses=Sum('amount', filter=Q(transaction_type='expense')),
        )

        total_income = aggregates['total_income'] or 0
        total_expenses = aggregates['total_expenses'] or 0

        report, _ = FinancialReport.objects.select_for_update().update_or_create(
            company=company,
            defaults={
                'total_income': total_income,
                'total_expenses': total_expenses,
                'net_profit': total_income - total_expenses
            }
        )

        return report
