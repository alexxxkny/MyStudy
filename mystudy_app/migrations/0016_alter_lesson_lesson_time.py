# Generated by Django 3.2.9 on 2021-12-19 10:02

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('mystudy_app', '0015_lesson_is_template'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lesson',
            name='lesson_time',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='mystudy_app.lessontime'),
        ),
    ]