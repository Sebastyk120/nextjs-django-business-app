from django.contrib import admin
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils.html import format_html
from import_export.admin import ImportExportModelAdmin
from simple_history.admin import SimpleHistoryAdmin
from unfold.contrib.import_export.forms import ImportForm, SelectableFieldsExportForm
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.filters.admin import AutocompleteSelectFilter
from django import forms
import math
from django.urls import path, reverse
from django.views.generic import TemplateView
from unfold.views import UnfoldModelAdminViewMixin
from django.shortcuts import render, redirect
from django.contrib import messages
from django.utils import timezone
from decimal import Decimal

from .models import (
    Pedido, Fruta, Iata, TipoCaja, Cliente, Presentacion, Contenedor, DetallePedido,
    Referencias, Exportador, ClientePresentacion, AutorizacionCancelacion, AgenciaCarga,
    Aerolinea, Intermediario, SubExportadora, PresentacionReferencia,
    Insumo, PresentacionInsumoCliente, CostoPresentacionCliente,
    CostosUnicosEmbarque, CostosEstibado, ListaPreciosFrutaExportador, TarifaAerea,
    CotizacionConjuntaHistorico
)
from .resources import (
    ClienteResource, PedidoResource, FrutaResource, DetallePedidoResource, ContenedorResource,
    IataResource, PresentacionResource, ReferenciasResource, ExportadorResource, TipoCajaResource,
    ClientePresentacionResource, AutorizacionCancelacionResource, AgenciaCargaResource, AerolineaResource,
    IntermediarioResource, SubExportadoraResource, PresentacionReferenciaResource
)

User = get_user_model()

# ----------------------------------------------------------------------------
# INLINE: DetallePedidoInline en PedidoAdmin
# ----------------------------------------------------------------------------
class DetallePedidoInline(TabularInline):
    """
    Para editar DetallePedido directamente desde el Pedido.
    """
    model = DetallePedido
    extra = 0
    fields = ('fruta', 'presentacion', 'cajas_solicitadas', 'cajas_enviadas', 'diferencia', 'valor_x_caja_usd')
    readonly_fields = ('diferencia',)
    show_change_link = True
    classes = ("collapse",)
    verbose_name = "Detalle del pedido"
    verbose_name_plural = "Detalles del pedido"
    max_num = 20

# ----------------------------------------------------------------------------
# PEDIDO ADMIN
# ----------------------------------------------------------------------------
@admin.register(Pedido)
class PedidoAdmin(ModelAdmin, ImportExportModelAdmin, SimpleHistoryAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = PedidoResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm

    campos_no_editables = [field.name for field in Pedido._meta.fields if not field.editable]
    campos_editables = [field.name for field in Pedido._meta.fields if field.editable]

    list_display = (
        'id', 'cliente', 'fecha_entrega', 'estado_pedido',
        'awb', 'numero_factura', 'estado_factura',
        'valor_total_factura_usd', 'view_history'
    )
    list_filter = ('estado_pedido', 'exportadora', 'estado_factura', 'fecha_entrega')
    ordering = ('-id',)
    search_fields = (
        'id',
        'awb',
        'numero_factura',
        'cliente__nombre',
    )
    search_help_text = 'Buscar por número de pedido, AWB, factura o nombre del cliente.'

    inlines = [DetallePedidoInline]

    def get_queryset(self, request):
        """
        Sobrescribimos el queryset para cargar relaciones con select_related/prefetch_related.
        """
        qs = super().get_queryset(request)
        return (
            qs.select_related(
                'cliente',
                'intermediario',
                'exportadora',
                'subexportadora',
                'destino',
                'responsable_reserva',
                'agencia_carga',
                'aerolinea',
            )
            .prefetch_related('detallepedido_set')
        )

    def view_history(self, obj):
        url = reverse(
            'admin:%s_%s_history' % (obj._meta.app_label, obj._meta.model_name),
            args=[obj.pk]
        )
        return format_html('<a href="{}">Historial</a>', url)

    view_history.short_description = "Ver Historial"

# ----------------------------------------------------------------------------
# DETALLE PEDIDO ADMIN
# ----------------------------------------------------------------------------
@admin.register(DetallePedido)
class DetallePedidoAdmin(ModelAdmin, ImportExportModelAdmin, SimpleHistoryAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = DetallePedidoResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm

    campos_no_editables = [field.name for field in DetallePedido._meta.fields if not field.editable]
    campos_editables = [field.name for field in DetallePedido._meta.fields if field.editable]

    list_display = (
        'id', 'pedido', 'fruta', 'presentacion',
        'cajas_solicitadas', 'cajas_enviadas', 'diferencia',
        'valor_x_caja_usd', 'valor_x_producto',
        'view_history'
    )
    list_filter = ('fruta', 'presentacion', 'tipo_caja', 'referencia')
    ordering = ('-pedido__id',)
    search_fields = (
        'pedido__id',
    )
    search_help_text = 'Buscar únicamente por # de pedido.'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return (
            qs.select_related(
                'pedido',
                'fruta',
                'presentacion',
                'tipo_caja',
                'referencia',
            )
        )

    def view_history(self, obj):
        url = reverse(
            'admin:%s_%s_history' % (obj._meta.app_label, obj._meta.model_name),
            args=[obj.pk]
        )
        return format_html('<a href="{}">Historial</a>', url)

    view_history.short_description = "Ver Historial"

# ----------------------------------------------------------------------------
# CLIENTE ADMIN
# ----------------------------------------------------------------------------
@admin.register(Cliente)
class ClienteAdmin(ModelAdmin, ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = ClienteResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm
    list_display = (
        "nombre",
        "direccion",
        "ciudad",
        "destino_iata",
        "tax_id",
        "incoterm",
        "correo",
        "telefono",
        "intermediario",
        "negociaciones_cartera"
    )
    search_fields = (
        "nombre",
        "ciudad",
        "intermediario"
    )
    search_help_text = "Buscar por nombre del cliente, intermediario o ciudad."
    list_filter = (
        "ciudad",
        "destino_iata",
        "incoterm",
        "negociaciones_cartera"
    )
    ordering = ("nombre",)
    list_per_page = 20

# ----------------------------------------------------------------------------
# EXPORTADOR ADMIN
# ----------------------------------------------------------------------------
@admin.register(Exportador)
class ExportadorAdmin(ModelAdmin, ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = ExportadorResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm
    search_fields = ('nombre',)
    search_help_text = 'Buscar por nombre de exportador'

# ----------------------------------------------------------------------------
# CONTENEDOR ADMIN
# ----------------------------------------------------------------------------
@admin.register(Contenedor)
class ContenedorAdmin(ModelAdmin, ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = ContenedorResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm

# ----------------------------------------------------------------------------
# FRUTA ADMIN
# ----------------------------------------------------------------------------
@admin.register(Fruta)
class FrutaAdmin(ModelAdmin, ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = FrutaResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm
    search_fields = ('nombre',)
    search_help_text = 'Buscar por nombre de fruta'

# ----------------------------------------------------------------------------
# IATA ADMIN
# ----------------------------------------------------------------------------
@admin.register(Iata)
class IataAdmin(ModelAdmin, ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = IataResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm
    search_fields = ('codigo', 'ciudad', 'pais')
    search_help_text = 'Buscar por código IATA, ciudad o país'

# ----------------------------------------------------------------------------
# PRESENTACION ADMIN
# ----------------------------------------------------------------------------
@admin.register(Presentacion)
class PresentacionAdmin(ModelAdmin, ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = PresentacionResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm

    list_display = ('nombre', 'kilos')
    search_fields = ('nombre',)
    search_help_text = 'Buscar por nombre de presentación.'
    ordering = ('nombre',)

# ----------------------------------------------------------------------------
# REFERENCIAS ADMIN
# ----------------------------------------------------------------------------
@admin.register(Referencias)
class ReferenciasAdmin(ModelAdmin, ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = ReferenciasResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm
    list_filter = ('exportador',)
    list_display = (
        'nombre', 'exportador', 'referencia_nueva',
        'cantidad_pallet_con_contenedor', 'cantidad_pallet_sin_contenedor',
        'porcentaje_peso_bruto', 'precio'
    )
    search_fields = ('nombre',)
    search_help_text = 'Buscar por nombre de referencia'

# ----------------------------------------------------------------------------
# TIPO CAJA ADMIN
# ----------------------------------------------------------------------------
@admin.register(TipoCaja)
class TipoCajaAdmin(ModelAdmin, ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = TipoCajaResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm
    search_fields = ('nombre',)
    search_help_text = 'Buscar por nombre de tipo de caja'

# ----------------------------------------------------------------------------
# FILTRO PERSONALIZADO PARA CLIENTE PRESENTACION
# ----------------------------------------------------------------------------
class ClienteListFilter(admin.SimpleListFilter):
    title = 'cliente'
    parameter_name = 'cliente'

    def lookups(self, request, model_admin):
        clientes_con_presentacion = (
            Cliente.objects.filter(presentaciones_config__isnull=False).distinct()
        )
        return [(cliente.id, cliente.nombre) for cliente in clientes_con_presentacion]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(cliente__id=self.value())
        return queryset

class PresentacionInsumoClienteInline(TabularInline):
    model = PresentacionInsumoCliente
    extra = 1
    autocomplete_fields = ['insumo']
    show_change_link = True


class CostoPresentacionClienteInline(TabularInline):
    model = CostoPresentacionCliente
    extra = 0
    fields = ('mano_obra_cop', 'deshidratacion_fruta', 'margen_adicional_usd', 'es_activo')
    show_change_link = True

# ----------------------------------------------------------------------------
# CLIENTE PRESENTACION ADMIN
# ----------------------------------------------------------------------------
@admin.register(ClientePresentacion)
class ClientePresentacionAdmin(ModelAdmin, ImportExportModelAdmin):
    list_filter = ('cliente', 'fruta', 'presentacion', 'exportador')
    list_display = ('cliente', 'fruta', 'presentacion', 'exportador', 'acciones')
    import_error_display = ("message", "row", "traceback")
    resource_class = ClientePresentacionResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm
    search_fields = ('cliente__nombre',)
    search_help_text = 'Buscar por cliente'
    autocomplete_fields = ['cliente']
    inlines = [PresentacionInsumoClienteInline, CostoPresentacionClienteInline]

    def get_urls(self):
        urls = super().get_urls()
        custom_view = self.admin_site.admin_view(
            CotizacionConjuntaView.as_view(model_admin=self)
        )
        custom = [
            path('cotizacion-conjunta/', custom_view, name='comercial_cotizacion_conjunta'),
        ]
        return custom + urls

    def acciones(self, obj):
        url = reverse('admin:comercial_clientepresentacion_change', args=[obj.pk])
        return format_html('<a class="button" href="{}">Editar</a>', url)
    acciones.short_description = 'Acciones'

    class ClientePresentacionForm(forms.ModelForm):
        class Meta:
            model = ClientePresentacion
            fields = '__all__'

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            exportador_id = None
            try:
                if self.data and 'exportador' in self.data:
                    exportador_id = int(self.data.get('exportador'))
                elif self.initial.get('exportador'):
                    exportador_id = int(self.initial.get('exportador'))
                elif getattr(self.instance, 'exportador_id', None):
                    exportador_id = self.instance.exportador_id
            except Exception:
                exportador_id = None

            if exportador_id:
                self.fields['referencia'].queryset = Referencias.objects.filter(exportador_id=exportador_id)
            else:
                self.fields['referencia'].queryset = Referencias.objects.none()

    form = ClientePresentacionForm

# ----------------------------------------------------------------------------
# AUTORIZACION CANCELACION ADMIN
# ----------------------------------------------------------------------------
@admin.register(AutorizacionCancelacion)
class AutorizacionCancelacionAdmin(ModelAdmin, ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = AutorizacionCancelacionResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm
    list_display = (
        'pedido', 'usuario_solicitante', 'usuario_autorizador',
        'autorizado', 'fecha_solicitud', 'fecha_autorizacion'
    )

# ----------------------------------------------------------------------------
# AEROLINEA ADMIN
# ----------------------------------------------------------------------------
@admin.register(Aerolinea)
class AerolineaAdmin(ModelAdmin, ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = AerolineaResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm
    search_fields = ('nombre',)
    search_help_text = 'Buscar por nombre de aerolínea'

# ----------------------------------------------------------------------------
# AGENCIA CARGA ADMIN
# ----------------------------------------------------------------------------
@admin.register(AgenciaCarga)
class AgenciaCargaAdmin(ModelAdmin, ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = AgenciaCargaResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm

# ----------------------------------------------------------------------------
# INTERMEDIARIO ADMIN
# ----------------------------------------------------------------------------
@admin.register(Intermediario)
class IntermediarioAdmin(ModelAdmin, ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = IntermediarioResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm

# ----------------------------------------------------------------------------
# SUBEXPORTADORA ADMIN
# ----------------------------------------------------------------------------
@admin.register(SubExportadora)
class SubExportadoraAdmin(ModelAdmin, ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = SubExportadoraResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm

# ----------------------------------------------------------------------------
# PRESENTACION REFERENCIA ADMIN
# ----------------------------------------------------------------------------
@admin.register(PresentacionReferencia)
class PresentacionReferenciaAdmin(ModelAdmin, ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = PresentacionReferenciaResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm
    list_filter = ('fruta', 'tipo_caja', 'presentacion', 'referencia')
    list_display = ('fruta', 'tipo_caja', 'presentacion', 'referencia')
    search_fields = ('referencia__nombre',)
    search_help_text = 'Buscar por nombre de referencia'


# ============================================================================
#  NUEVOS MODELOS DE COSTOS Y ESTRUCTURA
# ============================================================================

@admin.register(Insumo)
class InsumoAdmin(ModelAdmin, ImportExportModelAdmin):
    list_display = ('nombre', 'unidad_medida', 'precio')
    search_fields = ('nombre',)
    search_help_text = 'Buscar por nombre de insumo'


# Eliminado: flujo de plantillas de insumos por presentación


# Eliminado del panel: plantillas de insumos no se usan más




@admin.register(PresentacionInsumoCliente)
class PresentacionInsumoClienteAdmin(ModelAdmin, ImportExportModelAdmin):
    list_display = ('cliente_presentacion', 'insumo', 'cantidad', 'costo_total')
    list_filter = ('cliente_presentacion__cliente',)
    search_fields = ('cliente_presentacion__cliente__nombre', 'insumo__nombre')
    search_help_text = 'Buscar por cliente o nombre de insumo'
    autocomplete_fields = ['cliente_presentacion', 'insumo']


@admin.register(CostosUnicosEmbarque)
class CostosUnicosEmbarqueAdmin(ModelAdmin, ImportExportModelAdmin):
    list_display = ('aerolinea', 'destino', 'transporte_aeropuerto', 'termo', 'precinto', 'aduana', 'comision_bancaria', 'due_agent_usd', 'due_carrier_usd', 'fito_usd', 'certificado_origen_usd')
    list_filter = ('aerolinea', 'destino')
    search_fields = ('aerolinea__nombre', 'destino__codigo')
    search_help_text = 'Buscar por nombre de aerolínea o código de destino'
    
    fieldsets = (
        ('Ruta', {
            'fields': ('aerolinea', 'destino')
        }),
        ('Costos Base (COP) - Aplica FOB y CIF', {
            'fields': ('transporte_aeropuerto', 'termo', 'precinto', 'aduana', 'comision_bancaria')
        }),
        ('Costos Adicionales CIF (USD) - Solo aplica para negociación CIF', {
            'fields': ('due_agent_usd', 'due_carrier_usd', 'fito_usd', 'certificado_origen_usd'),
            'description': 'Estos costos están en USD y solo se aplican en negociaciones CIF.'
        }),
        ('Estado', {
            'fields': ('es_activo',)
        }),
    )


@admin.register(CostosEstibado)
class CostosEstibadoAdmin(ModelAdmin, ImportExportModelAdmin):
    list_display = ('nombre', 'estiba', 'malla_tela', 'malla_termica', 'esquineros_zuncho', 'entrega', 'costo_total', 'es_activo', 'fecha_actualizacion')
    search_fields = ('nombre',)
    search_help_text = 'Buscar por nombre'
    list_filter = ('es_activo',)


@admin.register(ListaPreciosFrutaExportador)
class ListaPreciosFrutaExportadorAdmin(ModelAdmin, ImportExportModelAdmin):
    list_display = ('exportadora', 'fruta', 'precio_kilo', 'fecha', 'precio_anterior')
    list_filter = ('exportadora', 'fruta')
    search_fields = ('exportadora__nombre', 'fruta__nombre')
    search_help_text = 'Buscar por nombre de exportadora o nombre de fruta'


@admin.register(TarifaAerea)
class TarifaAereaAdmin(ModelAdmin, ImportExportModelAdmin):
    list_display = ('aerolinea', 'destino', 'tarifa_por_kilo', 'fecha', 'es_activa')
    list_filter = ('aerolinea', 'destino', 'es_activa')
    search_fields = ('aerolinea__nombre', 'destino__codigo')
    search_help_text = 'Buscar por nombre de aerolínea o código de destino'


# ----------------------------------------------------------------------------
# COTIZACION CONJUNTA HISTORICO ADMIN
# ----------------------------------------------------------------------------
@admin.register(CotizacionConjuntaHistorico)
class CotizacionConjuntaHistoricoAdmin(ModelAdmin):
    list_display = (
        'numero_cotizacion', 'cliente', 'destino', 'aerolinea',
        'tipo_negociacion', 'total_cajas', 'total_pallets',
        'trm', 'utilidad_general_pct', 'fecha_aprobacion', 'usuario'
    )
    list_filter = ('tipo_negociacion', 'cliente', 'aerolinea', 'destino', 'fecha_aprobacion')
    search_fields = (
        'numero_cotizacion',
        'cliente__nombre',
        'aerolinea__nombre',
        'destino__codigo',
    )
    search_help_text = 'Buscar por número de cotización, cliente, aerolínea o destino'
    ordering = ('-fecha_aprobacion',)
    date_hierarchy = 'fecha_aprobacion'
    readonly_fields = (
        'numero_cotizacion', 'cliente', 'aerolinea', 'destino',
        'tipo_negociacion', 'trm', 'utilidad_general_pct', 'heavens_pct', 'exportador_pct',
        'total_cajas', 'total_pallets', 'estibado_por_caja_usd',
        'cabecera_snapshot', 'costos_globales_snapshot', 'items_snapshot', 'totales_snapshot',
        'fecha_creacion', 'fecha_aprobacion', 'usuario'
    )
    
    fieldsets = (
        ('Identificación', {
            'fields': ('numero_cotizacion', 'fecha_aprobacion', 'usuario')
        }),
        ('Configuración de la Cotización', {
            'fields': (
                'cliente', 'aerolinea', 'destino', 'tipo_negociacion',
                'trm', 'utilidad_general_pct', 'heavens_pct', 'exportador_pct'
            )
        }),
        ('Totales', {
            'fields': ('total_cajas', 'total_pallets', 'estibado_por_caja_usd')
        }),
        ('Snapshot Cabecera', {
            'fields': ('cabecera_snapshot',),
            'classes': ('collapse',)
        }),
        ('Snapshot Costos Globales', {
            'fields': ('costos_globales_snapshot',),
            'classes': ('collapse',)
        }),
        ('Snapshot Items', {
            'fields': ('items_snapshot',),
            'classes': ('collapse',)
        }),
        ('Snapshot Totales', {
            'fields': ('totales_snapshot',),
            'classes': ('collapse',)
        }),
        ('Notas', {
            'fields': ('notas',)
        }),
    )
    
    def has_add_permission(self, request):
        # No permitir agregar manualmente, solo a través de la aprobación
        return False
    
    def has_change_permission(self, request, obj=None):
        # Solo permitir ver, no editar (excepto notas)
        return True
    
    def has_delete_permission(self, request, obj=None):
        # Permitir eliminar solo a superusuarios
        return request.user.is_superuser


@admin.register(CostoPresentacionCliente)
class CostoPresentacionClienteAdmin(ModelAdmin, ImportExportModelAdmin, SimpleHistoryAdmin):
    list_display = ('cliente_presentacion', 'costo_insumos', 'costo_fruta_por_caja', 'precio_final_calculado', 'aprobada', 'fecha_aprobacion')
    list_filter = (["cliente_presentacion", AutocompleteSelectFilter], 'aprobada')
    search_fields = (
        'cliente_presentacion__cliente__nombre',
        'cliente_presentacion__presentacion__nombre',
        'cliente_presentacion__fruta__nombre',
        'cliente_presentacion__exportador__nombre',
    )
    search_help_text = 'Buscar por cliente, presentación, fruta o exportador'
    autocomplete_fields = ['cliente_presentacion']
    readonly_fields = ('costo_insumos', 'costo_fruta_por_caja', 'costo_contenedor_por_caja', 'costo_estibado_por_caja', 'desglose_aprobado')
    
    fieldsets = (
        ('Información Base', {
            'fields': ('cliente_presentacion', 'es_activo')
        }),
        ('Configuración de Precios', {
            'fields': ('margen_adicional_usd', 'mano_obra_cop', 'deshidratacion_fruta')
        }),
        ('Estado de Aprobación', {
            'fields': ('aprobada', 'fecha_aprobacion', 'trm_aprobacion', 'desglose_aprobado'),
            'classes': ('collapse',)
        }),
        ('Costos Calculados (Referencia)', {
            'fields': ('costo_insumos', 'costo_fruta_por_caja', 'costo_contenedor_por_caja', 'costo_estibado_por_caja'),
            'classes': ('collapse',)
        }),
    )

    actions = ['aprobar_cotizacion']

    def get_urls(self):
        return super().get_urls()

    def _to_jsonable(self, value):
        if isinstance(value, Decimal):
            return float(value)
        if isinstance(value, dict):
            return {k: self._to_jsonable(v) for k, v in value.items()}
        if isinstance(value, (list, tuple)):
            return [self._to_jsonable(v) for v in value]
        return value

    def precio_final_calculado(self, obj):
        try:
            if obj.aprobada and isinstance(obj.desglose_aprobado, dict):
                cajas = obj.desglose_aprobado.get('total_cajas') or 1
                per_caja = Decimal(str(obj.desglose_aprobado.get('precio_final_usd') or 0))
                total = per_caja * Decimal(str(cajas))
                trm = obj.trm_aprobacion or Decimal('0')
                return f"${per_caja:.2f} (TRM {trm}, prorrateo {cajas} cajas, total ${total:.2f})"
            trm = obj.trm_aprobacion or Decimal('4000')
            res = obj.calcular_precio_venta(total_cajas_pedido=1, trm=trm)
            return f"${res['precio_final_usd']:.2f} (TRM {trm}, prorrateo 1 caja)"
        except:
            return "-"
    precio_final_calculado.short_description = "Precio Venta Est."

    def aprobar_cotizacion(self, request, queryset):
        # Si se ha enviado el formulario con la TRM
        if 'apply' in request.POST:
            trm_str = request.POST.get('trm')
            cajas_str = request.POST.get('total_cajas', '1')
            try:
                trm = Decimal(trm_str)
                total_cajas = int(cajas_str) if str(cajas_str).isdigit() else 1
                count = 0
                for obj in queryset:
                    # Calcular y congelar
                    desglose = obj.get_desglose_costos(total_cajas_pedido=total_cajas, trm=trm)
                    desglose = self._to_jsonable(desglose)
                    desglose['total_cajas'] = total_cajas
                    precio = obj.calcular_precio_venta(total_cajas_pedido=total_cajas, trm=trm)
                    precio = self._to_jsonable(precio)
                    desglose['precio_final_usd'] = precio.get('precio_final_usd')
                    # Actualizar objeto
                    obj.trm_aprobacion = trm
                    obj.fecha_aprobacion = timezone.now()
                    obj.desglose_aprobado = desglose
                    obj.aprobada = True
                    obj.save()
                    count += 1
                
                self.message_user(request, f"Se aprobaron {count} cotizaciones con TRM {trm}.", messages.SUCCESS)
                return redirect(request.get_full_path())
            except Exception as e:
                self.message_user(request, f"Error al procesar: {str(e)}", messages.ERROR)
                return redirect(request.get_full_path())

        # Si no, mostrar página intermedia
        context = {
            'queryset': queryset,
            'opts': self.model._meta,
        }
        return render(request, 'admin/comercial/costopresentacioncliente/aprobar_cotizacion.html', context)

    aprobar_cotizacion.short_description = "Aprobar Cotización (Congelar Costos)"

class CotizacionConjuntaView(UnfoldModelAdminViewMixin, TemplateView):
    title = "Cotización Conjunta"
    permission_required = ()
    template_name = 'admin/comercial/cotizacion_conjunta.html'
    http_method_names = ['get', 'post']

    def get_context_data(self, **kwargs):
        request = self.request
        clientes = Cliente.objects.all().order_by('nombre')
        aerolineas = Aerolinea.objects.all().order_by('nombre')
        destinos = Iata.objects.all().order_by('codigo')

        cliente_id = request.GET.get('cliente') or request.POST.get('cliente')
        aerolinea_id = request.GET.get('aerolinea') or request.POST.get('aerolinea')
        destino_id = request.GET.get('destino') or request.POST.get('destino')
        tipo_negociacion = request.GET.get('tipo_negociacion') or request.POST.get('tipo_negociacion') or 'CIF'
        trm_str = request.GET.get('trm') or request.POST.get('trm') or '4000'
        utilidad_general_str = request.GET.get('utilidad_general_pct') or request.POST.get('utilidad_general_pct') or '15'
        heavens_pct_str = request.GET.get('heavens_pct') or request.POST.get('heavens_pct') or '35'
        exportador_pct_str = request.GET.get('exportador_pct') or request.POST.get('exportador_pct') or '65'

        cps = ClientePresentacion.objects.none()
        if cliente_id:
            cps = ClientePresentacion.objects.filter(cliente_id=cliente_id).select_related('fruta', 'presentacion', 'referencia')

        distribucion = {}
        cont_map = {}
        total_cajas = 0
        if request.method == 'POST':
            for cp in cps:
                val = request.POST.get(f'cajas_{cp.id}', '0')
                try:
                    n = int(val)
                except Exception:
                    n = 0
                cp.entered_boxes = val
                cont_map[cp.id] = bool(request.POST.get(f'cont_{cp.id}', ''))
                if n > 0:
                    distribucion[cp.id] = n
                    total_cajas += n

        trm = Decimal(trm_str or '4000')
        utilidad_general_pct = Decimal(utilidad_general_str or '15')
        heavens_pct = Decimal(heavens_pct_str or '35')
        exportador_pct = Decimal(exportador_pct_str or '65')

        rows = []
        total_pallets = 0
        errores_map = {}
        cp_map = {cp.id: cp for cp in cps}
        tarifa_activa = False
        global_errors = []
        if aerolinea_id and destino_id:
            tarifa_activa = TarifaAerea.objects.filter(aerolinea_id=aerolinea_id, destino_id=destino_id, es_activa=True).exists()
            if tipo_negociacion == 'CIF' and not tarifa_activa:
                a = Aerolinea.objects.filter(id=aerolinea_id).first()
                d = Iata.objects.filter(id=destino_id).first()
                global_errors.append(f'No se calculará CIF: tarifa aérea no disponible o inactiva para Aerolínea "{a.nombre if a else aerolinea_id}" y Destino "{d.codigo if d else destino_id}"')
        if total_cajas > 0:
            suma_frac_pallets = Decimal('0')
            suma_costos_pallet_ponderado = Decimal('0')
            for cp in cps:
                cajas_item = distribucion.get(cp.id, 0)
                if cajas_item <= 0:
                    continue
                ref = cp.referencia
                use_cont = cont_map.get(cp.id, bool(ref.contenedor) if ref else False)
                cpc = CostoPresentacionCliente.objects.filter(cliente_presentacion=cp).first()
                if not cpc:
                    continue
                v = cpc.validar_campos_para_calculo(use_cont)
                if not v['ok']:
                    errores_map[cp.id] = v['errores']
                    continue
                cap = (ref.cantidad_pallet_con_contenedor if use_cont else ref.cantidad_pallet_sin_contenedor)
                frac = Decimal(cajas_item) / Decimal(cap)
                suma_frac_pallets += frac
                # Obtener costos de estibado generales (ya no depende de referencia)
                ce = CostosEstibado.objects.filter(es_activo=True).first()
                costo_pallet_cop = ce.costo_total if ce else Decimal('0')
                costo_pallet_usd = (costo_pallet_cop / (trm or Decimal('1')))
                suma_costos_pallet_ponderado += (costo_pallet_usd * frac)

            total_pallets = int(math.ceil(float(suma_frac_pallets)))
            costo_prom_pallet_usd_global = (suma_costos_pallet_ponderado / suma_frac_pallets) if suma_frac_pallets else Decimal('0')
            estibado_por_caja_usd_global = (Decimal(total_pallets) * costo_prom_pallet_usd_global / Decimal(total_cajas)) if total_cajas else Decimal('0')

            for cp in cps:
                cajas_item = distribucion.get(cp.id, 0)
                if cajas_item <= 0:
                    continue
                ref = cp.referencia
                use_cont = cont_map.get(cp.id, bool(ref.contenedor) if ref else False)
                cpc = CostoPresentacionCliente.objects.filter(cliente_presentacion=cp).first()
                if not cpc:
                    continue
                v = cpc.validar_campos_para_calculo(use_cont)
                if not v['ok']:
                    errores_map[cp.id] = v['errores']
                    continue
                cap = (ref.cantidad_pallet_con_contenedor if use_cont else ref.cantidad_pallet_sin_contenedor)
                d = cpc.get_desglose_costos(total_cajas_pedido=total_cajas, trm=trm, cajas_item=cajas_item, use_contenedor=use_cont, aerolinea_id=aerolinea_id, destino_id=destino_id)
                base_otros = d['insumos_usd'] + d['fruta_usd'] + d['referencia_usd'] + d['contenedor_usd'] + d['mano_obra_usd'] + d['costos_embarque_base_usd']
                base_usd_caja = base_otros + estibado_por_caja_usd_global
                include_cif = (tipo_negociacion == 'CIF' and tarifa_activa)
                cif_usd_caja = (base_usd_caja + d['costos_cif_usd'] + d['tarifa_aerea_usd']) if include_cif else None
                kilos_base = cp.presentacion.kilos or Decimal('1')
                pct_deshidratacion = cpc.deshidratacion_fruta or Decimal('0')
                pct_peso_bruto = ref.porcentaje_peso_bruto or Decimal('0')
                # Kilos CIF = kilos netos × (1 + deshidratación%) × (1 + peso_bruto%)
                factor_deshidratacion = (Decimal('1') + (pct_deshidratacion / Decimal('100')))
                factor_peso_bruto = (Decimal('1') + (pct_peso_bruto / Decimal('100')))
                kilos_cif = kilos_base * factor_deshidratacion * factor_peso_bruto
                fob_kg = base_usd_caja / kilos_base
                cif_kg = (cif_usd_caja / kilos_cif) if include_cif else None
                fob_box = base_usd_caja
                margen_adicional = cpc.margen_adicional_usd or Decimal('0')
                
                # Nueva lógica de utilidad:
                # 1. Calcular utilidad general sobre FOB (ej: 15%)
                # 2. La utilidad se divide en Heavens (35%) y Exportador (65%)
                # 3. CIF suma costos adicionales SIN afectar la utilidad
                
                # Cálculo de precio FOB con utilidad general
                denom_utilidad = (Decimal('1') - (utilidad_general_pct / Decimal('100')))
                denom_utilidad = denom_utilidad if denom_utilidad > 0 else Decimal('1')
                precio_final_fob = (fob_box / denom_utilidad) + margen_adicional
                
                # La utilidad total es sobre FOB (no cambia con CIF)
                utilidad_total = precio_final_fob - fob_box - margen_adicional
                util_heavens = utilidad_total * (heavens_pct / Decimal('100'))
                util_exportador = utilidad_total * (exportador_pct / Decimal('100'))
                
                # Para CIF: agregar costos CIF al precio FOB (sin afectar utilidad)
                costos_adicionales_cif = (d['costos_cif_usd'] + d['tarifa_aerea_usd']) if include_cif else Decimal('0')
                precio_final_cif = (precio_final_fob + costos_adicionales_cif) if include_cif else None

                rows.append({
                    'cp': cp,
                    'kilos': kilos_base,
                    'kilos_cif': float(kilos_cif) if include_cif else None,
                    'pct_peso_bruto': float(pct_peso_bruto),
                    'boxes': cajas_item,
                    'pallets_item': math.ceil(cajas_item / cap),
                    'fob_kg': float(fob_kg),
                    'cif_kg': float(cif_kg) if include_cif else None,
                    'fob_box': float(fob_box),
                    'cif_box': float(cif_usd_caja) if include_cif else None,
                    'use_cont': use_cont,
                    'precio_final_fob': float(precio_final_fob),
                    'precio_final_cif': float(precio_final_cif) if include_cif else None,
                    'util_heavens': float(util_heavens),
                    'util_exportador': float(util_exportador),
                    'utilidad_total': float(utilidad_total),
                })

            # Aprobación en lote
            if self.request.POST.get('aprobar') == '1':
                def to_jsonable(value):
                    if isinstance(value, Decimal):
                        return float(value)
                    if isinstance(value, dict):
                        return {k: to_jsonable(v) for k, v in value.items()}
                    if isinstance(value, (list, tuple)):
                        return [to_jsonable(v) for v in value]
                    return value

                aprobadas = 0
                for cp in cps:
                    cajas_item = distribucion.get(cp.id, 0)
                    if cajas_item <= 0:
                        continue
                    cpc = CostoPresentacionCliente.objects.filter(cliente_presentacion=cp).first()
                    if not cpc:
                        continue
                    use_cont = cont_map.get(cp.id, bool(cp.referencia.contenedor) if cp.referencia else False)
                    v = cpc.validar_campos_para_calculo(use_cont)
                    if not v['ok']:
                        errores_map[cp.id] = v['errores']
                        continue
                    d = cpc.get_desglose_costos(total_cajas_pedido=total_cajas, trm=trm, cajas_item=cajas_item, use_contenedor=use_cont, aerolinea_id=aerolinea_id, destino_id=destino_id)
                    # Usar estibado global
                    d['estibado_usd'] = estibado_por_caja_usd_global
                    base_otros = d['insumos_usd'] + d['fruta_usd'] + d['referencia_usd'] + d['contenedor_usd'] + d['mano_obra_usd'] + d['costos_embarque_base_usd']
                    base_usd_caja = base_otros + d['estibado_usd']
                    include_cif = (tipo_negociacion == 'CIF' and tarifa_activa)
                    
                    # Nueva lógica de utilidad (igual que en cálculo)
                    margen_adicional = cpc.margen_adicional_usd or Decimal('0')
                    denom_utilidad = (Decimal('1') - (utilidad_general_pct / Decimal('100')))
                    denom_utilidad = denom_utilidad if denom_utilidad > 0 else Decimal('1')
                    precio_final_fob = (base_usd_caja / denom_utilidad) + margen_adicional
                    
                    # Utilidad calculada sobre FOB
                    utilidad_total = precio_final_fob - base_usd_caja - margen_adicional
                    
                    # Para CIF: agregar costos adicionales sin afectar utilidad
                    costos_adicionales_cif = (d['costos_cif_usd'] + d['tarifa_aerea_usd']) if include_cif else Decimal('0')
                    precio_final = precio_final_fob + costos_adicionales_cif

                    d['precio_final_usd'] = precio_final
                    d['precio_final_fob_usd'] = precio_final_fob
                    d['utilidad_total_usd'] = utilidad_total
                    d['total_cajas'] = total_cajas
                    d['cajas_item'] = cajas_item
                    d['pallets_total'] = total_pallets
                    d['utilidad_general_pct'] = float(utilidad_general_pct)
                    d['porcentaje_heavens'] = float(heavens_pct)
                    d['porcentaje_exportador'] = float(exportador_pct)
                    d['use_contenedor'] = bool(use_cont)

                    cpc.trm_aprobacion = trm
                    cpc.fecha_aprobacion = timezone.now()
                    cpc.desglose_aprobado = to_jsonable(d)
                    cpc.aprobada = True
                    cpc.save()
                    aprobadas += 1
                messages.success(self.request, f"Se aprobaron {aprobadas} cotizaciones con TRM {trm}.")
                if errores_map:
                    messages.warning(self.request, f"{len(errores_map)} presentaciones no se aprobaron por datos faltantes.")

        errores_detalle = []
        if errores_map:
            for cid, errs in errores_map.items():
                cp = cp_map.get(cid)
                errores_detalle.append({
                    'id': cid,
                    'nombre': f"{cp.fruta} / {cp.presentacion}" if cp else str(cid),
                    'errores': errs,
                })
            messages.warning(self.request, f"{len(errores_detalle)} presentaciones no se calcularon por datos faltantes.")

        context = super().get_context_data(**kwargs)
        context.update({
            'opts': self.model_admin.model._meta,
            'clientes': clientes,
            'aerolineas': aerolineas,
            'destinos': destinos,
            'cliente_id': cliente_id,
            'aerolinea_id': aerolinea_id,
            'destino_id': destino_id,
            'tipo_negociacion': tipo_negociacion,
            'trm': trm,
            'utilidad_general_pct': utilidad_general_pct,
            'heavens_pct': heavens_pct,
            'exportador_pct': exportador_pct,
            'cps': cps,
            'rows': rows,
            'total_cajas': total_cajas,
            'total_pallets': total_pallets,
            'estibado_por_caja_usd_global': estibado_por_caja_usd_global if total_cajas > 0 else Decimal('0'),
            'errores_map': errores_map,
            'errores_detalle': errores_detalle,
            'errores_count': len(errores_detalle),
            'global_errors': global_errors,
            'tarifa_activa': tarifa_activa,
            'cif_enabled': (tipo_negociacion == 'CIF' and tarifa_activa),
        })
        return context

    def post(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        return self.render_to_response(context)

