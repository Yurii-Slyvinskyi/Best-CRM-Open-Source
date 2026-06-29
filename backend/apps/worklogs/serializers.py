from rest_framework import serializers
from apps.projects.models import Project
from apps.teams.models import Team
from apps.users.models import User
from apps.worklogs.models import WorkLog


class WorklogSerializer(serializers.ModelSerializer):
    team = serializers.PrimaryKeyRelatedField(queryset=Team.objects.all())
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())
    worker = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.select_related('company').filter(role='worker'),
        required=False
    )

    class Meta:
        model = WorkLog
        fields = ('id', 'worker', 'team', 'project', 'date', 'hours_worked', 'description')

    def validate(self, data):
        user = self.context['request'].user
        team = data.get('team') or getattr(self.instance, 'team', None)
        project = data.get('project') or getattr(self.instance, 'project', None)
        worker = data.get('worker') or getattr(self.instance, 'worker', None)

        # Checking that objects exist
        if not team or not project:
            raise serializers.ValidationError("Team and project must be specified")

        if user.role == 'client':
            raise serializers.ValidationError("Clients cannot access work logs")

        if user.role == 'worker':
            submitted_worker = data.get('worker')
            if submitted_worker and submitted_worker != user:
                raise serializers.ValidationError("Workers can only create work logs for themselves")

            if team.company != user.company:
                raise serializers.ValidationError("You can only log hours for your company's teams")

            if user not in team.workers.all():
                raise serializers.ValidationError("You can only log hours for teams you are a member of")

            if project.company != user.company:
                raise serializers.ValidationError("You can only log hours for projects in your company")

        elif user.role == 'manager':
            if not worker:
                raise serializers.ValidationError({"worker": "Worker must be specified"})

            if worker.role != 'worker':
                raise serializers.ValidationError("Work logs can only be created for workers")

            if worker.company != user.company:
                raise serializers.ValidationError("Managers can only log hours for workers in their company")

            if team.company != user.company:
                raise serializers.ValidationError("Managers can only log hours for their company's teams")

            if worker not in team.workers.all():
                raise serializers.ValidationError("Worker must belong to the selected team")

            if project.company != user.company:
                raise serializers.ValidationError("Managers can only log hours for projects in their company")

        elif user.is_superuser:
            if not worker:
                raise serializers.ValidationError({"worker": "Worker must be specified"})

            if worker.role != 'worker':
                raise serializers.ValidationError("Work logs can only be created for workers")

            if worker not in team.workers.all():
                raise serializers.ValidationError("Worker must belong to the selected team")

        else:
            raise serializers.ValidationError("You do not have permission to manage work logs")

        if project.status == 'completed':
            raise serializers.ValidationError("You cannot log work hours for a completed project")

        return data
