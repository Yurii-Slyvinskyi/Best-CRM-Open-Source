from django.urls import path
from .views import UserProfileView, UserRegisterView, CustomTokenObtainPairView, UserListView, \
    UserDetailView, UserManageView, LogoutView, CustomTokenRefreshView, CustomTokenVerifyView

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('register/', UserRegisterView.as_view(), name='register'),

    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('login/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('login/verify/', CustomTokenVerifyView.as_view(), name='token_verify'),
    path('logout/', LogoutView.as_view(), name='token_logout'),

    path('list/', UserListView.as_view(), name='user_list'),
    path('update-role/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('manage/<int:pk>/', UserManageView.as_view(), name='user_manage'),
]
