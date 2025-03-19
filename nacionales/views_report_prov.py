from django.contrib.auth.decorators import login_required, user_passes_test
from django.db.models import Sum
from django.shortcuts import render, get_object_or_404
from django.utils import timezone

from nacionales.models import CompraNacional, VentaNacional, ReporteCalidadExportador, ReporteCalidadProveedor, \
    ProveedorNacional, TransferenciasProveedor, BalanceProveedor


def es_miembro_del_grupo(nombre_grupo):
    def es_miembro(user):
        return user.groups.filter(name=nombre_grupo).exists()

    return es_miembro

# Vistas para el estado de cuenta de proveedores: #
@login_required
@user_passes_test(user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home'))
def reporte_cuenta_proveedor(request, proveedor_id):
    # Obtener el proveedor
    proveedor = get_object_or_404(ProveedorNacional, id=proveedor_id)
    fecha_actual = timezone.now().date()

    # Reportes pagados
    compras_completas = ReporteCalidadProveedor.objects.filter(
        rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
        reporte_pago=True
    ).select_related(
        'rep_cal_exp',
        'rep_cal_exp__venta_nacional',
        'rep_cal_exp__venta_nacional__compra_nacional',
        'rep_cal_exp__venta_nacional__compra_nacional__fruta'
    ).order_by('-rep_cal_exp__venta_nacional__compra_nacional__fecha_compra')

    # Reportes pendientes de pago
    reportes_pendientes = ReporteCalidadProveedor.objects.filter(
        rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
        reporte_pago=False,
        reporte_enviado=True
    ).select_related(
        'rep_cal_exp',
        'rep_cal_exp__venta_nacional',
        'rep_cal_exp__venta_nacional__compra_nacional',
        'rep_cal_exp__venta_nacional__compra_nacional__fruta'
    ).order_by('-p_fecha_reporte')
    
    # Total de reportes pendientes
    total_pendientes = reportes_pendientes.aggregate(total=Sum('p_total_pagar'))['total'] or 0
    
    # Reportes sin factura
    reportes_sin_factura = ReporteCalidadProveedor.objects.filter(
        rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
        factura_prov__isnull=True
    ).select_related(
        'rep_cal_exp',
        'rep_cal_exp__venta_nacional',
        'rep_cal_exp__venta_nacional__compra_nacional'
    ).order_by('-p_fecha_reporte')
    
    # Total de reportes sin factura
    total_sin_factura = reportes_sin_factura.aggregate(total=Sum('p_total_facturar'))['total'] or 0

    # Obtener el saldo disponible del proveedor
    balance_proveedor, created = BalanceProveedor.objects.get_or_create(proveedor=proveedor)
    saldo_disponible = balance_proveedor.saldo_disponible

    # Obtener todas las compras del proveedor
    todas_compras = CompraNacional.objects.filter(
        proveedor=proveedor
    ).select_related('fruta', 'tipo_empaque')

    compras_completas_ids = set(
        ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
            reporte_enviado=True
        ).values_list('rep_cal_exp__venta_nacional__compra_nacional_id', flat=True).order_by('p_fecha_reporte')
    )

    # Preparar datos para compras en proceso
    compras_proceso = []
    for compra in todas_compras:
        # Excluir compras ya completadas
        if compra.id in compras_completas_ids:
            continue

        # Datos básicos de la compra
        datos_compra = {
            'numero_guia': compra.numero_guia,
            'fecha_compra': compra.fecha_compra,
            'peso_recibido': None,
            'fecha_reporte': None,
            'estado': 'Registrado',
        }

        # Verificar si tiene venta relacionada
        try:
            venta = VentaNacional.objects.get(compra_nacional=compra)
            datos_compra['peso_recibido'] = venta.peso_neto_recibido
            datos_compra['estado'] = venta.estado_venta

            # Verificar si tiene reporte de exportador
            try:
                reporte_exp = ReporteCalidadExportador.objects.get(venta_nacional=venta)
                datos_compra['estado'] = reporte_exp.estado_reporte_exp

                # Verificar si tiene reporte de proveedor
                try:
                    reporte_prov = ReporteCalidadProveedor.objects.get(rep_cal_exp=reporte_exp)
                    datos_compra['fecha_reporte'] = reporte_prov.p_fecha_reporte
                    datos_compra['estado'] = reporte_prov.estado_reporte_prov
                except ReporteCalidadProveedor.DoesNotExist:
                    datos_compra['estado'] = 'Pendiente Enviar A Proveedor'
            except ReporteCalidadExportador.DoesNotExist:
                datos_compra['estado'] = 'Sin Reporte Calidad'
        except VentaNacional.DoesNotExist:
            datos_compra['estado'] = 'Sin Ingreso'

        compras_proceso.append(datos_compra)

    # Obtener transferencias realizadas al proveedor
    transferencias = TransferenciasProveedor.objects.filter(
        proveedor=proveedor
    ).order_by('-fecha_transferencia')

    # Calcular el saldo total
    total_por_pagar = total_pendientes

    total_pagado = TransferenciasProveedor.objects.filter(
        proveedor=proveedor
    ).aggregate(total=Sum('valor_transferencia'))['total'] or 0

    saldo_actual = saldo_disponible
    valor_consignar = total_por_pagar - saldo_actual

    # Calcular la utilidad total para mostrar en tarjeta adicional
    total_utilidad = ReporteCalidadProveedor.objects.filter(
        rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
        reporte_enviado=True
    ).aggregate(total=Sum('p_utilidad'))['total'] or 0

    context = {
        'proveedor': proveedor,
        'fecha_actual': fecha_actual,
        'compras_completas': compras_completas,
        'compras_proceso': compras_proceso,
        'transferencias': transferencias,
        'saldo_actual': saldo_actual,
        'total_por_pagar': total_por_pagar,
        'total_pagado': total_pagado,
        'total_utilidad': total_utilidad,
        'reportes_pendientes': reportes_pendientes,
        'total_pendientes': total_pendientes,
        'reportes_sin_factura': reportes_sin_factura,
        'total_sin_factura': total_sin_factura,
        'saldo_disponible': saldo_disponible,
        'valor_consignar': valor_consignar,
    }

    return render(request, 'reporte_estado_cuenta_proveedor.html', context)