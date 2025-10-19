from django.contrib import admin
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils.html import format_html
from import_export.admin import ImportExportModelAdmin
from simple_history.admin import SimpleHistoryAdmin
from unfold.contrib.import_export.forms import ImportForm, SelectableFieldsExportForm
from unfold.admin import ModelAdmin, TabularInline

from .models import (
    Pedido, Fruta, Iata, TipoCaja, Cliente, Presentacion, Contenedor, DetallePedido,
    Referencias, Exportador, ClientePresentacion, AutorizacionCancelacion, AgenciaCarga,
    Aerolinea, Intermediario, SubExportadora, PresentacionReferencia
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

# ----------------------------------------------------------------------------
# IATA ADMIN
# ----------------------------------------------------------------------------
@admin.register(Iata)
class IataAdmin(ModelAdmin, ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = IataResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm

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
        'porcentaje_peso_bruto'
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

# ----------------------------------------------------------------------------
# FILTRO PERSONALIZADO PARA CLIENTE PRESENTACION
# ----------------------------------------------------------------------------
class ClienteListFilter(admin.SimpleListFilter):
    title = 'cliente'
    parameter_name = 'cliente'

    def lookups(self, request, model_admin):
        clientes_con_presentacion = (
            Cliente.objects.filter(clientepresentacion__isnull=False).distinct()
        )
        return [(cliente.id, cliente.nombre) for cliente in clientes_con_presentacion]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(cliente__id=self.value())
        return queryset

# ----------------------------------------------------------------------------
# CLIENTE PRESENTACION ADMIN
# ----------------------------------------------------------------------------
@admin.register(ClientePresentacion)
class ClientePresentacionAdmin(ModelAdmin, ImportExportModelAdmin):
    list_filter = (ClienteListFilter, 'fruta', 'presentacion')
    list_display = ('cliente', 'fruta', 'presentacion')
    import_error_display = ("message", "row", "traceback")
    resource_class = ClientePresentacionResource
    import_form_class = ImportForm
    export_form_class = SelectableFieldsExportForm

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
