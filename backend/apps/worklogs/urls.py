from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorklogViewSet

router = DefaultRouter()
router.register(r'worklogs', WorklogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
