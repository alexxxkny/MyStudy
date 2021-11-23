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

    def get_absolute_url(self):
        return reverse('mystudy_app:group', kwargs={'group_slug': self.group_slug})

    def __str__(self):
        return self.name
