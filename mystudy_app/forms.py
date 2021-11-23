from django.forms import *
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import *
auth_input_class = 'auth-form__input'


class RegisterUserForm(UserCreationForm):
    username = CharField(label='Логин', widget=TextInput(attrs={'class': auth_input_class}))
    password1 = CharField(label='Пароль', widget=PasswordInput(attrs={'class': auth_input_class}))
    password2 = CharField(label='Повторите пароль',
                                widget=PasswordInput(attrs={'class': auth_input_class}))
    last_name = CharField(label='Фамилия', widget=TextInput(attrs={'class': auth_input_class}))
    first_name = CharField(label='Имя', widget=TextInput(attrs={'class': auth_input_class}))
    middle_name = CharField(label='Отчество', widget=TextInput(attrs={'class': auth_input_class}))
    email = EmailField(label='Email', widget=TextInput(attrs={'class': auth_input_class}))

    class Meta:
        model = get_user_model()
        fields = ['username', 'password1', 'password2', 'last_name', 'first_name',
                  'middle_name', 'email']


class LoginUserForm(AuthenticationForm):
    username = CharField(label='Логин', widget=TextInput(attrs={'class': auth_input_class}))
    password = CharField(label='Пароль', widget=PasswordInput(attrs={'class': auth_input_class}))

    class Meta:
        model = get_user_model()
        fields = ['username', 'password']


class RegistrationGroupForm(ModelForm):
    name = CharField(label='Название группы', widget=TextInput(attrs={'class': auth_input_class}))

    class Meta:
        model = Group
        fields = ['name', ]
