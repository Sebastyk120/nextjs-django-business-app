from django.contrib import admin
from .models import Bodega, Item, Movimiento, Inventario, Proveedor
from .resources import MovimientoResource, ItemResource, BodegaResource, ProveedorResource
from import_export.admin import ImportExportModelAdmin


@admin.register(Item)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = ItemResource


@admin.register(Movimiento)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = MovimientoResource


@admin.register(Bodega)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = BodegaResource


@admin.register(Proveedor)
class MyModelAdmin(ImportExportModelAdmin):
    resource_class = ProveedorResource


admin.site.register(Inventario)
