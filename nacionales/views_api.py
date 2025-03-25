from django.db.models import Sum
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required, user_passes_test
from nacionales.models import BalanceProveedor

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
        balances_data.append({
            'proveedor_id': balance.proveedor.id,
            'proveedor_nombre': balance.proveedor.nombre,
            'saldo_disponible': float(balance.saldo_disponible),
            'ultima_actualizacion': balance.ultima_actualizacion.isoformat()
        })
    
    # Ordenar por saldo descendente
    balances_data = sorted(balances_data, key=lambda x: x['saldo_disponible'], reverse=True)
    
    return JsonResponse({
        'balances': balances_data,
        'total_saldo': float(total_saldo)
    })
