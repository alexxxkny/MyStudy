from django.contrib.auth import get_user_model, logout, login
from django.contrib.auth.views import LoginView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import CreateView, TemplateView
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