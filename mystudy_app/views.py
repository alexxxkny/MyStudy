from django.contrib.auth import get_user_model, logout, login
from django.contrib.auth.views import LoginView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.http import HttpResponse, JsonResponse
from django.views import View
from django.core.exceptions import *
from django.views.generic import CreateView, TemplateView, ListView, DetailView, FormView
from .forms import *
import json
import re


def index(request):
    return render(request, 'mystudy_app/index.html')


def logout_user(request):
    logout(request)
    return redirect('mystudy_app:login')


def register_user(request):
    return render(request, 'mystudy_app/auth/register.html')


class NewsPage(LoginRequiredMixin, TemplateView):
    template_name = 'mystudy_app/index.html'
    login_url = 'mystudy_app:login'


class SchedulePage(LoginRequiredMixin, TemplateView):
    template_name = 'mystudy_app/schedule/schedule.html'
    login_url = 'mystudy_app:login'

    def get(self, request, *args, **kwargs):
        return render(request, SchedulePage.template_name, {})

    def post(self, request, *args, **kwargs):
        query = json.loads(request.body)
        print(query)
        if query['action'] == 'send':
            return JsonResponse({'text': 'ITSWORKINMTHFCKR!!!'})
        else:
            return HttpResponse(request)


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
                group = request.user.group
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
            else:
                return HttpResponse()

    def get(self, request, *args, **kwargs):
        context = {
            'formats': LessonFormat.objects.filter(group=request.user.group)
        }
        return render(request, ScheduleSettingsPage.template_name, context)


class ScheduleTemplatesPage(LoginRequiredMixin, TemplateView):
    template_name = 'mystudy_app/schedule/week_templates.html'
    login_url = 'mystudy_app:login'


class RegisterUserView(CreateView):
    form_class = RegisterUserForm
    template_name = 'mystudy_app/auth/register.html'
    success_url = reverse_lazy('mystudy_app:home')
    extra_context = {'title': 'Регистрация'}

    def form_valid(self, form):
        user = form.save()
        login(self.request, user)
        return redirect('mystudy_app:home')


class LoginUserView(LoginView):
    form_class = LoginUserForm
    template_name = 'mystudy_app/auth/login.html'
    extra_context = {'title': 'Войти'}

    def get_success_url(self):
        return reverse_lazy('mystudy_app:home')


class RegisterGroupView(CreateView):
    form_class = RegistrationGroupForm
    template_name = 'mystudy_app/auth/group_registration.html'

    def get_success_url(self):
        return reverse_lazy('mystudy_app:all_groups')


class AllGroupsView(ListView):
    model = Group
    template_name = 'mystudy_app/auth/select_group.html'
    context_object_name = 'groups'

    def get(self, request, *args, **kwargs):
        query = request.GET.get('q', default=False)
        if query:
            query = rf'\w*{query}\w*'
        else:
            query = r'\w*'
        return render(request, self.template_name, {'groups': Group.objects.filter(name__iregex=query)})

    def post(self, request, *args, **kwargs):
        group_id = request.POST.get('group_pk', default=False)
        if group_id:
            group = Group.objects.get(pk=group_id)
            request.user.group = group
            request.user.save()
            return redirect('mystudy_app:group', group_slug=group.group_slug)
        else:
            self.get(request, *args, **kwargs)


class GroupView(DetailView):
    model = Group
    template_name = 'mystudy_app/group.html'
    context_object_name = 'group'
    slug_field = 'group_slug'
    slug_url_kwarg = 'group_slug'