
import math
from django.db.models import Sum
from comercial.models import Pedido
# Con esto Recalculo los pallets de los pedidos.
def recalcular_ultimos_200_pedidos():
    # 1) Obtenemos los últimos 200 pedidos
    pedidos = Pedido.objects.order_by('-id')[:200]

    for pedido in pedidos:
        # 2) Obtenemos todos los detalles del pedido
        detalles = pedido.detallepedido_set.all()

        # 3) Recalculamos las cajas solicitadas y enviadas (sum simple con aggregate)
        total_cajas_solicitadas = detalles.aggregate(total=Sum('cajas_solicitadas'))['total'] or 0
        total_cajas_enviadas = detalles.aggregate(total=Sum('cajas_enviadas'))['total'] or 0

        # 4) Recalculamos las piezas: sumamos fracciones y al final aplicamos math.ceil
        total_piezas_solicitadas = 0
        total_piezas_enviadas = 0

        for d in detalles:
            total_piezas_solicitadas += d.calcular_no_piezas() or 0
            total_piezas_enviadas += d.calcular_no_piezas_final() or 0

        # Redondeo final (después de sumar todo)
        total_piezas_solicitadas = math.ceil(total_piezas_solicitadas)
        total_piezas_enviadas = math.ceil(total_piezas_enviadas)

        # 5) Asignamos los valores recalculados al pedido
        pedido.total_cajas_solicitadas = total_cajas_solicitadas
        pedido.total_cajas_enviadas = total_cajas_enviadas
        pedido.total_piezas_solicitadas = total_piezas_solicitadas
        pedido.total_piezas_enviadas = total_piezas_enviadas

        # 6) Guardamos
        pedido.save()
