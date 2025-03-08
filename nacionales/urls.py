from django.urls import path
from . import views

urlpatterns = [
    path('nacionales_list_general', views.nacionales_list_general, name='nacionales_list_general'),
]