from rest_framework import serializers

from .models import Project, validate_project_blueprint_pdf
from apps.users.models import User
from apps.teams.models import Team


class ProjectSerializer(serializers.ModelSerializer):
    chat_room = serializers.SerializerMethodField()
    assigned_team = serializers.PrimaryKeyRelatedField(
        queryset=Team.objects.select_related('company'),
        many=True
    )
    client = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.select_related('company').filter(role='client')
    )
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    budget = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    blueprint = serializers.FileField(
        required=False,
        allow_null=True,
        validators=[validate_project_blueprint_pdf],
    )

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ('company', 'created_at', 'updated_at', 'chat_room')

    def get_chat_room(self, obj):
        try:
            return obj.chat.id
        except Project.chat.RelatedObjectDoesNotExist:
            return None

    def validate_assigned_team(self, value):
        user = self.context['request'].user
        invalid_teams = [t.id for t in value if t.company_id != user.company_id]
        if invalid_teams:
            raise serializers.ValidationError(
                f"Teams with ids {invalid_teams} do not belong to your company"
            )
        return value

    def validate_client(self, value):
        user = self.context['request'].user
        if value.company_id != user.company_id:
            raise serializers.ValidationError(
                "Client does not belong to your company"
            )
        return value

    def validate(self, data):
        """Ensure end_date is not earlier than start_date"""

        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date cannot be earlier than start date."})

        return data
