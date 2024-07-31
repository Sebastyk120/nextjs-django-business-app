import logging

from django.contrib.auth.models import User, Group
from django.db import models
from import_export import resources

from .models import Item, Movimiento, Bodega, Proveedor

logger = logging.getLogger(__name__)


class ItemResource(resources.ModelResource):
    class Meta:
        model = Item

    def before_import_row(self, row, **kwargs):
        logger.info(f"Importando fila: {row}")

        # Lista de campos no editables
        campos_no_editables = [field.name for field in Item._meta.fields if not field.editable]

        for campo in campos_no_editables:
            if campo in row:
                logger.info(f"Eliminando campo no editable: {campo}")
                del row[campo]

        # Convertir campos IntegerField
        campos_enteros = [field.name for field in Item._meta.fields if isinstance(field, models.IntegerField)]
        for campo in campos_enteros:
            if campo in row and campo not in campos_no_editables:
                try:
                    if row[campo] in [None, '']:
                        row[campo] = None  # Maneja valores vacíos como None
                    else:
                        valor = row[campo].replace(',', '').replace('.', '')  # Eliminar comas y puntos
                        row[campo] = int(valor)
                        logger.info(f"Convertido valor del campo {campo} a Integer: {row[campo]}")
                except (ValueError, TypeError) as e:
                    logger.error(f"Error al convertir el campo {campo} a Integer: {e}")
                    raise ValueError(f"El valor del campo {campo} no es válido para Integer: {row[campo]}")

        super().before_import_row(row, **kwargs)


class MovimientoResource(resources.ModelResource):
    class Meta:
        model = Movimiento

    def before_import_row(self, row, **kwargs):
        """
        Elimina o modifica los valores de los campos no editables antes de importar cada fila,
        y convierte las claves foráneas y campos decimales.
        """
        logger.info(f"Importando fila: {row}")

        # Lista de campos no editables
        campos_no_editables = [field.name for field in Movimiento._meta.fields if not field.editable]

        for campo in campos_no_editables:
            if campo in row:
                logger.info(f"Eliminando campo no editable: {campo}")
                del row[campo]

        # Convertir campos IntegerField
        campos_enteros = [field.name for field in Movimiento._meta.fields if isinstance(field, models.IntegerField)]
        for campo in campos_enteros:
            if campo in row and campo not in campos_no_editables:
                try:
                    if row[campo] in [None, '']:
                        row[campo] = None  # Maneja valores vacíos como None
                    else:
                        valor = row[campo].replace(',', '').replace('.', '')  # Eliminar comas y puntos
                        row[campo] = int(valor)
                        logger.info(f"Convertido valor del campo {campo} a Integer: {row[campo]}")
                except (ValueError, TypeError) as e:
                    logger.error(f"Error al convertir el campo {campo} a Integer: {e}")
                    raise ValueError(f"El valor del campo {campo} no es válido para Integer: {row[campo]}")

        super().before_import_row(row, **kwargs)


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
