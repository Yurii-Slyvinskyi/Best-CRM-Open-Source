from django.urls import path
from .views import CompanyListCreateView, CompanyDetailView


urlpatterns = [
    path('', CompanyListCreateView.as_view(), name='company_list_create'),
    path('<slug:slug>/', CompanyDetailView.as_view(), name='company_detail'),

]


