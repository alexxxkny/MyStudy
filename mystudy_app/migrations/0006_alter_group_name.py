# Generated by Django 3.2.9 on 2021-11-22 11:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mystudy_app', '0005_group_group_slug'),
    ]

    operations = [
        migrations.AlterField(
            model_name='group',
            name='name',
            field=models.CharField(max_length=150, unique=True, verbose_name='Название группы'),
        ),
    ]