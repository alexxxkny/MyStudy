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
    schedule_start = models.DateField(blank=True, null=True, verbose_name='Начало обучения')

    def get_absolute_url(self):
        return reverse('mystudy_app:group', kwargs={'group_slug': self.group_slug})

    def __str__(self):
        return f'Group(name={self.name})'


class LessonTime(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    order = models.SmallIntegerField()
    start = models.TimeField()
    end = models.TimeField()
    group = models.ForeignKey('Group', on_delete=models.CASCADE)

    def __str__(self):
        return f'LessonTime(order={self.order}, start={self.start}, end={self.end}, group={self.group})'


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

    def __str__(self):
        return f'TemplateLesson(id={self.id}, week_day={self.week_day},' \
               f' week_template={self.week_template}, lesson={self.lesson})'


class Lesson(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    date = models.DateField(blank=True, null=True)
    group = models.ForeignKey('Group', on_delete=models.CASCADE)
    lesson_time = models.ForeignKey('LessonTime', on_delete=models.CASCADE, null=True)
    lesson_format = models.ForeignKey('LessonFormat', on_delete=models.SET_NULL, null=True)
    type = models.CharField(max_length=100, blank=True, null=True)
    room = models.CharField(max_length=100, blank=True, null=True)
    discipline = models.ForeignKey('Discipline', on_delete=models.CASCADE)
    status = models.CharField(max_length=100)

    def __str__(self):
        return f'Lesson(id={self.id})'


class LessonFormat(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    name = models.CharField(max_length=20)
    color = models.CharField(max_length=6)
    group = models.ForeignKey('Group', on_delete=models.CASCADE)

    def __str__(self):
        return f'LessonFormat(name={self.name}, color={self.color}, group={self.group})'


class Discipline(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    name = models.CharField(max_length=50)
    short_name = models.CharField(max_length=10)
    group = models.ForeignKey('Group', on_delete=models.CASCADE)

    def __str__(self):
        return f'Discipline(id={self.id}, name={self.name}, short_name={self.short_name}, group={self.group})'


class DisciplineLabel(models.Model):
    id = models.AutoField(primary_key=True)
    color = models.CharField(max_length=7)
    user = models.ForeignKey('User', on_delete=models.CASCADE)
    discipline = models.ForeignKey('Discipline', on_delete=models.CASCADE)

    def __str__(self):
        return f'DisciplineLabel(id={self.id}, color={self.color}, user={self.user})'


class TaskLabel(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7)
    user = models.ForeignKey('User', on_delete=models.CASCADE)

    def __str__(self):
        return f'TaskLabel(id={self.id}, name={self.name}, color={self.color})'


class Task(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    tasklabel = models.ForeignKey('TaskLabel', on_delete=models.SET_NULL, null=True, blank=True)
    discipline_label = models.ForeignKey('DisciplineLabel', on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey('User', on_delete=models.CASCADE)

    def __str__(self):
        return f'Task(id={self.id}, name={self.name}, deadline={self.deadline}, user={self.user})'