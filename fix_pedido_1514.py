"""
Fix script for Pedido #1514
Recalculates all computed/aggregate fields on the Pedido from scratch
by summing up all its DetallePedido records.
"""
import os
import sys
import math
import django
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from comercial.models import Pedido, DetallePedido

PEDIDO_ID = 1514

def recalculate_pedido(pedido_id):
    try:
        pedido = Pedido.objects.get(pk=pedido_id)
    except Pedido.DoesNotExist:
        print(f"ERROR: Pedido {pedido_id} no existe.")
        return

    detalles = DetallePedido.objects.filter(pedido=pedido).select_related(
        'referencia', 'presentacion', 'fruta', 'tipo_caja'
    )

    print(f"Pedido #{pedido_id} encontrado: Cliente={pedido.cliente}, Exportadora={pedido.exportadora}")
    print(f"Detalles encontrados: {detalles.count()}")
    print()

    # Print current state
    print("=== ESTADO ACTUAL DEL PEDIDO ===")
    print(f"  total_cajas_solicitadas:       {pedido.total_cajas_solicitadas}")
    print(f"  total_cajas_enviadas:          {pedido.total_cajas_enviadas}")
    print(f"  total_piezas_solicitadas:      {pedido.total_piezas_solicitadas}")
    print(f"  total_piezas_enviadas:         {pedido.total_piezas_enviadas}")
    print(f"  valor_total_factura_usd:       {pedido.valor_total_factura_usd}")
    print(f"  valor_total_nota_credito_usd:  {pedido.valor_total_nota_credito_usd}")
    print(f"  valor_total_utilidad_usd:      {pedido.valor_total_utilidad_usd}")
    print(f"  valor_total_recuperacion_usd:  {pedido.valor_total_recuperacion_usd}")
    print(f"  total_peso_bruto_solicitado:   {pedido.total_peso_bruto_solicitado}")
    print(f"  total_peso_bruto_enviado:      {pedido.total_peso_bruto_enviado}")
    print(f"  variedades:                    {pedido.variedades}")
    print()

    # First, re-save each DetallePedido to recalculate its own computed fields
    # We do this with a direct update to avoid triggering signals/incremental logic
    print("=== RECALCULANDO DETALLES ===")
    for d in detalles:
        # Recalculate detail-level fields
        if d.presentacion:
            d.presentacion_peso = d.presentacion.kilos

        d.kilos = d.presentacion_peso * d.cajas_solicitadas
        d.kilos_enviados = d.presentacion_peso * (d.cajas_enviadas or 0)
        d.diferencia = d.cajas_solicitadas - (d.cajas_enviadas or 0)
        d.valor_x_producto = (d.valor_x_caja_usd or 0) * (d.cajas_enviadas or 0)

        # Recalculate NC and utility
        es_juan_matas = pedido.exportadora.nombre == "Juan_Matas" if pedido.exportadora else False
        cajas_enviadas = d.cajas_enviadas or 0
        no_cajas_nc = d.no_cajas_nc or 0
        tarifa_utilidad = d.tarifa_utilidad or 0
        tarifa_recuperacion = d.tarifa_recuperacion or 0
        valor_x_caja_usd = d.valor_x_caja_usd or 0
        porcentaje_afectacion = d.porcentaje_afectacion_utilidad or 0

        if d.afecta_utilidad is True:
            if es_juan_matas and no_cajas_nc > 0 and porcentaje_afectacion > 0:
                total_nc = no_cajas_nc * valor_x_caja_usd
                utilidad_base = cajas_enviadas * tarifa_utilidad
                deduccion = total_nc * porcentaje_afectacion / 100
                if deduccion >= utilidad_base:
                    d.valor_total_utilidad_x_producto = 0
                else:
                    d.valor_total_utilidad_x_producto = utilidad_base - deduccion
                d.valor_total_recuperacion_x_producto = (cajas_enviadas - no_cajas_nc) * tarifa_recuperacion
                d.valor_nota_credito_usd = total_nc
            else:
                d.valor_total_utilidad_x_producto = (cajas_enviadas - no_cajas_nc) * tarifa_utilidad
                d.valor_total_recuperacion_x_producto = (cajas_enviadas - no_cajas_nc) * tarifa_recuperacion
                d.valor_nota_credito_usd = no_cajas_nc * valor_x_caja_usd
        elif d.afecta_utilidad is False:
            d.valor_total_utilidad_x_producto = cajas_enviadas * tarifa_utilidad
            d.valor_total_recuperacion_x_producto = cajas_enviadas * tarifa_recuperacion
            d.valor_nota_credito_usd = no_cajas_nc * valor_x_caja_usd
        else:  # None = Descuento
            d.valor_total_recuperacion_x_producto = (cajas_enviadas - no_cajas_nc) * tarifa_recuperacion
            d.valor_total_utilidad_x_producto = (cajas_enviadas - no_cajas_nc) * tarifa_utilidad
            d.valor_nota_credito_usd = 0

        # Container fields
        if d.lleva_contenedor and d.referencia and d.referencia.contenedor:
            d.referencia_contenedor = d.referencia.contenedor.nombre
            if d.referencia.cant_contenedor and d.referencia.cant_contenedor > 0:
                d.cantidad_contenedores = math.ceil((d.cajas_enviadas or 0) / d.referencia.cant_contenedor)
            else:
                d.cantidad_contenedores = None
        else:
            d.referencia_contenedor = None
            d.cantidad_contenedores = None

        d.stickers = d.tipo_caja.nombre if d.tipo_caja else None

        # Save detail directly (bypass signals to avoid double-counting)
        DetallePedido.objects.filter(pk=d.pk).update(
            presentacion_peso=d.presentacion_peso,
            kilos=d.kilos,
            kilos_enviados=d.kilos_enviados,
            diferencia=d.diferencia,
            valor_x_producto=d.valor_x_producto,
            valor_total_utilidad_x_producto=d.valor_total_utilidad_x_producto,
            valor_total_recuperacion_x_producto=d.valor_total_recuperacion_x_producto,
            valor_nota_credito_usd=d.valor_nota_credito_usd,
            referencia_contenedor=d.referencia_contenedor,
            cantidad_contenedores=d.cantidad_contenedores,
            stickers=d.stickers,
        )
        print(f"  Detalle #{d.id}: {d.fruta} - {d.presentacion} | "
              f"Solicitadas={d.cajas_solicitadas}, Enviadas={d.cajas_enviadas}, "
              f"Factura={d.valor_x_producto}, NC={d.valor_nota_credito_usd}, "
              f"Utilidad={d.valor_total_utilidad_x_producto}")

    # Now recalculate all Pedido aggregate fields from scratch
    print()
    print("=== RECALCULANDO TOTALES DEL PEDIDO ===")

    # Refresh detalles from DB
    detalles = DetallePedido.objects.filter(pedido=pedido).select_related('referencia', 'fruta')

    total_cajas_solicitadas = 0
    total_cajas_enviadas = 0
    total_factura = Decimal('0')
    total_nota_credito = Decimal('0')
    total_utilidad = Decimal('0')
    total_recuperacion = Decimal('0')
    total_peso_bruto_solicitado = Decimal('0')
    total_peso_bruto_enviado = Decimal('0')
    total_piezas_solicitadas = Decimal('0')
    total_piezas_enviadas = Decimal('0')
    variedades = set()

    for d in detalles:
        total_cajas_solicitadas += d.cajas_solicitadas or 0
        total_cajas_enviadas += d.cajas_enviadas or 0
        total_factura += Decimal(str(d.valor_x_producto or 0))
        total_nota_credito += Decimal(str(d.valor_nota_credito_usd or 0))
        total_utilidad += Decimal(str(d.valor_total_utilidad_x_producto or 0))
        total_recuperacion += Decimal(str(d.valor_total_recuperacion_x_producto or 0))

        # Peso bruto
        porcentaje = Decimal(str(d.referencia.porcentaje_peso_bruto))
        kilos = Decimal(str(d.kilos))
        kilos_enviados = Decimal(str(d.kilos_enviados))
        total_peso_bruto_solicitado += round(kilos + ((kilos * porcentaje) / 100), 2)
        total_peso_bruto_enviado += round(kilos_enviados + ((kilos_enviados * porcentaje) / 100), 2)

        # Piezas (with safety checks for missing pallet values)
        cajas_sol = Decimal(str(d.cajas_solicitadas or 0))
        cajas_env = Decimal(str(d.cajas_enviadas or 0))

        if d.lleva_contenedor:
            pallet_val = d.referencia.cantidad_pallet_con_contenedor
            if pallet_val and pallet_val > 0:
                total_piezas_solicitadas += cajas_sol / Decimal(str(pallet_val))
                total_piezas_enviadas += cajas_env / Decimal(str(pallet_val))
            else:
                print(f"  ⚠ Detalle #{d.id}: referencia '{d.referencia}' no tiene cantidad_pallet_con_contenedor. Piezas omitidas.")
        else:
            pallet_val = d.referencia.cantidad_pallet_sin_contenedor
            if pallet_val and pallet_val > 0:
                total_piezas_solicitadas += cajas_sol / Decimal(str(pallet_val))
                total_piezas_enviadas += cajas_env / Decimal(str(pallet_val))
            else:
                print(f"  ⚠ Detalle #{d.id}: referencia '{d.referencia}' no tiene cantidad_pallet_sin_contenedor. Piezas omitidas.")

        variedades.add(d.fruta.nombre)

    # Update the pedido directly to avoid triggering post_save signals unnecessarily
    # We use Pedido.objects.filter().update() first for aggregates, then call save() for computed fields
    pedido.total_cajas_solicitadas = total_cajas_solicitadas
    pedido.total_cajas_enviadas = total_cajas_enviadas
    pedido.valor_total_factura_usd = total_factura
    pedido.valor_total_nota_credito_usd = total_nota_credito
    pedido.valor_total_utilidad_usd = total_utilidad
    pedido.valor_total_recuperacion_usd = total_recuperacion
    pedido.total_peso_bruto_solicitado = total_peso_bruto_solicitado
    pedido.total_peso_bruto_enviado = total_peso_bruto_enviado
    pedido.total_piezas_solicitadas = math.ceil(total_piezas_solicitadas)
    pedido.total_piezas_enviadas = math.ceil(total_piezas_enviadas)
    pedido.variedades = ", ".join(sorted(variedades)) if variedades else None

    # Call save() to trigger all calculated fields in the Pedido.save() method
    # (semana, diferencia_por_abono, estado_factura, estado_utilidad, etc.)
    pedido.save()

    print()
    print("=== ESTADO ACTUALIZADO DEL PEDIDO ===")
    # Refresh from DB
    pedido.refresh_from_db()
    print(f"  total_cajas_solicitadas:       {pedido.total_cajas_solicitadas}")
    print(f"  total_cajas_enviadas:          {pedido.total_cajas_enviadas}")
    print(f"  total_piezas_solicitadas:      {pedido.total_piezas_solicitadas}")
    print(f"  total_piezas_enviadas:         {pedido.total_piezas_enviadas}")
    print(f"  valor_total_factura_usd:       {pedido.valor_total_factura_usd}")
    print(f"  valor_total_nota_credito_usd:  {pedido.valor_total_nota_credito_usd}")
    print(f"  valor_total_utilidad_usd:      {pedido.valor_total_utilidad_usd}")
    print(f"  valor_total_recuperacion_usd:  {pedido.valor_total_recuperacion_usd}")
    print(f"  total_peso_bruto_solicitado:   {pedido.total_peso_bruto_solicitado}")
    print(f"  total_peso_bruto_enviado:      {pedido.total_peso_bruto_enviado}")
    print(f"  variedades:                    {pedido.variedades}")
    print(f"  estado_factura:                {pedido.estado_factura}")
    print(f"  estado_utilidad:               {pedido.estado_utilidad}")
    print(f"  estado_pedido:                 {pedido.estado_pedido}")
    print(f"  diferencia_por_abono:          {pedido.diferencia_por_abono}")
    print()
    print("✅ Pedido #1514 recalculado exitosamente.")


if __name__ == '__main__':
    recalculate_pedido(PEDIDO_ID)
