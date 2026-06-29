from rest_framework import permissions


class CanCreateWorklog(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        return (
            request.user.role in ['worker', 'manager'] or
            request.user.is_superuser
        )


class CanManageWorklog(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.is_superuser:
            return True

        if user.role == 'worker':
            return obj.worker == user

        if user.role == 'manager':
            return obj.project.company == user.company

        return False
