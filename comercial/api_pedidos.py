from rest_framework import viewsets, filters, mixins
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter, DateFilter
from django.db.models import Q
from .models import (
    Pedido, Cliente, Intermediario, Exportador, SubExportadora, Iata, DetallePedido,
    Fruta, Presentacion, TipoCaja, Referencias, AgenciaCarga, Aerolinea, AutorizacionCancelacion
)
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import transaction
from datetime import datetime, timedelta, date
from .serializers import (
    PedidoListSerializer, PedidoDetailSerializer, PedidoCreateSerializer,
    ClienteSerializer, IntermediarioSerializer, ExportadorSerializer,
    SubExportadoraSerializer, IataSerializer, DetallePedidoSerializer,
    FrutaSerializer, PresentacionSerializer, TipoCajaSerializer, ReferenciasSerializer,
    AgenciaCargaSerializer
)
from .forms import get_unique_weeks


class ClienteViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Cliente.objects.all().order_by('nombre')
        
        # Heavens and Autorizadores see all
        if user.groups.filter(name__in=['Heavens', 'Autorizadores']).exists():
            return queryset
        
        # Determine current user group
        user_group_names = user.groups.values_list('name', flat=True)
        exportadora_names = ['Etnico', 'Fieldex', 'Juan Matas', 'CI Dorado']
        # Map group names if necessary
        mapped_names = {
            'Juan_Matas': 'Juan Matas',
            'CI_Dorado': 'CI Dorado'
        }
        
        active_exportadora = None
        for group_name in user_group_names:
            if group_name in exportadora_names:
                active_exportadora = group_name
                break
            elif group_name in mapped_names:
                active_exportadora = mapped_names[group_name]
                break
        
        if active_exportadora:
            # Only clients with orders in this exportadora
            client_ids_with_orders = Pedido.objects.filter(
                exportadora__nombre=active_exportadora
            ).values_list('cliente_id', flat=True).distinct()
            return queryset.filter(id__in=client_ids_with_orders)
            
        return queryset.none()


class IntermediarioViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = IntermediarioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Intermediario.objects.all().order_by('nombre')
        
        if user.groups.filter(name__in=['Heavens', 'Autorizadores']).exists():
            return queryset
            
        user_group_names = user.groups.values_list('name', flat=True)
        exportadora_names = ['Etnico', 'Fieldex', 'Juan Matas', 'CI Dorado']
        mapped_names = {
            'Juan_Matas': 'Juan Matas',
            'CI_Dorado': 'CI Dorado'
        }
        
        active_exportadora = None
        for group_name in user_group_names:
            if group_name in exportadora_names:
                active_exportadora = group_name
                break
            elif group_name in mapped_names:
                active_exportadora = mapped_names[group_name]
                break
                
        if active_exportadora:
            intermediary_ids_with_orders = Pedido.objects.filter(
                exportadora__nombre=active_exportadora
            ).values_list('intermediario_id', flat=True).distinct()
            return queryset.filter(id__in=intermediary_ids_with_orders)
            
        return queryset.none()


class ExportadorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Exportador.objects.all().order_by('nombre')
    serializer_class = ExportadorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Exportador.objects.all().order_by('nombre')
        
        # Heavens and Superusers see all
        if user.is_superuser or user.groups.filter(name='Heavens').exists():
            return queryset
        
        # Determine current user group
        user_group_names = user.groups.values_list('name', flat=True)
        exportadora_names = ['Etnico', 'Fieldex', 'Juan Matas', 'CI Dorado']
        # Map group names if necessary
        mapped_names = {
            'Juan_Matas': 'Juan Matas',
            'CI_Dorado': 'CI Dorado'
        }
        
        active_exportadora = None
        for group_name in user_group_names:
            if group_name in exportadora_names:
                active_exportadora = group_name
                break
            elif group_name in mapped_names:
                active_exportadora = mapped_names[group_name]
                break
        
        if active_exportadora:
            return queryset.filter(nombre=active_exportadora)
            
        return queryset.none()


class SubExportadoraViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubExportadora.objects.all().order_by('nombre')
    serializer_class = SubExportadoraSerializer
    permission_classes = [IsAuthenticated]


class IataViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Iata.objects.all().order_by('codigo')
    serializer_class = IataSerializer
    permission_classes = [IsAuthenticated]


class AgenciaCargaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AgenciaCarga.objects.all().order_by('nombre')
    serializer_class = AgenciaCargaSerializer
    permission_classes = [IsAuthenticated]


class PedidoPagination(PageNumberPagination):
    """Custom pagination for Pedidos"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class PedidoFilter(FilterSet):
    """Custom filter for Pedidos"""
    search = CharFilter(method='filter_search')
    awb = CharFilter(field_name='awb', lookup_expr='icontains')
    pedido_id = CharFilter(field_name='id', lookup_expr='exact')
    cliente = CharFilter(field_name='cliente__nombre', lookup_expr='icontains')
    intermediario = CharFilter(field_name='intermediario__nombre', lookup_expr='icontains')
    numero_factura = CharFilter(field_name='numero_factura', lookup_expr='icontains')
    estado_pedido = CharFilter(field_name='estado_pedido', lookup_expr='exact')
    fecha_desde = DateFilter(field_name='fecha_entrega', lookup_expr='gte')
    fecha_hasta = DateFilter(field_name='fecha_entrega', lookup_expr='lte')
    exportadora = CharFilter(field_name='exportadora__nombre', lookup_expr='icontains')
    semana = CharFilter(field_name='semana', lookup_expr='exact')

    class Meta:
        model = Pedido
        fields = [
            'search', 'awb', 'pedido_id', 'cliente', 'intermediario', 
            'numero_factura', 'estado_pedido', 'fecha_desde', 'fecha_hasta',
            'exportadora', 'semana'
        ]

    def filter_search(self, queryset, name, value):
        """Custom search filter across multiple fields"""
        return queryset.filter(
            Q(id__icontains=value) |
            Q(awb__icontains=value) |
            Q(cliente__nombre__icontains=value) |
            Q(numero_factura__icontains=value)
        )


class PedidoViewSet(mixins.CreateModelMixin, mixins.UpdateModelMixin, viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for Pedidos (Orders)
    Provides list and retrieve actions with filtering and pagination
    """
    permission_classes = [IsAuthenticated]
    pagination_class = PedidoPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = PedidoFilter
    ordering_fields = ['id', 'fecha_solicitud', 'fecha_entrega']
    ordering = ['-id']

    def get_queryset(self):
        """
        Filter queryset based on user's group permissions
        """
        user = self.request.user
        queryset = Pedido.objects.all().select_related(
            'cliente', 'intermediario', 'exportadora', 'subexportadora', 'destino'
        )

        # Filter by User Group Permissions
        if user.groups.filter(name='Heavens').exists():
            # Heavens group sees all pedidos
            return queryset
        elif user.groups.filter(name='Fieldex').exists():
            return queryset.filter(exportadora__nombre='Fieldex')
        elif user.groups.filter(name='Etnico').exists():
            return queryset.filter(exportadora__nombre='Etnico')
        elif user.groups.filter(name='Juan_Matas').exists():
            return queryset.filter(exportadora__nombre='Juan Matas')
        elif user.groups.filter(name='CI_Dorado').exists():
            return queryset.filter(exportadora__nombre='CI Dorado')
        else:
            # No permission - return empty queryset
            return queryset.none()

    def perform_update(self, serializer):
        user = self.request.user
        instance = serializer.instance
        if not user.groups.filter(name='Heavens').exists():
            if instance.estado_pedido == 'Finalizado':
                raise PermissionDenied("No puedes editar pedidos finalizados.")
        serializer.save()

    @action(detail=False, methods=['get'])
    def weeks(self, request):
        """Returns unique weeks from Pedidos"""
        weeks_list = get_unique_weeks()
        # Transform from [(id, label), ...] to [{id, label}, ...]
        return Response([{"id": w[0], "label": w[1]} for w in weeks_list])

    @action(detail=False, methods=['get'], url_path='solicitudes-pendientes')
    def solicitudes_pendientes(self, request):
        if not (request.user.groups.filter(name='Heavens').exists() or request.user.groups.filter(name='Autorizadores').exists()):
            return Response([])
        
        pendientes = Pedido.objects.filter(estado_cancelacion='pendiente').select_related('cliente')
        data = [{
            'id': p.id,
            'cliente': p.cliente.nombre if p.cliente else 'Sin cliente',
            'fecha_entrega': p.fecha_entrega,
            'observaciones': p.observaciones
        } for p in pendientes]
        
        return Response(data)

    @action(detail=True, methods=['post'], url_path='solicitar-cancelacion')
    def solicitar_cancelacion(self, request, pk=None):
        pedido = self.get_object()
        observaciones = request.data.get('observaciones', '')
        
        if pedido.estado_cancelacion in ['sin_solicitud', 'no_autorizado']:
            AutorizacionCancelacion.objects.create(
                pedido=pedido,
                usuario_solicitante=request.user
            )
            pedido.estado_cancelacion = 'pendiente'
            pedido.observaciones = observaciones
            pedido.save()
            return Response({'status': 'solicitud creada', 'estado_cancelacion': 'pendiente'})
        
        return Response(
            {'error': 'No se puede solicitar cancelación en este estado'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'], url_path='gestionar-cancelacion')
    def gestionar_cancelacion(self, request, pk=None):
        pedido = self.get_object()
        accion = request.data.get('accion') # 'autorizar' or 'no_autorizar'
        observaciones = request.data.get('observaciones', '')
        
        # Check permissions - Assuming Heavens can authorize, or check for 'Autorizadores' group
        if not (request.user.groups.filter(name='Heavens').exists() or request.user.groups.filter(name='Autorizadores').exists()):
            raise PermissionDenied("No tienes permisos para autorizar cancelaciones.")

        try:
            autorizacion = AutorizacionCancelacion.objects.filter(pedido=pedido, autorizado=False).latest('fecha_solicitud')
        except AutorizacionCancelacion.DoesNotExist:
            return Response({'error': 'No hay solicitud de cancelación pendiente'}, status=status.HTTP_404_NOT_FOUND)

        if accion == 'autorizar':
            autorizacion.autorizado = True
            autorizacion.fecha_autorizacion = timezone.now()
            autorizacion.usuario_autorizador = request.user
            autorizacion.save()
            
            # Reset values as per original Django view
            pedido.estado_cancelacion = 'autorizado'
            pedido.estado_pedido = 'Cancelado'
            pedido.estado_factura = 'Cancelada'
            pedido.awb = '-'
            pedido.descuento = 0
            pedido.dias_de_vencimiento = 0
            pedido.diferencia_por_abono = 0
            pedido.documento_cobro_utilidad = 'Pedido Cancelado'
            pedido.estado_utilidad = 'Pedido Cancelado'
            pedido.numero_factura = 'Pedido Cancelado'
            pedido.tasa_representativa_usd_diaria = 0
            pedido.total_cajas_enviadas = 0
            pedido.total_peso_bruto = 0
            pedido.total_piezas_enviadas = 0
            pedido.total_piezas_solicitadas = 0
            pedido.trm_cotizacion = 0
            pedido.trm_monetizacion = 0
            pedido.utilidad_bancaria_usd = 0
            pedido.valor_total_factura_usd = 0
            pedido.valor_total_nota_credito_usd = 0
            pedido.valor_total_utilidad_usd = 0
            pedido.valor_total_recuperacion_usd = 0
            pedido.valor_utilidad_pesos = 0
            
            # Delete details
            DetallePedido.objects.filter(pedido=pedido).delete()
            
        elif accion == 'no_autorizar':
            pedido.estado_cancelacion = 'no_autorizado'

        pedido.observaciones = observaciones
        pedido.save()
        
        return Response({'status': 'actualizado', 'estado_cancelacion': pedido.estado_cancelacion})

    @action(detail=False, methods=['post'], url_path='update-expiration-days')
    def update_expiration_days(self, request):
        if not (request.user.groups.filter(name='Heavens').exists() or request.user.groups.filter(name='Autorizadores').exists()):
             return Response({'error': 'No tienes permisos'}, status=status.HTTP_403_FORBIDDEN)

        batch_size = 150
        pedidos = Pedido.objects.all().iterator(chunk_size=batch_size)
        pedidos_para_actualizar = []
        hoy = timezone.now().date()

        for pedido in pedidos:
            if pedido.fecha_pago is not None:
                pedido.dias_de_vencimiento = 0
            else:
                if isinstance(pedido.fecha_entrega, datetime):
                    fecha_entrega = pedido.fecha_entrega.date()
                elif isinstance(pedido.fecha_entrega, date):
                    fecha_entrega = pedido.fecha_entrega
                else:
                    pedido.dias_de_vencimiento = None
                    pedidos_para_actualizar.append(pedido)
                    continue

                fecha_entrega += timedelta(days=pedido.dias_cartera)
                pedido.dias_de_vencimiento = (hoy - fecha_entrega).days

            pedidos_para_actualizar.append(pedido)

            if len(pedidos_para_actualizar) >= batch_size:
                with transaction.atomic():
                    Pedido.objects.bulk_update(
                        pedidos_para_actualizar,
                        ['dias_de_vencimiento']
                    )
                pedidos_para_actualizar = []

        if pedidos_para_actualizar:
            with transaction.atomic():
                Pedido.objects.bulk_update(
                    pedidos_para_actualizar,
                    ['dias_de_vencimiento']
                )

        return Response({'status': 'success', 'message': 'Todos los pedidos se han actualizado correctamente.'})

    @action(detail=False, methods=['post'], url_path='update-trm')
    def update_trm(self, request):
        if not (request.user.groups.filter(name='Heavens').exists() or request.user.groups.filter(name='Autorizadores').exists()):
             return Response({'error': 'No tienes permisos'}, status=status.HTTP_403_FORBIDDEN)
             
        pedidos = Pedido.objects.order_by('-id')[:60]
        for pedido in pedidos:
            pedido.actualizar_tasa_representativa()
            
        return Response({'status': 'success', 'message': 'Se Actualizaron Las Tasas Con Banco De La Republica Correctamente'})

    def get_serializer_class(self):
        """Use different serializers for list and detail views"""
        if self.action == 'list':
            return PedidoListSerializer
        elif self.action == 'create':
            return PedidoCreateSerializer
        return PedidoDetailSerializer


class DetallePedidoViewSet(viewsets.ModelViewSet):
    """
    API endpoint for DetallePedido (Order Details)
    """
    serializer_class = DetallePedidoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['pedido']
    ordering_fields = ['id', 'fruta', 'presentacion']
    ordering = ['id']

    def get_queryset(self):
        """
        Filter details by order ID if provided and enforce strict group permission
        """
        user = self.request.user
        queryset = DetallePedido.objects.all().select_related(
            'pedido', 'fruta', 'presentacion', 'tipo_caja', 'referencia'
        )

        # Apply strict filtering based on parent Order permissions
        if user.groups.filter(name='Heavens').exists():
            pass # All access
        elif user.groups.filter(name='Fieldex').exists():
            queryset = queryset.filter(pedido__exportadora__nombre='Fieldex')
        elif user.groups.filter(name='Etnico').exists():
             queryset = queryset.filter(pedido__exportadora__nombre='Etnico')
        elif user.groups.filter(name='Juan_Matas').exists():
             queryset = queryset.filter(pedido__exportadora__nombre='Juan Matas')
        elif user.groups.filter(name='CI_Dorado').exists():
             queryset = queryset.filter(pedido__exportadora__nombre='CI Dorado')
        else:
             return queryset.none()
        
        # Filter by pedido_id if provided in query params
        pedido_id = self.request.query_params.get('pedido_id')
        if pedido_id:
            queryset = queryset.filter(pedido_id=pedido_id)
            
        return queryset

    def perform_create(self, serializer):
        if not self.request.user.groups.filter(name='Heavens').exists():
            raise PermissionDenied("No tienes permisos para agregar detalles.")
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.groups.filter(name='Heavens').exists():
            raise PermissionDenied("No tienes permisos para editar detalles.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.groups.filter(name='Heavens').exists():
             raise PermissionDenied("No tienes permisos para eliminar detalles.")
        instance.delete()


class FrutaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FrutaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Optionally filters frutas by pedido_id (via cliente)
        """
        queryset = Fruta.objects.all().order_by('nombre')
        pedido_id = self.request.query_params.get('pedido_id')
        if pedido_id:
            try:
                pedido = Pedido.objects.get(id=pedido_id)
                queryset = queryset.filter(
                    clientepresentacion__cliente=pedido.cliente
                ).distinct()
            except Pedido.DoesNotExist:
                queryset = Fruta.objects.none()
        return queryset


class PresentacionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PresentacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Optionally filters presentaciones by pedido_id and fruta_id
        """
        queryset = Presentacion.objects.all().order_by('nombre')
        pedido_id = self.request.query_params.get('pedido_id')
        fruta_id = self.request.query_params.get('fruta_id')

        if pedido_id and fruta_id:
            try:
                pedido = Pedido.objects.get(id=pedido_id)
                queryset = queryset.filter(
                    clientepresentacion__cliente=pedido.cliente,
                    clientepresentacion__fruta_id=fruta_id
                ).distinct()
            except Pedido.DoesNotExist:
                queryset = Presentacion.objects.none()
        return queryset


class TipoCajaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TipoCaja.objects.all().order_by('nombre')
    serializer_class = TipoCajaSerializer
    permission_classes = [IsAuthenticated]


class ReferenciasViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReferenciasSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Optionally filters referencias by presentacion, tipo_caja, fruta and pedido (exportadora)
        """
        queryset = Referencias.objects.all().order_by('nombre')
        pedido_id = self.request.query_params.get('pedido_id')
        presentacion_id = self.request.query_params.get('presentacion_id')
        tipo_caja_id = self.request.query_params.get('tipo_caja_id')
        fruta_id = self.request.query_params.get('fruta_id')

        if presentacion_id and tipo_caja_id and fruta_id and pedido_id:
            try:
                pedido = Pedido.objects.get(id=pedido_id)
                queryset = queryset.filter(
                    presentacionreferencia__presentacion_id=presentacion_id,
                    presentacionreferencia__tipo_caja_id=tipo_caja_id,
                    presentacionreferencia__fruta_id=fruta_id,
                    exportador=pedido.exportadora
                ).distinct()
            except Pedido.DoesNotExist:
                queryset = Referencias.objects.none()
        return queryset
