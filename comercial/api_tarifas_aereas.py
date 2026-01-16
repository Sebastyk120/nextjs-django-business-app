"""
API ViewSet for Tarifas Aéreas (Air Freight Rates)
Follows existing project patterns from api_pedidos.py
"""
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from .models import TarifaAerea, Aerolinea, Iata
from .serializers import (
    AerolineaSerializer, TarifaAereaListSerializer, TarifaAereaWriteSerializer
)


def is_heavens_user(user):
    """Check if user belongs to Heavens or Administradores group"""
    return user.groups.filter(name__in=['Heavens', 'Administradores']).exists()


class AerolineaViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for Aerolineas (Airlines)"""
    queryset = Aerolinea.objects.all().order_by('nombre')
    serializer_class = AerolineaSerializer
    permission_classes = [IsAuthenticated]


class TarifaAereaViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Tarifas Aéreas (Air Freight Rates)
    Provides CRUD operations and comparison data
    Permission: Heavens group only
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return all tarifas with related objects"""
        user = self.request.user
        if not is_heavens_user(user):
            return TarifaAerea.objects.none()
        return TarifaAerea.objects.all().select_related('aerolinea', 'destino')
    
    def get_serializer_class(self):
        """Use different serializers for read/write operations"""
        if self.action in ['create', 'update', 'partial_update']:
            return TarifaAereaWriteSerializer
        return TarifaAereaListSerializer
    
    def list(self, request, *args, **kwargs):
        """List all tarifas with optional search filter"""
        if not is_heavens_user(request.user):
            return Response({'error': 'No tienes permisos'}, status=status.HTTP_403_FORBIDDEN)
        
        queryset = self.get_queryset()
        
        # Search filter
        search = request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(aerolinea__nombre__icontains=search) |
                Q(destino__codigo__icontains=search) |
                Q(destino__ciudad__icontains=search)
            )
        
        # Airline filter
        aerolinea = request.query_params.get('aerolinea', '')
        if aerolinea:
            queryset = queryset.filter(aerolinea__nombre=aerolinea)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({'data': serializer.data, 'count': queryset.count()})
    
    @action(detail=False, methods=['get'])
    def comparison(self, request):
        """
        Get comparison data grouped by destination
        Returns rates sorted by price for each destination
        """
        if not is_heavens_user(request.user):
            return Response({'error': 'No tienes permisos'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all destinations that have tarifas
        destinos = Iata.objects.filter(tarifaaerea__isnull=False).distinct()
        
        comparison_data = []
        for destino in destinos:
            tarifas = TarifaAerea.objects.filter(
                destino=destino, 
                es_activa=True
            ).select_related('aerolinea')
            
            rates = [
                {
                    'aerolinea': t.aerolinea.nombre,
                    'tarifa': float(t.tarifa_por_kilo)
                }
                for t in tarifas
            ]
            
            if rates:
                comparison_data.append({
                    'destino': f"{destino.codigo} - {destino.ciudad}",
                    'rates': rates
                })
        
        return Response({'data': comparison_data})
    
    @action(detail=False, methods=['get'])
    def options(self, request):
        """
        Get options for form dropdowns (aerolineas and destinos)
        """
        if not is_heavens_user(request.user):
            return Response({'error': 'No tienes permisos'}, status=status.HTTP_403_FORBIDDEN)
        
        aerolineas = Aerolinea.objects.all().order_by('nombre').values('id', 'codigo', 'nombre')
        destinos = Iata.objects.all().order_by('codigo').values('id', 'codigo', 'ciudad')
        
        return Response({
            'aerolineas': list(aerolineas),
            'destinos': list(destinos)
        })
    
    def create(self, request, *args, **kwargs):
        """Create a new tarifa"""
        if not is_heavens_user(request.user):
            return Response({'error': 'No tienes permisos'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'message': 'Tarifa creada correctamente'})
        return Response({'success': False, 'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """Update an existing tarifa"""
        if not is_heavens_user(request.user):
            return Response({'error': 'No tienes permisos'}, status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'message': 'Tarifa actualizada correctamente'})
        return Response({'success': False, 'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a tarifa"""
        if not is_heavens_user(request.user):
            return Response({'error': 'No tienes permisos'}, status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        instance.delete()
        return Response({'success': True, 'message': 'Tarifa eliminada correctamente'})
