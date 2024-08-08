from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .models import Pedido, Fruta, Iata, TipoCaja, Cliente, Presentacion, Contenedor, DetallePedido, Referencias, \
    Exportador, ClientePresentacion, AutorizacionCancelacion, AgenciaCarga, Aerolinea, Intermediario, SubExportadora, \
    PresentacionReferencia
from simple_history.admin import SimpleHistoryAdmin
from import_export.admin import ImportExportModelAdmin
from .resources import ClienteResource, PedidoResource, FrutaResource, DetallePedidoResource, ContenedorResource, \
    IataResource, PresentacionResource, ReferenciasResource, ExportadorResource, TipoCajaResource, \
    ClientePresentacionResource, AutorizacionCancelacionResource, AgenciaCargaResource, AerolineaResource, \
    IntermediarioResource, SubExportadoraResource, PresentacionReferenciaResource

admin.site.site_header = "Administración Heavens Fruits"
admin.site.site_title = "Administración Heavens"
admin.site.index_title = "Bienvenido al Portal de Administración Heavens"


class PedidoAdmin(ImportExportModelAdmin, SimpleHistoryAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = PedidoResource
    search_fields = ('id',)
    search_help_text = 'Escribe el número de pedido para filtrar.'
    # Tus campos existentes
    campos_no_editables = [field.name for field in Pedido._meta.fields if not field.editable]
    campos_editables = [field.name for field in Pedido._meta.fields if field.editable]

    # Crear la lista de visualización agregando 'id', campos no editables y editables
    list_display = campos_editables + campos_no_editables + ['view_history']

    def view_history(self, obj):
        url = reverse('admin:%s_%s_history' % (obj._meta.app_label, obj._meta.model_name), args=[obj.pk])
        return format_html('<a href="{}">Historial</a>', url)

    view_history.short_description = "Ver Historial"


class DetallePedidoAdmin(ImportExportModelAdmin, SimpleHistoryAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = DetallePedidoResource
    campos_no_editables = [field.name for field in DetallePedido._meta.fields if not field.editable]
    campos_editables = [field.name for field in DetallePedido._meta.fields if field.editable]
    list_display = campos_editables + campos_no_editables + ['view_history']
    search_fields = ('pedido__id',)
    search_help_text = 'Escribe el número de pedido para filtrar.'

    def get_search_results(self, request, queryset, search_term):
        if search_term:
            queryset = self.model.objects.filter(pedido__id=search_term)
            use_distinct = False
        else:
            queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        return queryset, use_distinct

    def view_history(self, obj):
        url = reverse('admin:%s_%s_history' % (obj._meta.app_label, obj._meta.model_name), args=[obj.pk])
        return format_html('<a href="{}">Historial</a>', url)

    view_history.short_description = "Ver Historial"


@admin.register(Cliente)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = ClienteResource


@admin.register(Exportador)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = ExportadorResource


@admin.register(Contenedor)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = ContenedorResource


@admin.register(Fruta)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = FrutaResource


@admin.register(Iata)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = IataResource


@admin.register(Presentacion)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = PresentacionResource


@admin.register(Referencias)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    list_filter = ('exportador',)
    list_display = ('nombre', 'exportador', 'referencia_nueva', 'cantidad_pallet_con_contenedor',
                    'cantidad_pallet_sin_contenedor', 'porcentaje_peso_bruto')
    search_fields = ('nombre',)
    search_help_text = 'Buscar por nombre de referencia'
    resource_class = ReferenciasResource


@admin.register(TipoCaja)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = TipoCajaResource


class ClienteListFilter(admin.SimpleListFilter):
    title = 'cliente'
    parameter_name = 'cliente'

    def lookups(self, request, model_admin):
        # Filtra solo los clientes que tienen alguna relación con ClientePresentacion
        clientes_con_presentacion = Cliente.objects.filter(clientepresentacion__isnull=False).distinct()
        return [(cliente.id, cliente.nombre) for cliente in clientes_con_presentacion]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(cliente__id=self.value())
        return queryset


@admin.register(ClientePresentacion)
class ClientePresentacionAdmin(ImportExportModelAdmin):
    list_filter = (ClienteListFilter, 'fruta', 'presentacion')
    list_display = ('cliente', 'fruta', 'presentacion')
    import_error_display = ("message", "row", "traceback")
    resource_class = ClientePresentacionResource


@admin.register(AutorizacionCancelacion)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    list_display = ('pedido', 'usuario_solicitante', 'usuario_autorizador', 'autorizado',
                    'fecha_solicitud', 'fecha_autorizacion')
    resource_class = AutorizacionCancelacionResource


@admin.register(Aerolinea)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = AerolineaResource


@admin.register(AgenciaCarga)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = AgenciaCargaResource


@admin.register(Intermediario)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = IntermediarioResource


@admin.register(SubExportadora)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = SubExportadoraResource


@admin.register(PresentacionReferencia)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    list_filter = ('fruta', 'tipo_caja', 'presentacion', 'referencia')
    list_display = ('fruta', 'tipo_caja', 'presentacion', 'referencia')
    search_fields = ('referencia__nombre',)
    search_help_text = 'Buscar por nombre de referencia'
    resource_class = PresentacionReferenciaResource


admin.site.register(Pedido, PedidoAdmin)
admin.site.register(DetallePedido, DetallePedidoAdmin)
