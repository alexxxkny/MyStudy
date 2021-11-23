from django.urls import path
from .views import *

app_name = 'mystudy_app'
urlpatterns = [
    path('', index, name='home'),
    path('news/', NewsPage.as_view(), name='news'),
    path('schedule/', index, name='schedule'),
    path('todo/', index, name='todo'),
    path('files/', index, name='files'),
    path('login/', LoginUserView.as_view(), name='login'),
    path('logout/', logout_user, name='logout'),
    path('registration/', RegisterUserView.as_view(), name='registration'),
    path('groups/registration/', RegisterGroupView.as_view(), name='group_registration'),
    path('groups/', AllGroupsView.as_view(), name='all_groups'),
    path('groups/<slug:group_slug>', GroupView.as_view(), name='group'),
]