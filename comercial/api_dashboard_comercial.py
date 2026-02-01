from django.http import JsonResponse
from django.contrib.auth.decorators import login_required, user_passes_test
from .views4_dash_comer import get_dashboard_comercial_data, es_miembro_del_grupo
from .models import Cliente, Intermediario, Fruta, Exportador

@login_required
@user_passes_test(lambda u: any(es_miembro_del_grupo(g)(u) for g in ['Heavens', 'Etnico', 'Fieldex', 'Juan_Matas', 'CI_Dorado']), login_url='home')
def dashboard_comercial_api(request):
    try:
        # Get context data using existing logic
        context = get_dashboard_comercial_data(request)
        
        # Helper to convert QuerySet to list
        def qs_to_list(qs):
            return list(qs.values('id', 'nombre'))

        # Helper to handle potential Decimal/None values safely
        def safe_float(val):
            if val is None:
                return 0.0
            return float(val)

        # Build response data
        data = {
            # Filter options
            'clientes': qs_to_list(context['clientes']),
            'intermediarios': qs_to_list(context['intermediarios']),
            'frutas': qs_to_list(context['frutas']),
            'exportadores': qs_to_list(context['exportadores']),
            
            # Current filters
            'filters': {
                'fecha_inicio': context['fecha_inicio'],
                'fecha_fin': context['fecha_fin'],
                'fecha_inicio_anterior': context['fecha_inicio_anterior'],
                'fecha_fin_anterior': context['fecha_fin_anterior'],
                'cliente_id': context['cliente_id'],
                'intermediario_id': context['intermediario_id'],
                'fruta_id': context['fruta_id'],
                'exportador_id': context['exportador_id'],
            },
            
            # Metrics
            'metrics': {
                'kilos': {
                    'current': safe_float(context['global_total_kilos']), 
                    'prev': safe_float(context['kilos_prev']), 
                    'percent': context['kilos_percent']
                },
                'cajas': {
                    'current': safe_float(context['global_total_cajas']), 
                    'prev': safe_float(context['cajas_prev']), 
                    'percent': context['cajas_percent']
                },
                'facturado': {
                    'current': safe_float(context['global_total_facturado']), 
                    'prev': safe_float(context['facturado_prev']), 
                    'percent': context['facturado_percent']
                },
                'utilidad': {
                    'current': safe_float(context['global_total_utilidades_usd']), 
                    'prev': safe_float(context['utilidad_usd_prev']), 
                    'percent': context['utilidad_usd_percent']
                },
                'recuperacion': {
                    'current': safe_float(context['global_total_recuperacion']), 
                    'prev': safe_float(context['recuperacion_prev']), 
                    'percent': context['recuperacion_percent']
                },
                'notas_credito': {
                    'current': safe_float(context['global_total_notas_credito']), 
                    'prev': safe_float(context['notas_credito_prev']), 
                    'percent': context['notas_credito_percent']
                },
                'cancelados': {
                    'current': context['global_total_cancelados'], 
                    'prev': context['cancelados_prev'], 
                    'percent': context['cancelados_percent']
                },
                'profit_margin': {
                    'current': safe_float(context.get('profit_margin_current', 0)),
                    'prev': safe_float(context.get('profit_margin_prev', 0)),
                    'percent': context.get('profit_margin_percent_change', 0)
                },
                'nc_ratio': {
                    'current': safe_float(context.get('nc_ratio_current', 0)),
                    'prev': safe_float(context.get('nc_ratio_prev', 0)),
                    'percent': context.get('nc_ratio_percent_change', 0)
                },
                'portfolio_days': {
                    'current': safe_float(context.get('avg_portfolio_days', 0)),
                    'prev': 0, # Not calculating previous for this one yet as it is a status metric
                    'percent': 0
                },
            },
            
            # Charts Data
            'charts': {
                'utilidad_cliente': context['utilidad_por_cliente'],
                'utilidad_cliente_prev': context['utilidad_por_cliente_anterior'],
                
                'utilidad_fruta': context['utilidad_por_fruta'],
                'utilidad_fruta_prev': context['utilidad_por_fruta_anterior'],
                
                'utilidad_exportador': context['utilidad_por_exportador'],
                'utilidad_exportador_prev': context['utilidad_por_exportador_anterior'],
                
                'kilos_fruta': context['kilos_por_fruta'],
                
                'mensual': context['datos_mensuales'],
                'mensual_prev': context['datos_mensuales_anterior'],
            },
            
            # Table Data
            'clients_data': context['clientes_data']
        }
        
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
