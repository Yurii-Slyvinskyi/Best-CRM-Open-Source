from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from apps.common.permissions import IsSuperUser
from apps.companies.serializers import CompanySerializer
from apps.companies.models import Company


class CompanyListCreateView(ListCreateAPIView):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsSuperUser]


class CompanyDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsSuperUser]
    lookup_field = 'slug'
