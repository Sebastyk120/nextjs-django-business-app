import subprocess
import tempfile
from django.http import FileResponse, HttpResponse
from django.contrib.auth.decorators import login_required, user_passes_test

"""@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def backup_database(request):
    if request.method == 'POST':
        try:
            # Crear un archivo temporal para el backup
            with tempfile.NamedTemporaryFile(delete=True, suffix='.backup') as temp_file:
                # Comando pg_dump
                pg_dump_cmd = [
                    'pg_dump',
                    '-h', 'db.railway.app',
                    '-p', '5432',
                    '-U', 'myuser',
                    '-F', 'c',
                    '-b',
                    '-v',
                    '-f', temp_file.name,
                    'heavens_db'
                ]

                # Ejecutar pg_dump
                subprocess.run(pg_dump_cmd, check=True, env={'PGPASSWORD': 'mypassword'})

                # Preparar la respuesta para descargar el archivo
                temp_file.seek(0)
                response = FileResponse(temp_file, content_type='application/octet-stream')
                response['Content-Disposition'] = f'attachment; filename="backup_heavens_{now().strftime("%Y-%m-%d_%H-%M-%S")}.backup"'
                return response
        except subprocess.CalledProcessError as e:
            return HttpResponse(f'Error during backup: {e}', status=500)
    else:
        return HttpResponse('Method not allowed', status=405)"""
