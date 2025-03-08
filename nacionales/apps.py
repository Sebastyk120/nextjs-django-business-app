from django.apps import AppConfig

class NacionalesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'nacionales'

    def ready(self):
        import nacionales.signals  # Asegúrate de que el nombre coincida con tu aplicación