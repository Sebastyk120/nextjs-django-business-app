from django.shortcuts import render
from django.conf.urls import handler404
from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login1, name='login'),
    path('signup/', views.signup, name='signup'),
    path('logout/', views.salir, name='logout'),
    path('migrate/', views.MigrateView.as_view(), name='migrate'),
    path('reset_password/', views.CustomPasswordResetView.as_view(), name='password_reset'),
    path('reset_password_sent/', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('reset_password_complete/', auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),
    path('backup/', views.BackupDataView.as_view(), name='backup_data'),
    path('restore/', views.RestoreDataView.as_view(), name='restore_data'),
]



