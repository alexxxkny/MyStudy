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


@admin.register(LessonTime)
class LessonTimeAdmin(admin.ModelAdmin):
    list_display = ('order', 'start', 'end', 'group')


@admin.register(WeekTemplate)
class WeekTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'order', 'group')


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('id', 'status', 'date', 'group', 'lesson_time', 'lesson_format')


@admin.register(TemplateLesson)
class TemplateLessonAdmin(admin.ModelAdmin):
    list_display = ('id', 'week_day', 'week_template', 'lesson')


@admin.register(Discipline)
class DisciplineAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'short_name', 'group')


@admin.register(DisciplineLabel)
class DisciplineLabelAdmin(admin.ModelAdmin):
    list_display = ('id', 'discipline', 'color', 'user')


@admin.register(TaskLabel)
class TaskLabelAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'color', 'user')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'deadline', 'user')


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ('id', 'adding_datetime', 'file', 'group')

@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ('id', 'adding_datetime', 'title', 'group')