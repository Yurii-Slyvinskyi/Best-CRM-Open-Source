from django.db import models
from apps.projects.models import Project
from apps.users.models import User


class ChatRoom(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='chat')

    def __str__(self):
        return f"Chat for {self.project.name}"


class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.username}: {self.content}"
