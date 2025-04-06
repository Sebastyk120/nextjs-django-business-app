from django.core.management.base import BaseCommand
from comercial.models import Pedido

class Command(BaseCommand):
    help = 'Recalcula el valor total de la factura para un pedido específico'

    def add_arguments(self, parser):
        parser.add_argument('--pedido_id', type=int, help='ID del pedido a recalcular')

    def handle(self, *args, **kwargs):
        pedido_id = kwargs['pedido_id']
        if pedido_id:
            recalcular_valor_total_factura(pedido_id)
        else:
            self.stdout.write(self.style.ERROR('Por favor proporciona un ID de pedido válido'))

def recalcular_valor_total_factura(pedido_id):
    try:
        pedido = Pedido.objects.get(id=pedido_id)
        # Inicializar el campo a 0
        pedido.valor_total_factura_usd = 0

        # Sumar valores a partir de cada DetallePedido
        detalles = pedido.detallepedido_set.all()
        for d in detalles:
            pedido.valor_total_factura_usd += d.valor_x_producto or 0

        # Guardar el pedido con el nuevo valor
        pedido.save()
    except Pedido.DoesNotExist:
        print(f"Pedido con id {pedido_id} no existe.")