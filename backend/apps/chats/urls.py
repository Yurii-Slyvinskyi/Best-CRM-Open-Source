from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.chats.views import ChatMessageViewSet

router = DefaultRouter()
router.register(r'chats/messages', ChatMessageViewSet, basename='chatmessage')

urlpatterns = [
    path('', include(router.urls)),
]
