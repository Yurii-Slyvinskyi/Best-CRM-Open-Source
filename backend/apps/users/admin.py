from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.users.models import User


class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'company', 'phone', 'address', 'is_staff')
    list_filter = ('role', 'company', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'phone')

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('company', 'email', 'phone', 'address')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'company', 'phone', 'address'),
        }),
    )


admin.site.register(User, CustomUserAdmin)

