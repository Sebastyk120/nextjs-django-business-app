from django.contrib.admin.models import LogEntry
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin, GroupAdmin as BaseGroupAdmin
from django.utils.html import format_html
from .models import Bodega, Item, Movimiento, Inventario, Proveedor
from .resources import MovimientoResource, ItemResource, BodegaResource, ProveedorResource, UserResource, GroupResource
from import_export.admin import ImportExportModelAdmin
from django.contrib import admin

admin.site.site_header = "Administración Heavens Fruits"
admin.site.site_title = "Administración Heavens"
admin.site.index_title = "Bienvenido al Portal de Administración Heavens"


@admin.register(Item)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = ItemResource

    # Campos para mostrar en modo tabla
    list_display = (
        "numero_item",
        "cantidad_cajas",
        "tipo_documento",
        "documento",
        "bodega",
        "proveedor",
        "fecha_movimiento",
        "propiedad",
        "user",
        "observaciones_display"
    )
    # Campos para búsqueda
    search_fields = ("numero_item__nombre",)
    # Filtros laterales
    list_filter = (
        "bodega",
        "proveedor",
        "propiedad"
    )

    # Orden predeterminado
    ordering = ("-fecha_movimiento",)

    # Mostrar observaciones con un límite de caracteres
    def observaciones_display(self, obj):
        if obj.observaciones:
            return format_html(f"{obj.observaciones[:50]}{'...' if len(obj.observaciones) > 50 else ''}")
        return "-"
    observaciones_display.short_description = "Observaciones"


@admin.register(Movimiento)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = MovimientoResource
    list_display = (
        "item_historico",
        "cantidad_cajas_h",
        "bodega",
        "propiedad",
        "fecha_movimiento",
        "user",
        "observaciones_display",
        "fecha",
    )

    # Campos para búsqueda
    search_fields = ("item_historico", "bodega__nombre", "propiedad", "user__username")

    # Filtros laterales
    list_filter = (
        "bodega",
        "propiedad",
        "user",
    )

    # Orden predeterminado
    ordering = ("-fecha",)

    def observaciones_display(self, obj):
        if obj.observaciones:
            return f"{obj.observaciones[:50]}{'...' if len(obj.observaciones) > 50 else ''}"
        return "-"
    observaciones_display.short_description = "Observaciones"


@admin.register(Bodega)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = BodegaResource
    list_display = ("nombre", "exportador_display")

    # Campos para búsqueda
    search_fields = ("nombre", "exportador__nombre")  # Reemplaza "nombre_campo_relacionado" por el campo del modelo Exportador que identifica al exportador.

    # Orden predeterminado (ya definido en el modelo, pero puedes especificarlo también aquí)
    ordering = ("nombre",)
    search_help_text = "Buscar por nombre del exportador"

    def exportador_display(self, obj):
        return obj.exportador  # Este devuelve la representación `__str__` del modelo Exportador.
    exportador_display.short_description = "Exportador"


@admin.register(Proveedor)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = ProveedorResource


# Anular el registro del modelo User
admin.site.unregister(User)


# Registrar de nuevo el modelo User con la clase personalizada
@admin.register(User)
class UserAdmin(ImportExportModelAdmin, BaseUserAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = UserResource


# Anular el registro del modelo Group
admin.site.unregister(Group)


# Registrar de nuevo el modelo Group con la clase personalizada
@admin.register(Group)
class GroupAdmin(ImportExportModelAdmin, BaseGroupAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = GroupResource


class InventarioAdmin(admin.ModelAdmin):
    list_display = (
        'numero_item', 
        'compras_efectivas', 
        'saldos_iniciales', 
        'salidas', 
        'traslado_propio', 
        'traslado_remisionado', 
        'ventas', 
        'venta_contenedor'
    )
    list_filter = ('numero_item__exportador__nombre',)  # Filtro exportador
    search_fields = ('numero_item__nombre', 'numero_item__exportador__nombre')  # Búsqueda por campos relacionados
    search_help_text = 'Buscar por nombre del item o nombre del exportador'
    ordering = ('numero_item',)  # Ordena por el campo definido en Meta

# Registra el modelo y su configuración
admin.site.register(Inventario, InventarioAdmin)

@admin.register(LogEntry)
class LogEntryAdmin(admin.ModelAdmin):
    # Indicamos qué campos se mostrarán en la lista
    list_display = (
        'action_time',
        'user',
        'content_type',
        'object_repr',
        'action_flag',
        'change_message',
    )

    # Opcionalmente, podemos agregar filtros
    list_filter = ('action_flag', 'content_type', 'user',)

    # Si quieres hacer búsquedas por algún campo
    search_fields = ('object_repr', 'change_message',)

    # Si quieres que los campos se muestren como solo lectura
    readonly_fields = [f.name for f in LogEntry._meta.get_fields()]
