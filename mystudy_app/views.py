import datetime
import mimetypes

import data as data
from django.contrib.auth.models import Group
from django.contrib.auth import logout, login
from django.contrib.auth.views import LoginView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.http import HttpResponse, JsonResponse, Http404
from django.views.generic import CreateView, TemplateView, ListView, DetailView
from .forms import *
from datetime import time, date, timedelta
from json import JSONEncoder
import json, traceback, os
from MyStudy import settings


class MyJsonEncoder(JSONEncoder):
    def default(self, obj):
        data_dict = obj.__dict__.copy()
        print(data_dict)
        if '_state' in data_dict:
            data_dict.pop('_state')
        return data_dict


class ScheduleTableHandler:
    @staticmethod
    def make_template_table(request, data):
        table = {'0': {}, '1': {}, '2': {}, '3': {}, '4': {}, '5': {}}
        template_lessons = TemplateLesson.objects.filter(
            week_template=data['template_id'],
            week_template__group=request.user.students_group,
        )
        for template_lesson in template_lessons:
            lesson = template_lesson.lesson
            table[template_lesson.week_day][lesson.lesson_time.order - 1] = {
                'id': template_lesson.pk,
                'color': lesson.lesson_format.color,
                'type': lesson.type,
                'room': lesson.room,
                'discipline': lesson.discipline.short_name,
                'status': 'template'
            }
        return table

    @staticmethod
    def make_full_table(request, data):
        current_date = datetime.datetime.strptime(data['week_start'], '%Y-%m-%d').date()
        template_id = ScheduleTableHandler.get_template_id(request.user.students_group, current_date)
        table = ScheduleTableHandler.make_template_table(request, {'template_id': template_id})

        week_start = date.fromisoformat(data['week_start'])
        week_end = date.fromisoformat(data['week_end'])
        custom_lessons = Lesson.objects.filter(
            group=request.user.students_group,
            date__range=(week_start, week_end),
            status__istartswith='custom'
        )
        for lesson in custom_lessons:
            table[str(date.weekday(lesson.date))][lesson.lesson_time.order - 1] = {
                'id': lesson.pk,
                'color': lesson.lesson_format.color,
                'type': lesson.type,
                'room': lesson.room,
                'discipline': lesson.discipline.short_name,
                'status': lesson.status
        }
        print(custom_lessons)
        return table

    @staticmethod
    def get_template_id(group, start_date):
        schedule_start_monday = group.schedule_start - timedelta(days=date.weekday(group.schedule_start))
        weeks_delta = (start_date - schedule_start_monday).days // 7
        week_template_order = (weeks_delta % 2) + 1
        try:
            template_id = WeekTemplate.objects.get(order=week_template_order, group=group).pk
        except WeekTemplate.DoesNotExist as e:
            raise Exception('Не удалось найти WeekTemplate')
        else:
            return template_id


def json_error_response(text):
    return JsonResponse({
        'result': 'error',
        'data': {
            'error_text': str(text)
        }
    })


def json_success_response(data=None):
    if data is None:
        return JsonResponse({
            'result': 'success'
        })
    else:
        return JsonResponse({
            'result': 'success',
            'data': data
        })


def get_schedule_table(group, start_date=None, end_date=None):
    schedule_start_monday = group.schedule_start - timedelta(days=date.weekday(group.schedule_start))
    weeks_delta = (start_date - schedule_start_monday).days // 7
    week_template_order = (weeks_delta % 2) + 1

    template_lessons = TemplateLesson.objects.filter(group=group, week_template=week_template_order)
    return template_lessons


def download_file(request, path):
    print(path)
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    if os.path.exists(file_path):
        with open(file_path, 'rb') as fh:
            mime_type, _ = mimetypes.guess_type(file_path)
            response = HttpResponse(fh.read(), content_type=mime_type)
            response['Content-Disposition'] = 'attachment; filename=' + os.path.basename(file_path)
            return response
    raise Http404


def index(request):
    return render(request, 'mystudy_app/index.html')


def logout_user(request):
    logout(request)
    return redirect('mystudy_app:login')


def register_user(request):
    return render(request, 'mystudy_app/auth/register.html')


class NewsPage(LoginRequiredMixin, TemplateView):
    template_name = 'mystudy_app/news.html'
    login_url = 'mystudy_app:login'

    def get(self, request, *args, **kwargs):
        if request.user.students_group is None:
            return redirect('mystudy_app:all_groups')
        context = {
            'news_list': News.objects.filter(group=request.user.students_group).order_by('-adding_datetime')
        }
        return render(request, self.template_name, context)

    def post(self, request, *args, **kwargs):
        if 'json' in request.content_type:
            query = json.loads(request.body)
            if 'action' in query:
                action = query['action']
                if action == 'add_news':
                    return self.add_news(request, query['data'])
        raise Http404

    @staticmethod
    def add_news(request, data):
        try:
            news = News.objects.create(
                title=data['title'],
                content=data['content'],
                topic='custom',
                group=request.user.students_group
            )
        except Exception as e:
            return json_error_response(e)
        else:
            return json_success_response({
                'title': news.title,
                'content': news.content,
                'datetime': news.adding_datetime.strftime('%d.%m.%Y %H:%M')
            })


class SchedulePage(LoginRequiredMixin, TemplateView):
    template_name = 'mystudy_app/schedule/schedule.html'
    login_url = 'mystudy_app:login'

    def get(self, request, *args, **kwargs):
        if request.user.students_group is None:
            return redirect('mystudy_app:all_groups')
        week_start, week_end = self.get_week_dates()
        context = {
            'disciplines': Discipline.objects.filter(group=request.user.students_group),
            'templates': WeekTemplate.objects.filter(group=request.user.students_group).order_by('order'),
            'lesson_times': LessonTime.objects.filter(group=request.user.students_group).order_by('order'),
            'formats': LessonFormat.objects.filter(group=request.user.students_group),
            'week_start': week_start,
            'week_end': week_end,
        }
        return render(request, self.template_name, context)

    def post(self, request, *args, **kwargs):
        if 'json' in request.content_type:
            query = json.loads(request.body)
            action = query.get('action', False)
            if action:
                if action == 'previous_week':
                    return self.previous_week(request, query['data'])
                elif action == 'next_week':
                    return self.next_week(request, query['data'])
                elif action == 'get_table':
                    return self.get_table(request, query['data'])
                elif action == 'cancel_template_lesson':
                    return self.cancel_template_lesson(request, query['data'])
                elif action == 'add_custom_lesson':
                    return self.add_custom_lesson(request, query['data'])
                elif action == 'delete_custom_lesson':
                    return self.delete_custom_lesson(request, query['data'])
                elif action == 'change_custom_lesson':
                    return self.change_custom_lesson(request, query['data'])

    @staticmethod
    def get_week_dates(current_date=date.today()):
        week_start = current_date - timedelta(days=date.weekday(current_date))
        week_end = current_date + timedelta(days=(6 - date.weekday(current_date)))
        return week_start, week_end

    @staticmethod
    def previous_week(request, data):
        current_date = data['date']
        week_start, week_end = SchedulePage.get_week_dates(date.fromisoformat(current_date) - timedelta(days=1))
        data['week_start'] = week_start.isoformat()
        data['week_end'] = week_end.isoformat()
        return SchedulePage.get_table(request, data)

    @staticmethod
    def next_week(request, data):
        current_date = datetime.datetime.strptime(data['date'], '%Y-%m-%d').date()
        week_start, week_end = SchedulePage.get_week_dates(current_date + timedelta(days=1))
        data['week_start'] = week_start.isoformat()
        data['week_end'] = week_end.isoformat()
        return SchedulePage.get_table(request, data)

    @staticmethod
    def get_table(request, data):
        table = ScheduleTableHandler.make_full_table(request, data)
        data['table'] = table
        return json_success_response(data)

    @staticmethod
    def cancel_template_lesson(request, data):
        template_id = data['template_id']
        current_date = data['current_date']
        try:
            template_lesson = TemplateLesson.objects.get(pk=template_id)
            canceled_lesson = Lesson.objects.create(
                status='custom-canceled',
                discipline=template_lesson.lesson.discipline,
                group=request.user.students_group,
                lesson_time=template_lesson.lesson.lesson_time,
                date=date.fromisoformat(current_date),
                lesson_format=template_lesson.lesson.lesson_format,
                type=template_lesson.lesson.type,
                room=template_lesson.lesson.room,
            )
        except TemplateLesson.DoesNotExist:
            return json_error_response('Неверный TemplateLesson ID')
        except Exception as e:
            return json_error_response(e)
        else:
            news_content = f'Дата: {canceled_lesson.date.strftime("%d.%m.%Y")}' \
                           f'\nВремя: {canceled_lesson.lesson_time.start.strftime("%H:%M")}' \
                           f' - {canceled_lesson.lesson_time.end.strftime("%H:%M")}'
            news_content += f'\nПредмет: {canceled_lesson.discipline.short_name}'
            if canceled_lesson.type:
                news_content += f', {canceled_lesson.type}'
            if canceled_lesson.room:
                news_content += f'\nАудитория: {canceled_lesson.room}'
            if canceled_lesson.lesson_format:
                news_content += f'\nФормат: {canceled_lesson.lesson_format.name}'
            News.objects.create(
                topic='schedule',
                title='Занятие отменено',
                content=news_content,
                group=request.user.students_group
            )
            return json_success_response({
                'id': canceled_lesson.pk,
                'status': canceled_lesson.status,
            })

    @staticmethod
    def add_custom_lesson(request, data):
        try:
            lesson_format = LessonFormat.objects.get(pk=int(data['format_id']))
            new_lesson = Lesson.objects.create(
                date=date.fromisoformat(data['current_date']),
                group=request.user.students_group,
                lesson_time=LessonTime.objects.get(pk=int(data['time_id'])),
                lesson_format=lesson_format,
                type=data['type'],
                room=data['room'],
                discipline=Discipline.objects.get(pk=int(data['discipline_id'])),
                status='custom',
            )
        except Exception as e:
            return json_error_response(e)
        else:
            news_content = f'Дата: {new_lesson.date.strftime("%d.%m.%Y")}' \
                           f'\nВремя: {new_lesson.lesson_time.start.strftime("%H:%M")}' \
                           f' - {new_lesson.lesson_time.end.strftime("%H:%M")}'
            news_content += f'\nПредмет: {new_lesson.discipline.short_name}'
            if new_lesson.type:
                news_content += f', {new_lesson.type}'
            if new_lesson.room:
                news_content += f'\nАудитория: {new_lesson.room}'
            if new_lesson.lesson_format:
                news_content += f'\nФормат: {new_lesson.lesson_format.name}'
            News.objects.create(
                topic='schedule',
                title='Добавлено занятие',
                content=news_content,
                group=request.user.students_group
            )
            return json_success_response({
                'id': new_lesson.pk,
                'color': lesson_format.color,
                'status': 'custom'
            })

    @staticmethod
    def delete_custom_lesson(request, data):
        try:
            Lesson.objects.get(pk=data['id']).delete()
        except Exception as e:
            return json_error_response(e)
        else:
            return json_success_response()

    @staticmethod
    def change_custom_lesson(request, data):
        try:
            lesson = Lesson.objects.get(pk=data['id'])
            lesson.discipline = Discipline.objects.get(pk=int(data['discipline_id']))
            lesson.type = data['type']
            lesson.room = data['room']
            lesson.lesson_format = LessonFormat.objects.get(pk=int(data['format_id']))
            lesson.save()
        except Lesson.DoesNotExist:
            return json_error_response('Неверный Lesson ID')
        except LessonFormat.DoesNotExist:
            return json_error_response('Неверный LessonFormat ID')
        except Exception as e:
            return json_error_response(e)
        else:
            return json_success_response({
                'color': lesson.lesson_format.color,
            })


class ScheduleSettingsPage(LoginRequiredMixin, TemplateView):
    template_name = 'mystudy_app/schedule/schedule_settings.html'
    login_url = 'mystudy_app:login'

    def post(self, request, *args, **kwargs):
        if 'form' in request.content_type:
            new_name = request.POST['name']
            format_id = request.POST['id']
            LessonFormat.objects.filter(pk=format_id).update(name=new_name)
            return HttpResponse()
        else:
            query = json.loads(request.body)
            if 'action' not in query:
                return HttpResponse(request)
            if query['action'] == 'delete':
                format_id = query['id']
                LessonFormat.objects.get(pk=format_id).delete()
                return HttpResponse(request)
            elif query['action'] == 'add':
                name = query['name']
                color = query['color']
                group = request.user.students_group
                try:
                    new_obj = LessonFormat.objects.create(name=name, color=color, group=group)
                except:
                    print('error')
                else:
                    return JsonResponse({'id': new_obj.pk})
            elif query['action'] == 'change_color':
                format_id = query['id']
                new_color = query['color']
                LessonFormat.objects.filter(pk=format_id).update(color=new_color)
                return HttpResponse()
            elif query['action'] == 'add_time':
                order = query['order']
                start = [int(elem) for elem in query['start'].split(':')]
                end = [int(elem) for elem in query['end'].split(':')]
                try:
                    new_obj = LessonTime.objects.create(order=order,
                                                        start=time(start[0], start[1]),
                                                        end=time(end[0], end[1]),
                                                        group=request.user.students_group)
                except Exception as e:
                    print(e)
                else:
                    return JsonResponse({'id': new_obj.pk})
            elif query['action'] == 'change_time':
                time_id = query['id']
                start = [int(elem) for elem in query['start'].split(':')]
                end = [int(elem) for elem in query['end'].split(':')]
                try:
                    new_obj = LessonTime.objects.filter(pk=time_id).update(start=time(start[0], start[1]),
                                                                           end=time(end[0], end[1]),
                                                                           group=request.user.students_group)
                except Exception as e:
                    print(e)
                else:
                    return HttpResponse()
            elif query['action'] == 'delete_time':
                time_id = query['id']
                try:
                    LessonTime.objects.get(pk=time_id).delete()
                except Exception as e:
                    print(e)
                else:
                    return HttpResponse()
            elif query['action'] == 'set_schedule_start':
                try:
                    new_date = query['date']
                    request.user.students_group.schedule_start = date.fromisoformat(new_date)
                    request.user.students_group.save()
                except Exception as e:
                    print(traceback.format_exc())
                    print(e)
                    return json_error_response('Сломався((')
                else:
                    return json_success_response()
            else:
                return HttpResponse()

    def get(self, request, *args, **kwargs):
        if request.user.students_group is None:
            return redirect('mystudy_app:all_groups')
        if request.user.students_group.schedule_start:
            schedule_start = date.isoformat(request.user.students_group.schedule_start)
        else:
            schedule_start = None
        context = {
            'lessons': Discipline.objects.filter(group=request.user.students_group),
            'schedule_start': schedule_start,
            'formats': LessonFormat.objects.filter(group=request.user.students_group),
            'lessons_time': LessonTime.objects.filter(group=request.user.students_group),
        }
        return render(request, ScheduleSettingsPage.template_name, context)


class ScheduleTemplatesPage(ScheduleTableHandler, LoginRequiredMixin, TemplateView):
    template_name = 'mystudy_app/schedule/week_templates.html'
    login_url = 'mystudy_app:login'

    def get(self, request, *args, **kwargs):
        if request.user.students_group is None:
            return redirect('mystudy_app:all_groups')
        context = {
            'disciplines': Discipline.objects.filter(group=request.user.students_group),
            'templates': WeekTemplate.objects.filter(group=request.user.students_group).order_by('order'),
            'lesson_times': LessonTime.objects.filter(group=request.user.students_group).order_by('order'),
            'formats': LessonFormat.objects.filter(group=request.user.students_group)
        }
        return render(request, self.template_name, context)

    def post(self, request, *args, **kwargs):
        if 'json' in request.content_type:
            query = json.loads(request.body)
            action = query.get('action', False)
            if action:
                if action == 'change_template_name':
                    return self.change_template_name(request, query['data'])
                elif action == 'change_template_order':
                    return self.change_template_order(request, query['data'])
                elif action == 'get_table':
                    return self.send_table(request, query['data'])
                elif action == 'add_template_lesson':
                    return self.add_template_lesson(request, query['data'])
                elif action == 'edit_template_lesson':
                    return self.edit_template_lesson(request, query['data'])
                elif action == 'delete_template_lesson':
                    return self.delete_template_lesson(request, query['data'])

    @staticmethod
    def change_template_name(request, data):
        try:
            template_id = data['id']
            template = WeekTemplate.objects.get(pk=template_id, group=request.user.students_group)
            template.name = data['name']
            template.save()
        except WeekTemplate.DoesNotExist:
            return json_error_response('Неверный ID')
        except Exception as e:
            return json_error_response(e)
        else:
            return json_success_response()

    @staticmethod
    def change_template_order(request, data):
        # we can't just change an order
        # we must swap orders
        try:
            template_id = data['id']
            old_order = data['old_order']
            new_order = data['new_order']
            first_template = WeekTemplate.objects.get(pk=template_id, group=request.user.students_group)
            second_template = WeekTemplate.objects.get(order=new_order, group=request.user.students_group)
            first_template.order = new_order
            second_template.order = old_order
            first_template.save()
            second_template.save()
        except WeekTemplate.DoesNotExist:
            return json_error_response('Неверный ID')
        except Exception as e:
            return json_error_response(e)
        else:
            return json_success_response()

    def send_table(self, request, data):
        table = ScheduleTableHandler.make_template_table(request, data)
        return json_success_response({'table': table})

    @staticmethod
    def add_template_lesson(request, data):
        # Adding lesson
        try:
            lesson_format = LessonFormat.objects.get(pk=int(data['format_id']))
            new_lesson = Lesson.objects.create(
                group=request.user.students_group,
                lesson_time=LessonTime.objects.get(pk=int(data['time_id'])),
                lesson_format=lesson_format,
                type=data['type'],
                room=data['room'],
                discipline=Discipline.objects.get(pk=int(data['discipline_id'])),
                status='template'
            )
            new_template_lesson = TemplateLesson.objects.create(
                week_day=data['weekday'],
                week_template=WeekTemplate.objects.get(pk=int(data['template_id'])),
                lesson=new_lesson
            )
        except Exception as e:
            print(traceback.format_exc())
            print(e)
            return json_error_response(e)
        else:
            return json_success_response({
                'id': new_template_lesson.pk,
                'color': lesson_format.color
            })

    @staticmethod
    def edit_template_lesson(request, data):
        try:
            lesson = TemplateLesson.objects.get(pk=int(data['template_id'])).lesson
            lesson_format = LessonFormat.objects.get(pk=int(data['format_id']))
            lesson.discipline = Discipline.objects.get(pk=int(data['discipline_id']))
            lesson.type = data['type']
            lesson.room = data['room']
            lesson.lesson_format = lesson_format
            lesson.save()
        except TemplateLesson.DoesNotExist as e:
            return json_error_response('Неверный TemplateLesson ID')
        except LessonFormat.DoesNotExist as e:
            return json_error_response('Неверный LessonFormat ID')
        except Exception as e:
            print(traceback.format_exc())
            print(e)
            return json_error_response(e)
        else:
            return json_success_response({
                'color': lesson_format.color
            })

    @staticmethod
    def delete_template_lesson(request, data):
        try:
            template_lesson = TemplateLesson.objects.get(pk=data['id'])
            template_lesson.lesson.delete()
            template_lesson.delete()
        except TemplateLesson.DoesNotExist:
            return json_error_response('Неверный TemplateLesson ID')
        except Exception as e:
            return json_error_response(e)
        else:
            return json_success_response()


class DisciplinesPage(LoginRequiredMixin, TemplateView):
    template_name = 'mystudy_app/schedule/disciplines.html'
    login_url = 'mystudy_app:login'

    def get(self, request, *args, **kwargs):
        context = {
            'lessons': Discipline.objects.filter(group=request.user.students_group)
        }
        return render(request, self.template_name, context)

    def post(self, request, *args, **kwargs):
        if 'json' in request.content_type:
            query = json.loads(request.body)
            if 'action' in query:
                action = query['action']
                if action == 'add_discipline':
                    return self.add_discipline(request, query['data'])
                elif action == 'edit_discipline':
                    return self.edit_discipline(request, query['data'])
                elif action == 'delete_discipline':
                    return self.delete_discipline(request, query['data'])

    @staticmethod
    def delete_discipline(request, data):
        try:
            Discipline.objects.get(pk=data['id']).delete()
        except Discipline.DoesNotExist:
            return json_error_response('Неверный Discipline ID')
        except Exception as e:
            return json_error_response(e)
        else:
            return json_success_response()

    @staticmethod
    def edit_discipline(request, data):
        try:
            discipline = Discipline.objects.get(pk=int(data['id']))
            discipline.name = data['name']
            discipline.short_name = data['short_name']
            discipline.save()
        except Discipline.DoesNotExist:
            return json_error_response('Неверный Discipline ID')
        except Exception as e:
            return json_error_response(e)
        else:
            return json_success_response()

    @staticmethod
    def add_discipline(request, data):
        try:
            new_discipline = Discipline.objects.create(
                name=data['name'],
                short_name=data['short_name'],
                group=request.user.students_group
            )
        except Exception as e:
            return json_error_response(e)
        else:
            return json_success_response({
                'id': new_discipline.pk
            })


class TasksPage(LoginRequiredMixin, TemplateView):
    template_name = 'mystudy_app/tasks.html'
    login_url = 'mystudy:login'

    def get(self, request, *args, **kwargs):
        context = {
            'discipline_labels': self.get_discipline_labels(request),
            'tasks': Task.objects.filter(user=request.user),
            'labels': TaskLabel.objects.filter(user=request.user),
        }
        return render(request, self.template_name, context)

    def post(self, request, *args, **kwargs):
        if 'json' in request.content_type:
            query = json.loads(request.body)
            if 'action' in query:
                action = query['action']
                if action == 'add_custom_label':
                    return self.add_custom_label(request, query['data'])
                elif action == 'edit_custom_label':
                    return self.edit_custom_label(request, query['data'])
                elif action == 'delete_custom_label':
                    return self.delete_custom_label(request, query['data'])
                elif action == 'edit_discipline_label':
                    return self.edit_discipline_label(request, query['data'])
                elif action == 'get_discipline_labels':
                    return json_success_response({
                        'discipline_labels': self.get_discipline_labels(request)
                    })
                elif action == 'get_custom_labels':
                    return json_success_response({
                        'custom_labels': self.get_custom_labels(request)
                    })
                elif action == 'get_tasks':
                    return json_success_response({
                        'tasks': self.get_tasks(request)
                    })
                elif action == 'delete_task':
                    return self.delete_task(request, query['data'])
                elif action == 'edit_task':
                    return self.edit_task(request, query['data'])
                elif action == 'add_task':
                    return self.add_task(request, query['data'])

    @staticmethod
    def get_tasks(request):
        tasks = {}
        for task in Task.objects.filter(user=request.user):
            tasks[task.pk] = {
                'name': task.name,
                'custom_label_id': task.tasklabel.pk if task.tasklabel else None,
                'discipline_label_id': task.discipline_label.pk if task.discipline_label else None,
                'deadline': task.deadline.strftime('%d.%m') if task.deadline else None
            }
        return tasks

    @staticmethod
    def get_discipline_labels(request):
        discipline_labels = {}
        for discipline in Discipline.objects.filter(group=request.user.students_group):
            label, created = discipline.disciplinelabel_set.get_or_create(user=request.user, defaults={
                'color': '#FF0000',
                'discipline': discipline
            })
            discipline_labels[label.pk] = {
                'short_name': discipline.short_name,
                'color': label.color
            }
        return discipline_labels

    @staticmethod
    def get_custom_labels(request):
        custom_labels = {}
        for label in TaskLabel.objects.filter(user=request.user):
            custom_labels[label.pk] = {
                'name': label.name,
                'color': label.color
            }
        return custom_labels

    @staticmethod
    def add_custom_label(request, data):
        try:
            data['user'] = request.user
            print(data)
            new_label = TaskLabel.objects.create(**data)
        except Exception as e:
            return json_error_response(e)
        else:
            return json_success_response({
                'id': new_label.pk
            })

    @staticmethod
    def edit_custom_label(request, data):
        try:
            label = TaskLabel.objects.get(pk=data['id'])
            label.name = data['name']
            label.color = data['color']
            label.save()
        except TaskLabel.DoesNotExist:
            return json_error_response('Неверный TaskLabel ID')
        except Exception as e:
            return json_error_response(e)
        else:
            return json_success_response()

    @staticmethod
    def delete_custom_label(request, data):
        try:
            TaskLabel.objects.get(pk=data['id']).delete()
        except TaskLabel.DoesNotExist:
            return json_error_response('Неверный TaskLabel ID')
        except Exception as e:
            return json_error_response(e)
        else:
            return json_success_response()

    @staticmethod
    def edit_discipline_label(request, data):
        try:
            label = DisciplineLabel.objects.get(pk=data['id'])
            label.color = data['color']
            label.save()
        except DisciplineLabel.DoesNotExist:
            return json_error_response('Неверный DisciplineLabel ID')
        except Exception as e:
            return json_error_response(e)
        else:
            return json_success_response()

    @staticmethod
    def delete_task(request, data):
        try:
            Task.objects.get(pk=data['id'], user=request.user).delete()
        except Task.DoesNotExist:
            return json_error_response('Неверный Task ID')
        except Exception as e:
            return json_error_response(e)
        else:
            return json_success_response()

    @staticmethod
    def edit_task(request, data):
        try:
            print(data)
            task = Task.objects.get(pk=data['id'], user=request.user)
            task.name = data['name']
            task.tasklabel = TaskLabel.objects.get(pk=data['custom_label_id'], user=request.user) if data['custom_label_id'] != '0' else None
            task.discipline_label = DisciplineLabel.objects.get(pk=data['discipline_label_id'], user=request.user) if data['discipline_label_id'] != '0' else None
            task.deadline = date.fromisoformat(data['deadline']) if data['deadline'] else None
            task.save()
        except Task.DoesNotExist:
            return json_error_response('Неверный Task ID')
        except TaskLabel.DoesNotExist:
            return json_error_response('Неверный TaskLabel ID')
        except DisciplineLabel.DoesNotExist:
            return json_error_response('Неверный DisciplineLabel ID')
        except Exception as e:
            traceback.format_exc()
            print(e)
            return json_error_response(e)
        else:
            return json_success_response()

    @staticmethod
    def add_task(request, data):
        try:
            print(data)
            tasklabel = TaskLabel.objects.get(pk=data['custom_label_id'], user=request.user) if data['custom_label_id'] != '0' else None
            discipline_label = DisciplineLabel.objects.get(pk=data['discipline_label_id'], user=request.user) if data['discipline_label_id'] != '0' else None
            deadline = date.fromisoformat(data['deadline']) if data['deadline'] else None
            new_task = Task.objects.create(
                user=request.user,
                name=data['name'],
                tasklabel=tasklabel,
                discipline_label=discipline_label,
                deadline=deadline
            )
        except Exception as e:
            return json_error_response(e)
        else:
            return json_success_response({
                'id': new_task.pk
            })


class FilesPage(LoginRequiredMixin, TemplateView):
    template_name = 'mystudy_app/files.html'
    login_url = 'mystudy_app:login'

    def get(self, request, *args, **kwargs):
        if request.user.students_group is None:
            return redirect('mystudy_app:all_groups')
        context = {
            'files': File.objects.filter(group=request.user.students_group),
            'discipline_labels': TasksPage.get_discipline_labels(request)
        }
        return render(request, self.template_name, context)

    def post(self, request, *args, **kwargs):
        if 'json' in request.content_type:
            query = json.loads(request.body)
            if 'action' in query:
                action = query['action']
                if action == 'get_discipline_labels':
                    return json_success_response({
                        'discipline_labels': self.get_discipline_labels(request)
                    })
                elif action == 'get_files':
                    return json_success_response({
                        'files': self.get_files(request)
                    })
                elif action == 'edit_discipline_label':
                    return self.edit_discipline_label(request, query['data'])
                elif action == 'delete_file':
                    return self.delete_file(request, query['data'])
        elif 'form' in request.content_type:
            print('see')
            return self.upload_file(request, request.POST, request.FILES)
        else:
            print(request.content_type)

    @staticmethod
    def get_discipline_labels(request):
        discipline_labels = {}
        for discipline in Discipline.objects.filter(group=request.user.students_group):
            label, created = discipline.disciplinelabel_set.get_or_create(user=request.user, defaults={
                'color': '#FF0000',
                'discipline': discipline
            })
            discipline_labels[label.pk] = {
                'short_name': discipline.short_name,
                'color': label.color,
            }
        return discipline_labels

    @staticmethod
    def edit_discipline_label(request, data):
        try:
            label = DisciplineLabel.objects.get(pk=data['id'])
            label.color = data['color']
            label.save()
        except DisciplineLabel.DoesNotExist:
            return json_error_response('Неверный DisciplineLabel ID')
        except Exception as e:
            return json_error_response(e)
        else:
            return json_success_response()

    @staticmethod
    def get_files(request):
        files_data = {}
        files = File.objects.filter(group=request.user.students_group)
        for file in files:
            if file.discipline:
                discipline_label_id = file.discipline.disciplinelabel_set.get(user=request.user).pk
            else:
                discipline_label_id = None
            files_data[file.pk] = {
                'name': os.path.basename(file.file.name).replace('_', ' '),
                'extension': os.path.splitext(file.file.name)[1],
                'adding_datetime': file.adding_datetime.strftime('%d.%m.%Y %H:%M'),
                'url': file.file.url,
                'discipline_label_id': discipline_label_id
            }
        return files_data

    @staticmethod
    def upload_file(request, data, files):
        try:
            discipline_label_id = int(data['discipline_label_id'][0])
            if discipline_label_id != 0:
                label = DisciplineLabel.objects.get(pk=discipline_label_id, user=request.user)
                discipline = label.discipline
            else:
                discipline_label_id = None
                discipline = None
            new_file = File.objects.create(
                file=files['file'],
                discipline=discipline,
                group=request.user.students_group
            )
        except DisciplineLabel.DoesNotExist:
            return json_error_response('Неверны DisciplineLabel ID')
        except Exception as e:
            traceback.print_exc()
            print(e)
            return json_error_response(e)
        else:
            filename = os.path.basename(new_file.file.name).replace('_', ' ')
            news_content = f'{filename} был добавлен в файлообменник.'
            if new_file.discipline:
                news_content += f'\n \nПредмет: {new_file.discipline.short_name}'
            News.objects.create(
                topic='files',
                title='Загружен новый файл',
                group=request.user.students_group,
                content=news_content
            )
            return json_success_response({
                'id': new_file.pk,
                'file_info': {
                    'name': filename,
                    'extension': os.path.splitext(new_file.file.name)[1],
                    'adding_datetime': new_file.adding_datetime.strftime('%d.%m.%Y %H:%M'),
                    'url': new_file.file.url,
                    'discipline_label_id': discipline_label_id
                }
            })

    @staticmethod
    def delete_file(request, data):
        try:
            file = File.objects.get(pk=data['id'])
            file_path = file.file.path
            os.remove(file_path)
            file.delete()
        except File.DoesNotExist:
            return json_error_response('Неверный File ID')
        except Exception as e:
            traceback.print_exc()
            print(e)
            return json_error_response(e)
        else:
            return json_success_response()


class RegisterUserView(CreateView):
    form_class = RegisterUserForm
    template_name = 'mystudy_app/auth/register.html'
    success_url = reverse_lazy('mystudy_app:news')
    extra_context = {'title': 'Регистрация'}

    def form_valid(self, form):
        user = form.save()
        user.groups.add(Group.objects.get(pk=1))
        login(self.request, user)
        return redirect('mystudy_app:news')


class LoginUserView(LoginView):
    form_class = LoginUserForm
    template_name = 'mystudy_app/auth/login.html'
    extra_context = {'title': 'Войти'}

    def get_success_url(self):
        return reverse_lazy('mystudy_app:news')


class RegisterGroupView(LoginRequiredMixin, CreateView):
    form_class = RegistrationGroupForm
    template_name = 'mystudy_app/auth/group_registration.html'

    def get_success_url(self):
        return reverse_lazy('mystudy_app:all_groups')

    def post(self, request, *args, **kwargs):
        data = request.POST
        new_group = StudentsGroup.objects.create(
            name=data['name'],
            organization=data['organization'],
            specialization=data['specialization'],
        )
        request.user.students_group = new_group
        request.user.groups.add(Group.objects.get(pk=4))
        request.user.groups.remove(Group.objects.get(pk=1))
        request.user.save()
        WeekTemplate.objects.create(
            name='Четная',
            order=1,
            group=new_group
        )
        WeekTemplate.objects.create(
            name='Нечетная',
            order=2,
            group=new_group
        )
        print(request.user.groups.all())
        return redirect('mystudy_app:news')


class AllGroupsView(LoginRequiredMixin, ListView):
    model = StudentsGroup
    template_name = 'mystudy_app/auth/select_group.html'
    context_object_name = 'groups'
    login_url = 'mystudy_app:login'

    def get(self, request, *args, **kwargs):
        query = request.GET.get('q', default=False)
        if query:
            query = rf'\w*{query}\w*'
        else:
            query = r'\w*'
        return render(request, self.template_name, {'groups': StudentsGroup.objects.filter(name__iregex=query)})

    def post(self, request, *args, **kwargs):
        group_id = request.POST.get('group_pk', default=False)
        if group_id:
            try:
                group = StudentsGroup.objects.get(pk=group_id)
            except StudentsGroup.DoesNotExist:
                raise Http404
            else:
                # Creating an joining request
                JoinRequest.objects.create(
                    user=request.user,
                    group=group
                )
        return self.get(request, *args, **kwargs)


class GroupView(LoginRequiredMixin, TemplateView):
    template_name = 'mystudy_app/group_control.html'
    login_url = 'mystudy_app:login'

    def get(self, request, *args, **kwargs):
        context = {
            'permission_groups': Group.objects.all(),
            'requests': JoinRequest.objects.filter(group=request.user.students_group),
            'students': User.objects.filter(students_group=request.user.students_group).exclude(pk=request.user.pk)
        }
        return render(request, self.template_name, context)

    def post(self, request, *args, **kwargs):
        if 'json' in request.content_type:
            query = json.loads(request.body)
            if 'action' in query:
                action = query['action']
                if action == 'accept_request':
                    return self.accept_request(request, query['data'])
                elif action == 'decline_request':
                    return self.decline_request(request, query['data'])
                elif action == 'change_role':
                    return self.change_role(request, query['data'])
        raise Http404

    @staticmethod
    def accept_request(request, data):
        try:
            join_request = JoinRequest.objects.get(pk=int(data['id']))
            user = join_request.user
            group = join_request.group
            user.students_group = group
            user.groups.clear()
            user.groups.add(Group.objects.get(pk=2))
            user.save()
            join_request.delete()
        except JoinRequest.DoesNotExist:
            return json_error_response('Неверный JoinRequest ID')
        except Exception as e:
            traceback.print_exc()
            print(e)
            return json_error_response(e)
        else:
            return json_success_response()

    @staticmethod
    def decline_request(request, data):
        try:
            join_request = JoinRequest.objects.get(pk=int(data['id']))
            join_request.delete()
        except JoinRequest.DoesNotExist:
            return json_error_response('Неверный JoinRequest ID')
        except Exception as e:
            traceback.print_exc()
            print(e)
            return json_error_response(e)
        else:
            return json_success_response()

    @staticmethod
    def change_role(request, data):
        try:
            user = User.objects.get(pk=data['user_id'])
            user.groups.clear()
            user.groups.add(Group.objects.get(pk=data['role_id']))
            user.save()
        except User.DoesNotExist:
            return json_error_response('Неверный User ID')
        except Group.DoesNotExist:
            return json_error_response('Неверный Group ID')
        except Exception as e:
            traceback.print_exc()
            print(e)
            return json_error_response(e)
        else:
            return json_success_response()


class ProfileView(LoginRequiredMixin, TemplateView):
    template_name = 'mystudy_app/profile.html'
    login_url = 'mystudy_app:login'

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name, {})