from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login1, name='login'),
    path('signup/', views.signup, name='signup'),
    path('logout/', views.salir, name='logout'),
]
