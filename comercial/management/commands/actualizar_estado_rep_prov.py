from django.core.management.base import BaseCommand
from nacionales.models import ReporteCalidadProveedor

class Command(BaseCommand):
    help = "Recalcula estado_venta en todos los registros de ReporteCalidadProveedor"

    def handle(self, *args, **options):
        # actualización y guardado individual para activar señales
        for rep in ReporteCalidadProveedor.objects.all():
            rep.save()
        self.stdout.write(self.style.SUCCESS("Estados de reporte recalculados."))