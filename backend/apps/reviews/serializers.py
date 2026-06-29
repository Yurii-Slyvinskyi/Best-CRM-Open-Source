from rest_framework import serializers

from apps.reviews.models import Review


class ReviewSerializer(serializers.ModelSerializer):
    client = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'project', 'client', 'rating', 'comment', 'created_at']
        read_only_fields = ['client']

    def validate_project(self, project):
        request = self.context.get('request')
        user = request.user if request else None

        if getattr(user, 'role', None) == 'client':
            if project.company_id != user.company_id:
                raise serializers.ValidationError(
                    "You can only review projects in your company."
                )

            if project.client_id != user.id:
                raise serializers.ValidationError(
                    "You can only review your own projects."
                )

        return project
