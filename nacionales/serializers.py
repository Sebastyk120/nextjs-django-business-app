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
    # Overridden computed fields: p_precio_kg_nal may be stored as 0/None
    # due to a signal timing issue (update() doesn't refresh in-memory objects).
    # We fall back to rep_cal_exp.precio_venta_kg_nal as source of truth.
    p_precio_kg_nal = serializers.SerializerMethodField()
    p_precio_kg_exp = serializers.SerializerMethodField()
    p_total_facturar = serializers.SerializerMethodField()
    asohofrucol = serializers.SerializerMethodField()
    rte_fte = serializers.SerializerMethodField()
    rte_ica = serializers.SerializerMethodField()
    p_total_pagar = serializers.SerializerMethodField()

    class Meta:
        model = ReporteCalidadProveedor
        fields = '__all__'

    def _get_effective_precio_nal(self, obj):
        from decimal import Decimal
        if obj.p_precio_kg_nal and obj.p_precio_kg_nal > 0:
            return float(obj.p_precio_kg_nal)
        return float(obj.rep_cal_exp.precio_venta_kg_nal or 0)

    def _get_effective_precio_exp(self, obj):
        from decimal import Decimal
        if obj.p_precio_kg_exp and obj.p_precio_kg_exp > 0:
            return float(obj.p_precio_kg_exp)
        return float(obj.rep_cal_exp.venta_nacional.compra_nacional.precio_compra_exp or 0)

    def _get_corrected_total_facturar(self, obj):
        kg_exp = float(obj.p_kg_exportacion or 0)
        kg_nal = float(obj.p_kg_nacional or 0)
        precio_exp = self._get_effective_precio_exp(obj)
        precio_nal = self._get_effective_precio_nal(obj)
        return round((kg_exp * precio_exp) + (kg_nal * precio_nal), 2)

    def get_p_precio_kg_nal(self, obj):
        return self._get_effective_precio_nal(obj)

    def get_p_precio_kg_exp(self, obj):
        return self._get_effective_precio_exp(obj)

    def get_p_total_facturar(self, obj):
        return self._get_corrected_total_facturar(obj)

    def get_asohofrucol(self, obj):
        total = self._get_corrected_total_facturar(obj)
        proveedor = obj.rep_cal_exp.venta_nacional.compra_nacional.proveedor
        return round(total * 1.0 / 100.0, 2) if proveedor.asohofrucol else 0.0

    def get_rte_fte(self, obj):
        total = self._get_corrected_total_facturar(obj)
        proveedor = obj.rep_cal_exp.venta_nacional.compra_nacional.proveedor
        return round(total * 1.5 / 100.0, 2) if proveedor.rte_fte else 0.0

    def get_rte_ica(self, obj):
        total = self._get_corrected_total_facturar(obj)
        proveedor = obj.rep_cal_exp.venta_nacional.compra_nacional.proveedor
        return round(total * 4.14 / 1000.0, 2) if proveedor.rte_ica else 0.0

    def get_p_total_pagar(self, obj):
        total = self._get_corrected_total_facturar(obj)
        return round(total - self.get_asohofrucol(obj) - self.get_rte_fte(obj) - self.get_rte_ica(obj), 2)

class ResumenReporteProveedorSerializer(ReporteCalidadProveedorSerializer):
    compra_guia = serializers.ReadOnlyField(source='rep_cal_exp.venta_nacional.compra_nacional.numero_guia')
    compra_fecha = serializers.ReadOnlyField(source='rep_cal_exp.venta_nacional.compra_nacional.fecha_compra')
    peso_recibido = serializers.ReadOnlyField(source='rep_cal_exp.venta_nacional.peso_neto_recibido')
    
    class Meta(ReporteCalidadProveedorSerializer.Meta):
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
    ventas = VentaNacionalSerializer(many=True, read_only=True)
    
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
        venta = obj.ventas.first()
        if venta:
            return venta.estado_venta
        return None

    def get_estado_reporte_exp(self, obj):
        venta = obj.ventas.first()
        if venta and hasattr(venta, 'reportecalidadexportador'):
            return venta.reportecalidadexportador.estado_reporte_exp
        return None

    def get_estado_reporte_prov(self, obj):
        venta = obj.ventas.first()
        if venta and hasattr(venta, 'reportecalidadexportador') and hasattr(venta.reportecalidadexportador, 'reportecalidadproveedor'):
            return venta.reportecalidadexportador.reportecalidadproveedor.estado_reporte_prov
        return None
    
    def get_estado_facturacion_exp(self, obj):
        venta = obj.ventas.first()
        if venta and hasattr(venta, 'reportecalidadexportador'):
            reporte = venta.reportecalidadexportador
            if reporte.factura:
                return "Facturado"
            return "Pendiente"
        return None
        

    def get_remision_exp(self, obj):
        venta = obj.ventas.first()
        if venta and hasattr(venta, 'reportecalidadexportador'):
            return venta.reportecalidadexportador.remision_exp
        return None


class TransferenciasProveedorSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')

    class Meta:
        model = TransferenciasProveedor
        fields = '__all__'


