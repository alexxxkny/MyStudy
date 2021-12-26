from django.forms import *
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import *
auth_input_class = 'auth-form__input'


class RegisterUserForm(UserCreationForm):
    username = CharField(label='Логин', widget=TextInput(attrs={'class': auth_input_class,
                                                                'placeholder': 'Логин'}))
    password1 = CharField(label='Пароль', widget=PasswordInput(attrs={'class': auth_input_class,
                                                                      'placeholder': 'Пароль'}))
    password2 = CharField(label='Повторите пароль',
                                widget=PasswordInput(attrs={'class': auth_input_class,
                                                            'placeholder': 'Повторите пароль'}))
    last_name = CharField(label='Фамилия', widget=TextInput(attrs={'class': auth_input_class,
                                                                   'placeholder': 'Фамилия'}))
    first_name = CharField(label='Имя', widget=TextInput(attrs={'class': auth_input_class,
                                                                'placeholder': 'Имя'}))
    middle_name = CharField(label='Отчество', widget=TextInput(attrs={'class': auth_input_class,
                                                                      'placeholder': 'Отчество'}))
    email = EmailField(label='Email', widget=TextInput(attrs={'class': auth_input_class,
                                                              'placeholder': 'Email'}))

    class Meta:
        model = get_user_model()
        fields = ['username', 'password1', 'password2', 'last_name', 'first_name',
                  'middle_name', 'email']


class LoginUserForm(AuthenticationForm):
    username = CharField(label='Логин', widget=TextInput(attrs={'class': auth_input_class,
                                                                'placeholder': 'Логин'}))
    password = CharField(label='Пароль', widget=PasswordInput(attrs={'class': auth_input_class,
                                                                     'placeholder': 'Пароль'}))

    class Meta:
        model = get_user_model()
        fields = ['username', 'password']


class RegistrationGroupForm(ModelForm):
    name = CharField(label='Название группы', widget=TextInput(attrs={'class': auth_input_class,
                                                                      'placeholder': 'Название группы'}))
    organization = CharField(label='Учебное заведение', widget=TextInput(attrs={'class': auth_input_class,
                                                                                'placeholder': 'Учебное заведение'}))
    specialization = CharField(label='Направление', widget=TextInput(attrs={'class': auth_input_class,
                                                                            'placeholder': 'Направление'}))

    class Meta:
        model = StudentsGroup
        fields = ['name', 'organization', 'specialization']
