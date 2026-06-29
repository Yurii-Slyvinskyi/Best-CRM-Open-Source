from rest_framework.permissions import BasePermission


class IsSuperUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'manager'


class IsClient(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'client'


class IsWorker(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'worker'


class IsManagerOrSuperUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
                request.user.role == 'manager' or
                request.user.is_superuser
        )


class IsWorkerOrManagerOrSuperUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
                request.user.role in ['worker', 'manager'] or
                request.user.is_superuser
        )


class IsManagerOrSuperUserOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user.is_authenticated

        return request.user.is_authenticated and (
                request.user.role == 'manager' or
                request.user.is_superuser
        )
