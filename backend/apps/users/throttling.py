from rest_framework.throttling import UserRateThrottle


class RoleBasedRateThrottle(UserRateThrottle):
    def get_cache_key(self, request, view):
        if not request.user or not request.user.is_authenticated:
            self.scope = 'anon'
        else:
            role = getattr(request.user, 'role', None)
            if role == 'client':
                self.scope = 'client'
            elif role == 'worker':
                self.scope = 'worker'
            elif role == 'manager':
                self.scope = 'manager'
            else:
                self.scope = 'user'
        return super().get_cache_key(request, view)
