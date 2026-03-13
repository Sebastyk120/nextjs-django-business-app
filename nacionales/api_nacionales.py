import datetime
from rest_framework import viewsets, filters, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Sum
from .models import (
    CompraNacional, VentaNacional, ReporteCalidadExportador, 
    ReporteCalidadProveedor, ProveedorNacional, Empaque, TransferenciasProveedor
)
from .serializers import (
    CompraNacionalSerializer, VentaNacionalSerializer, 
    ReporteCalidadExportadorSerializer, ReporteCalidadProveedorSerializer,
    ProveedorNacionalSerializer, EmpaqueSerializer, TransferenciasProveedorSerializer,
    ResumenReporteProveedorSerializer
)
from .services import DashboardNacionalesService
from comercial.models import Fruta, Exportador
from comercial.serializers import FrutaSerializer, ExportadorSerializer

class IsHeavensGroup(permissions.BasePermission):
    """
    Custom permission to only allow members of the 'Heavens' group.
    """
    def has_permission(self, request, view):
        # Allow Superusers too for debugging
        if request.user.is_superuser:
            return True
        return request.user.groups.filter(name='Heavens').exists()

class CompraPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class CompraNacionalViewSet(viewsets.ModelViewSet):
    serializer_class = CompraNacionalSerializer
    permission_classes = [permissions.IsAuthenticated, IsHeavensGroup]
    pagination_class = CompraPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['numero_guia', 'proveedor__nombre', 'remision']

    def get_queryset(self):
        queryset = CompraNacional.objects.all().select_related(
            'proveedor', 'fruta', 'tipo_empaque'
        ).prefetch_related(
            'ventas', 
            'ventas__reportecalidadexportador', 
            'ventas__reportecalidadexportador__reportecalidadproveedor'
        ).order_by('-fecha_compra', '-id')

        # Filter by 'completed' status
        completed = self.request.query_params.get('completed')
        if completed == 'true':
            queryset = queryset.filter(
                ventas__reportecalidadexportador__reportecalidadproveedor__completado=True
            ).distinct()
        
        return queryset


    @action(detail=False, methods=['get'])
    def incompletas(self, request):
        queryset = self.get_queryset()
        incompletas = []
        
        # Logic adapted from nacionales_list_detallada view
        for compra in queryset:
            ventas = compra.ventas.all()
            if not ventas.exists():
                incompletas.append(compra)
                continue
                
            compra_completa = True
            for venta in ventas:
                tiene_reporte_exp = hasattr(venta, 'reportecalidadexportador')
                tiene_reporte_prov = False
                reporte_prov_completado = False
                
                if tiene_reporte_exp:
                    reporte_exp = venta.reportecalidadexportador
                    tiene_reporte_prov = hasattr(reporte_exp, 'reportecalidadproveedor')
                    if tiene_reporte_prov:
                        reporte_prov = reporte_exp.reportecalidadproveedor
                        reporte_prov_completado = reporte_prov.completado
                
                # If any sale in the chain is incomplete, the purchase is incomplete
                if not (tiene_reporte_exp and tiene_reporte_prov and reporte_prov_completado):
                    compra_completa = False
                    break
            
            if not compra_completa:
                incompletas.append(compra)
        
        # Use standard pagination if available
        page = self.paginate_queryset(incompletas)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(incompletas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search_guia(self, request):
        guia = request.query_params.get('guia', '').strip()
        if not guia:
            return Response({'error': 'Parameter guia is required'}, status=400)
        
        compra = CompraNacional.objects.filter(numero_guia__iexact=guia).first()
        if compra:
             serializer = self.get_serializer(compra)
             return Response(serializer.data)
        return Response({'message': 'Not found', 'id': None}, status=200)
    
    @action(detail=False, methods=['get'])
    def autocomplete_guia(self, request):
        query = request.query_params.get('search', '')
        if not query:
             return Response([])
        
        guia_list = CompraNacional.objects.filter(numero_guia__icontains=query).values_list('numero_guia', flat=True)[:10]
        return Response(guia_list)


class VentaNacionalViewSet(viewsets.ModelViewSet):
    queryset = VentaNacional.objects.all().select_related('exportador')
    serializer_class = VentaNacionalSerializer
    permission_classes = [permissions.IsAuthenticated, IsHeavensGroup]


class ReporteCalidadExportadorViewSet(viewsets.ModelViewSet):
    queryset = ReporteCalidadExportador.objects.all()
    serializer_class = ReporteCalidadExportadorSerializer
    permission_classes = [permissions.IsAuthenticated, IsHeavensGroup]


class ReporteCalidadProveedorViewSet(viewsets.ModelViewSet):
    queryset = ReporteCalidadProveedor.objects.all()
    serializer_class = ReporteCalidadProveedorSerializer
    permission_classes = [permissions.IsAuthenticated, IsHeavensGroup]


class ProveedorNacionalViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProveedorNacional.objects.all().order_by('nombre')
    serializer_class = ProveedorNacionalSerializer
    permission_classes = [permissions.IsAuthenticated, IsHeavensGroup]

    @action(detail=True, methods=['get'])
    def resumen_reportes(self, request, pk=None):
        """
        Retrieve provider summary with reports, purchases, and transfers.
        Endpoint: /api/nacionales/proveedores/{id}/resumen_reportes/
        """
        proveedor = self.get_object()
        
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
        ).order_by('-rep_cal_exp__venta_nacional__compra_nacional__fecha_compra', '-rep_cal_exp__venta_nacional__compra_nacional__pk')
        
        # Total de reportes pendientes
        total_pendientes = reportes_pendientes.aggregate(total=Sum('p_total_pagar'))['total'] or 0
        
        # Reportes pagados
        reportes_pagados = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
            reporte_pago=True
        ).select_related(
            'rep_cal_exp',
            'rep_cal_exp__venta_nacional',
            'rep_cal_exp__venta_nacional__compra_nacional',
            'rep_cal_exp__venta_nacional__compra_nacional__fruta'
        ).order_by('-rep_cal_exp__venta_nacional__compra_nacional__fecha_compra', '-pk')
        
        # Calcular el monto pendiente total (considerando anticipos)
        monto_pendiente_total = reportes_pendientes.aggregate(total=Sum('monto_pendiente'))['total'] or 0
        
        # Reportes sin factura
        reportes_sin_factura = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
            factura_prov__isnull=True
        ).select_related(
            'rep_cal_exp',
            'rep_cal_exp__venta_nacional',
            'rep_cal_exp__venta_nacional__compra_nacional'
        ).order_by('-rep_cal_exp__venta_nacional__compra_nacional__fecha_compra', '-rep_cal_exp__venta_nacional__compra_nacional__pk')
        
        # Total de reportes sin factura
        total_sin_factura = reportes_sin_factura.aggregate(total=Sum('p_total_facturar'))['total'] or 0
        
        # Obtener el saldo disponible del proveedor
        from nacionales.models import BalanceProveedor
        balance_proveedor, created = BalanceProveedor.objects.get_or_create(proveedor=proveedor)
        saldo_disponible = balance_proveedor.saldo_disponible
        
        # Obtener todas las compras del proveedor
        todas_compras = CompraNacional.objects.filter(
            proveedor=proveedor
        ).select_related('fruta', 'tipo_empaque').order_by('-fecha_compra', '-pk')
        
        compras_completas_ids = set(
            ReporteCalidadProveedor.objects.filter(
                rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
                reporte_enviado=True
            ).values_list('rep_cal_exp__venta_nacional__compra_nacional_id', flat=True)
        )
        
        # Preparar datos para compras en proceso
        compras_proceso = []
        for compra in todas_compras:
            # Check if all ventas are complete
            ventas = VentaNacional.objects.filter(compra_nacional=compra)
            if not ventas.exists():
                 compras_proceso.append({
                    'numero_guia': compra.numero_guia,
                    'fecha_compra': compra.fecha_compra,
                    'peso_recibido': None,
                    'fecha_reporte': None,
                    'estado': 'Sin Ingreso'
                })
                 continue

            for venta in ventas:
                # Excluir ventas ya completadas (si se desea filtrar por venta individual)
                # O si la compra entera está en compras_completos_ids (que parece ser ids de reportes completos)
                # La lógica original usaba compra.id in compras_completas_ids
                # Vamos a listar cada venta como un item separado si es necesario o agrupar
                
                # Para simplificar, listamos cada venta
                datos_venta = {
                    'numero_guia': f"{compra.numero_guia} ({venta.tipo or 'N/A'})",
                    'fecha_compra': compra.fecha_compra,
                    'peso_recibido': venta.peso_neto_recibido,
                    'fecha_reporte': None,
                    'estado': venta.estado_venta,
                }
                
                try:
                    reporte_exp = ReporteCalidadExportador.objects.get(venta_nacional=venta)
                    datos_venta['estado'] = reporte_exp.estado_reporte_exp
                    
                    try:
                        reporte_prov = ReporteCalidadProveedor.objects.get(rep_cal_exp=reporte_exp)
                        if reporte_prov.reporte_enviado:
                             # Already in reports lists?
                             pass
                        datos_venta['fecha_reporte'] = reporte_prov.p_fecha_reporte
                        datos_venta['estado'] = reporte_prov.estado_reporte_prov
                        
                        # Si ya fue enviado, probablemente no debería estar en "en proceso" si se considera completado
                        # Pero la lógica original filtraba compras enteras.
                        # Aquí, si el reporte fue enviado, ya aparecería arriba en pendientes o pagados o sin factura.
                        if reporte_prov.reporte_enviado:
                            continue
                            
                    except ReporteCalidadProveedor.DoesNotExist:
                        datos_venta['estado'] = 'Pendiente Enviar A Proveedor'
                except ReporteCalidadExportador.DoesNotExist:
                    datos_venta['estado'] = 'Sin Reporte Calidad'
                
                compras_proceso.append(datos_venta)
        
        # Ordenar compras_proceso por fecha_compra de más reciente a más antigua
        compras_proceso = sorted(compras_proceso, key=lambda x: x['fecha_compra'], reverse=True)
        
        # Obtener transferencias realizadas al proveedor
        transferencias = TransferenciasProveedor.objects.filter(
            proveedor=proveedor
        ).order_by('-fecha_transferencia', '-pk')
        
        # Calcular totales
        total_por_pagar = total_pendientes
        
        total_pagado = TransferenciasProveedor.objects.filter(
            proveedor=proveedor
        ).aggregate(total=Sum('valor_transferencia'))['total'] or 0
        
        saldo_actual = saldo_disponible
        valor_consignar = monto_pendiente_total - saldo_actual
        
        # Calcular la utilidad total
        total_utilidad = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
            reporte_enviado=True
        ).aggregate(total=Sum('p_utilidad'))['total'] or 0
        
        # Serializar datos
        from .serializers import TransferenciasProveedorSerializer
        
        # Helper function to aggregate reports by compra_nacional
        def aggregate_by_compra(reportes_queryset):
            """Agrupa reportes por compra_nacional y suma los valores"""
            from decimal import Decimal
            from collections import defaultdict
            
            compras_dict = defaultdict(lambda: {
                'compra_guia': None,
                'compra_fecha': None,
                'compra_id': None,
                'p_kg_totales': Decimal('0'),
                'p_kg_exportacion': Decimal('0'),
                'p_kg_nacional': Decimal('0'),
                'p_total_pagar': Decimal('0'),
                'p_total_facturar': Decimal('0'),
                'monto_pendiente': Decimal('0'),
                'p_fecha_reporte': None,  # Use the latest
                'count': 0
            })
            
            for reporte in reportes_queryset:
                compra = reporte.rep_cal_exp.venta_nacional.compra_nacional
                compra_id = compra.id
                entry = compras_dict[compra_id]
                
                entry['compra_guia'] = compra.numero_guia
                entry['compra_fecha'] = compra.fecha_compra
                entry['compra_id'] = compra_id
                entry['p_kg_totales'] += reporte.p_kg_totales or Decimal('0')
                entry['p_kg_exportacion'] += reporte.p_kg_exportacion or Decimal('0')
                entry['p_kg_nacional'] += reporte.p_kg_nacional or Decimal('0')
                entry['p_total_pagar'] += reporte.p_total_pagar or Decimal('0')
                entry['p_total_facturar'] += reporte.p_total_facturar or Decimal('0')
                entry['monto_pendiente'] += reporte.monto_pendiente or Decimal('0')
                entry['count'] += 1
                
                # Keep the latest date
                if entry['p_fecha_reporte'] is None or (reporte.p_fecha_reporte and reporte.p_fecha_reporte > entry['p_fecha_reporte']):
                    entry['p_fecha_reporte'] = reporte.p_fecha_reporte
            
            # Calculate weighted percentages
            result = []
            for compra_id, data in compras_dict.items():
                if data['p_kg_totales'] > 0:
                    data['p_porcentaje_exportacion'] = (data['p_kg_exportacion'] / data['p_kg_totales'] * 100).quantize(Decimal('0.1'))
                    data['p_porcentaje_nacional'] = (data['p_kg_nacional'] / data['p_kg_totales'] * 100).quantize(Decimal('0.1'))
                else:
                    data['p_porcentaje_exportacion'] = Decimal('0')
                    data['p_porcentaje_nacional'] = Decimal('0')
                
                # Convert decimals to floats for JSON serialization
                data['p_kg_totales'] = float(data['p_kg_totales'])
                data['p_kg_exportacion'] = float(data['p_kg_exportacion'])
                data['p_kg_nacional'] = float(data['p_kg_nacional'])
                data['p_total_pagar'] = float(data['p_total_pagar'])
                data['p_total_facturar'] = float(data['p_total_facturar'])
                data['monto_pendiente'] = float(data['monto_pendiente'])
                data['p_porcentaje_exportacion'] = float(data['p_porcentaje_exportacion'])
                data['p_porcentaje_nacional'] = float(data['p_porcentaje_nacional'])
                
                result.append(data)
            
            # Sort by date descending
            result.sort(key=lambda x: x['compra_fecha'] or '', reverse=True)
            return result
        
        # Aggregate by compra instead of showing individual ventas
        reportes_pendientes_data = aggregate_by_compra(reportes_pendientes)
        reportes_pagados_data = aggregate_by_compra(reportes_pagados)
        reportes_sin_factura_data = aggregate_by_compra(reportes_sin_factura)
        transferencias_data = TransferenciasProveedorSerializer(transferencias, many=True).data
        
        return Response({
            'proveedor': ProveedorNacionalSerializer(proveedor).data,
            'reportes_pendientes': reportes_pendientes_data,
            'total_pendientes': total_pendientes,
            'monto_pendiente_total': monto_pendiente_total,
            'reportes_pagados': reportes_pagados_data,
            'reportes_sin_factura': reportes_sin_factura_data,
            'total_sin_factura': total_sin_factura,
            'saldo_disponible': saldo_disponible,
            'compras_proceso': compras_proceso,
            'transferencias': transferencias_data,
            'saldo_actual': saldo_actual,
            'total_por_pagar': total_por_pagar,
            'total_pagado': total_pagado,
            'total_utilidad': total_utilidad,
            'valor_consignar': valor_consignar,
        })

    @action(detail=True, methods=['get'])
    def exportar_pdf(self, request, pk=None):
        """
        Generate and return PDF for provider report summary.
        Endpoint: /api/nacionales/proveedores/{id}/exportar_pdf/
        """
        from django.http import HttpResponse
        from .pdf_generator import generate_resumen_reportes_pdf
        
        # Reutilizamos la lógica de resumen_reportes
        proveedor = self.get_object()
        
        reportes_pendientes = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
            reporte_pago=False,
            reporte_enviado=True
        ).select_related(
            'rep_cal_exp',
            'rep_cal_exp__venta_nacional',
            'rep_cal_exp__venta_nacional__compra_nacional',
        ).order_by('-rep_cal_exp__venta_nacional__compra_nacional__fecha_compra', '-pk')
        
        total_pendientes = reportes_pendientes.aggregate(total=Sum('p_total_pagar'))['total'] or 0
        monto_pendiente_total = reportes_pendientes.aggregate(total=Sum('monto_pendiente'))['total'] or 0
        
        reportes_pagados = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
            reporte_pago=True
        ).select_related(
            'rep_cal_exp',
            'rep_cal_exp__venta_nacional',
            'rep_cal_exp__venta_nacional__compra_nacional',
        ).order_by('-rep_cal_exp__venta_nacional__compra_nacional__fecha_compra', '-pk')
        
        reportes_sin_factura = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
            factura_prov__isnull=True
        ).select_related(
            'rep_cal_exp',
            'rep_cal_exp__venta_nacional',
            'rep_cal_exp__venta_nacional__compra_nacional'
        ).order_by('-rep_cal_exp__venta_nacional__compra_nacional__fecha_compra', '-pk')
        
        total_sin_factura = reportes_sin_factura.aggregate(total=Sum('p_total_facturar'))['total'] or 0
        
        from nacionales.models import BalanceProveedor
        balance_proveedor, _ = BalanceProveedor.objects.get_or_create(proveedor=proveedor)
        saldo_disponible = balance_proveedor.saldo_disponible
        
        todas_compras = CompraNacional.objects.filter(
            proveedor=proveedor
        ).select_related('fruta', 'tipo_empaque').order_by('-fecha_compra', '-pk')
        
        compras_completas_ids = set(
            ReporteCalidadProveedor.objects.filter(
                rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
                reporte_enviado=True
            ).values_list('rep_cal_exp__venta_nacional__compra_nacional_id', flat=True)
        )
        
        compras_proceso = []
        for compra in todas_compras:
            ventas = VentaNacional.objects.filter(compra_nacional=compra)
            
            if not ventas.exists():
                 compras_proceso.append({
                    'numero_guia': compra.numero_guia,
                    'fecha_compra': compra.fecha_compra,
                    'peso_recibido': None,
                    'fecha_reporte': None,
                    'estado': 'Sin Ingreso'
                })
                 continue

            for venta in ventas:
                datos_venta = {
                    'numero_guia': f"{compra.numero_guia} ({venta.tipo or 'N/A'})",
                    'fecha_compra': compra.fecha_compra,
                    'peso_recibido': venta.peso_neto_recibido,
                    'fecha_reporte': None,
                    'estado': venta.estado_venta,
                }
                try:
                    reporte_exp = ReporteCalidadExportador.objects.get(venta_nacional=venta)
                    datos_venta['estado'] = reporte_exp.estado_reporte_exp
                    try:
                        reporte_prov = ReporteCalidadProveedor.objects.get(rep_cal_exp=reporte_exp)
                        datos_venta['fecha_reporte'] = reporte_prov.p_fecha_reporte
                        datos_venta['estado'] = reporte_prov.estado_reporte_prov
                        if reporte_prov.reporte_enviado:
                            continue
                    except ReporteCalidadProveedor.DoesNotExist:
                        datos_venta['estado'] = 'Pendiente Enviar A Proveedor'
                except ReporteCalidadExportador.DoesNotExist:
                    datos_venta['estado'] = 'Sin Reporte Calidad'
                compras_proceso.append(datos_venta)
        
        compras_proceso = sorted(compras_proceso, key=lambda x: x['fecha_compra'], reverse=True)
        
        transferencias = TransferenciasProveedor.objects.filter(
            proveedor=proveedor
        ).order_by('-fecha_transferencia', '-pk')
        
        saldo_actual = saldo_disponible
        valor_consignar = monto_pendiente_total - saldo_actual
        
        # Helper function to aggregate reports by compra_nacional (same as resumen_reportes)
        def aggregate_by_compra(reportes_queryset):
            """Agrupa reportes por compra_nacional y suma los valores"""
            from decimal import Decimal
            from collections import defaultdict
            
            compras_dict = defaultdict(lambda: {
                'compra_guia': None,
                'compra_fecha': None,
                'compra_id': None,
                'p_kg_totales': Decimal('0'),
                'p_kg_exportacion': Decimal('0'),
                'p_kg_nacional': Decimal('0'),
                'p_total_pagar': Decimal('0'),
                'p_total_facturar': Decimal('0'),
                'monto_pendiente': Decimal('0'),
                'p_fecha_reporte': None,
                'count': 0
            })
            
            for reporte in reportes_queryset:
                compra = reporte.rep_cal_exp.venta_nacional.compra_nacional
                compra_id = compra.id
                entry = compras_dict[compra_id]
                
                entry['compra_guia'] = compra.numero_guia
                entry['compra_fecha'] = compra.fecha_compra
                entry['compra_id'] = compra_id
                entry['p_kg_totales'] += reporte.p_kg_totales or Decimal('0')
                entry['p_kg_exportacion'] += reporte.p_kg_exportacion or Decimal('0')
                entry['p_kg_nacional'] += reporte.p_kg_nacional or Decimal('0')
                entry['p_total_pagar'] += reporte.p_total_pagar or Decimal('0')
                entry['p_total_facturar'] += reporte.p_total_facturar or Decimal('0')
                entry['monto_pendiente'] += reporte.monto_pendiente or Decimal('0')
                entry['count'] += 1
                
                if entry['p_fecha_reporte'] is None or (reporte.p_fecha_reporte and reporte.p_fecha_reporte > entry['p_fecha_reporte']):
                    entry['p_fecha_reporte'] = reporte.p_fecha_reporte
            
            result = []
            for compra_id, data in compras_dict.items():
                if data['p_kg_totales'] > 0:
                    data['p_porcentaje_exportacion'] = float((data['p_kg_exportacion'] / data['p_kg_totales'] * 100).quantize(Decimal('0.1')))
                    data['p_porcentaje_nacional'] = float((data['p_kg_nacional'] / data['p_kg_totales'] * 100).quantize(Decimal('0.1')))
                else:
                    data['p_porcentaje_exportacion'] = 0
                    data['p_porcentaje_nacional'] = 0
                
                data['p_kg_totales'] = float(data['p_kg_totales'])
                data['p_kg_exportacion'] = float(data['p_kg_exportacion'])
                data['p_kg_nacional'] = float(data['p_kg_nacional'])
                data['p_total_pagar'] = float(data['p_total_pagar'])
                data['p_total_facturar'] = float(data['p_total_facturar'])
                data['monto_pendiente'] = float(data['monto_pendiente'])
                
                result.append(data)
            
            result.sort(key=lambda x: x['compra_fecha'] or '', reverse=True)
            return result
        
        # Aggregate by compra (same as resumen_reportes)
        reportes_pendientes_data = aggregate_by_compra(reportes_pendientes)
        reportes_pagados_data = aggregate_by_compra(reportes_pagados)
        reportes_sin_factura_data = aggregate_by_compra(reportes_sin_factura)
        transferencias_data = TransferenciasProveedorSerializer(transferencias, many=True).data
        
        pdf_data = {
            'proveedor': ProveedorNacionalSerializer(proveedor).data,
            'reportes_pendientes': reportes_pendientes_data,
            'total_pendientes': total_pendientes,
            'monto_pendiente_total': monto_pendiente_total,
            'reportes_pagados': reportes_pagados_data,
            'reportes_sin_factura': reportes_sin_factura_data,
            'total_sin_factura': total_sin_factura,
            'saldo_disponible': saldo_disponible,
            'compras_proceso': compras_proceso,
            'transferencias': transferencias_data,
            'saldo_actual': saldo_actual,
            'valor_consignar': valor_consignar,
        }
        
        pdf_buffer = generate_resumen_reportes_pdf(pdf_data)
        
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="estado_cuenta_{proveedor.nombre.replace(" ", "_")}.pdf"'
        return response

    @action(detail=True, methods=['get'])
    def estado_cuenta(self, request, pk=None):
        """
        Estado de cuenta del proveedor con filtros de fecha y fruta.
        Endpoint: /nacionales/api/proveedores/{id}/estado_cuenta/
        Query params: fecha_inicio, fecha_fin, fruta_id
        """
        from decimal import Decimal
        
        proveedor = self.get_object()
        
        fecha_inicio_str = request.query_params.get('fecha_inicio')
        fecha_fin_str = request.query_params.get('fecha_fin')
        fruta_id = request.query_params.get('fruta_id')
        
        es_primera_carga = not fecha_inicio_str and not fecha_fin_str
        
        fecha_inicio = None
        fecha_fin = None
        
        if not es_primera_carga:
            if fecha_fin_str:
                try:
                    fecha_fin = datetime.datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
                except ValueError:
                    fecha_fin = datetime.date.today()
            else:
                fecha_fin = datetime.date.today()
            
            if fecha_inicio_str:
                try:
                    fecha_inicio = datetime.datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
                except ValueError:
                    fecha_inicio = fecha_fin - datetime.timedelta(days=30)
            else:
                fecha_inicio = fecha_fin - datetime.timedelta(days=30)
        
        compras = CompraNacional.objects.filter(proveedor=proveedor).select_related(
            'fruta', 'tipo_empaque'
        ).prefetch_related(
            'ventas',
            'ventas__reportecalidadexportador',
            'ventas__reportecalidadexportador__reportecalidadproveedor'
        )
        
        if not es_primera_carga:
            if fecha_inicio:
                compras = compras.filter(fecha_compra__gte=fecha_inicio)
            if fecha_fin:
                compras = compras.filter(fecha_compra__lte=fecha_fin)
        
        if fruta_id:
            try:
                compras = compras.filter(fruta_id=int(fruta_id))
            except ValueError:
                pass
        
        compras = compras.order_by('-fecha_compra', '-id')
        
        total_compras_valor = Decimal('0')
        total_utilidad = Decimal('0')
        total_kilos = Decimal('0')
        
        compras_data = []
        for compra in compras:
            compra_item = {
                'id': compra.id,
                'fecha_compra': compra.fecha_compra.strftime('%Y-%m-%d') if compra.fecha_compra else None,
                'numero_guia': compra.numero_guia,
                'fruta_nombre': compra.fruta.nombre if compra.fruta else '',
                'peso_compra': float(compra.peso_compra) if compra.peso_compra else 0,
                'precio_compra_exp': float(compra.precio_compra_exp) if compra.precio_compra_exp else None,
                'precio_compra_nal': float(compra.precio_compra_nal) if compra.precio_compra_nal else None,
                'porcentaje_completitud': float(compra.porcentaje_completitud) if hasattr(compra, 'porcentaje_completitud') else 0,
                'total_pagar': None,
                'utilidad': None,
                'utilidad_sin_ajuste': None,
                'diferencia_utilidad': None,
            }
            
            ventas = compra.ventas.all()
            if ventas:
                for venta in ventas:
                    total_kilos += venta.peso_neto_recibido or Decimal('0')
                    
                    try:
                        reporte_exp = venta.reportecalidadexportador
                        if reporte_exp:
                            try:
                                reporte_prov = reporte_exp.reportecalidadproveedor
                                if reporte_prov:
                                    if reporte_prov.p_total_pagar:
                                        total_compras_valor += reporte_prov.p_total_pagar
                                        compra_item['total_pagar'] = (compra_item['total_pagar'] or 0) + float(reporte_prov.p_total_pagar)
                                    
                                    if reporte_prov.p_utilidad is not None:
                                        total_utilidad += reporte_prov.p_utilidad
                                        compra_item['utilidad'] = (compra_item['utilidad'] or 0) + float(reporte_prov.p_utilidad)
                                    
                                    if reporte_prov.p_utilidad_sin_ajuste is not None:
                                        compra_item['utilidad_sin_ajuste'] = (compra_item['utilidad_sin_ajuste'] or 0) + float(reporte_prov.p_utilidad_sin_ajuste)
                                    
                                    if reporte_prov.diferencia_utilidad is not None:
                                        compra_item['diferencia_utilidad'] = (compra_item['diferencia_utilidad'] or 0) + float(reporte_prov.diferencia_utilidad)
                            except ReporteCalidadProveedor.DoesNotExist:
                                pass
                    except ReporteCalidadExportador.DoesNotExist:
                        pass
            else:
                pass
            
            compras_data.append(compra_item)
        
        transferencias_query = TransferenciasProveedor.objects.filter(proveedor=proveedor)
        if not es_primera_carga:
            if fecha_inicio:
                transferencias_query = transferencias_query.filter(fecha_transferencia__gte=fecha_inicio)
            if fecha_fin:
                transferencias_query = transferencias_query.filter(fecha_transferencia__lte=fecha_fin)
        
        transferencias_query = transferencias_query.order_by('-fecha_transferencia', '-id')
        
        total_transferido = transferencias_query.aggregate(
            total=Sum('valor_transferencia')
        )['total'] or Decimal('0')
        
        transferencias_data = []
        for transf in transferencias_query:
            transferencias_data.append({
                'id': transf.id,
                'fecha_transferencia': transf.fecha_transferencia.strftime('%Y-%m-%d') if transf.fecha_transferencia else None,
                'valor_transferencia': float(transf.valor_transferencia) if transf.valor_transferencia else 0,
                'origen_transferencia': transf.origen_transferencia or '',
            })
        
        saldo_pendiente = total_compras_valor - total_transferido
        
        proveedores_all = ProveedorNacional.objects.all().order_by('nombre')
        proveedores_data = [{'id': p.id, 'nombre': p.nombre, 'nit': p.nit} for p in proveedores_all]
        
        return Response({
            'proveedor': {
                'id': proveedor.id,
                'nombre': proveedor.nombre,
                'nit': proveedor.nit,
            },
            'proveedores': proveedores_data,
            'total_compras_valor': float(total_compras_valor),
            'total_kilos': float(total_kilos),
            'total_transferido': float(total_transferido),
            'saldo_pendiente': float(saldo_pendiente),
            'total_utilidad': float(total_utilidad),
            'compras': compras_data,
            'transferencias': transferencias_data,
            'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d') if fecha_inicio else None,
            'fecha_fin': fecha_fin.strftime('%Y-%m-%d') if fecha_fin else None,
            'es_primera_carga': es_primera_carga,
        })


class EmpaqueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Empaque.objects.all().order_by('nombre')
    serializer_class = EmpaqueSerializer
    permission_classes = [permissions.IsAuthenticated, IsHeavensGroup]


class DashboardNacionalesAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsHeavensGroup]

    def get(self, request):
        fecha_inicio_str = request.query_params.get('fecha_inicio')
        fecha_fin_str = request.query_params.get('fecha_fin')
        proveedor_id = request.query_params.get('proveedor_id')
        fruta_id = request.query_params.get('fruta_id')

        fecha_inicio = None
        fecha_fin = None

        if fecha_inicio_str:
            try:
                fecha_inicio = datetime.datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
            except ValueError:
                pass

        if fecha_fin_str:
            try:
                fecha_fin = datetime.datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
            except ValueError:
                pass

        proveedor_id_int = None
        if proveedor_id:
            try:
                proveedor_id_int = int(proveedor_id)
            except ValueError:
                pass

        fruta_id_int = None
        if fruta_id:
            try:
                fruta_id_int = int(fruta_id)
            except ValueError:
                pass

        service = DashboardNacionalesService(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            proveedor_id=proveedor_id_int,
            fruta_id=fruta_id_int
        )

        data = service.get_full_dashboard_data()
        return Response(data)



class TransferenciasPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        # Calculate total value of the filtered queryset
        total_valor = self.page.paginator.object_list.aggregate(
            total=Sum('valor_transferencia')
        )['total'] or 0

        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'total_valor': total_valor,
            'results': data
        })


class TransferenciasProveedorViewSet(viewsets.ModelViewSet):
    serializer_class = TransferenciasProveedorSerializer
    permission_classes = [permissions.IsAuthenticated, IsHeavensGroup]
    pagination_class = TransferenciasPagination

    def get_queryset(self):
        queryset = TransferenciasProveedor.objects.all().select_related('proveedor').order_by('-fecha_transferencia')
        
        proveedor_id = self.request.query_params.get('proveedor')
        fecha_inicio = self.request.query_params.get('fecha_inicio')
        fecha_fin = self.request.query_params.get('fecha_fin')
        origen = self.request.query_params.get('origen')
        
        if proveedor_id:
            queryset = queryset.filter(proveedor_id=proveedor_id)
        if fecha_inicio:
            queryset = queryset.filter(fecha_transferencia__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha_transferencia__lte=fecha_fin)
        if origen:
            queryset = queryset.filter(origen_transferencia=origen)
            
        return queryset

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """Return choices for filters"""
        from .choices import origen_transferencia
        return Response({
            'origenes': [x[0] for x in origen_transferencia]
        })


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsHeavensGroup])
def reporte_individual_api(request):
    """
    API endpoint para obtener datos del reporte individual del proveedor.
    GET /nacionales/api/reporte-individual/?numero_guia=XXX
    
    This endpoint aggregates data from ALL ventas of the same compra/guia.
    """
    from decimal import Decimal
    
    numero_guia = request.query_params.get('numero_guia', '').strip()
    
    if not numero_guia:
        return Response({'error': 'El parámetro numero_guia es requerido'}, status=400)
    
    try:
        compra = CompraNacional.objects.select_related(
            'proveedor', 'fruta'
        ).get(numero_guia=numero_guia)
    except CompraNacional.DoesNotExist:
        return Response({'error': 'No se encontró la compra con ese número de guía'}, status=404)
    
    ventas = VentaNacional.objects.filter(compra_nacional=compra)
    if not ventas.exists():
        return Response({'error': 'No se encontró la venta asociada a esta compra'}, status=404)
    
    # Collect all reportes_proveedor for aggregation
    reportes_proveedor = []
    first_venta = None
    
    for venta in ventas:
        if first_venta is None:
            first_venta = venta
        
        try:
            reporte_exportador = ReporteCalidadExportador.objects.select_related(
                'venta_nacional__compra_nacional'
            ).get(venta_nacional=venta)
            try:
                reporte_proveedor = ReporteCalidadProveedor.objects.select_related(
                    'rep_cal_exp__venta_nacional__compra_nacional'
                ).get(rep_cal_exp=reporte_exportador)
                reportes_proveedor.append(reporte_proveedor)
            except ReporteCalidadProveedor.DoesNotExist:
                pass
        except ReporteCalidadExportador.DoesNotExist:
            pass
    
    if not reportes_proveedor:
        return Response({'error': 'No se encontraron reportes del proveedor para esta guía'}, status=404)
    
    first_reporte = reportes_proveedor[0]
    
    # Helper: get the effective price for each report.
    # p_precio_kg_nal may be 0/None due to a signal timing issue where
    # compra.precio_compra_nal is updated via update() and the in-memory
    # object is stale when ReporteCalidadProveedor.save() reads it.
    # Fallback to rep_cal_exp.precio_venta_kg_nal (the correct source of truth).
    def get_effective_precio_exp(r):
        if r.p_precio_kg_exp and r.p_precio_kg_exp > 0:
            return Decimal(str(r.p_precio_kg_exp))
        return Decimal(str(r.rep_cal_exp.venta_nacional.compra_nacional.precio_compra_exp or 0))
    
    def get_effective_precio_nal(r):
        if r.p_precio_kg_nal and r.p_precio_kg_nal > 0:
            return Decimal(str(r.p_precio_kg_nal))
        # Fallback: use the ExportadorReporte's national price
        return Decimal(str(r.rep_cal_exp.precio_venta_kg_nal or 0))
    
    # Aggregate kg from all reportes
    total_kg = sum(Decimal(str(r.p_kg_totales or 0)) for r in reportes_proveedor)
    total_kg_exp = sum(Decimal(str(r.p_kg_exportacion or 0)) for r in reportes_proveedor)
    total_kg_nal = sum(Decimal(str(r.p_kg_nacional or 0)) for r in reportes_proveedor)
    total_kg_merma = sum(Decimal(str(r.p_kg_merma or 0)) for r in reportes_proveedor)
    
    # Compute total values using effective (corrected) prices
    total_valor_exp = sum(
        Decimal(str(r.p_kg_exportacion or 0)) * get_effective_precio_exp(r)
        for r in reportes_proveedor
    )
    total_valor_nal = sum(
        Decimal(str(r.p_kg_nacional or 0)) * get_effective_precio_nal(r)
        for r in reportes_proveedor
    )
    
    # Recalculate total_facturar from corrected values
    total_facturar = total_valor_exp + total_valor_nal
    
    # Recalculate retenciones based on corrected total_facturar
    proveedor = compra.proveedor
    if proveedor.asohofrucol:
        total_asohofrucol = (total_facturar * Decimal('1.00') / Decimal('100.00')).quantize(Decimal('0.01'))
    else:
        total_asohofrucol = Decimal('0')
    
    if proveedor.rte_fte:
        total_rte_fte = (total_facturar * Decimal('1.50') / Decimal('100.00')).quantize(Decimal('0.01'))
    else:
        total_rte_fte = Decimal('0')
    
    if proveedor.rte_ica:
        total_rte_ica = (total_facturar * Decimal('4.14') / Decimal('1000.00')).quantize(Decimal('0.01'))
    else:
        total_rte_ica = Decimal('0')
    
    total_pagar = total_facturar - total_asohofrucol - total_rte_fte - total_rte_ica
    
    # Calculate weighted percentages
    if total_kg > 0:
        porc_exp = (total_kg_exp / total_kg * 100).quantize(Decimal('0.01'))
        porc_nal = (total_kg_nal / total_kg * 100).quantize(Decimal('0.01'))
        porc_merma = (total_kg_merma / total_kg * 100).quantize(Decimal('0.01'))
    else:
        porc_exp = porc_nal = porc_merma = Decimal('0')
    
    # Calculate weighted average prices
    if total_kg_exp > 0:
        precio_kg_exp = total_valor_exp / total_kg_exp
    else:
        precio_kg_exp = get_effective_precio_exp(first_reporte)
        
    if total_kg_nal > 0:
        precio_kg_nal = total_valor_nal / total_kg_nal
    else:
        precio_kg_nal = get_effective_precio_nal(first_reporte)
    
    today = datetime.date.today()
    
    return Response({
        'proveedor': {
            'id': proveedor.id,
            'nombre': proveedor.nombre,
            'nit': proveedor.nit or '',
            'ciudad': proveedor.ciudad or '',
        },
        'compra': {
            'id': compra.id,
            'numero_guia': compra.numero_guia,
            'fruta_nombre': compra.fruta.nombre if compra.fruta else '',
            'fecha_compra': compra.fecha_compra.strftime('%Y-%m-%d') if compra.fecha_compra else None,
        },
        'venta': {
            'fecha_llegada': first_venta.fecha_llegada.strftime('%Y-%m-%d') if first_venta and first_venta.fecha_llegada else None,
        },
        'reporte_proveedor': {
            'pk': first_reporte.pk,
            'ventas_count': len(reportes_proveedor),
            'p_kg_totales': float(total_kg),
            'p_kg_exportacion': float(total_kg_exp),
            'p_porcentaje_exportacion': float(porc_exp),
            'p_precio_kg_exp': float(precio_kg_exp),
            'p_kg_nacional': float(total_kg_nal),
            'p_porcentaje_nacional': float(porc_nal),
            'p_precio_kg_nal': float(precio_kg_nal),
            'p_kg_merma': float(total_kg_merma),
            'p_porcentaje_merma': float(porc_merma),
            'p_total_facturar': float(total_facturar),
            'asohofrucol': float(total_asohofrucol),
            'rte_fte': float(total_rte_fte),
            'rte_ica': float(total_rte_ica),
            'p_total_pagar': float(total_pagar),
        },
        'today': today.strftime('%Y-%m-%d'),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsHeavensGroup])
def guias_autocomplete_api(request):
    """
    API endpoint para autocompletado de números de guía.
    GET /nacionales/api/guias/autocomplete/?q=XXX
    """
    query = request.query_params.get('q', '').strip()
    
    if len(query) < 2:
        return Response({'guias': []})
    
    compras = CompraNacional.objects.filter(
        numero_guia__icontains=query
    ).select_related('proveedor')[:30] # Fetch more to allow for filtering duplicates
    
    guias_seen = set()
    guias = []
    for compra in compras:
        label = f"{compra.numero_guia} - {compra.proveedor.nombre if compra.proveedor else 'Sin proveedor'}"
        if label not in guias_seen:
            guias.append({
                'value': compra.numero_guia,
                'label': label
            })
            guias_seen.add(label)
            if len(guias) >= 15:
                break
    
    return Response({'guias': guias})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reportes_vencidos_api(request):
    """
    API endpoint para obtener reporte de ventas nacionales vencidas.
    GET /nacionales/api/reportes-vencidos/?exportador=ID
    """
    user = request.user
    requested_exportador_id = request.query_params.get('exportador')
    
    # Determine if user is superuser or in Heavens group
    is_privileged = user.is_superuser or user.groups.filter(name='Heavens').exists()
    
    target_exportador_id = None
    
    if is_privileged:
        if not requested_exportador_id:
             return Response({'error': 'El parámetro exportador es requerido'}, status=400)
        target_exportador_id = requested_exportador_id
    else:
        # User is restricted, find their allowed exporter
        user_group_names = user.groups.values_list('name', flat=True)
        exportadora_names = ['Etnico', 'Fieldex', 'Juan Matas', 'CI_Dorado']
        mapped_names = {
            'Juan_Matas': 'Juan Matas',
            'Juan Matas': 'Juan Matas',
            'CI_Dorado': 'CI_Dorado',
            'CI Dorado': 'CI_Dorado'
        }
        
        active_exportadora_name = None
        for group_name in user_group_names:
            if group_name in exportadora_names:
                active_exportadora_name = group_name
                break
            elif group_name in mapped_names:
                active_exportadora_name = mapped_names[group_name]
                break
        
        if not active_exportadora_name:
            return Response({'error': 'No tienes permisos para ver reportes de ningún exportador.'}, status=403)
            
        # Find the ID of their exporter
        try:
            target_exportador = Exportador.objects.get(nombre=active_exportadora_name)
            target_exportador_id = target_exportador.id
        except Exportador.DoesNotExist:
             return Response({'error': f'Configuración inválida: El exportador {active_exportadora_name} no existe.'}, status=500)
             
        # If they requested a different ID, we could warn, but "filtering default" implies we just give them theirs.
        # But if they requested specific ID different from theirs, it's technically unauthorized access to that ID.
        # However, for simplicity and UX, we can just ignore their param and use the forced one, OR check it.
        # Let's just USE the target_exportador_id.

    try:
        exportador = Exportador.objects.get(pk=target_exportador_id)
    except Exportador.DoesNotExist:
        return Response({'error': 'Exportador no encontrado'}, status=404)
        
    today = datetime.date.today()
    
    # Obtener ventas nacionales con reportes vencidos (fecha vencimiento < hoy)
    reportes = VentaNacional.objects.filter(
        fecha_vencimiento__lt=today, # Estrictamente menor a hoy
        exportador=exportador,
        estado_venta="Vencido"
    ).select_related(
        'compra_nacional',
        'compra_nacional__fruta',
        'compra_nacional__proveedor',
        'compra_nacional__tipo_empaque'
    ).order_by('fecha_vencimiento')
    
    reportes_vencidos = []
    
    for reporte in reportes:
        # Calcular días de vencimiento usando today
        dias_vencidos = (today - reporte.fecha_vencimiento).days
        
        reportes_vencidos.append({
            'id': reporte.pk,
            'numero_guia': reporte.compra_nacional.numero_guia,
            'fecha_llegada': reporte.fecha_llegada,
            'fecha_vencimiento': reporte.fecha_vencimiento,
            'fruta': reporte.compra_nacional.fruta.nombre if reporte.compra_nacional.fruta else '',
            'origen': reporte.compra_nacional.origen_compra,
            'peso_bruto_recibido': float(reporte.peso_bruto_recibido) if reporte.peso_bruto_recibido else 0,
            'peso_neto_recibido': float(reporte.peso_neto_recibido) if reporte.peso_neto_recibido else 0,
            'cantidad_empaque_recibida': reporte.cantidad_empaque_recibida,
            'tipo_empaque': reporte.compra_nacional.tipo_empaque.nombre if reporte.compra_nacional.tipo_empaque else '',
            'dias_vencidos': dias_vencidos,
        })
        
    return Response({
        'exportador': {
            'id': exportador.id,
            'nombre': exportador.nombre
        },
        'reportes_vencidos': reportes_vencidos,
        'total_reportes': len(reportes_vencidos),
        'fecha_actual': today
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsHeavensGroup])
def reportes_asociados_api(request):
    """
    API endpoint para obtener reportes asociados por factura, guía o remisión.
    GET /nacionales/api/reportes-asociados/?factura=XXX&numero_guia=XXX&remision=XXX
    Al menos uno de los parámetros es requerido.
    """
    from decimal import Decimal
    
    factura = request.query_params.get('factura', '').strip()
    numero_guia = request.query_params.get('numero_guia', '').strip()
    remision = request.query_params.get('remision', '').strip()
    
    # Validar que al menos un criterio esté presente
    if not factura and not numero_guia and not remision:
        return Response({
            'error': 'Debe proporcionar al menos un criterio de búsqueda (factura, numero_guia o remision)'
        }, status=400)
    
    today = datetime.date.today()
    
    # Base query
    reportes = ReporteCalidadExportador.objects.all().select_related(
        'venta_nacional__compra_nacional__fruta',
        'venta_nacional__compra_nacional__proveedor',
        'venta_nacional__exportador'
    )
    
    # Lista para almacenar facturas encontradas
    facturas_encontradas = set()
    criterio_busqueda = None
    
    # Aplicar filtros según los criterios proporcionados
    if factura:
        reportes = reportes.filter(factura=factura)
        criterio_busqueda = f"Factura: {factura}"
        facturas_encontradas.add(factura)
        
    if numero_guia:
        # Primero buscamos los reportes que cumplen este criterio
        reportes_guia = reportes.filter(venta_nacional__compra_nacional__numero_guia=numero_guia)
        criterio_busqueda = f"Guía: {numero_guia}"
        
        # Si alguno de estos reportes tiene factura, incluimos todas las entradas con esa factura
        for reporte in reportes_guia:
            if reporte.factura:
                facturas_encontradas.add(reporte.factura)
        
        # Si encontramos facturas asociadas, actualizamos la búsqueda
        if facturas_encontradas:
            reportes = reportes.filter(factura__in=facturas_encontradas)
        else:
            reportes = reportes_guia
        
    if remision:
        # Similar al número de guía
        reportes_remision = reportes.filter(remision_exp=remision)
        criterio_busqueda = f"Remisión/Reporte: {remision}"
        
        # Si alguno de estos reportes tiene factura, incluimos todas las entradas con esa factura
        for reporte in reportes_remision:
            if reporte.factura:
                facturas_encontradas.add(reporte.factura)
        
        # Si encontramos facturas asociadas, actualizamos la búsqueda
        if facturas_encontradas and not numero_guia:
            reportes = reportes.filter(factura__in=facturas_encontradas)
        elif not facturas_encontradas and not numero_guia:
            reportes = reportes_remision
    
    # Agrupar por factura
    facturas_agrupadas = {}
    total_a_pagar = Decimal('0.00')
    
    for reporte in reportes:
        # Calcular valores requeridos
        valor_exp = float(reporte.precio_venta_kg_exp * reporte.kg_exportacion) if reporte.precio_venta_kg_exp and reporte.kg_exportacion else 0
        valor_nal = float(reporte.precio_venta_kg_nal * reporte.kg_nacional) if reporte.precio_venta_kg_nal and reporte.kg_nacional else 0
        
        factura_key = reporte.factura or 'Sin Factura'
        
        if factura_key not in facturas_agrupadas:
            facturas_agrupadas[factura_key] = {
                'factura': factura_key,
                'fecha_factura': reporte.fecha_factura.strftime('%Y-%m-%d') if reporte.fecha_factura else None,
                'vencimiento_factura': reporte.vencimiento_factura.strftime('%Y-%m-%d') if reporte.vencimiento_factura else None,
                'exportador': reporte.venta_nacional.exportador.nombre if reporte.venta_nacional.exportador else '',
                'items': [],
                'subtotal': Decimal('0.00')
            }
            
        facturas_agrupadas[factura_key]['items'].append({
            'id': reporte.pk,
            'remision_exp': reporte.remision_exp or '',
            'numero_guia': reporte.venta_nacional.compra_nacional.numero_guia if reporte.venta_nacional.compra_nacional else '',
            'fecha_reporte': reporte.fecha_reporte.strftime('%Y-%m-%d') if reporte.fecha_reporte else None,
            'fruta': reporte.venta_nacional.compra_nacional.fruta.nombre if reporte.venta_nacional.compra_nacional and reporte.venta_nacional.compra_nacional.fruta else '',
            'valor_exp': valor_exp,
            'valor_nal': valor_nal,
            'precio_total': float(reporte.precio_total) if reporte.precio_total else 0
        })
        
        facturas_agrupadas[factura_key]['subtotal'] += reporte.precio_total or Decimal('0.00')
        total_a_pagar += reporte.precio_total or Decimal('0.00')
    
    # Convertir subtotales a float para JSON serialization
    facturas_list = []
    for factura_data in facturas_agrupadas.values():
        factura_data['subtotal'] = float(factura_data['subtotal'])
        facturas_list.append(factura_data)
        
    return Response({
        'facturas': facturas_list,
        'total_a_pagar': float(total_a_pagar),
        'criterio_busqueda': criterio_busqueda,
        'fecha_actual': today.strftime('%Y-%m-%d')
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsHeavensGroup])
def facturas_autocomplete_api(request):
    """
    API endpoint para autocompletado de números de factura.
    GET /nacionales/api/facturas/autocomplete/?q=XXX
    """
    query = request.query_params.get('q', '').strip()
    
    if len(query) < 1:
        return Response({'facturas': []})
    
    facturas = ReporteCalidadExportador.objects.filter(
        factura__icontains=query
    ).exclude(
        factura__isnull=True
    ).exclude(
        factura=''
    ).values_list('factura', flat=True).distinct()[:15]
    
    facturas_list = [{'value': f, 'label': f} for f in facturas]
    
    return Response({'facturas': facturas_list})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsHeavensGroup])
def remisiones_autocomplete_api(request):
    """
    API endpoint para autocompletado de números de remisión.
    GET /nacionales/api/remisiones/autocomplete/?q=XXX
    """
    query = request.query_params.get('q', '').strip()
    
    if len(query) < 1:
        return Response({'remisiones': []})
    
    remisiones = ReporteCalidadExportador.objects.filter(
        remision_exp__icontains=query
    ).exclude(
        remision_exp__isnull=True
    ).exclude(
        remision_exp=''
    ).values_list('remision_exp', flat=True).distinct()[:15]
    
    remisiones_list = [{'value': r, 'label': r} for r in remisiones]
    
    return Response({'remisiones': remisiones_list})

