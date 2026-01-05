from rest_framework import viewsets, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import (
    CompraNacional, VentaNacional, ReporteCalidadExportador, 
    ReporteCalidadProveedor, ProveedorNacional, Empaque
)
from .serializers import (
    CompraNacionalSerializer, VentaNacionalSerializer, 
    ReporteCalidadExportadorSerializer, ReporteCalidadProveedorSerializer,
    ProveedorNacionalSerializer, EmpaqueSerializer
)
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

class CompraNacionalViewSet(viewsets.ModelViewSet):
    serializer_class = CompraNacionalSerializer
    permission_classes = [permissions.IsAuthenticated, IsHeavensGroup]
    filter_backends = [filters.SearchFilter]
    search_fields = ['numero_guia', 'proveedor__nombre', 'remision']

    def get_queryset(self):
        return CompraNacional.objects.all().select_related(
            'proveedor', 'fruta', 'tipo_empaque'
        ).prefetch_related(
            'ventanacional', 
            'ventanacional__reportecalidadexportador', 
            'ventanacional__reportecalidadexportador__reportecalidadproveedor'
        ).order_by('-fecha_compra', '-id')

    @action(detail=False, methods=['get'])
    def incompletas(self, request):
        queryset = self.get_queryset()
        incompletas = []
        
        # Logic adapted from nacionales_list_detallada view
        for compra in queryset:
            tiene_venta = hasattr(compra, 'ventanacional')
            tiene_reporte_exp = False
            tiene_reporte_prov = False
            reporte_prov_completado = False

            if tiene_venta:
                venta = compra.ventanacional
                tiene_reporte_exp = hasattr(venta, 'reportecalidadexportador')
                if tiene_reporte_exp:
                    reporte_exp = venta.reportecalidadexportador
                    tiene_reporte_prov = hasattr(reporte_exp, 'reportecalidadproveedor')
                    if tiene_reporte_prov:
                        reporte_prov = reporte_exp.reportecalidadproveedor
                        reporte_prov_completado = reporte_prov.completado

            # Condition: purchase is incomplete if relations are missing or provider report not completed
            if not (tiene_venta and tiene_reporte_exp and tiene_reporte_prov and reporte_prov_completado):
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
        guia = request.query_params.get('guia', '')
        if not guia:
            return Response({'error': 'Parameter guia is required'}, status=400)
        
        compra = CompraNacional.objects.filter(numero_guia=guia).first()
        if compra:
             serializer = self.get_serializer(compra)
             return Response(serializer.data)
        return Response({'message': 'No found'}, status=404)
    
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


class EmpaqueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Empaque.objects.all().order_by('nombre')
    serializer_class = EmpaqueSerializer
    permission_classes = [permissions.IsAuthenticated, IsHeavensGroup]
