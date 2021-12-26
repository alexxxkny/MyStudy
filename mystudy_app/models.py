from django.contrib.auth.models import AbstractUser
from django.shortcuts import reverse
from django.db import models
from slugger import AutoSlugField

# Create your models here.


class User(AbstractUser):
    middle_name = models.CharField(max_length=150, null=True, blank=True)
    students_group = models.ForeignKey('StudentsGroup', on_delete=models.SET_NULL, null=True)

    def get_short_name(self):
        short_name = f'{self.last_name} {self.first_name[0]}. '
        if self.middle_name:
            short_name += f'{self.middle_name[0]}.'
        return short_name

    def get_role_id(self):
        return self.groups.all()[0].pk

    def is_boss(self):
        return self.get_role_id() == 4

    def is_editor(self):
        return self.get_role_id() == 3

    def is_loner(self):
        return self.get_role_id() == 1

    def is_student(self):
        return self.get_role_id() == 2

    def can_edit(self):
        return self.get_role_id() >= 3

    def get_role_name(self):
        return self.groups.all()[0].name


class StudentsGroup(models.Model):
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


class JoinRequest(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey('User', on_delete=models.CASCADE)
    group = models.ForeignKey('StudentsGroup', on_delete=models.CASCADE)

    def __str__(self):
        return f'JoinRequest(id={self.id}, user={self.user}, group={self.group})'


class LessonTime(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    order = models.SmallIntegerField()
    start = models.TimeField()
    end = models.TimeField()
    group = models.ForeignKey('StudentsGroup', on_delete=models.CASCADE)

    def __str__(self):
        return f'LessonTime(order={self.order}, start={self.start}, end={self.end}, group={self.group})'


class WeekTemplate(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    name = models.CharField(max_length=150, verbose_name='Неделя')
    order = models.SmallIntegerField()
    group = models.ForeignKey('StudentsGroup', on_delete=models.CASCADE)


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
    group = models.ForeignKey('StudentsGroup', on_delete=models.CASCADE)
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
    group = models.ForeignKey('StudentsGroup', on_delete=models.CASCADE)

    def __str__(self):
        return f'LessonFormat(name={self.name}, color={self.color}, group={self.group})'


class Discipline(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    name = models.CharField(max_length=50)
    short_name = models.CharField(max_length=10)
    group = models.ForeignKey('StudentsGroup', on_delete=models.CASCADE)

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


def user_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/group_<id>/<filename>
    return 'group_{0}/{1}'.format(instance.group.pk, filename)


class File(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    adding_datetime = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to=user_directory_path)
    discipline = models.ForeignKey('Discipline', on_delete=models.SET_NULL, null=True, blank=True)
    group = models.ForeignKey('StudentsGroup', on_delete=models.CASCADE)


class News(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    topic = models.CharField(max_length=20)
    title = models.CharField(max_length=50)
    content = models.TextField(null=True, blank=True)
    adding_datetime = models.DateTimeField(auto_now_add=True)
    group = models.ForeignKey('StudentsGroup', on_delete=models.CASCADE)

    def __str__(self):
        return f'News(id={self.id}, topic={self.topic}, title={self.title}, adding_datetime={self.adding_datetime}, ' \
               f'group={self.group})'
