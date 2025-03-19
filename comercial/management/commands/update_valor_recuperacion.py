from django.core.management.base import BaseCommand
from django.db.models import Sum
from comercial.models import Pedido, DetallePedido

class Command(BaseCommand):
    help = "Actualiza el campo valor_total_recuperacion_usd para cada Pedido"

    def handle(self, *args, **options):
        pedidos = Pedido.objects.all()
        for pedido in pedidos:
            suma_recuperacion = DetallePedido.objects.filter(pedido=pedido).aggregate(
                total=Sum('valor_total_recuperacion_x_producto')
            )['total'] or 0
            pedido.valor_total_recuperacion_usd = suma_recuperacion
            pedido.save()
        self.stdout.write(self.style.SUCCESS("Valores de recuperación actualizados."))