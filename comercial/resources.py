import openpyxl
from django.db.models import Sum
from import_export import resources
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

from .models import Pedido, Cliente, Fruta, Contenedor, DetallePedido, Iata, Presentacion, Referencias, Exportador, \
    TipoCaja, ClientePresentacion, PresentacionReferencia, AutorizacionCancelacion, Aerolinea, AgenciaCarga, \
    Intermediario, SubExportadora


# ////////////////////////////////////// Exportaciones De Cartera /////////////////////////////////////////////////////
def obtener_datos_con_totales_juan(fecha_inicial=None, fecha_final=None):
    pedidos_query = Pedido.objects.filter(exportadora__nombre='Juan_Matas')
    if fecha_inicial is not None:
        pedidos_query = pedidos_query.filter(fecha_entrega__gte=fecha_inicial)

    if fecha_final is not None:
        pedidos_query = pedidos_query.filter(fecha_entrega__lte=fecha_final)
    # Obtener los pedidos y sus datos
    pedidos = pedidos_query.values(
        'id', 'cliente__nombre', 'exportadora__nombre', 'numero_factura',
        'fecha_entrega', 'dias_de_vencimiento', 'valor_total_factura_usd',
        'valor_pagado_cliente_usd', 'utilidad_bancaria_usd', 'fecha_pago', 'estado_factura',
        'valor_total_nota_credito_usd', 'descuento', 'nota_credito_no'
    )

    # Calcular los totales por cliente y exportadora
    totales_por_cliente_exportadora = pedidos_query.values(
        'cliente__nombre', 'exportadora__nombre'
    ).annotate(
        total_factura=Sum('valor_total_factura_usd'),
        total_utilidad=Sum('utilidad_bancaria_usd'),
        total_pagado=Sum('valor_pagado_cliente_usd'),
        total_nc=Sum('valor_total_nota_credito_usd'),
        total_descuentos=Sum('descuento')
    )

    return list(pedidos), list(totales_por_cliente_exportadora)


def obtener_datos_con_totales_fieldex(fecha_inicial=None, fecha_final=None):
    pedidos_query = Pedido.objects.filter(exportadora__nombre='Fieldex')
    if fecha_inicial is not None:
        pedidos_query = pedidos_query.filter(fecha_entrega__gte=fecha_inicial)

    if fecha_final is not None:
        pedidos_query = pedidos_query.filter(fecha_entrega__lte=fecha_final)
    # Obtener los pedidos y sus datos
    pedidos = pedidos_query.values(
        'id', 'cliente__nombre', 'exportadora__nombre', 'numero_factura',
        'fecha_entrega', 'dias_de_vencimiento', 'valor_total_factura_usd',
        'valor_pagado_cliente_usd', 'utilidad_bancaria_usd', 'fecha_pago', 'estado_factura',
        'valor_total_nota_credito_usd', 'descuento', 'nota_credito_no'
    )

    # Calcular los totales por cliente y exportadora
    totales_por_cliente_exportadora = pedidos_query.values(
        'cliente__nombre', 'exportadora__nombre'
    ).annotate(
        total_factura=Sum('valor_total_factura_usd'),
        total_utilidad=Sum('utilidad_bancaria_usd'),
        total_pagado=Sum('valor_pagado_cliente_usd'),
        total_nc=Sum('valor_total_nota_credito_usd'),
        total_descuentos=Sum('descuento')
    )

    return list(pedidos), list(totales_por_cliente_exportadora)


def obtener_datos_con_totales_etnico(fecha_inicial=None, fecha_final=None):
    pedidos_query = Pedido.objects.filter(exportadora__nombre='Etnico')

    if fecha_inicial is not None:
        pedidos_query = pedidos_query.filter(fecha_entrega__gte=fecha_inicial)

    if fecha_final is not None:
        pedidos_query = pedidos_query.filter(fecha_entrega__lte=fecha_final)

    pedidos = pedidos_query.values(
        'id', 'cliente__nombre', 'exportadora__nombre', 'numero_factura',
        'fecha_entrega', 'dias_de_vencimiento', 'valor_total_factura_usd',
        'valor_pagado_cliente_usd', 'utilidad_bancaria_usd', 'fecha_pago', 'estado_factura',
        'valor_total_nota_credito_usd', 'descuento', 'nota_credito_no'
    )

    # Calcular los totales por cliente y exportadora
    totales_por_cliente_exportadora = pedidos_query.values(
        'cliente__nombre', 'exportadora__nombre'
    ).annotate(
        total_factura=Sum('valor_total_factura_usd'),
        total_utilidad=Sum('utilidad_bancaria_usd'),
        total_pagado=Sum('valor_pagado_cliente_usd'),
        total_nc=Sum('valor_total_nota_credito_usd'),
        total_descuentos=Sum('descuento')
    )

    return list(pedidos), list(totales_por_cliente_exportadora)


def obtener_datos_con_totales(fecha_inicial=None, fecha_final=None):
    pedidos_query = Pedido.objects.all()

    if fecha_inicial is not None:
        pedidos_query = pedidos_query.filter(fecha_entrega__gte=fecha_inicial)

    if fecha_final is not None:
        pedidos_query = pedidos_query.filter(fecha_entrega__lte=fecha_final)
    # Obtener los pedidos y sus datos
    pedidos = pedidos_query.values(
        'id', 'cliente__nombre', 'exportadora__nombre', 'numero_factura',
        'fecha_entrega', 'dias_de_vencimiento', 'valor_total_factura_usd',
        'valor_pagado_cliente_usd', 'utilidad_bancaria_usd', 'fecha_pago', 'estado_factura',
        'valor_total_nota_credito_usd', 'descuento', 'nota_credito_no'
    )

    # Calcular los totales por cliente y exportadora
    totales_por_cliente_exportadora = pedidos_query.values(
        'cliente__nombre', 'exportadora__nombre'
    ).annotate(
        total_factura=Sum('valor_total_factura_usd'),
        total_utilidad=Sum('utilidad_bancaria_usd'),
        total_pagado=Sum('valor_pagado_cliente_usd'),
        total_nc=Sum('valor_total_nota_credito_usd'),
        total_descuentos=Sum('descuento')
    )

    return list(pedidos), list(totales_por_cliente_exportadora)


def crear_archivo_excel(pedidos, totales, ruta_archivo):
    # Crear un nuevo workbook y seleccionar la hoja activa
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.title = 'Cartera Clientes'

    # Definir y escribir los encabezados de columna
    encabezados = ['No. Pedido', 'Cliente', 'Exportadora', 'Número Factura', 'Fecha Entrega', 'Días Vencimiento',
                   'Valor Factura USD', 'Valor Pagado Cliente USD', 'Nota Crédito', 'Total NC', 'Descuento',
                   'Utilidad Bancaria', 'Fecha Pago Cliente', 'Estado Factura', 'Saldo']
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
        saldo = pedido['valor_total_factura_usd'] - pedido['valor_pagado_cliente_usd'] - pedido[
            'utilidad_bancaria_usd'] - pedido['valor_total_nota_credito_usd'] - pedido['descuento']
        # Aplicar formato de moneda a las celdas relevantes
        moneda_columns = [7, 8, 10, 11, 12, 15]  # Índices de columnas a formatear como moneda
        for col_idx in moneda_columns:
            sheet.cell(row=sheet.max_row, column=col_idx).number_format = '"$"#,##0.00'

        fila = [
            pedido['id'],
            pedido['cliente__nombre'],
            pedido['exportadora__nombre'],
            pedido['numero_factura'],
            pedido['fecha_entrega'].strftime('%Y-%m-%d') if pedido['fecha_entrega'] else '',
            pedido['dias_de_vencimiento'],
            pedido['valor_total_factura_usd'],
            pedido['valor_pagado_cliente_usd'],
            pedido['nota_credito_no'],
            pedido['valor_total_nota_credito_usd'],
            pedido['descuento'],
            pedido['utilidad_bancaria_usd'],
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
            'Total Facturas ->',
            total['total_factura'],
            'Total Pagado Cliente ->',
            total['total_pagado'],
            'Total Utilidades Banc ->',
            total['total_utilidad'],
            'Total Notas Credito ->',
            total['total_nc'],
            'Total Descuentos ->',
            total['total_descuentos'],
            'Saldo ->',
            total['total_factura'] - total['total_pagado'] - total['total_utilidad'] - total['total_nc'] - total[
                'total_descuentos']
        ]
        sheet.append(fila_total)
        moneda_columns = [4, 6, 8, 10, 12, 14]  # Índices de columnas a formatear como moneda totales
        for col_idx in moneda_columns:
            sheet.cell(row=sheet.max_row, column=col_idx).number_format = '"$"#,##0.00'
        for cell in sheet[sheet.max_row]:
            cell.border = thin_border
            cell.fill = PatternFill(start_color='9ed1b7', end_color='9ed1b7',
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


class IataResource(resources.ModelResource):
    class Meta:
        model = Iata


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


class ClientePresentacionResource(resources.ModelResource):
    class Meta:
        model = ClientePresentacion


class PresentacionReferenciaResource(resources.ModelResource):
    class Meta:
        model = PresentacionReferencia


class AutorizacionCancelacionResource(resources.ModelResource):
    class Meta:
        model = AutorizacionCancelacion


class AerolineaResource(resources.ModelResource):
    class Meta:
        model = Aerolinea


class AgenciaCargaResource(resources.ModelResource):
    class Meta:
        model = AgenciaCarga


class IntermediarioResource(resources.ModelResource):
    class Meta:
        model = Intermediario


class SubExportadoraResource(resources.ModelResource):
    class Meta:
        model = SubExportadora
