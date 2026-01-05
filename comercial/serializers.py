from rest_framework import serializers
from .models import (
    Pedido, Cliente, Intermediario, Exportador, SubExportadora, Iata, DetallePedido,
    Fruta, Presentacion, TipoCaja, Referencias, AgenciaCarga, Aerolinea
)


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['id', 'nombre']


class IntermediarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Intermediario
        fields = ['id', 'nombre']


class ExportadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exportador
        fields = ['id', 'nombre']


class SubExportadoraSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubExportadora
        fields = ['id', 'nombre']


class IataSerializer(serializers.ModelSerializer):
    class Meta:
        model = Iata
        fields = ['id', 'codigo', 'ciudad', 'pais']


class AgenciaCargaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgenciaCarga
        fields = ['id', 'nombre']


class PedidoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pedido
        fields = [
            'cliente', 'intermediario', 'fecha_entrega', 
            'exportadora', 'subexportadora', 'destino', 'observaciones'
        ]


class PedidoListSerializer(serializers.ModelSerializer):
    """
    Optimized serializer for Pedido list view
    Returns related object names instead of IDs for better readability
    """
    cliente = serializers.SerializerMethodField()
    intermediario = serializers.SerializerMethodField()
    exportadora = serializers.SerializerMethodField()
    subexportadora = serializers.SerializerMethodField()
    destino = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = [
            'id', 'cliente', 'intermediario', 'semana',
            'fecha_solicitud', 'fecha_entrega', 'fecha_llegada',
            'exportadora', 'subexportadora', 'dias_cartera',
            'awb', 'destino', 'numero_factura',
            'total_cajas_solicitadas', 'total_cajas_enviadas',
            'total_peso_bruto_solicitado', 'total_peso_bruto_enviado',
            'total_piezas_solicitadas', 'total_piezas_enviadas',
            'descuento', 'nota_credito_no', 'motivo_nota_credito',
            'valor_total_nota_credito_usd', 'utilidad_bancaria_usd',
            'fecha_pago', 'valor_pagado_cliente_usd',
            'fecha_monetizacion', 'trm_monetizacion',
            'tasa_representativa_usd_diaria', 'trm_cotizacion',
            'estado_factura', 'diferencia_por_abono', 'dias_de_vencimiento',
            'valor_total_factura_usd', 'valor_total_utilidad_usd',
            'valor_utilidad_pesos', 'valor_total_recuperacion_usd',
            'documento_cobro_utilidad', 'fecha_pago_utilidad',
            'estado_utilidad', 'variedades', 'estado_pedido',
            'estado_cancelacion', 'observaciones'
        ]

    def get_cliente(self, obj):
        return obj.cliente.nombre if obj.cliente else None

    def get_intermediario(self, obj):
        return obj.intermediario.nombre if obj.intermediario else None

    def get_exportadora(self, obj):
        return obj.exportadora.nombre if obj.exportadora else None

    def get_subexportadora(self, obj):
        return obj.subexportadora.nombre if obj.subexportadora else None

    def get_destino(self, obj):
        return obj.destino.codigo if obj.destino else None


class PedidoDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for Pedido with all fields
    """
    cliente_nombre = serializers.SerializerMethodField()
    intermediario_nombre = serializers.SerializerMethodField()
    exportadora_nombre = serializers.SerializerMethodField()
    subexportadora_nombre = serializers.SerializerMethodField()
    destino_nombre = serializers.SerializerMethodField()
    agencia_carga_nombre = serializers.SerializerMethodField()
    aerolinea_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = '__all__'

    def get_cliente_nombre(self, obj):
        return obj.cliente.nombre if obj.cliente else None

    def get_intermediario_nombre(self, obj):
        return obj.intermediario.nombre if obj.intermediario else None

    def get_exportadora_nombre(self, obj):
        return obj.exportadora.nombre if obj.exportadora else None

    def get_subexportadora_nombre(self, obj):
        return obj.subexportadora.nombre if obj.subexportadora else None

    def get_destino_nombre(self, obj):
        return obj.destino.codigo if obj.destino else None

    def get_agencia_carga_nombre(self, obj):
        return obj.agencia_carga.nombre if obj.agencia_carga else None

    def get_aerolinea_nombre(self, obj):
        return obj.aerolinea.nombre if obj.aerolinea else None


class DetallePedidoSerializer(serializers.ModelSerializer):
    """
    Serializer for DetallePedido items
    """
    fruta_nombre = serializers.SerializerMethodField()
    presentacion_nombre = serializers.SerializerMethodField()
    presentacion_kilos = serializers.SerializerMethodField()
    tipo_caja_nombre = serializers.SerializerMethodField()
    referencia_nombre = serializers.SerializerMethodField()
    pedido_info = serializers.SerializerMethodField()

    class Meta:
        model = DetallePedido
        fields = '__all__'

    def validate(self, data):
        """
        Mirror validation logic from DetallePedidoForm.clean()
        """
        referencia = data.get('referencia')
        lleva_contenedor = data.get('lleva_contenedor')

        if referencia:
            if (referencia.cantidad_pallet_con_contenedor in [0, None]) and lleva_contenedor:
                raise serializers.ValidationError({
                    "lleva_contenedor": "No puedes seleccionar Si en el campo Lleva contenedor porque la referencia no permite contenedor."
                })
        
        return data

    def get_fruta_nombre(self, obj):
        return obj.fruta.nombre if obj.fruta else None

    def get_presentacion_nombre(self, obj):
        return obj.presentacion.nombre if obj.presentacion else None

    def get_presentacion_kilos(self, obj):
        return obj.presentacion.kilos if obj.presentacion else None

    def get_tipo_caja_nombre(self, obj):
        return obj.tipo_caja.nombre if obj.tipo_caja else None

    def get_referencia_nombre(self, obj):
        return obj.referencia.nombre if obj.referencia else None

    def get_pedido_info(self, obj):
        """Return subset of parent order info needed for UI logic"""
        return {
            'awb': obj.pedido.awb,
            'numero_factura': obj.pedido.numero_factura,
            'estado_factura': obj.pedido.estado_factura
        }


class FrutaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fruta
        fields = ['id', 'nombre']


class PresentacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Presentacion
        fields = ['id', 'nombre', 'kilos']


class TipoCajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoCaja
        fields = ['id', 'nombre']


class ReferenciasSerializer(serializers.ModelSerializer):
    class Meta:
        model = Referencias
        fields = ['id', 'nombre']

