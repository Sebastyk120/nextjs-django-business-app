from import_export import resources
from .models import Item, Movimiento, Bodega, Proveedor


class ItemResource(resources.ModelResource):
    class Meta:
        model = Item


class MovimientoResource(resources.ModelResource):
    class Meta:
        model = Movimiento


class BodegaResource(resources.ModelResource):
    class Meta:
        model = Bodega


class ProveedorResource(resources.ModelResource):
    class Meta:
        model = Proveedor
