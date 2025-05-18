from django.db.models import Sum
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required, user_passes_test
from nacionales.models import BalanceProveedor, CompraNacional, VentaNacional, ReporteCalidadProveedor, TransferenciasProveedor
from decimal import Decimal

def es_miembro_del_grupo(nombre_grupo):
    def es_miembro(user):
        return user.groups.filter(name=nombre_grupo).exists()
    return es_miembro

@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def api_balance_proveedores(request):
    """API para obtener datos de balance de proveedores para el dashboard"""
    proveedor_id = request.GET.get('proveedor')
    
    # Filtrar por proveedor si se especifica
    if proveedor_id and proveedor_id != 'todos':
        balances = BalanceProveedor.objects.filter(proveedor_id=proveedor_id)
    else:
        balances = BalanceProveedor.objects.all()
    
    # Calcular total de saldo
    total_saldo = balances.aggregate(total=Sum('saldo_disponible'))['total'] or 0
    
    # Preparar datos para JSON
    balances_data = []
    for balance in balances:
        proveedor = balance.proveedor
        
        # Obtener todas las compras del proveedor
        compras = CompraNacional.objects.filter(proveedor=proveedor)
        
        # Calcular total de compras
        total_compras = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras
        ).aggregate(total=Sum('p_total_pagar'))['total'] or Decimal('0')
        
        # Calcular total transferido
        total_transferido = TransferenciasProveedor.objects.filter(
            proveedor=proveedor
        ).aggregate(total=Sum('valor_transferencia'))['total'] or Decimal('0')
        
        # Calcular saldo pendiente
        saldo_pendiente = total_compras - total_transferido
        
        # Calcular utilidad total
        total_utilidad = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras
        ).aggregate(total=Sum('p_utilidad'))['total'] or Decimal('0')
        
        balances_data.append({
            'proveedor_id': proveedor.id,
            'proveedor_nombre': proveedor.nombre,
            'saldo_disponible': float(balance.saldo_disponible),
            'ultima_actualizacion': balance.ultima_actualizacion.isoformat(),
            'total_compras': float(total_compras),
            'total_transferido': float(total_transferido),
            'saldo_pendiente': float(saldo_pendiente),
            'total_utilidad': float(total_utilidad)
        })
    
    # Ordenar por saldo pendiente descendente
    balances_data = sorted(balances_data, key=lambda x: x['saldo_pendiente'], reverse=True)
    
    # Calcular totales generales
    totales = {
        'total_compras': sum(item['total_compras'] for item in balances_data),
        'total_transferido': sum(item['total_transferido'] for item in balances_data),
        'total_saldo_pendiente': sum(item['saldo_pendiente'] for item in balances_data),
        'total_utilidad': sum(item['total_utilidad'] for item in balances_data)
    }
    
    return JsonResponse({
        'balances': balances_data,
        'total_saldo': float(total_saldo),
        'totales': totales
    })
