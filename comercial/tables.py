import locale
import django_tables2 as tables
from django.utils.html import format_html
from .models import Pedido, DetallePedido, Referencias

locale.setlocale(locale.LC_ALL, 'es_ES.UTF-8')


def format_as_currency(value):
    formatted_value = locale.format_string("%.2f", value, grouping=True)
    return f"${formatted_value}"


class PedidoTable(tables.Table):
    detalle = tables.TemplateColumn(template_name='detalle_pedido_button.html', orderable=False)
    editar = tables.TemplateColumn(template_name='editar_pedido_button.html', orderable=False)
    eliminar = tables.TemplateColumn(template_name='eliminar_pedido_button.html', orderable=False)
    inf = tables.TemplateColumn(template_name='resumen_pedido_button.html', orderable=False)
    valor_total_comision_usd = tables.Column(verbose_name='$Comisiones (USD)', )
    valor_comision_pesos = tables.Column(verbose_name='$Comisiones (Pesos)', )
    trm_monetizacion = tables.Column()
    valor_total_factura_usd = tables.Column()
    diferencia_por_abono = tables.Column()
    comision_bancaria_usd = tables.Column()
    valor_pagado_cliente_usd = tables.Column()
    valor_total_nota_credito_usd = tables.Column()

    class Meta:
        model = Pedido
        template_name = "django_tables2/bootstrap5-responsive.html"
        fields = ("id", "cliente", "fecha_solicitud", "fecha_entrega", "exportadora", "dias_cartera", "awb", "destino",
                  "numero_factura", "total_cajas_enviadas", "nota_credito_no", "motivo_nota_credito",
                  "valor_total_nota_credito_usd", "tasa_representativa_usd_diaria", "valor_pagado_cliente_usd",
                  "comision_bancaria_usd", "fecha_pago", "trm_monetizacion", "estado_factura", "diferencia_por_abono",
                  "dias_de_vencimiento", "valor_total_factura_usd", "valor_total_comision_usd", "valor_comision_pesos",
                  "documento_cobro_comision", "fecha_pago_comision", "estado_comision", "detalle", "editar", "eliminar",
                  "inf")

    def render_valor_total_factura_usd(self, value):
        return format_as_currency(value)

    def render_comision_bancaria_usd(self, value):
        return format_as_currency(value)

    def render_valor_total_comision_usd(self, value):
        return format_as_currency(value)

    def render_valor_comision_pesos(self, value):
        return format_as_currency(value)

    def render_trm_monetizacion(self, value):
        return format_as_currency(value)

    def render_diferencia_por_abono(self, value):
        return format_as_currency(value)

    def render_valor_pagado_cliente_usd(self, value):
        return format_as_currency(value)

    def render_valor_total_nota_credito_usd(self, value):
        return format_as_currency(value)


class DetallePedidoTable(tables.Table):
    editar = tables.TemplateColumn(
        template_name='detalle_pedido_editar_button.html',
        orderable=False
    )

    eliminar = tables.TemplateColumn(
        template_name='detalle_pedido_eliminar_button.html',
        orderable=False
    )

    class Meta:
        model = DetallePedido
        template_name = "django_tables2/bootstrap5-responsive.html"
        fields = ["fruta", "presentacion", "cajas_solicitadas", "presentacion_peso", "kilos", "cajas_enviadas",
                  "kilos_enviados", "diferencia", "tipo_caja", "referencia__nombre", "stickers", "lleva_contenedor",
                  "referencia_contenedor", "cantidad_contenedores", "tarifa_comision", "valor_x_caja_usd",
                  "valor_x_caja_usd", "valor_x_producto", "no_cajas_nc", "valor_nota_credito_usd", "afecta_comision",
                  "valor_total_comision_x_producto", "precio_proforma", "observaciones"]
        exclude = ("pedido", "id")


class PedidoExportadorTable(tables.Table):
    detalle = tables.TemplateColumn(
        template_name='detalle_pedido_button.html',
        orderable=False
    )

    editar = tables.TemplateColumn(
        template_name='editar_pedido_button.html',
        orderable=False
    )

    inf = tables.TemplateColumn(
        template_name='resumen_pedido_button.html',
        orderable=False
    )

    class Meta:
        model = Pedido
        template_name = "django_tables2/bootstrap5-responsive.html"


class CarteraPedidoTable(tables.Table):
    fecha_entrega_personalizada = tables.DateColumn(accessor='fecha_entrega', verbose_name='Fecha Factura')
    valor_total_factura_usd = tables.Column(verbose_name='$Total Factura', )
    comision_bancaria_usd = tables.Column()
    valor_pagado_cliente_usd = tables.Column()

    class Meta:
        model = Pedido
        template_name = "django_tables2/bootstrap5-responsive.html"
        order_by = ('cliente',)
        fields = (
            "id", "cliente", "exportadora", "numero_factura", "fecha_entrega_personalizada", "dias_de_vencimiento",
            "valor_total_factura_usd", "valor_pagado_cliente_usd", "comision_bancaria_usd", "fecha_pago",
            "estado_factura")

    def render_valor_total_factura_usd(self, value):
        return format_as_currency(value)

    def render_comision_bancaria_usd(self, value):
        return format_as_currency(value)

    def render_valor_pagado_cliente_usd(self, value):
        return format_as_currency(value)


class ComisionPedidoTable(tables.Table):
    fecha_entrega_personalizada = tables.DateColumn(accessor='fecha_pago', verbose_name='Fecha Pago Cliente')
    cobro_comision = tables.BooleanColumn(orderable=False, verbose_name="Cobro Comisión")
    valor_total_comision_usd = tables.Column(verbose_name='$Comisiones (USD)', )
    valor_comision_pesos = tables.Column(verbose_name='$Comisiones (Pesos)', )
    trm_monetizacion = tables.Column()
    valor_total_factura_usd = tables.Column()
    diferencia_por_abono = tables.Column()

    class Meta:
        model = Pedido
        template_name = "django_tables2/bootstrap5-responsive.html"
        order_by = ('cliente',)
        fields = ("id", "cobro_comision",
                  "cliente", "exportadora", "fecha_entrega_personalizada", "valor_total_factura_usd",
                  "diferencia_por_abono",
                  "trm_monetizacion", "estado_factura", "valor_total_comision_usd", "valor_comision_pesos",
                  "documento_cobro_comision", "fecha_pago_comision", "estado_comision")

    def render_cobro_comision(self, record):
        if record.diferencia_por_abono >= 0:
            return format_html('<span style="color: green;">✔️</span>')
        else:
            return format_html('<span style="color: red;">❌</span>')

    def render_valor_total_comision_usd(self, value):
        return format_as_currency(value)

    def render_valor_comision_pesos(self, value):
        return format_as_currency(value)

    def render_trm_monetizacion(self, value):
        return format_as_currency(value)

    def render_valor_total_factura_usd(self, value):
        return format_as_currency(value)

    def render_diferencia_por_abono(self, value):
        return format_as_currency(value)


class ResumenPedidoTable(tables.Table):
    peso_bruto = tables.Column(empty_values=(), orderable=False, verbose_name="Peso Bruto")
    cajas_solicitadas = tables.Column(verbose_name="Cajas Pedido")
    lleva_contenedor = tables.BooleanColumn(orderable=False, verbose_name="Contenedor")
    valor_x_caja_usd = tables.Column(verbose_name="$Precio Final")
    tarifa_comision = tables.Column(verbose_name="$Comisión Caja")
    precio_proforma = tables.Column(verbose_name="$Proforma")
    precio_und_caja = tables.Column(empty_values=(), orderable=False, verbose_name="$Precio Caja")

    class Meta:
        model = DetallePedido
        template_name = "django_tables2/bootstrap5-responsive.html"
        fields = ["fruta", "presentacion", "cajas_solicitadas", "presentacion_peso", "kilos", "peso_bruto", "tipo_caja",
                  "referencia__nombre", "stickers", "lleva_contenedor", "observaciones", "precio_und_caja",
                  "tarifa_comision", "valor_x_caja_usd", "precio_proforma"]
        exclude = ("pedido", "id")

    def render_peso_bruto(self, record):
        return record.calcular_peso_bruto()

    def render_lleva_contenedor(self, record):
        if record.lleva_contenedor is True:
            return format_html('<span style="color: green;">✔</span>')
        else:
            return format_html('<span style="color: red;">❌</span>')

    def render_precio_und_caja(self, record):
        return format_as_currency(record.valor_x_caja_usd - record.tarifa_comision)

    def render_valor_x_caja_usd(self, value):
        return format_as_currency(value)

    def render_tarifa_comision(self, value):
        return format_as_currency(value)

    def render_precio_proforma(self, value):
        return format_as_currency(value)


class ReferenciasTable(tables.Table):
    precio = tables.Column()
    editar = tables.TemplateColumn(
        template_name='editar_referencia_button.html',
        orderable=False
    )

    class Meta:
        model = Referencias
        template_name = "django_tables2/bootstrap5-responsive.html"
        exclude = ("id",)

    def render_precio(self, value):
        return format_as_currency(value)
