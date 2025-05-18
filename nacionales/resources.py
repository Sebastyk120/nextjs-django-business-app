from import_export import resources, fields, widgets
from .models import (
    ProveedorNacional, Empaque, CompraNacional, VentaNacional,
    ReporteCalidadExportador, ReporteCalidadProveedor,
    TransferenciasProveedor, BalanceProveedor
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


class BalanceProveedorResource(resources.ModelResource):
    proveedor = fields.Field(
        column_name='proveedor',
        attribute='proveedor',
        widget=widgets.ForeignKeyWidget(ProveedorNacional, 'nombre')
    )
    
    class Meta:
        model = BalanceProveedor
        fields = ('id', 'proveedor', 'saldo_disponible', 'ultima_actualizacion')
        export_order = fields

