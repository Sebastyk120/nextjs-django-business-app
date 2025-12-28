import json

from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django.views import View
from .models import TarifaAerea, Aerolinea, Iata


def es_miembro_del_grupo(nombre_grupo):
    def es_miembro(user):
        return user.groups.filter(name=nombre_grupo).exists()

    return es_miembro

    
@method_decorator(login_required, name='dispatch')
@method_decorator(user_passes_test(es_miembro_del_grupo('Heavens'), login_url=reverse_lazy('home')), name='dispatch')
class TarifaAereaView(View):
    template_name = 'tarifas_aereas.html'

    def get(self, request):
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            # Handle AJAX requests for data
            action = request.GET.get('action')
            
            if action == 'list':
                 tarifas = TarifaAerea.objects.all().select_related('aerolinea', 'destino')
                 data = []
                 for t in tarifas:
                     data.append({
                         'id': t.id,
                         'aerolinea': t.aerolinea.nombre,
                         'aerolinea_id': t.aerolinea.id,
                         'destino': t.destino.codigo,
                         'destino_ciudad': t.destino.ciudad,
                         'destino_id': t.destino.id,
                         'tarifa_por_kilo': float(t.tarifa_por_kilo),
                         'fecha': t.fecha.strftime('%Y-%m-%d'),
                         'es_activa': t.es_activa,
                     })
                 return JsonResponse({'data': data})
            
            elif action == 'comparison':
                # Group by destination
                destinos = Iata.objects.filter(tarifaaerea__isnull=False).distinct()
                comparison_data = []
                
                for destino in destinos:
                    tarifas = TarifaAerea.objects.filter(destino=destino, es_activa=True).select_related('aerolinea')
                    rates = []
                    for t in tarifas:
                        rates.append({
                            'aerolinea': t.aerolinea.nombre,
                            'tarifa': float(t.tarifa_por_kilo)
                        })
                    
                    if rates:
                        comparison_data.append({
                            'destino': f"{destino.codigo} - {destino.ciudad}",
                            'rates': rates
                        })
                
                return JsonResponse({'data': comparison_data})

        # Initial page load context
        context = {
            'aerolineas': Aerolinea.objects.all(),
            'destinos': Iata.objects.all(),
        }
        return render(request, self.template_name, context)

    def post(self, request):
        # Create or Update
        try:
            data = json.loads(request.body)
            tarifa_id = data.get('id')
            
            aerolinea_id = data.get('aerolinea')
            destino_id = data.get('destino')
            tarifa_valor = data.get('tarifa_por_kilo')
            es_activa = data.get('es_activa', True)

            if not all([aerolinea_id, destino_id, tarifa_valor]):
                 return JsonResponse({'success': False, 'error': 'Faltan campos obligatorios'})

            if tarifa_id:
                tarifa = get_object_or_404(TarifaAerea, id=tarifa_id)
                tarifa.aerolinea_id = aerolinea_id
                tarifa.destino_id = destino_id
                tarifa.tarifa_por_kilo = tarifa_valor
                tarifa.es_activa = es_activa
                tarifa.save()
                message = 'Tarifa actualizada correctamente'
            else:
                tarifa = TarifaAerea.objects.create(
                    aerolinea_id=aerolinea_id,
                    destino_id=destino_id,
                    tarifa_por_kilo=tarifa_valor,
                    es_activa=es_activa
                )
                message = 'Tarifa creada correctamente'
            
            return JsonResponse({'success': True, 'message': message})
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    def delete(self, request):
        try:
            data = json.loads(request.body)
            tarifa_id = data.get('id')
            if tarifa_id:
                tarifa = get_object_or_404(TarifaAerea, id=tarifa_id)
                tarifa.delete()
                return JsonResponse({'success': True, 'message': 'Tarifa eliminada'})
            return JsonResponse({'success': False, 'error': 'ID no proporcionado'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
