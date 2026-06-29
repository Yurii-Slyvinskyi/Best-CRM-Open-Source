from django.contrib import admin

from .models import ChatRoom, ChatMessage


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    pass


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    pass
