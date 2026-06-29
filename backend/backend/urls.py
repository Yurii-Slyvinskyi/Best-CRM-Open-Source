from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from backend import settings


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("health/", health_check),
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/companies/', include('apps.companies.urls')),
    path('api/', include('apps.teams.urls')),
    path('api/', include('apps.projects.urls')),
    path('api/', include('apps.worklogs.urls')),
    path('api/', include('apps.chats.urls')),
    path('api/finances/', include('apps.finances.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/', include('apps.reviews.urls')),
]

if settings.DEBUG:
    import debug_toolbar

    urlpatterns += [
        path("__debug__/", include(debug_toolbar.urls)),
    ]
