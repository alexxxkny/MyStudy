# Generated by Django 3.2.9 on 2021-12-22 18:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mystudy_app', '0022_alter_tasklabel_color'),
    ]

    operations = [
        migrations.AlterField(
            model_name='discipline',
            name='label_color',
            field=models.CharField(blank=True, max_length=7, null=True),
        ),
    ]