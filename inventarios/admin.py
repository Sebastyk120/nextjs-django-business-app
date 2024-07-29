from django.contrib import admin
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin, GroupAdmin as BaseGroupAdmin
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


@admin.register(Movimiento)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = MovimientoResource


@admin.register(Bodega)
class MyModelAdmin(ImportExportModelAdmin):
    import_error_display = ("message", "row", "traceback")
    resource_class = BodegaResource


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


admin.site.register(Inventario)
