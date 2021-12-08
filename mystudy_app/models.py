from django.contrib.auth.models import AbstractUser
from django.shortcuts import reverse
from django.db import models
from slugger import AutoSlugField

# Create your models here.


class User(AbstractUser):
    middle_name = models.CharField(max_length=150, null=True)
    group = models.ForeignKey('Group', on_delete=models.SET_NULL, null=True)


class Group(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    name = models.CharField(max_length=150, unique=True, verbose_name='Название группы')
    group_slug = AutoSlugField(populate_from='name', max_length=150, unique=True, verbose_name='URL')
    organization = models.CharField(max_length=150, verbose_name='Учебное заведение')
    specialization = models.CharField(max_length=150, verbose_name='Направление')

    def get_absolute_url(self):
        return reverse('mystudy_app:group', kwargs={'group_slug': self.group_slug})

    def __str__(self):
        return self.name


class LessonTime(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    order = models.SmallIntegerField()
    start = models.TimeField()
    end = models.TimeField()
    group = models.ForeignKey('Group', on_delete=models.CASCADE)


class WeekTemplate(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    name = models.CharField(max_length=150, verbose_name='Неделя')
    order = models.SmallIntegerField()
    group = models.ForeignKey('Group', on_delete=models.CASCADE)


class TemplateLesson(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    week_day = models.CharField(max_length=15, verbose_name='День недели')
    week_template = models.ForeignKey('WeekTemplate', on_delete=models.CASCADE)
    lesson = models.ForeignKey('Lesson', on_delete=models.CASCADE)


class Lesson(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    date = models.DateField(null=True)
    group = models.ForeignKey('Group', on_delete=models.CASCADE)
    lesson_time = models.ForeignKey('LessonTime', on_delete=models.CASCADE)


class LessonFormat(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    name = models.CharField(max_length=20)
    color = models.CharField(max_length=6)
    group = models.ForeignKey('Group', on_delete=models.CASCADE)
