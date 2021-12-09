from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from .models import *


@admin.register(get_user_model())
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'last_name', 'first_name', 'middle_name', 'email', 'is_superuser')


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'group_slug')


@admin.register(LessonFormat)
class LessonFormatAdmin(admin.ModelAdmin):
    list_display = ('name', 'color', 'group')
