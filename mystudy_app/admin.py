from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(get_user_model())
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'last_name', 'first_name', 'middle_name', 'email', 'is_superuser')
