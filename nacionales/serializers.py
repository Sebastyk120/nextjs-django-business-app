from rest_framework import serializers
from .models import (
    CompraNacional, VentaNacional, ReporteCalidadExportador, 
    ReporteCalidadProveedor, ProveedorNacional, Empaque, TransferenciasProveedor
)
from comercial.models import Fruta, Exportador
from comercial.serializers import FrutaSerializer, ExportadorSerializer

class ProveedorNacionalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProveedorNacional
        fields = ['id', 'nombre', 'nit']

class EmpaqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empaque
        fields = ['id', 'nombre', 'peso']

class ReporteCalidadProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReporteCalidadProveedor
        fields = '__all__'

class ReporteCalidadExportadorSerializer(serializers.ModelSerializer):
    reportecalidadproveedor = ReporteCalidadProveedorSerializer(read_only=True)
    
    class Meta:
        model = ReporteCalidadExportador
        fields = '__all__'

class VentaNacionalSerializer(serializers.ModelSerializer):
    exportador_nombre = serializers.ReadOnlyField(source='exportador.nombre')
    reportecalidadexportador = ReporteCalidadExportadorSerializer(read_only=True)
    
    class Meta:
        model = VentaNacional
        fields = '__all__'

class CompraNacionalSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')
    fruta_nombre = serializers.ReadOnlyField(source='fruta.nombre')
    tipo_empaque_nombre = serializers.ReadOnlyField(source='tipo_empaque.nombre')
    tipo_empaque_peso = serializers.ReadOnlyField(source='tipo_empaque.peso')
    
    # Proveedor tax settings (needed for ReporteProveedor calculations)
    proveedor_asohofrucol = serializers.ReadOnlyField(source='proveedor.asohofrucol')
    proveedor_rte_fte = serializers.ReadOnlyField(source='proveedor.rte_fte')
    proveedor_rte_ica = serializers.ReadOnlyField(source='proveedor.rte_ica')
    
    # Nested relationships for full chain display
    ventanacional = VentaNacionalSerializer(read_only=True)
    
    # Computed properties
    porcentaje_completitud = serializers.ReadOnlyField()
    progreso_color = serializers.ReadOnlyField()
    
    # Flattened status helper fields for table view
    estado_venta = serializers.SerializerMethodField()
    estado_reporte_exp = serializers.SerializerMethodField()
    estado_facturacion_exp = serializers.SerializerMethodField()
    estado_reporte_prov = serializers.SerializerMethodField()
    remision_exp = serializers.SerializerMethodField()

    class Meta:
        model = CompraNacional
        fields = '__all__'

    def get_estado_venta(self, obj):
        if hasattr(obj, 'ventanacional'):
            return obj.ventanacional.estado_venta
        return None

    def get_estado_reporte_exp(self, obj):
        if hasattr(obj, 'ventanacional') and hasattr(obj.ventanacional, 'reportecalidadexportador'):
            return obj.ventanacional.reportecalidadexportador.estado_reporte_exp
        return None

    def get_estado_reporte_prov(self, obj):
        if hasattr(obj, 'ventanacional') and hasattr(obj.ventanacional, 'reportecalidadexportador') and hasattr(obj.ventanacional.reportecalidadexportador, 'reportecalidadproveedor'):
            return obj.ventanacional.reportecalidadexportador.reportecalidadproveedor.estado_reporte_prov
        return None
    
    def get_estado_facturacion_exp(self, obj):
        if hasattr(obj, 'ventanacional') and hasattr(obj.ventanacional, 'reportecalidadexportador'):
            reporte = obj.ventanacional.reportecalidadexportador
            if reporte.factura:
                return "Facturado"
            return "Pendiente"
        return None
        

    def get_remision_exp(self, obj):
         if hasattr(obj, 'ventanacional') and hasattr(obj.ventanacional, 'reportecalidadexportador'):
            return obj.ventanacional.reportecalidadexportador.remision_exp
         return None


class TransferenciasProveedorSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')

    class Meta:
        model = TransferenciasProveedor
        fields = '__all__'


