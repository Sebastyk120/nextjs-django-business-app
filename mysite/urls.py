from django.contrib import admin
from django.contrib import admin
from django.shortcuts import render
from django.urls import path, include
from autenticacion import views as principal

urlpatterns = [
    path('admin/', admin.site.urls),
    path('autenticacion/', include('autenticacion.urls')),
    path('comercial/', include('comercial.urls')),
    path('inventarios/', include('inventarios.urls')),
    path('cartera/', include('cartera.urls')),
    path('nacionales/', include('nacionales.urls')),
    path('', principal.home, name='home_principal')
]


def custom_404(request, exception):
    return render(request, '404.html', status=404)


# Asignar el handler para 404
handler404 = 'mysite.urls.custom_404'
