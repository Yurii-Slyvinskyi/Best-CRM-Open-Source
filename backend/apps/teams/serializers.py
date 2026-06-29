from rest_framework import serializers
from .models import Team
from apps.users.models import User


class TeamSerializer(serializers.ModelSerializer):
    workers = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='worker'),
        many=True
    )

    class Meta:
        model = Team
        fields = ('id', 'name', 'company', 'workers')
        read_only_fields = ['company']

    def validate_name(self, value):
        user = self.context['request'].user
        team_id = self.instance.id if self.instance else None

        if Team.objects.filter(name=value, company=user.company).exclude(id=team_id).exists():
            raise serializers.ValidationError("A team with this name already exists in your company.")
        return value

    def validate_workers(self, value):
        user = self.context['request'].user
        invalid_workers = [
            w for w in value if getattr(w, 'company_id', None) != self.context['request'].user.company_id
        ]

        if invalid_workers:
            raise serializers.ValidationError("You can only add workers from your company")
        return value
