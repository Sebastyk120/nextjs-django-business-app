from django.contrib import admin
from django.shortcuts import render
from django.conf.urls import handler404
from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
from .views import LandingPageView, EnglishLandingPageView
from django.contrib.auth.decorators import login_required

# Crear clases personalizadas para las vistas de restablecimiento de contraseña
class CustomPasswordResetDoneView(auth_views.PasswordResetDoneView):
    template_name = 'registration/password_reset_done.html'
    
    def get_template_names(self):
        return [self.template_name]

class CustomPasswordResetConfirmView(auth_views.PasswordResetConfirmView):
    template_name = 'registration/password_reset_confirm.html'
    success_url = '/autenticacion/reset_password_complete/'
    
    def get_template_names(self):
        return [self.template_name]

class CustomPasswordResetCompleteView(auth_views.PasswordResetCompleteView):
    template_name = 'registration/password_reset_complete.html'
    
    def get_template_names(self):
        return [self.template_name]

urlpatterns = [
    # Landing page (pública)
    path('', LandingPageView.as_view(), name='landing_page'),
    path('en/', EnglishLandingPageView.as_view(), name='landing_page_en'),
    
    # Rutas de autenticación
    path('login/', views.login1, name='login'),
    path('signup/', views.signup, name='signup'),
    path('logout/', views.salir, name='logout'),
    
    # Home (protegido)
    path('home/', login_required(views.home), name='home'),
    
    # Rutas de restablecimiento de contraseña
    path('reset_password/', 
        views.CustomPasswordResetView.as_view(
            template_name='registration/password_reset_form.html',
            email_template_name='registration/password_reset_email.html',
            subject_template_name='registration/password_reset_subject.txt',
            success_url='/autenticacion/reset_password_sent/'
        ), 
        name='password_reset'),
    
    path('reset_password_sent/', 
        CustomPasswordResetDoneView.as_view(
            template_name='registration/password_reset_done.html'
        ), 
        name='password_reset_done'),
    
    path('reset/<uidb64>/<token>/', 
        CustomPasswordResetConfirmView.as_view(
            template_name='registration/password_reset_confirm.html',
            success_url='/autenticacion/reset_password_complete/'
        ), 
        name='password_reset_confirm'),
    
    path('reset_password_complete/', 
        CustomPasswordResetCompleteView.as_view(
            template_name='registration/password_reset_complete.html'
        ), 
        name='password_reset_complete'),
    
    # Rutas de administración
    path('backup/', views.backup_database, name='backup_database'),
    path('restore/', views.RestoreDataView.as_view(), name='restore_data'),
]



