from django.forms import *
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm


class RegisterUserForm(UserCreationForm):
    username = CharField(label='Логин', widget=TextInput(attrs={'class': 'register-form__input'}))
    password1 = CharField(label='Пароль', widget=PasswordInput(attrs={'class': 'register-form__input'}))
    password2 = CharField(label='Повторите пароль',
                                widget=PasswordInput(attrs={'class': 'register-form__input'}))
    last_name = CharField(label='Фамилия')
    first_name = CharField(label='Имя')
    middle_name = CharField(label='Отчество')
    email = EmailField(label='Email')

    class Meta:
        model = get_user_model()
        fields = ['username', 'password1', 'password2', 'last_name', 'first_name',
                  'middle_name', 'email']


class LoginUserForm(AuthenticationForm):
    username = CharField(label='Логин', widget=TextInput(attrs={'class': 'register-form__input'}))
    password = CharField(label='Пароль', widget=PasswordInput(attrs={'class': 'register-form__input'}))

    class Meta:
        model = get_user_model()
        fields = ['username', 'password']


class RegistrationGroupForm(Form):
    name = CharField(label='Название группы', widget=TextInput())
