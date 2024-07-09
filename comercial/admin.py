from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .models import Pedido, Fruta, Iata, TipoCaja, Cliente, Presentacion, Contenedor, DetallePedido, Referencias, \
    Exportador, ClientePresentacion, AutorizacionCancelacion, AgenciaCarga, Aerolinea, Intermediario, SubExportadora, PresentacionReferencia
from simple_history.admin import SimpleHistoryAdmin
from import_export.admin import ImportExportModelAdmin
from .resources import ClienteResource, PedidoResource, FrutaResource, DetallePedidoResource, ContenedorResource, \
    IataResource, PresentacionResource, ReferenciasResource, ExportadorResource, TipoCajaResource, \
    ClientePresentacionResource, AutorizacionCancelacionResource, AgenciaCargaResource, AerolineaResource, \
    IntermediarioResource, SubExportadoraResource, PresentacionReferenciaResource
from django.contrib import admin

admin.site.site_header = "Administración Heavens Fruits"
admin.site.site_title = "Administración Heavens"
admin.site.index_title = "Bienvenido al Portal de Administración Heavens"


class PedidoAdmin(ImportExportModelAdmin, SimpleHistoryAdmin):
    resource_class = PedidoResource
    # Tus campos existentes
    campos_no_editables = [field.name for field in Pedido._meta.fields if not field.editable]
    campos_editables = [field.name for field in Pedido._meta.fields if field.editable]

    # Crear la lista de visualización agregando 'id', campos no editables y editables
    list_display = ['id'] + campos_no_editables + campos_editables + ['view_history']

    def view_history(self, obj):
        url = reverse('admin:%s_%s_history' % (obj._meta.app_label, obj._meta.model_name), args=[obj.pk])
        return format_html('<a href="{}">Historial</a>', url)

    view_history.short_description = "Ver Historial"


class DetallePedidoAdmin(ImportExportModelAdmin, SimpleHistoryAdmin):
    resource_class = DetallePedidoResource
    # Obtener todos los campos no editables del modelo
    campos_no_editables = [field.name for field in DetallePedido._meta.fields if not field.editable]
    campos_editables = [field.name for field in DetallePedido._meta.fields if field.editable]
    # Crear la lista de visualización agregando 'id' y otros campos no editables
    list_display = ['id'] + campos_no_editables + campos_editables + ['view_history']

    def view_history(self, obj):
        url = reverse('admin:%s_%s_history' % (obj._meta.app_label, obj._meta.model_name), args=[obj.pk])
        return format_html('<a href="{}">Historial</a>', url)

    view_history.short_description = "Ver Historial"


@admin.register(Cliente)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = ClienteResource


@admin.register(Exportador)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = ExportadorResource


@admin.register(Contenedor)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = ContenedorResource


@admin.register(Fruta)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = FrutaResource


@admin.register(Iata)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = IataResource


@admin.register(Presentacion)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = PresentacionResource


@admin.register(Referencias)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = ReferenciasResource


@admin.register(TipoCaja)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = TipoCajaResource


@admin.register(ClientePresentacion)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = ClientePresentacionResource


@admin.register(AutorizacionCancelacion)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = AutorizacionCancelacionResource


@admin.register(Aerolinea)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = AerolineaResource


@admin.register(AgenciaCarga)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = AgenciaCargaResource


@admin.register(Intermediario)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = IntermediarioResource


@admin.register(SubExportadora)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = SubExportadoraResource

@admin.register(PresentacionReferencia)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = PresentacionReferenciaResource


admin.site.register(Pedido, PedidoAdmin)
admin.site.register(DetallePedido, DetallePedidoAdmin)
