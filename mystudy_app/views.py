from django.contrib.auth import get_user_model, logout, login
from django.contrib.auth.views import LoginView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.http import HttpResponse
from django.views import View
from django.views.generic import CreateView, TemplateView, ListView, DetailView
from .forms import *


def index(request):
    return render(request, 'mystudy_app/index.html')


def logout_user(request):
    logout(request)
    return redirect('mystudy_app:login')


def register_user(request):
    return render(request, 'mystudy_app/register.html')


class NewsPage(LoginRequiredMixin, TemplateView):
    template_name = 'mystudy_app/index.html'
    login_url = 'mystudy_app:login'


class RegisterUserView(CreateView):
    form_class = RegisterUserForm
    template_name = 'mystudy_app/register.html'
    success_url = reverse_lazy('mystudy_app:home')

    def form_valid(self, form):
        user = form.save()
        login(self.request, user)
        return redirect('mystudy_app:home')


class LoginUserView(LoginView):
    form_class = LoginUserForm
    template_name = 'mystudy_app/login.html'

    def get_success_url(self):
        return reverse_lazy('mystudy_app:home')


class RegisterGroupView(CreateView):
    form_class = RegistrationGroupForm
    template_name = 'mystudy_app/group_registration.html'

    def get_success_url(self):
        return reverse_lazy('mystudy_app:all_groups')


class AllGroupsView(ListView):
    model = Group
    template_name = 'mystudy_app/all_groups.html'
    context_object_name = 'groups'

    def get(self, request, *args, **kwargs):
        print(request.GET)
        return render(request, self.template_name, {'groups': self.get_queryset()})

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