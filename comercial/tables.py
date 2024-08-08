import django_tables2 as tables
from django.utils.html import format_html
from .models import Pedido, DetallePedido, Referencias


def format_as_currency(value):
    formatted_value = "${:2f}".format(value)
    return formatted_value


class PedidoTable(tables.Table):
    detalle = tables.TemplateColumn(template_name='detalle_pedido_button.html', orderable=False)
    editar = tables.TemplateColumn(template_name='editar_pedido_button.html', orderable=False)
    editar2 = tables.TemplateColumn(template_name='editar2_pedido_button.html', orderable=False,
                                    verbose_name="Awb-Fact")
    cancelar = tables.TemplateColumn(template_name='cancelar_pedido_button.html', orderable=False)
    inf = tables.TemplateColumn(template_name='resumen_pedido_button.html', orderable=False)
    id = tables.Column(verbose_name='No.', )
    valor_total_utilidad_usd = tables.Column(verbose_name='$Utilidades (USD)', )
    valor_utilidad_pesos = tables.Column(verbose_name='$Utilidades (Pesos)', )
    descuento = tables.Column()
    trm_monetizacion = tables.Column()
    valor_total_factura_usd = tables.Column()
    diferencia_por_abono = tables.Column()
    utilidad_bancaria_usd = tables.Column()
    valor_pagado_cliente_usd = tables.Column()
    valor_total_nota_credito_usd = tables.Column()
    dias_de_vencimiento = tables.Column()
    tasa_representativa_usd_diaria = tables.Column()

    class Meta:
        model = Pedido
        template_name = "django_tables2/bootstrap5-responsive.html"
        fields = ("id", "cliente", "intermediario", "semana", "fecha_solicitud", "fecha_entrega", "fecha_llegada",
                  "exportadora", "subexportadora", "dias_cartera", "awb", "destino",
                  "numero_factura", "total_cajas_solicitadas", "total_cajas_enviadas", "total_peso_bruto_solicitado",
                  "total_peso_bruto_enviado", "total_piezas_solicitadas", "total_piezas_enviadas",
                  "descuento", "nota_credito_no", "motivo_nota_credito",
                  "valor_total_nota_credito_usd", "utilidad_bancaria_usd", "fecha_pago", "valor_pagado_cliente_usd",
                  "fecha_monetizacion", "trm_monetizacion", "tasa_representativa_usd_diaria", "trm_cotizacion",
                  "estado_factura", "diferencia_por_abono", "dias_de_vencimiento", "valor_total_factura_usd",
                  "valor_total_utilidad_usd", "valor_utilidad_pesos", "documento_cobro_utilidad", "fecha_pago_utilidad",
                  "estado_utilidad", "variedades", "estado_pedido", "estado_cancelacion", "observaciones", "detalle",
                  "editar", "editar2", "inf", "cancelar")
        row_attrs = {
            "style": lambda record: ("background-color: #f8d7da;" if record.estado_cancelacion == "autorizado" else
                                     ("background-color: #d4edda;" if record.estado_pedido == "Finalizado" else
                                      (
                                          "background-color: #fff3cd;" if record.estado_cancelacion == "pendiente" else ""))
                                     )
        }

    def render_dias_de_vencimiento(self, value):
        if value <= 0:
            return format_html(f'<span style="color: green;">{value}</span>')
        else:
            return format_html(f'<span style="color: red;">{value}</span>')

    def render_tasa_representativa_usd_diaria(self, value):
        return format_as_currency(value)

    def render_valor_total_factura_usd(self, value):
        return format_as_currency(value)

    def render_utilidad_bancaria_usd(self, value):
        return format_as_currency(value)

    def render_valor_total_utilidad_usd(self, value):
        return format_as_currency(value)

    def render_valor_utilidad_pesos(self, value):
        return format_as_currency(value)

    def render_trm_monetizacion(self, value):
        return format_as_currency(value)

    def render_diferencia_por_abono(self, value):
        return format_as_currency(value)

    def render_valor_pagado_cliente_usd(self, value):
        return format_as_currency(value)

    def render_valor_total_nota_credito_usd(self, value):
        return format_as_currency(value)

    def render_descuento(self, value):
        return format_as_currency(value)


class DetallePedidoTable(tables.Table):
    editar = tables.TemplateColumn(template_name='detalle_pedido_editar_button.html', orderable=False)
    enviadas = tables.TemplateColumn(template_name='detalle_pedido_editar_button2.html', orderable=False,
                                     verbose_name="Cajas Enviadas")
    nota_utilidad = tables.TemplateColumn(template_name='detalle_pedido_editar_button3.html', orderable=False,
                                          verbose_name="Cajas NC")
    eliminar = tables.TemplateColumn(template_name='detalle_pedido_eliminar_button.html', orderable=False)
    afecta_utilidad = tables.Column()
    tarifa_utilidad = tables.Column()
    valor_x_caja_usd = tables.Column()
    valor_x_producto = tables.Column()
    valor_nota_credito_usd = tables.Column()
    valor_total_utilidad_x_producto = tables.Column()
    precio_proforma = tables.Column()

    class Meta:
        model = DetallePedido
        template_name = "django_tables2/bootstrap5-responsive.html"
        fields = ["fruta", "presentacion", "cajas_solicitadas", "presentacion_peso", "kilos", "cajas_enviadas",
                  "kilos_enviados", "diferencia", "tipo_caja", "referencia__nombre", "stickers", "lleva_contenedor",
                  "referencia_contenedor", "cantidad_contenedores", "tarifa_utilidad", "valor_x_caja_usd",
                  "valor_x_producto", "no_cajas_nc", "valor_nota_credito_usd", "afecta_utilidad",
                  "valor_total_utilidad_x_producto", "precio_proforma", "observaciones", "editar", "enviadas",
                  "nota_utilidad", "eliminar"]
        exclude = ("pedido", "id")

    def render_afecta_utilidad(self, record):
        if record.afecta_utilidad is True:
            return format_html('<span style="color: green;">✔</span>')
        elif record.afecta_utilidad is False:
            return format_html('<span style="color: red;">✘</span>')
        else:
            return format_html('<span style="color: blue;">Dcto</span>')

    def render_tarifa_utilidad(self, value):
        return format_as_currency(value)

    def render_valor_x_caja_usd(self, value):
        return format_as_currency(value)

    def render_valor_x_producto(self, value):
        return format_as_currency(value)

    def render_valor_nota_credito_usd(self, value):
        return format_as_currency(value)

    def render_valor_total_utilidad_x_producto(self, value):
        return format_as_currency(value)

    def render_precio_proforma(self, value):
        return format_as_currency(value)


class PedidoExportadorTable(tables.Table):
    detalle = tables.TemplateColumn(template_name='detalle_pedido_button.html', orderable=False)
    editar = tables.TemplateColumn(template_name='editar_pedido_exportador_button.html', orderable=False)
    inf = tables.TemplateColumn(template_name='resumen_pedido_button.html', orderable=False)
    valor_total_utilidad_usd = tables.Column(verbose_name='$Utilidades (USD)', )
    valor_utilidad_pesos = tables.Column(verbose_name='$Utilidades (Pesos)', )
    descuento = tables.Column()
    trm_monetizacion = tables.Column()
    valor_total_factura_usd = tables.Column()
    diferencia_por_abono = tables.Column()
    utilidad_bancaria_usd = tables.Column()
    valor_pagado_cliente_usd = tables.Column()
    valor_total_nota_credito_usd = tables.Column()
    dias_de_vencimiento = tables.Column()

    class Meta:
        model = Pedido
        template_name = "django_tables2/bootstrap5-responsive.html"
        fields = ("id", "cliente", "intermediario", "semana", "fecha_solicitud", "fecha_entrega", "fecha_llegada",
                  "exportadora", "subexportadora", "dias_cartera", "awb", "destino",
                  "numero_factura", "total_cajas_solicitadas", "total_cajas_enviadas", "total_peso_bruto_solicitado",
                  "total_peso_bruto_enviado", "total_piezas_solicitadas", "total_piezas_enviadas",
                  "descuento", "nota_credito_no", "motivo_nota_credito",
                  "valor_total_nota_credito_usd", "utilidad_bancaria_usd", "fecha_pago", "valor_pagado_cliente_usd",
                  "fecha_monetizacion", "trm_monetizacion", "tasa_representativa_usd_diaria", "trm_cotizacion",
                  "estado_factura", "diferencia_por_abono", "dias_de_vencimiento", "valor_total_factura_usd",
                  "valor_total_utilidad_usd", "valor_utilidad_pesos", "documento_cobro_utilidad", "fecha_pago_utilidad",
                  "estado_utilidad", "variedades", "estado_pedido", "estado_cancelacion", "observaciones", "detalle",
                  "editar", "inf")
        row_attrs = {
            "style": lambda record: ("background-color: #f8d7da;" if record.estado_cancelacion == "autorizado" else
                                     ("background-color: #d4edda;" if record.estado_pedido == "Finalizado" else
                                      (
                                          "background-color: #fff3cd;" if record.estado_cancelacion == "pendiente" else ""))
                                     )
        }

    def render_dias_de_vencimiento(self, value):
        if value <= 0:
            return format_html(f'<span style="color: green;">{value}</span>')
        else:
            return format_html(f'<span style="color: red;">{value}</span>')

    def render_valor_total_factura_usd(self, value):
        return format_as_currency(value)

    def render_utilidad_bancaria_usd(self, value):
        return format_as_currency(value)

    def render_valor_total_utilidad_usd(self, value):
        return format_as_currency(value)

    def render_valor_utilidad_pesos(self, value):
        return format_as_currency(value)

    def render_trm_monetizacion(self, value):
        return format_as_currency(value)

    def render_diferencia_por_abono(self, value):
        return format_as_currency(value)

    def render_valor_pagado_cliente_usd(self, value):
        return format_as_currency(value)

    def render_valor_total_nota_credito_usd(self, value):
        return format_as_currency(value)

    def render_descuento(self, value):
        return format_as_currency(value)


class CarteraPedidoTable(tables.Table):
    id = tables.Column(verbose_name='Pedido', )
    editar = tables.TemplateColumn(template_name='editar_pedido_cartera_button.html', orderable=False)
    fecha_entrega_personalizada = tables.DateColumn(accessor='fecha_entrega', verbose_name='Fecha Factura')
    valor_total_factura_usd = tables.Column(verbose_name='$Total Factura', )
    utilidad_bancaria_usd = tables.Column()
    valor_pagado_cliente_usd = tables.Column()
    diferencia_por_abono = tables.Column()
    descuento = tables.Column()
    dias_de_vencimiento = tables.Column()

    class Meta:
        model = Pedido
        template_name = "django_tables2/bootstrap5-responsive.html"
        order_by = ('cliente',)
        fields = (
            "intermediario", "cliente", "exportadora", "awb", "id", "fecha_entrega_personalizada", "numero_factura",
            "valor_total_factura_usd", "dias_de_vencimiento", "valor_pagado_cliente_usd", "diferencia_por_abono",
            "nota_credito_no", "motivo_nota_credito", "valor_total_nota_credito_usd", "descuento",
            "utilidad_bancaria_usd", "fecha_pago", "estado_factura", "editar")
        row_attrs = {
            "style": lambda record: "background-color: #f8d7da;" if record.numero_factura == "Pedido Cancelado" else ""}

    def render_dias_de_vencimiento(self, value):
        if value <= 0:
            return format_html(f'<span style="color: green;">{value}</span>')
        else:
            return format_html(f'<span style="color: red;">{value}</span>')

    def render_valor_total_factura_usd(self, value):
        return format_as_currency(value)

    def render_utilidad_bancaria_usd(self, value):
        return format_as_currency(value)

    def render_valor_pagado_cliente_usd(self, value):
        return format_as_currency(value)

    def render_diferencia_por_abono(self, value):
        return format_as_currency(value)

    def render_descuento(self, value):
        return format_as_currency(value)


class UtilidadPedidoTable(tables.Table):
    id = tables.Column(verbose_name='No.', )
    editar = tables.TemplateColumn(template_name='editar_pedido_utilidades_button.html', orderable=False)
    fecha_entrega_personalizada = tables.DateColumn(accessor='fecha_pago', verbose_name='Fecha Pago Cliente')
    cobro_utilidad = tables.BooleanColumn(orderable=False, verbose_name="Cobro Utilidad")
    valor_total_utilidad_usd = tables.Column(verbose_name='$Utilidades (USD)', )
    valor_utilidad_pesos = tables.Column(verbose_name='$Utilidades (Pesos)', )
    trm_monetizacion = tables.Column()
    valor_total_factura_usd = tables.Column()
    diferencia_por_abono = tables.Column()
    tasa_representativa_usd_diaria = tables.Column()

    class Meta:
        model = Pedido
        template_name = "django_tables2/bootstrap5-responsive.html"
        order_by = ('cliente',)
        fields = ("id", "cobro_utilidad", "fecha_entrega",
                  "cliente", "exportadora", "awb", "fecha_entrega_personalizada", "numero_factura",
                  "valor_total_factura_usd", "valor_pagado_cliente_usd", "diferencia_por_abono", "trm_monetizacion",
                  "tasa_representativa_usd_diaria", "estado_factura", "total_cajas_enviadas",
                  "valor_total_utilidad_usd", "valor_utilidad_pesos", "documento_cobro_utilidad", "fecha_pago_utilidad",
                  "estado_utilidad", "editar")
        row_attrs = {
            "style": lambda record: (
                "background-color: #f8d7da;" if record.numero_factura == "Pedido Cancelado" else
                "background-color: #d4edda;" if record.estado_utilidad == "Pagada" else
                ""
            )
        }

    def render_cobro_utilidad(self, record):
        if record.estado_utilidad == "Por Facturar" or record.estado_utilidad == "Facturada":
            return format_html('<span style="color: green;">✔</span>')
        else:
            return format_html('<span style="color: red;">✘</span>')

    def render_valor_total_utilidad_usd(self, value):
        return format_as_currency(value)

    def render_tasa_representativa_usd_diaria(self, value):
        return format_as_currency(value)

    def render_valor_utilidad_pesos(self, value):
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
    tarifa_utilidad = tables.Column(verbose_name="$Utilidad Caja")
    precio_proforma = tables.Column(verbose_name="$Proforma")
    precio_und_caja = tables.Column(empty_values=(), orderable=False, verbose_name="$Precio Caja")

    class Meta:
        model = DetallePedido
        template_name = "django_tables2/bootstrap5-responsive.html"
        fields = ["fruta", "presentacion", "cajas_solicitadas", "presentacion_peso", "kilos", "peso_bruto", "tipo_caja",
                  "referencia__nombre", "stickers", "lleva_contenedor", "observaciones", "precio_und_caja",
                  "tarifa_utilidad", "valor_x_caja_usd", "precio_proforma"]
        exclude = ("pedido", "id")

    def render_peso_bruto(self, record):
        return record.calcular_peso_bruto()

    def render_lleva_contenedor(self, record):
        if record.lleva_contenedor is True:
            return format_html('<span style="color: green;">✔</span>')
        elif record.lleva_contenedor is False:
            return format_html('<span style="color: red;">✘</span>')

    def render_precio_und_caja(self, record):
        return format_as_currency(record.valor_x_caja_usd - record.tarifa_utilidad)

    def render_valor_x_caja_usd(self, value):
        return format_as_currency(value)

    def render_tarifa_utilidad(self, value):
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


# -------------------- Tabla De seguimiento Tracking ----------------------------------------------------------------
class SeguimienosTable(tables.Table):
    editar = tables.TemplateColumn(template_name='editar_pedido_seguimientos_button.html', orderable=False)
    semana = tables.Column(verbose_name='Week', )
    id = tables.Column(verbose_name='Order', )
    fecha_solicitud = tables.Column(verbose_name='Request Date', )
    exportadora = tables.Column(verbose_name='Exporter', )
    cliente = tables.Column(verbose_name='Customer', )
    intermediario = tables.Column(verbose_name='Intermediary', )
    destino = tables.Column(verbose_name='Destination', )
    total_cajas_solicitadas = tables.Column(verbose_name='Requested Boxes', )
    total_piezas_solicitadas = tables.Column(verbose_name='Requested Pallets', )
    total_peso_bruto_solicitado = tables.Column(verbose_name='Requested Gross Weight', )
    fecha_entrega = tables.Column(verbose_name='Date Of Delivery', )
    aerolinea = tables.Column(verbose_name='Airline', )
    fecha_llegada = tables.Column(verbose_name='Arrival Date', )
    agencia_carga = tables.Column(verbose_name='Cargo Agency', )
    variedades = tables.Column(verbose_name='Products', )
    total_cajas_enviadas = tables.Column(verbose_name='Shipped Boxes', )
    total_piezas_enviadas = tables.Column(verbose_name='Total Pallets Shipped', )
    total_peso_bruto_enviado = tables.Column(verbose_name='Total Gross Weight Shipped', )
    peso_awb = tables.Column(verbose_name='Weight Awb', )
    numero_factura = tables.Column(verbose_name='Invoice', )
    termo = tables.Column(verbose_name='# Termo', )
    responsable_reserva = tables.Column(verbose_name='Booking Responsible', )
    estado_documentos = tables.Column(verbose_name='Document Status', )
    estatus_reserva = tables.Column(verbose_name='Booking Status', )
    estado_pedido = tables.Column(verbose_name='Order Status', )
    observaciones_tracking = tables.Column(verbose_name='Comments', )

    class Meta:
        model = Pedido
        template_name = "django_tables2/bootstrap5-responsive.html"
        fields = ["semana",
                  "id",
                  "fecha_solicitud",
                  "exportadora",
                  "intermediario",
                  "cliente",
                  "destino",
                  "total_cajas_solicitadas",
                  "total_piezas_solicitadas",
                  "total_peso_bruto_solicitado",
                  "fecha_entrega",
                  "awb",
                  "aerolinea",
                  "fecha_llegada",
                  "eta",
                  "etd",
                  "agencia_carga",
                  "variedades",
                  "total_cajas_enviadas",
                  "total_piezas_enviadas",
                  "total_peso_bruto_enviado",
                  "peso_awb",
                  "diferencia_peso_factura_awb",
                  "eta_real",
                  "numero_factura",
                  "termo",
                  "responsable_reserva",
                  "estatus_reserva",
                  "estado_documentos",
                  "estado_pedido",
                  "observaciones_tracking",
                  "editar"
                  ]
        row_attrs = {
            "style": lambda record: "background-color: #f8d7da;" if record.estado_cancelacion == "autorizado" else
            ("background-color: #d4edda;" if record.estado_pedido == "Finalizado" else "")
        }

    def render_fecha_solicitud(self, value):
        return value.strftime('%d/%m/%Y')

    def render_fecha_entrega(self, value):
        return value.strftime('%d/%m/%Y')

    def render_fecha_llegada(self, value):
        return value.strftime('%d/%m/%Y')


class SeguimienosResumenTable(tables.Table):
    semana = tables.Column(verbose_name='Week', )
    id = tables.Column(verbose_name='Order', )
    exportadora = tables.Column(verbose_name='Exporter', )
    cliente = tables.Column(verbose_name='Customer', )
    destino = tables.Column(verbose_name='Destination', )
    variedades = tables.Column(verbose_name='Products', )
    total_cajas_solicitadas = tables.Column(verbose_name='Requested Boxes', )
    total_cajas_enviadas = tables.Column(verbose_name='Shipped Boxes', )
    total_piezas_solicitadas = tables.Column(verbose_name='Requested Pallets', )
    fecha_entrega = tables.Column(verbose_name='Date Of Delivery', )
    responsable_reserva = tables.Column(verbose_name='Booking Responsible', )
    estatus_reserva = tables.Column(verbose_name='Booking Status', )
    aerolinea = tables.Column(verbose_name='Airline', )
    agencia_carga = tables.Column(verbose_name='Cargo Agency', )
    total_peso_bruto_solicitado = tables.Column(verbose_name='Requested Gross Weight', )
    estado_pedido = tables.Column(verbose_name='Order Status', )
    estado_documentos = tables.Column(verbose_name='Document Status', )
    observaciones_tracking = tables.Column(verbose_name='Comments', )

    class Meta:
        model = Pedido
        template_name = "django_tables2/bootstrap5-responsive.html"
        fields = ["semana", "id", "exportadora", "cliente", "destino", "variedades", "total_cajas_solicitadas",
                  "total_cajas_enviadas", "total_piezas_solicitadas", "fecha_entrega", "responsable_reserva",
                  "estatus_reserva", "awb", "aerolinea", "agencia_carga", "total_peso_bruto_solicitado",
                  "total_cajas_enviadas", "estado_pedido", "estado_documentos", "observaciones_tracking", ]
        row_attrs = {
            "style": lambda record: "background-color: #f8d7da;" if record.estado_cancelacion == "autorizado" else
            ("background-color: #d4edda;" if record.estado_pedido == "Finalizado" else "")
        }

    def render_fecha_entrega(self, value):
        return value.strftime('%d/%m/%Y')
