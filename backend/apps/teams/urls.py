from rest_framework.routers import DefaultRouter
from .views import TeamViewSet
from django.urls import path, include

router = DefaultRouter()
router.register(r'teams', TeamViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
