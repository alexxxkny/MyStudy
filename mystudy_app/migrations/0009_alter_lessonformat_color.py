# Generated by Django 3.2.9 on 2021-12-06 18:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mystudy_app', '0008_auto_20211206_2127'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lessonformat',
            name='color',
            field=models.CharField(max_length=6),
        ),
    ]
