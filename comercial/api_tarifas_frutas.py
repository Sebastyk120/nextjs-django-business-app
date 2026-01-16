"""
API ViewSet for Tarifas Frutas (Price List Fruit Exporter)
Mirrors api_tarifas_aereas.py
"""
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Max, Min, Avg

from .models import ListaPreciosFrutaExportador, Fruta, Exportador
from .serializers import (
    TarifaFrutaListSerializer, TarifaFrutaWriteSerializer
)


def is_heavens_user(user):
    """Check if user belongs to Heavens or Administradores group"""
    return user.groups.filter(name__in=['Heavens', 'Administradores']).exists()


class TarifaFrutaViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Tarifas Frutas (ListaPreciosFrutaExportador)
    Provides CRUD operations and comparison data
    Permission: Heavens group only
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return all tarifas with related objects"""
        user = self.request.user
        if not is_heavens_user(user):
            return ListaPreciosFrutaExportador.objects.none()
        return ListaPreciosFrutaExportador.objects.all().select_related('fruta', 'exportadora')
    
    def get_serializer_class(self):
        """Use different serializers for read/write operations"""
        if self.action in ['create', 'update', 'partial_update']:
            return TarifaFrutaWriteSerializer
        return TarifaFrutaListSerializer
    
    def list(self, request, *args, **kwargs):
        """List all prices with optional search filter"""
        if not is_heavens_user(request.user):
            return Response({'error': 'No tienes permisos'}, status=status.HTTP_403_FORBIDDEN)
        
        queryset = self.get_queryset()
        
        # Search filter
        search = request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(fruta__nombre__icontains=search) |
                Q(exportadora__nombre__icontains=search)
            )
        
        # Fruit filter
        fruta = request.query_params.get('fruta', '')
        if fruta:
            queryset = queryset.filter(fruta__nombre=fruta)
            
        # Exportador filter (optional)
        exportador = request.query_params.get('exportador', '')
        if exportador:
            queryset = queryset.filter(exportadora__nombre=exportador)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({'data': serializer.data, 'count': queryset.count()})
    
    @action(detail=False, methods=['get'])
    def comparison(self, request):
        """
        Get comparison data grouped by Fruit
        Returns rates sorted by price for each fruit to compare exporters.
        """
        if not is_heavens_user(request.user):
            return Response({'error': 'No tienes permisos'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all fruits that have prices
        frutas_ids = ListaPreciosFrutaExportador.objects.values_list('fruta_id', flat=True).distinct()
        frutas = Fruta.objects.filter(id__in=frutas_ids)
        
        comparison_data = []
        for fruta in frutas:
            precios = ListaPreciosFrutaExportador.objects.filter(fruta=fruta).select_related('exportadora')
            
            rates = []
            for p in precios:
                if p.precio_kilo:
                    trend = 'neutral'
                    if p.precio_anterior and p.precio_kilo:
                         if p.precio_kilo > p.precio_anterior:
                             trend = 'up'
                         elif p.precio_kilo < p.precio_anterior:
                             trend = 'down'
                    
                    rates.append({
                        'exportador': p.exportadora.nombre,
                        'precio': float(p.precio_kilo),
                        'trend': trend
                    })
            
            if rates:
                # Add analytics
                prices = [r['precio'] for r in rates]
                min_price = min(prices)
                max_price = max(prices)
                avg_price = sum(prices) / len(prices)
                
                comparison_data.append({
                    'fruta': fruta.nombre,
                    'rates': rates,
                    'stats': {
                        'min': min_price,
                        'max': max_price,
                        'avg': round(avg_price, 2)
                    }
                })
        
        return Response({'data': comparison_data})
    
    @action(detail=False, methods=['get'])
    def options(self, request):
        """
        Get options for form dropdowns (frutas and exportadores)
        """
        if not is_heavens_user(request.user):
            return Response({'error': 'No tienes permisos'}, status=status.HTTP_403_FORBIDDEN)
        
        frutas = Fruta.objects.all().order_by('nombre').values('id', 'nombre')
        exportadores = Exportador.objects.all().order_by('nombre').values('id', 'nombre')
        
        return Response({
            'frutas': list(frutas),
            'exportadores': list(exportadores)
        })
    
    def create(self, request, *args, **kwargs):
        """Create a new price"""
        if not is_heavens_user(request.user):
            return Response({'error': 'No tienes permisos'}, status=status.HTTP_403_FORBIDDEN)
            
        # Check uniqueness manually if needed, or rely on serializer validation/model UniqueConstraint
        # Model has unique_together = [['fruta', 'exportadora']]
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'message': 'Precio creado correctamente'})
        return Response({'success': False, 'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """Update an existing price"""
        if not is_heavens_user(request.user):
            return Response({'error': 'No tienes permisos'}, status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'message': 'Precio actualizado correctamente'})
        return Response({'success': False, 'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a price"""
        if not is_heavens_user(request.user):
            return Response({'error': 'No tienes permisos'}, status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        instance.delete()
        return Response({'success': True, 'message': 'Precio eliminado correctamente'})
