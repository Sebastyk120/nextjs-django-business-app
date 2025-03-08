import io
import json
import os
import subprocess
import tempfile
from urllib.parse import urlparse
from django.apps import apps
from django.contrib import messages
from django.contrib.admin.views.decorators import user_passes_test
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.models import User
from django.contrib.auth.views import PasswordResetView
from django.core.management import call_command
from django.db import IntegrityError, transaction
from django.http import HttpResponse, FileResponse
from django.shortcuts import render, redirect
from django.utils.timezone import now
from django.views import View


# Create your views here.

def es_miembro_del_grupo(grupo):
    def check(user):
        return user.groups.filter(name=grupo).exists()
    return check

class MigrateView(LoginRequiredMixin, UserPassesTestMixin, View):
    def test_func(self):
        # Solo permitir acceso a usuarios que son administradores
        return self.request.user.is_superuser

    def get(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                # Ejecutar 'makemigrations' para todas las aplicaciones
                call_command('makemigrations')

                # Ejecutar 'migrate' para todas las aplicaciones
                call_command('migrate')

            return HttpResponse("Todas las migraciones realizadas con éxito.")
        except Exception as e:
            # Capturar cualquier error que pueda ocurrir durante la ejecución de las migraciones
            return HttpResponse(f"Error al realizar las migraciones: {str(e)}", status=500)


def home(request):
    if not request.user.is_authenticated:
        return redirect('login')
    return render(request, 'home.html')


def login1(request):
    if request.method == 'GET':
        return render(request, 'login2.html', {'form': AuthenticationForm})
    else:
        user = authenticate(
            request, username=request.POST['username'], password=request.POST['password'])
        if user is None:
            messages.error(request, f'Usuario o contraseña incorrecto')
            return render(request, 'login2.html',
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
    template_name = 'registration/password_reset_form.html'
    email_template_name = 'registration/password_reset_email.html'
    subject_template_name = 'registration/password_reset_subject.txt'
    success_url = '/autenticacion/reset_password_sent/'
    title = 'Restablecer Contraseña - Heavens Fruits'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['site_name'] = "Administración Heavens Fruits"
        context['site_header'] = "Heaven's Fruits Connect"
        return context

    # Asegurarse de que use la plantilla correcta
    def get_template_names(self):
        return [self.template_name]


def stream_backup():
    """Genera un backup de todos los modelos en un solo bloque."""
    # Obtener todos los modelos registrados en Django
    all_models = apps.get_models()

    # Crear un StringIO para capturar la salida de dumpdata
    output = io.StringIO()

    # Obtener los nombres de todos los modelos
    model_names = [model._meta.label for model in all_models]

    # Usar dumpdata para generar el backup de todos los modelos a la vez
    call_command('dumpdata', *model_names, stdout=output)

    # Devolver el contenido del backup
    yield output.getvalue()


@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def backup_database(request):
    if request.method == 'POST':
        try:
            # Obtener la URL de la base de datos desde las variables de entorno
            database_url = os.getenv('DATABASE_URL')
            if not database_url:
                return HttpResponse('DATABASE_URL no está configurado en el archivo .env.', status=500)

            # Parsear la URL de la base de datos
            parsed_url = urlparse(database_url)

            db_user = parsed_url.username
            db_password = parsed_url.password
            db_host = parsed_url.hostname
            db_port = parsed_url.port or '5432'
            db_name = parsed_url.path.lstrip('/')

            # Crear un archivo temporal para el backup
            with tempfile.NamedTemporaryFile(delete=True, suffix='.backup') as temp_file:
                # Comando pg_dump
                pg_dump_cmd = [
                    'pg_dump',
                    '-h', db_host,
                    '-p', str(db_port),
                    '-U', db_user,
                    '-F', 'c',
                    '-b',
                    '-v',
                    '-f', temp_file.name,
                    db_name
                ]

                # Configurar las variables de entorno para el subprocess
                env = os.environ.copy()
                env['PGPASSWORD'] = db_password

                # Ejecutar pg_dump
                subprocess.run(pg_dump_cmd, check=True, env=env)

                # Preparar la respuesta para descargar el archivo
                temp_file.seek(0)
                response = FileResponse(temp_file, content_type='application/octet-stream')
                filename = f'backup_heavens_{now().strftime("%Y-%m-%d_%H-%M-%S")}.backup'
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response
        except subprocess.CalledProcessError as e:
            return HttpResponse(f'Error durante el backup: {e}', status=500)
        except Exception as e:
            return HttpResponse(f'Error inesperado: {e}', status=500)
    elif request.method == 'GET':
        # Renderizar la plantilla con el botón para descargar
        return render(request, 'backup.html')
    else:
        return HttpResponse('Método no permitido', status=405)


class RestoreDataView(View):
    def post(self, request, *args, **kwargs):
        if 'backup_file' not in request.FILES:
            return HttpResponse('No file uploaded', content_type='text/plain')

        backup_file = request.FILES['backup_file']

        # Guardar el archivo temporalmente
        with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as temp_file:
            for chunk in backup_file.chunks():
                temp_file.write(chunk)
            temp_file_name = temp_file.name

        # Leer el contenido del archivo temporal
        try:
            with open(temp_file_name, 'r', encoding='utf-8') as file:
                data = json.load(file)

            # Restaurar los datos usando loaddata
            call_command('loaddata', temp_file_name)
            os.remove(temp_file_name)
            return HttpResponse('Data restored successfully', content_type='text/plain')
        except Exception as e:
            os.remove(temp_file_name)
            return HttpResponse(f'Error during data restoration: {e}', content_type='text/plain')
