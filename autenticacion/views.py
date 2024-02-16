from django.contrib import messages
from django.contrib.admin.views.decorators import user_passes_test
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth.models import User
from django.contrib.auth.views import PasswordResetView
from django.db import IntegrityError
from django.core.management import call_command
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.views import View


# Create your views here.

class MigrateView(View):
    def get(self, request, *args, **kwargs):
        apps_to_migrate = ['comercial', 'cartera', 'inventarios']

        try:
            for app_name in apps_to_migrate:
                # Ejecutar 'makemigrations' para la aplicación específica
                call_command('makemigrations', app_name)

                # Ejecutar 'migrate' para la aplicación específica
                call_command('migrate', app_name)

            return HttpResponse(f"Migraciones para las aplicaciones {', '.join(apps_to_migrate)} realizadas con éxito.")
        except Exception as e:
            # Capturar cualquier error que pueda ocurrir durante la ejecución de las migraciones
            return HttpResponse(f"Error al realizar las migraciones: {str(e)}", status=500)


def home(request):
    return render(request, 'home.html')


def login1(request):
    if request.method == 'GET':
        return render(request, 'login.html', {'form': AuthenticationForm})
    else:
        user = authenticate(
            request, username=request.POST['username'], password=request.POST['password'])
        if user is None:
            messages.error(request, f'Usuario o contraseña incorrecto')
            return render(request, 'login.html',
                          {'form': AuthenticationForm})
        else:
            login(request, user)
            return redirect('home')


@user_passes_test(lambda u: User.objects.count() == 0, login_url='/login/')
def signup(request):
    if request.method == 'GET':
        return render(request, 'signup.html', {'form': UserCreationForm})
    else:
        if request.POST['password1'] == request.POST['password2']:
            try:
                # Registrar usuario.
                user = User.objects.create_user(
                    username=request.POST['username'], password=request.POST['password1'])
                user.is_superuser = True
                user.is_staff = True
                user.save()
                messages.success(request, "Superusuario creado correctamente")
                login(request, user)
                return redirect('home')
            except IntegrityError:
                return render(request, 'signup.html', {'form': UserCreationForm, "error": 'El usuario ya existe'})
        return render(request, 'signup.html', {'form': UserCreationForm, "error": 'Las contraseñas no coinciden'})


@login_required
def salir(request):
    logout(request)
    return redirect('home')


class CustomPasswordResetView(PasswordResetView):
    title = 'Restablecer Contraseña - Heavens Fruits'

