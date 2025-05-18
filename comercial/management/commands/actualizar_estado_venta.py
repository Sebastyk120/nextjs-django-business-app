from django.core.management.base import BaseCommand
from nacionales.models import VentaNacional

class Command(BaseCommand):
    help = "Recalcula estado_venta en todos los registros de VentaNacional"

    def handle(self, *args, **options):
        default = VentaNacional._meta.get_field('estado_venta').default
        # actualización y guardado individual para activar señales
        for vn in VentaNacional.objects.all():
            vn.estado_venta = default
            vn.save()
        self.stdout.write(self.style.SUCCESS("Estados de venta recalculados."))