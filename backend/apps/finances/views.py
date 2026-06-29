import logging
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.generics import ListCreateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Payment, Salary, Transaction, FinancialReport
from .serializers import PaymentSerializer, SalarySerializer, TransactionSerializer, FinancialReportSerializer
from apps.common.permissions import (
    IsClient,
    IsManager,
    IsManagerOrSuperUser,
    IsSuperUser,
    IsWorkerOrManagerOrSuperUser
)
from apps.companies.models import Company
from apps.projects.models import Project
from apps.users.models import User
from apps.notifications.mixins import FinancialNotificationsMixin
from .utils import update_financial_report

logger = logging.getLogger(__name__)


class ManagerPaymentApiCreateView(ListCreateAPIView, FinancialNotificationsMixin):
    """Allow managers to create and view their payments"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsManager]

    def get_queryset(self):
        return Payment.objects.filter(
            manager=self.request.user,
            company=self.request.user.company
        ).select_related('client', 'project', 'company', 'manager')

    @transaction.atomic
    def perform_create(self, serializer):
        project = get_object_or_404(
            Project.objects.select_related('company').only('id', 'company_id'),
            id=self.request.data.get('project'),
            company=self.request.user.company
        )
        client = get_object_or_404(
            User.objects.only('id', 'email', 'company_id'),
            id=self.request.data.get('client'),
            role='client',
            company=self.request.user.company
        )

        payment = serializer.save(
            client=client,
            manager=self.request.user,
            company=self.request.user.company,
            project=project,
        )

        self.send_payment_created_notification(payment)


class ManagerPaymentDetailApiView(RetrieveUpdateDestroyAPIView):
    """Allow managers to edit pending payments or delete unconfirmed ones"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsManager]

    def get_queryset(self):
        return Payment.objects.filter(
            manager=self.request.user,
            company=self.request.user.company
        ).select_related('client', 'project', 'company', 'manager')

    def perform_update(self, serializer):
        # The serializer enforces the rules (confirmed is locked; details need pending).
        project_id = self.request.data.get('project')
        if project_id is not None:
            get_object_or_404(
                Project.objects.only('id'),
                id=project_id,
                company=self.request.user.company
            )

        client_id = self.request.data.get('client')
        if client_id is not None:
            get_object_or_404(
                User.objects.only('id'),
                id=client_id,
                role='client',
                company=self.request.user.company
            )

        serializer.save()

    def perform_destroy(self, instance):
        if instance.status == 'confirmed':
            raise ValidationError("Confirmed payments cannot be deleted.")
        instance.delete()


class ClientManagerSuperUserPaymentView(ListAPIView):
    """Allow clients, managers and superusers to view payments"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsManager | IsSuperUser | IsClient]

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return Payment.objects.all().select_related('client', 'project', 'company', 'manager')

        filters = {'company': user.company}

        if user.role == 'client':
            filters['client'] = user
        elif user.role == 'manager':
            filters['manager'] = user

        return Payment.objects.filter(**filters).select_related('client', 'project', 'company', 'manager')


class ManagerSalaryApiCreateView(ListCreateAPIView, FinancialNotificationsMixin):
    """Allow managers to create and view salaries"""
    serializer_class = SalarySerializer
    permission_classes = [IsAuthenticated, IsManager]

    def get_queryset(self):
        return Salary.objects.filter(
            manager=self.request.user,
            company=self.request.user.company
        ).select_related('worker', 'company', 'manager')

    def perform_create(self, serializer):
        user = self.request.user
        worker_id = self.request.data.get('worker')

        worker = get_object_or_404(
            User.objects.only('id', 'username', 'company_id'),
            id=worker_id,
            role='worker'
        )

        if worker.company_id != user.company_id:
            raise PermissionDenied("You cannot create a salary for a worker from another company.")

        with transaction.atomic():
            salary = serializer.save(manager=user, company=user.company, worker=worker)

            Transaction.objects.create(
                company=user.company,
                amount=salary.amount,
                currency=salary.currency,
                transaction_type='expense',
                description=f"Salary for {worker.username} on {salary.date_paid}",
                salary=salary
            )

        self.send_salary_created_notification(salary)
        return salary


class ManagerSalaryDetailApiView(RetrieveUpdateDestroyAPIView):
    """Allow managers to edit or delete their company salaries"""
    serializer_class = SalarySerializer
    permission_classes = [IsAuthenticated, IsManager]

    def get_queryset(self):
        return Salary.objects.filter(
            company=self.request.user.company
        ).select_related('worker', 'company', 'manager')

    def perform_update(self, serializer):
        user = self.request.user
        worker = serializer.validated_data.get('worker')

        if worker and worker.company_id != user.company_id:
            raise PermissionDenied("You cannot assign a salary to a worker from another company.")

        with transaction.atomic():
            salary = serializer.save()

            # Keep the auto-generated expense transaction in sync (its save() refreshes the report).
            for linked_transaction in salary.transactions.all():
                linked_transaction.amount = salary.amount
                linked_transaction.currency = salary.currency
                linked_transaction.description = (
                    f"Salary for {salary.worker.username} on {salary.date_paid}"
                )
                linked_transaction.save()

    def perform_destroy(self, instance):
        company = instance.company
        with transaction.atomic():
            # Cascade removes the linked expense transaction without firing signals,
            # so refresh the report explicitly afterwards.
            instance.delete()
            update_financial_report(company)


class WorkerSuperUserSalaryApiView(ListAPIView):
    """Allow workers and superusers to view salaries"""
    serializer_class = SalarySerializer
    permission_classes = [IsAuthenticated, IsWorkerOrManagerOrSuperUser]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Salary.objects.all().select_related('worker', 'manager', 'company')
        if user.role == 'worker':
            return Salary.objects.filter(worker=user).select_related('manager', 'company')
        return Salary.objects.none()


class TransactionViewSet(ModelViewSet):
    """Allow managers and superusers to manage transactions"""
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, IsManagerOrSuperUser]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Transaction.objects.all().select_related('company')
        return Transaction.objects.filter(company=self.request.user.company).select_related('company')

    def perform_create(self, serializer):
        user = self.request.user

        if not user.company:
            raise PermissionDenied("You are not associated with any company")

        company = serializer.validated_data.get('company', user.company)

        if company != user.company:
            raise PermissionDenied("You can only create transactions within your company")

        serializer.save(company=user.company)


class FinancialReportViewSet(ModelViewSet):
    """Allow managers and superusers to manage financial reports"""
    queryset = FinancialReport.objects.all()
    serializer_class = FinancialReportSerializer
    permission_classes = [IsAuthenticated, IsManagerOrSuperUser]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return FinancialReport.objects.all().select_related('company')
        return FinancialReport.objects.filter(company=self.request.user.company).select_related('company')

    def get_object(self):
        report_id = self.kwargs.get('pk')
        report = get_object_or_404(FinancialReport, id=report_id)
        if self.request.user.is_superuser:
            return report
        if report.company != self.request.user.company:
            raise PermissionDenied("You can only manage reports within your company")
        return report

    def create(self, request, *args, **kwargs):
        """Refresh current company financial summary without notifications"""
        if "start_date" in request.data or "end_date" in request.data:
            raise ValidationError({
                "detail": "Financial reports are current company summaries; start_date and end_date are not supported."
            })

        if request.user.is_superuser:
            company_id = request.data.get("company")
            if not company_id:
                raise ValidationError({"company": "Company is required for superuser report refresh."})

            company = get_object_or_404(Company, id=company_id)
        else:
            company = request.user.company

        if not company:
            raise PermissionDenied("You are not associated with any company")

        report = update_financial_report(company)

        serializer = self.get_serializer(report)
        return Response(serializer.data, status=status.HTTP_200_OK)
