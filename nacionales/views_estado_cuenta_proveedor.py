import datetime
from decimal import Decimal
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db.models import Sum, Avg
from django.shortcuts import render, get_object_or_404

from .models import CompraNacional, VentaNacional, ReporteCalidadProveedor, \
    TransferenciasProveedor, ProveedorNacional


def es_miembro_del_grupo(nombre_grupo):
    def es_miembro(user):
        return user.groups.filter(name=nombre_grupo).exists()

    return es_miembro

@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def estado_cuenta_proveedor(request, proveedor_id):
    # Obtener proveedor
    proveedor = get_object_or_404(ProveedorNacional, id=proveedor_id)

    # Filtros desde request
    fecha_inicio = request.GET.get('fecha_inicio')
    fecha_fin = request.GET.get('fecha_fin')
    fruta_id = request.GET.get('fruta')

    # Verificar si es la primera carga (sin filtros)
    es_primera_carga = not fecha_inicio and not fecha_fin

    # Establecer fechas por defecto solo si no es primera carga
    if not es_primera_carga:
        fecha_fin = fecha_fin or datetime.date.today()
        if isinstance(fecha_fin, str):
            fecha_fin = datetime.datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        fecha_inicio = fecha_inicio or (fecha_fin - datetime.timedelta(days=30))
        if isinstance(fecha_inicio, str):
            fecha_inicio = datetime.datetime.strptime(fecha_inicio, '%Y-%m-%d').date()

    # Filtrar compras del proveedor
    compras = CompraNacional.objects.filter(proveedor=proveedor)
    
    if not es_primera_carga:
        if fecha_inicio:
            compras = compras.filter(fecha_compra__gte=fecha_inicio)
        if fecha_fin:
            compras = compras.filter(fecha_compra__lte=fecha_fin)
    if fruta_id:
        compras = compras.filter(fruta_id=fruta_id)

    # Calcular totales
    total_compras_valor = ReporteCalidadProveedor.objects.filter(
        rep_cal_exp__venta_nacional__compra_nacional__in=compras
    ).aggregate(total=Sum('p_total_pagar'))['total'] or Decimal('0')

    total_kilos = VentaNacional.objects.filter(
        compra_nacional__in=compras
    ).aggregate(
        total=Sum('peso_neto_recibido')
    )['total'] or Decimal('0')

    # Filtrar transferencias solo si no es primera carga
    transferencias_query = TransferenciasProveedor.objects.filter(proveedor=proveedor)
    if not es_primera_carga:
        transferencias_query = transferencias_query.filter(
            fecha_transferencia__gte=fecha_inicio,
            fecha_transferencia__lte=fecha_fin
        )

    total_transferido = transferencias_query.aggregate(total=Sum('valor_transferencia'))['total'] or Decimal('0')

    saldo_pendiente = total_compras_valor - total_transferido

    total_utilidad = ReporteCalidadProveedor.objects.filter(
        rep_cal_exp__venta_nacional__compra_nacional__in=compras
    ).aggregate(total=Sum('p_utilidad'))['total'] or Decimal('0')

    # Datos para gráficos - precio de exportación por cada compra individual, ordenado por fecha
    compras_por_fecha = list(compras.values(
        'fecha_compra',
        'precio_compra_exp'
    ).order_by('fecha_compra'))
    
    # Filtrar las compras con precios válidos
    compras_por_fecha = [
        compra for compra in compras_por_fecha 
        if compra['precio_compra_exp'] is not None and compra['precio_compra_exp'] > 0
    ]

    # Asegurarse de que los datos son serializables y las fechas están en el formato correcto
    for compra in compras_por_fecha:
        # Convertir la fecha a string en formato YYYY-MM-DD
        if isinstance(compra['fecha_compra'], datetime.date):
            compra['fecha_compra'] = compra['fecha_compra'].strftime('%Y-%m-%d')
        # Asegurarse de que el precio es un número
        compra['precio_compra_exp'] = float(compra['precio_compra_exp'])

    # Contexto para el template
    context = {
        'proveedor': proveedor,
        'compras': compras,
        'transferencias': transferencias_query,
        'total_compras_valor': total_compras_valor,
        'total_kilos': total_kilos,
        'total_transferido': total_transferido,
        'saldo_pendiente': saldo_pendiente,
        'total_utilidad': total_utilidad,
        'fecha_inicio': fecha_inicio,
        'fecha_fin': fecha_fin,
        'fruta_id': fruta_id,
        'compras_por_fecha': compras_por_fecha,  # Para gráficos
        'proveedores': ProveedorNacional.objects.all(),  # Para dropdown
        'es_primera_carga': es_primera_carga,  # Nuevo flag para el template
    }

    return render(request, 'estado_cuenta_proveedor.html', context)