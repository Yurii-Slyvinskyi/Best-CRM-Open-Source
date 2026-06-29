from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    ManagerPaymentApiCreateView,
    ManagerPaymentDetailApiView,
    ClientManagerSuperUserPaymentView,
    WorkerSuperUserSalaryApiView,
    ManagerSalaryApiCreateView,
    ManagerSalaryDetailApiView,
    TransactionViewSet,
    FinancialReportViewSet,
)
from .webhooks import stripe_webhook

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'reports', FinancialReportViewSet, basename='report')

urlpatterns = [
    path('payments/manager/', ManagerPaymentApiCreateView.as_view(), name='manager-payments'),
    path('payments/manager/<int:pk>/', ManagerPaymentDetailApiView.as_view(), name='manager-payment-detail'),
    path('payments/', ClientManagerSuperUserPaymentView.as_view(), name='client-manager-superuser-payments'),
    path('salaries/worker/', WorkerSuperUserSalaryApiView.as_view(), name='worker-salaries'),
    path('salaries/manager/', ManagerSalaryApiCreateView.as_view(), name='manager-salaries'),
    path('salaries/manager/<int:pk>/', ManagerSalaryDetailApiView.as_view(), name='manager-salary-detail'),
    path('webhooks/stripe/', stripe_webhook, name='stripe_webhook'),
]

urlpatterns += router.urls
