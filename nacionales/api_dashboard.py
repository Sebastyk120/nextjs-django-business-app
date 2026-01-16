from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, F, Case, When, Value, DecimalField, Avg
from django.db.models.functions import TruncWeek, Coalesce
from .models import VentaNacional, ProveedorNacional, Fruta
from comercial.models import Exportador
from decimal import Decimal
from datetime import datetime

class DashboardCalidadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Base Query
        query = VentaNacional.objects.filter(
            reportecalidadexportador__isnull=False
        ).select_related(
            'compra_nacional__proveedor',
            'compra_nacional__fruta',
            'exportador',
            'reportecalidadexportador',
            'reportecalidadexportador__reportecalidadproveedor'
        )

        # 2. Filters
        proveedor_id = request.query_params.get('proveedor')
        exportador_id = request.query_params.get('exportador')
        fruta_id = request.query_params.get('fruta')
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')

        if proveedor_id and proveedor_id != 'all':
            query = query.filter(compra_nacional__proveedor_id=proveedor_id)
        if exportador_id and exportador_id != 'all':
            query = query.filter(exportador_id=exportador_id)
        if fruta_id and fruta_id != 'all':
            query = query.filter(compra_nacional__fruta_id=fruta_id)
        if fecha_inicio:
            query = query.filter(fecha_llegada__gte=fecha_inicio)
        if fecha_fin:
            query = query.filter(fecha_llegada__lte=fecha_fin)

        # 3. Weekly Aggregations (Charts)
        
        # A. Calidad (% Exp) & Merma (% Merma) - Weighted Averages per Week
        semanal_qs = query.annotate(
            semana=TruncWeek('fecha_llegada')
        ).values('semana').annotate(
            total_kg_exp=Coalesce(Sum('reportecalidadexportador__kg_exportacion'), Value(0, output_field=DecimalField())),
            total_kg_merma=Coalesce(Sum('reportecalidadexportador__kg_merma'), Value(0, output_field=DecimalField())),
            total_kg_recibidos=Coalesce(Sum('peso_neto_recibido'), Value(0, output_field=DecimalField())),
            
            # Weighted Sums for Averages
            sum_prod_calidad=Coalesce(Sum(
                F('reportecalidadexportador__porcentaje_exportacion') * F('reportecalidadexportador__kg_exportacion'),
                output_field=DecimalField()
            ), Value(0, output_field=DecimalField())),
            sum_prod_merma=Coalesce(Sum(
                F('reportecalidadexportador__porcentaje_merma') * F('reportecalidadexportador__kg_merma'),
                output_field=DecimalField()
            ), Value(0, output_field=DecimalField())),
            
            # Pricing (Weighted by Kg Exported)
            sum_prod_precio=Coalesce(Sum(
                F('reportecalidadexportador__reportecalidadproveedor__p_precio_kg_exp') * F('reportecalidadexportador__kg_exportacion'),
                output_field=DecimalField()
            ), Value(0, output_field=DecimalField()))
        ).order_by('semana')

        chart_data = []
        for item in semanal_qs:
            semana_str = item['semana'].strftime('%Y-%m-%d') if item['semana'] else "N/A"
            kg_exp = item['total_kg_exp'] or Decimal(0)
            kg_merma = item['total_kg_merma'] or Decimal(0)
            
            # Weighted Avgs
            avg_calidad = (item['sum_prod_calidad'] / kg_exp) if kg_exp > 0 else 0
            avg_merma = (item['sum_prod_merma'] / kg_merma) if kg_merma > 0 else 0
            
            # Price Logic (same as legacy)
            avg_precio = (item['sum_prod_precio'] / kg_exp) if kg_exp > 0 else 0

            chart_data.append({
                'semana': semana_str,
                'calidad_promedio': round(float(avg_calidad), 2),
                'merma_promedio': round(float(avg_merma), 2),
                'precio_promedio': round(float(avg_precio), 2),
                'kg_exportacion': float(kg_exp),
                'kg_merma': float(kg_merma),
            })

        # 4. KPIs (Overall)
        totals = query.aggregate(
            total_kg_recibidos=Coalesce(Sum('peso_neto_recibido'), Value(0, output_field=DecimalField())),
            total_kg_exportacion=Coalesce(Sum('reportecalidadexportador__kg_exportacion'), Value(0, output_field=DecimalField())),
            total_kg_merma=Coalesce(Sum('reportecalidadexportador__kg_merma'), Value(0, output_field=DecimalField())),
            
            # Weighted Global Averages
            global_sum_calidad=Coalesce(Sum(
                F('reportecalidadexportador__porcentaje_exportacion') * F('reportecalidadexportador__kg_exportacion'),
                output_field=DecimalField()
            ), Value(0, output_field=DecimalField())),
             global_sum_precio=Coalesce(Sum(
                F('reportecalidadexportador__reportecalidadproveedor__p_precio_kg_exp') * F('reportecalidadexportador__kg_exportacion'),
                output_field=DecimalField()
            ), Value(0, output_field=DecimalField())),
            global_sum_merma=Coalesce(Sum(
                F('reportecalidadexportador__porcentaje_merma') * F('reportecalidadexportador__kg_merma'),
                output_field=DecimalField()
            ), Value(0, output_field=DecimalField()))
        )
        
        t_kg_exp = totals['total_kg_exportacion'] or Decimal(0)
        t_kg_merma = totals['total_kg_merma'] or Decimal(0)
        t_kg_recibidos = totals['total_kg_recibidos'] or Decimal(0)
        
        kpis = {
            'total_kg_recibidos': float(t_kg_recibidos),
            'total_kg_exportacion': float(t_kg_exp),
            'promedio_calidad': round(float(totals['global_sum_calidad'] / t_kg_exp), 2) if t_kg_exp > 0 else 0,
            'promedio_precio': round(float(totals['global_sum_precio'] / t_kg_exp), 2) if t_kg_exp > 0 else 0,
            'porcentaje_merma_global': round(float(t_kg_merma / t_kg_recibidos) * 100, 2) if t_kg_recibidos > 0 else 0
        }

        return Response({
            'chart_data': chart_data,
            'kpis': kpis,
        })

class DashboardOptionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        proveedores = ProveedorNacional.objects.all().order_by('nombre').values('id', 'nombre')
        exportadores = Exportador.objects.all().order_by('nombre').values('id', 'nombre')
        frutas = Fruta.objects.all().order_by('nombre').values('id', 'nombre')
        
        return Response({
            'proveedores': list(proveedores),
            'exportadores': list(exportadores),
            'frutas': list(frutas)
        })
