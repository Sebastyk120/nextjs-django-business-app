from import_export import resources, fields
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
from .models import Pedido, Cliente, Fruta, Contenedor, DetallePedido, Pais, Presentacion, Referencias, Exportador, \
    TipoCaja
from django.db.models import Sum


# ////////////////////////////////////// Exportaciones De Cartera /////////////////////////////////////////////////////
def obtener_datos_con_totales_juan():
    # Obtener los pedidos y sus datos
    pedidos = Pedido.objects.filter(exportadora__nombre='Juan_Matas').values(
        'cliente__nombre', 'exportadora__nombre', 'numero_factura',
        'fecha_entrega', 'dias_de_vencimiento', 'valor_total_factura_usd',
        'valor_pagado_cliente_usd', 'comision_bancaria_usd', 'fecha_pago', 'estado_factura'
    )

    # Calcular los totales por cliente y exportadora
    totales_por_cliente_exportadora = Pedido.objects.filter(exportadora__nombre='Juan_Matas').values(
        'cliente__nombre', 'exportadora__nombre'
    ).annotate(
        total_factura=Sum('valor_total_factura_usd'),
        total_comision=Sum('comision_bancaria_usd'),
        total_pagado=Sum('valor_pagado_cliente_usd')
    )

    return list(pedidos), list(totales_por_cliente_exportadora)


def obtener_datos_con_totales_fieldex():
    # Obtener los pedidos y sus datos
    pedidos = Pedido.objects.filter(exportadora__nombre='Fieldex').values(
        'cliente__nombre', 'exportadora__nombre', 'numero_factura',
        'fecha_entrega', 'dias_de_vencimiento', 'valor_total_factura_usd',
        'valor_pagado_cliente_usd', 'comision_bancaria_usd', 'fecha_pago', 'estado_factura'
    )

    # Calcular los totales por cliente y exportadora
    totales_por_cliente_exportadora = Pedido.objects.filter(exportadora__nombre='Fieldex').values(
        'cliente__nombre', 'exportadora__nombre'
    ).annotate(
        total_factura=Sum('valor_total_factura_usd'),
        total_comision=Sum('comision_bancaria_usd'),
        total_pagado=Sum('valor_pagado_cliente_usd')
    )

    return list(pedidos), list(totales_por_cliente_exportadora)


def obtener_datos_con_totales_etnico():
    # Obtener los pedidos y sus datos
    pedidos = Pedido.objects.filter(exportadora__nombre='Etnico').values(
        'cliente__nombre', 'exportadora__nombre', 'numero_factura',
        'fecha_entrega', 'dias_de_vencimiento', 'valor_total_factura_usd',
        'valor_pagado_cliente_usd', 'comision_bancaria_usd', 'fecha_pago', 'estado_factura'
    )

    # Calcular los totales por cliente y exportadora
    totales_por_cliente_exportadora = Pedido.objects.filter(exportadora__nombre='Etnico').values(
        'cliente__nombre', 'exportadora__nombre'
    ).annotate(
        total_factura=Sum('valor_total_factura_usd'),
        total_comision=Sum('comision_bancaria_usd'),
        total_pagado=Sum('valor_pagado_cliente_usd')
    )

    return list(pedidos), list(totales_por_cliente_exportadora)


def obtener_datos_con_totales():
    # Obtener los pedidos y sus datos
    pedidos = Pedido.objects.all().values(
        'cliente__nombre', 'exportadora__nombre', 'numero_factura',
        'fecha_entrega', 'dias_de_vencimiento', 'valor_total_factura_usd',
        'valor_pagado_cliente_usd', 'comision_bancaria_usd', 'fecha_pago', 'estado_factura'
    )

    # Calcular los totales por cliente y exportadora
    totales_por_cliente_exportadora = Pedido.objects.values(
        'cliente__nombre', 'exportadora__nombre'
    ).annotate(
        total_factura=Sum('valor_total_factura_usd'),
        total_comision=Sum('comision_bancaria_usd'),
        total_pagado=Sum('valor_pagado_cliente_usd')
    )

    return list(pedidos), list(totales_por_cliente_exportadora)


def crear_archivo_excel(pedidos, totales, ruta_archivo):
    # Crear un nuevo workbook y seleccionar la hoja activa
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.title = 'Cartera Clientes'

    # Definir y escribir los encabezados de columna
    encabezados = ['Cliente', 'Exportadora', 'Número Factura', 'Fecha Entrega', 'Días Vencimiento', 'Valor Total USD',
                   'Valor Pagado USD', 'Comision Bancaria', 'Fecha Pago', 'Estado Factura', 'Saldo']
    sheet.append(encabezados)

    # Estilo para los encabezados
    for cell in sheet[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal='center')
        cell.fill = PatternFill(start_color='FFFF00', end_color='FFFF00', fill_type='solid')
    # Estilo para las celdas de datos
    thin_border = Border(left=Side(style='thin'),
                         right=Side(style='thin'),
                         top=Side(style='thin'),
                         bottom=Side(style='thin'))

    # Escribir los datos de los pedidos
    for pedido in pedidos:
        saldo = pedido['valor_total_factura_usd'] - pedido['valor_pagado_cliente_usd'] - pedido['comision_bancaria_usd']
        fila = [
            pedido['cliente__nombre'],
            pedido['exportadora__nombre'],
            pedido['numero_factura'],
            pedido['fecha_entrega'].strftime('%Y-%m-%d') if pedido['fecha_entrega'] else '',
            pedido['dias_de_vencimiento'],
            pedido['valor_total_factura_usd'],
            pedido['valor_pagado_cliente_usd'],
            pedido['comision_bancaria_usd'],
            pedido['fecha_pago'].strftime('%Y-%m-%d') if pedido['fecha_pago'] else '',
            pedido['estado_factura'],
            saldo
        ]
        sheet.append(fila)

    # Escribir los totales
    for total in totales:
        fila_total = [
            total['cliente__nombre'],
            total['exportadora__nombre'],
            '-----------------',
            'Total',
            'Total Facturas',
            total['total_factura'],
            'Total Pagado Cliente',
            total['total_pagado'],
            'Total Comisiones Banc',
            total['total_comision'],
            total['total_factura'] - total['total_pagado'] - total['total_comision']
        ]
        sheet.append(fila_total)
        for cell in sheet[sheet.max_row]:
            cell.border = thin_border
            cell.fill = PatternFill(start_color='FFC7CE', end_color='FFC7CE',
                                    fill_type='solid')  # Color diferente para totales

        # Ajustar el ancho de las columnas
    for col in range(1, len(encabezados) + 1):
        sheet.column_dimensions[get_column_letter(col)].width = 15

    # Guardar el archivo
    workbook.save(ruta_archivo)

    return ruta_archivo


# ////////////////////////////////////// Fin Exportaciones De Cartera /////////////////////////////////////////////////
# Recursos Para Importaciones.

class ClienteResource(resources.ModelResource):
    class Meta:
        model = Cliente


class ContenedorResource(resources.ModelResource):
    class Meta:
        model = Contenedor


class DetallePedidoResource(resources.ModelResource):
    class Meta:
        model = DetallePedido
        fields = [field.name for field in DetallePedido._meta.fields]

    def before_import_row(self, row, **kwargs):
        """
        Elimina o modifica los valores de los campos no editables antes de importar cada fila.
        """
        campos_no_editables = [field.name for field in DetallePedido._meta.fields if not field.editable]
        for campo in campos_no_editables:
            if campo in row:
                # Eliminar el campo o establecer un valor predeterminado
                del row[campo]
                # O establecer un valor predeterminado
                # row[campo] = valor_predeterminado


class ExportadorResource(resources.ModelResource):
    class Meta:
        model = Exportador


class TipoCajaResource(resources.ModelResource):
    class Meta:
        model = TipoCaja


class FrutaResource(resources.ModelResource):
    class Meta:
        model = Fruta


class PaisResource(resources.ModelResource):
    class Meta:
        model = Pais


class PedidoResource(resources.ModelResource):
    class Meta:
        model = Pedido
        fields = [field.name for field in Pedido._meta.fields]

    def before_import_row(self, row, **kwargs):
        """
        Elimina o modifica los valores de los campos no editables antes de importar cada fila.
        """
        campos_no_editables = [field.name for field in Pedido._meta.fields if not field.editable]
        for campo in campos_no_editables:
            if campo in row:
                # Eliminar el campo o establecer un valor predeterminado
                del row[campo]
                # O establecer un valor predeterminado
                # row[campo] = valor_predeterminado


class PresentacionResource(resources.ModelResource):
    class Meta:
        model = Presentacion


class ReferenciasResource(resources.ModelResource):
    class Meta:
        model = Referencias
