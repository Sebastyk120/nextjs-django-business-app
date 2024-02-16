from django.contrib import admin
from django.contrib.auth.views import PasswordResetView

admin.site.site_header = "Administración Heavens Fruits"
admin.site.site_title = "Administración Heavens"
admin.site.index_title = "Bienvenido al Portal de Administración Heavens"


class CustomPasswordResetView(PasswordResetView):
    title = 'Restablecer Contraseña - Heavens Fruits'
    header = 'Administración Heavens Fruits'
