from django import template


register = template.Library()


@register.simple_tag()
def get_nav_menu():
    return [
        {'title': 'Новости', 'url_name': 'mystudy_app:news'},
        {'title': 'Расписание', 'url_name': 'mystudy_app:schedule'},
        {'title': 'Задачи', 'url_name': 'mystudy_app:todo'},
        {'title': 'Файлы', 'url_name': 'mystudy_app:files'},
        {'title': 'Группы', 'url_name': 'mystudy_app:all_groups'},
    ]


@register.simple_tag()
def get_login_menu():
    return [
        {'title': 'Регистрация', 'url_name': 'mystudy_app:registration', 'authenticated': False},
        {'title': 'Войти', 'url_name': 'mystudy_app:login', 'authenticated': False},
        {'title': 'Выйти', 'url_name': 'mystudy_app:logout', 'authenticated': True},
    ]


@register.filter(name='times')
def times(number):
    return range(number)
