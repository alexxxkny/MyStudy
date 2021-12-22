# Generated by Django 3.2.9 on 2021-12-22 14:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mystudy_app', '0019_alter_lesson_discipline'),
    ]

    operations = [
        migrations.CreateModel(
            name='TaskLabel',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('color', models.CharField(max_length=6)),
            ],
        ),
        migrations.AddField(
            model_name='discipline',
            name='label_color',
            field=models.CharField(blank=True, max_length=6, null=True),
        ),
    ]
