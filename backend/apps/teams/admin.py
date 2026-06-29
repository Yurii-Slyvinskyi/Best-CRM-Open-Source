from django.contrib import admin

from .models import Team


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'created_at')
    filter_horizontal = ('workers',)
    list_filter = ('company',)
    search_fields = ('name', 'company__name')
