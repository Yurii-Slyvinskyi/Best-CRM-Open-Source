from rest_framework_simplejwt.exceptions import TokenError
from django.core.cache import cache
from rest_framework import generics, status
from rest_framework.generics import ListAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenVerifyView, TokenRefreshView

from apps.notifications.mixins import UserNotificationsMixin
from apps.common.permissions import IsManagerOrSuperUser
from apps.users.models import User
from apps.users.serializers import (
    UserProfileSerializer,
    UserRegistrationSerializer,
    UserManagementSerializer,
    CustomTokenObtainPairSerializer,
)
import logging

logger = logging.getLogger(__name__)


class CompanyScopedUserQuerysetMixin:
    """Scope a user queryset to the requesting user's company.

    Superusers may have no company, so they are never company-scoped and see all
    users. Every other (manager) caller keeps the existing company-only scoping.
    """

    def get_user_queryset(self):
        users = User.objects.select_related('company')
        if self.request.user.is_superuser:
            return users
        return users.filter(company=self.request.user.company)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = User.objects.select_related('company').only(
            'username', 'email', 'phone', 'address', 'role',
            'company__name', 'company__id'
        ).get(id=self.request.user.id)
        return user

    def retrieve(self, request, *args, **kwargs):
        cache_key = f"user_profile_data_{request.user.id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.info(
                f"[ProfileView] Retrieved profile from cache for user {request.user.username} (ID: {request.user.id})")
            return Response(cached_data)

        instance = self.get_object()
        serializer = self.get_serializer(instance)
        cache.set(cache_key, serializer.data, 60 * 60)

        logger.info(f"[ProfileView] Retrieved profile for user {request.user.username} (ID: {request.user.id})")
        return Response(serializer.data)

    def perform_update(self, serializer):
        serializer.save()
        cache.delete(f"user_profile_data_{self.request.user.id}")


class UserRegisterView(generics.CreateAPIView, UserNotificationsMixin):
    serializer_class = UserRegistrationSerializer
    permission_classes = [IsAuthenticated, IsManagerOrSuperUser]

    def perform_create(self, serializer):
        serializer.save()

        logger.info(
            f"[Registration] New user registered by manager {self.request.user.username} (Role: {serializer.instance.role}, Username: {serializer.instance.username})")
        self.send_registration_notification(serializer.instance)


class CustomTokenObtainPairView(TokenObtainPairView, UserNotificationsMixin):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AnonRateThrottle]

    def post(self, request, *args, **kwargs):
        self.initial(request, *args, **kwargs)

        if 'username' not in request.data or 'password' not in request.data:
            logger.warning(f"[Login] Missing credentials in request from IP {request.META.get('REMOTE_ADDR')}")
            return Response(
                {"error": "Both username and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            username = request.data.get('username')
            logger.info(f"[Login] User '{username}' logged in successfully")
            user = User.objects.filter(username=username).first()

            if user:
                self.send_login_notification(user, request)

        return response


class CustomTokenVerifyView(TokenVerifyView):
    throttle_classes = [AnonRateThrottle]


class CustomTokenRefreshView(TokenRefreshView):
    throttle_classes = [AnonRateThrottle]


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"error": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            logger.info(f"[Logout] User {request.user.username} logged out successfully")

            return Response(
                {"message": "Successfully logged out"},
                status=status.HTTP_205_RESET_CONTENT
            )
        except TokenError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": "Invalid token"},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserListView(CompanyScopedUserQuerysetMixin, ListAPIView):
    """The manager can view the list of users in his company.

    Superusers (who may have no company) are not company-scoped and see all users.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsManagerOrSuperUser]

    def get_queryset(self):
        company = self.request.user.company
        scope = "all companies" if self.request.user.is_superuser else f"company {company.name if company else None}"
        logger.info(
            f"[UserList] User {self.request.user.username} fetched user list for {scope}")

        return self.get_user_queryset()


class UserDetailView(CompanyScopedUserQuerysetMixin, RetrieveUpdateAPIView, UserNotificationsMixin):
    """Manager and superuser can view profiles and change user roles"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsManagerOrSuperUser]

    def get_queryset(self):
        return self.get_user_queryset()

    def update(self, request, *args, **kwargs):
        user_id = kwargs['pk']
        new_role = request.data.get('role')

        # Get user (superusers are not company-scoped)
        user = self.get_user_queryset().filter(
            pk=user_id
        ).only('id', 'username', 'role', 'company_id').first()

        if not user:
            logger.warning(f"[RoleChange] User ID {user_id} not found in company {request.user.company}")
            return Response({'error': "User not found"}, status=404)

        old_role = user.role

        logger.info(
            f"[RoleChange] {request.user.username} is attempting to change role of user '{user.username}' from {old_role} to {new_role}")

        # Role validation
        if request.user.role == 'manager' and new_role not in ['client', 'worker']:
            logger.warning(
                f"[RoleChange] Manager {request.user.username} attempted forbidden role change to '{new_role}'")
            return Response({'error': "Manager can only change client or worker"}, status=400)

        if request.user.is_superuser and new_role not in ['client', 'worker', 'manager']:
            logger.warning(f"[RoleChange] Superuser {request.user.username} attempted invalid role assignment: {new_role}")
            return Response({'error': "Invalid role"}, status=400)

        # Apply role change
        user.role = new_role
        user.save(update_fields=['role'])

        logger.info(
            f"[RoleChange] User '{user.username}' role changed from {old_role} to {new_role} by {request.user.username}")

        self.send_role_change_notification(user, old_role)

        return Response({
            'message': "Role changed successfully",
            'new_role': new_role
        })

    def _get_client_ip(self):
        """Get client IP address from request"""
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        return x_forwarded_for.split(',')[0] if x_forwarded_for else self.request.META.get('REMOTE_ADDR')


class UserManageView(CompanyScopedUserQuerysetMixin, generics.RetrieveUpdateDestroyAPIView, UserNotificationsMixin):
    """Manager can edit or delete users that belong to their own company.

    For managers the queryset is scoped to ``company=request.user.company`` so
    update/delete on a user from another company resolves to 404. Superusers (who
    may have no company) are not company-scoped. Managers cannot delete their own account.
    """
    serializer_class = UserManagementSerializer
    permission_classes = [IsManagerOrSuperUser]

    def get_queryset(self):
        return self.get_user_queryset()

    def perform_update(self, serializer):
        old_role = serializer.instance.role
        user = serializer.save()
        cache.delete(f"user_profile_data_{user.id}")

        if user.role != old_role:
            logger.info(
                f"[UserManage] {self.request.user.username} changed role of '{user.username}' "
                f"from {old_role} to {user.role}")
            self.send_role_change_notification(user, old_role)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.id == request.user.id:
            logger.warning(f"[UserManage] {request.user.username} attempted to delete their own account")
            return Response(
                {'error': "You cannot delete your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        username = instance.username
        self.perform_destroy(instance)
        cache.delete(f"user_profile_data_{instance.id}")

        logger.info(f"[UserManage] {request.user.username} deleted user '{username}'")
        return Response(status=status.HTTP_204_NO_CONTENT)
