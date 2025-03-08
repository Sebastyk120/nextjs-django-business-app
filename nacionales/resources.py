from import_export import resources, fields
from .models import (
    ProveedorNacional, Empaque, CompraNacional, VentaNacional,
    ReporteCalidadExportador, ReporteCalidadProveedor,
    TransferenciasProveedor, FacturacionExportadores
)


class ProveedorNacionalResource(resources.ModelResource):
    class Meta:
        model = ProveedorNacional


class EmpaqueResource(resources.ModelResource):
    class Meta:
        model = Empaque


class CompraNacionalResource(resources.ModelResource):
    class Meta:
        model = CompraNacional


class VentaNacionalResource(resources.ModelResource):
    id = fields.Field(attribute='compra_nacional_id', column_name='id')

    class Meta:
        model = VentaNacional
        import_id_fields = ['id']


class ReporteCalidadExportadorResource(resources.ModelResource):
    id = fields.Field(attribute='venta_nacional_id', column_name='id')

    class Meta:
        model = ReporteCalidadExportador
        import_id_fields = ['id']

class ReporteCalidadProveedorResource(resources.ModelResource):
    id = fields.Field(attribute='rep_cal_exp_id', column_name='id')

    class Meta:
        model = ReporteCalidadProveedor
        import_id_fields = ['id']

class TransferenciasProveedorResource(resources.ModelResource):
    class Meta:
        model = TransferenciasProveedor


class FacturacionExportadoresResource(resources.ModelResource):
    class Meta:
        model = FacturacionExportadores

