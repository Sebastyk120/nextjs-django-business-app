from django.core.management.base import BaseCommand
from nacionales.models import ReporteCalidadExportador

class Command(BaseCommand):
    help = "Recalcula estado_venta en todos los registros de ReporteCalidadExportador"

    def handle(self, *args, **options):
        default = ReporteCalidadExportador._meta.get_field('estado_reporte_exp').default
        # actualización y guardado individual para activar señales
        for rep in ReporteCalidadExportador.objects.all():
            rep.estado_reporte_exp = default
            rep.save()
        self.stdout.write(self.style.SUCCESS("Estados de reporte recalculados."))