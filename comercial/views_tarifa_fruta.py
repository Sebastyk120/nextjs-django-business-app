import json
from decimal import Decimal

from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.urls import reverse_lazy
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import ListaPreciosFrutaExportador, Fruta, Exportador


def es_miembro_del_grupo(nombre_grupo):
    def es_miembro(user):
        return user.groups.filter(name=nombre_grupo).exists()

    return es_miembro

@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url=reverse_lazy('home'))
@ensure_csrf_cookie
def tarifa_frutas_view(request):
    """
    Vista principal que gestiona precios de fruta.
    Maneja GET (render y datos API) y POST/DELETE (acciones).
    """
    # Manejo de API GET via AJAX
    if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.GET.get('action'):
        action = request.GET.get('action')
        
        if action == 'list':
            precios = ListaPreciosFrutaExportador.objects.select_related('fruta', 'exportadora').all()
            data = []
            for p in precios:
                # Calcular variación si existe precio anterior
                variacion = 0
                trend = 'neutral'
                if p.precio_anterior and p.precio_kilo:
                    if p.precio_kilo > p.precio_anterior:
                        trend = 'up'
                        variacion = ((p.precio_kilo - p.precio_anterior) / p.precio_anterior) * 100
                    elif p.precio_kilo < p.precio_anterior:
                        trend = 'down'
                        variacion = ((p.precio_kilo - p.precio_anterior) / p.precio_anterior) * 100
                elif not p.precio_anterior:
                     trend = 'new'

                data.append({
                    'id': p.id,
                    'fruta_nombre': p.fruta.nombre,
                    'fruta_id': p.fruta.id,
                    'exportador_nombre': p.exportadora.nombre,
                    'exportador_id': p.exportadora.id,
                    'precio_kilo': float(p.precio_kilo) if p.precio_kilo else 0,
                    'precio_anterior': float(p.precio_anterior) if p.precio_anterior else None,
                    'fecha': p.fecha.strftime('%Y-%m-%d'),
                    'trend': trend,
                    'variacion_pct': round(float(variacion), 2)
                })
            return JsonResponse({'data': data})
            
        elif action == 'comparison':
            # Agrupar por Fruta para mostrar comparativa de precios entre exportadores
            frutas_con_precios = Fruta.objects.filter(listapreciosfrutaexportador__isnull=False).distinct()
            comparison_data = []
            
            for fruta in frutas_con_precios:
                # Obtener precios para esta fruta
                precios = ListaPreciosFrutaExportador.objects.filter(fruta=fruta).select_related('exportadora')
                rates = []
                for p in precios:
                    if p.precio_kilo:
                         rates.append({
                            'exportador': p.exportadora.nombre,
                            'precio': float(p.precio_kilo),
                            'trend': 'up' if p.precio_anterior and p.precio_kilo > p.precio_anterior else ('down' if p.precio_anterior and p.precio_kilo < p.precio_anterior else 'neutral')
                        })
                
                if rates:
                    comparison_data.append({
                        'fruta': fruta.nombre,
                        'rates': rates
                    })
            
            return JsonResponse({'data': comparison_data})

    # Renderizado inicial
    if request.method == 'GET':
        context = {
            'frutas': Fruta.objects.all().order_by('nombre'),
            'exportadores': Exportador.objects.all().order_by('nombre'),
        }
        return render(request, 'tarifa_frutas.html', context)

    # Manejo de POST (Crear/Editar) vía API Fetch manual
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            precio_id = data.get('id')
            fruta_id = data.get('fruta_id')
            exportador_id = data.get('exportador_id')
            precio_valor = data.get('precio')

            if not fruta_id or not exportador_id or precio_valor is None:
                return JsonResponse({'success': False, 'error': 'Faltan datos requeridos'})

            if precio_id:
                instance = get_object_or_404(ListaPreciosFrutaExportador, pk=precio_id)
                instance.precio_kilo = Decimal(str(precio_valor))
                instance.fruta_id = fruta_id
                instance.exportadora_id = exportador_id
                instance.save()
                msg = 'Precio actualizado correctamente'
            else:
                if ListaPreciosFrutaExportador.objects.filter(fruta_id=fruta_id, exportadora_id=exportador_id).exists():
                     return JsonResponse({'success': False, 'error': 'Ya existe precio para esta fruta y exportador.'})
                
                instance = ListaPreciosFrutaExportador.objects.create(
                    fruta_id=fruta_id,
                    exportadora_id=exportador_id,
                    precio_kilo=Decimal(str(precio_valor))
                )
                msg = 'Precio creado correctamente'

            return JsonResponse({'success': True, 'message': msg})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    # Manejo de DELETE
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            pk = data.get('id')
            instance = get_object_or_404(ListaPreciosFrutaExportador, pk=pk)
            instance.delete()
            return JsonResponse({'success': True, 'message': 'Precio eliminado'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)

# Endpoints API Legacy (si se requieren por urls antiguas, las redirigimos a la vista principal logicamente)
# Pero como estamos reescribiendo, podemos dejar de usar los endpoints api_* separados si el front usa la url principal.
# En tarifas_aereas usan la misma URL para todo.