from import_export import resources
from .models import Item, Movimiento, Bodega, Proveedor
from django.contrib.auth.models import User, Group


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


# Exportacion De Usuarios y Grupos.
class UserResource(resources.ModelResource):
    class Meta:
        model = User


class GroupResource(resources.ModelResource):
    class Meta:
        model = Group
