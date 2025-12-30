from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
from .views import LandingPageView, EnglishLandingPageView
from django.contrib.auth.decorators import login_required

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
    path('api/fruits/', views.fruits_api, name='fruits_api'),
    path('api/get_captcha/', views.get_captcha_api, name='get_captcha_api'),
    path('api/contact_submit/', views.contact_api_submit, name='contact_api_submit'),
    path('api/login/', views.api_login, name='api_login'),
    path('api/logout/', views.api_logout, name='api_logout'),
    path('api/password-reset/', views.api_password_reset, name='api_password_reset'),
    path('api/check-auth/', views.api_check_auth, name='api_check_auth'),
    
    # Rutas de autenticación
    path('login/', views.login1, name='login'),
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
]



