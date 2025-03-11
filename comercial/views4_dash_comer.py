import io
from datetime import datetime, timedelta

import xlsxwriter
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db import connection
from django.db.models import Sum, DecimalField, IntegerField, Q, Count
from django.db.models.functions import Coalesce
from django.http import HttpResponse
from django.shortcuts import render
from comercial.models import Pedido, DetallePedido, Cliente, Intermediario, Fruta, Exportador


def es_miembro_del_grupo(nombre_grupo):
    def es_miembro(user):
        return user.groups.filter(name=nombre_grupo).exists()

    return es_miembro


@login_required
@user_passes_test(user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home'))
def dashboard_comercial(request):
    context = get_dashboard_comercial_data(request)
    return render(request, 'dashboard_comercial.html', context)


def obtener_nombre_mes(mes):
    nombres_meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril',
        'Mayo', 'Junio', 'Julio', 'Agosto',
        'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return nombres_meses[mes - 1] if 1 <= mes <= 12 else 'Desconocido'

# ------------------------------ Dashboard Comercial ---------------------------------------------------------------


# ------------------------------ Exportacion Dashboard Comercial ---------------------------------------------------


@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def exportar_dashboard_comercial(request):
    """
    Exporta los datos del dashboard comercial a un archivo Excel con múltiples hojas
    y formato profesional, utilizando los mismos filtros que el dashboard.
    """
    # Obtener los mismos parámetros de filtro que el dashboard
    fecha_inicio_str = request.GET.get('fecha_inicio')
    fecha_fin_str = request.GET.get('fecha_fin')
    cliente_id = request.GET.get('cliente')
    intermediario_id = request.GET.get('intermediario')
    fruta_id = request.GET.get('fruta')
    exportador_id = request.GET.get('exportador')
    
    # Establecer fechas por defecto si no están definidas (mismo código que en dashboard_comercial)
    if not fecha_inicio_str:
        fecha_inicio = datetime.now().date() - timedelta(days=30)
        fecha_inicio_str = fecha_inicio.strftime('%Y-%m-%d')
    else:
        fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()

    if not fecha_fin_str:
        fecha_fin = datetime.now().date()
        fecha_fin_str = fecha_fin.strftime('%Y-%m-%d')
    else:
        fecha_fin = datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
    
    # Obtener todos los datos utilizando la función existente (con los mismos filtros)
    # Esta línea solo extrae el contexto, no renderiza la plantilla
    context = get_dashboard_comercial_data(request)
    
    # Crear un nombre descriptivo para el archivo
    filtro_descripcion = f"Periodo_{fecha_inicio_str}_a_{fecha_fin_str}"
    if cliente_id:
        cliente = Cliente.objects.get(id=cliente_id)
        filtro_descripcion += f"_Cliente_{cliente.nombre.replace(' ', '_')}"
    if fruta_id:
        fruta = Fruta.objects.get(id=fruta_id)
        filtro_descripcion += f"_Fruta_{fruta.nombre.replace(' ', '_')}"
    
    # Crear un archivo de Excel en memoria
    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output)
    
    # Definir formatos para el Excel
    title_format = workbook.add_format({
        'bold': True,
        'font_size': 14,
        'align': 'center',
        'valign': 'vcenter',
        'bg_color': '#4F81BD',
        'font_color': 'white',
        'border': 1
    })
    
    header_format = workbook.add_format({
        'bold': True,
        'bg_color': '#D0E1F5',
        'border': 1,
        'align': 'center'
    })
    
    date_format = workbook.add_format({
        'num_format': 'dd/mm/yyyy',
        'border': 1
    })
    
    number_format = workbook.add_format({
        'num_format': '#,##0.00',
        'border': 1
    })
    
    integer_format = workbook.add_format({
        'num_format': '#,##0',
        'border': 1
    })
    
    percent_format = workbook.add_format({
        'num_format': '0.00%',
        'border': 1
    })
    
    money_format = workbook.add_format({
        'num_format': '$#,##0.00',
        'border': 1
    })
    
    text_format = workbook.add_format({
        'border': 1
    })
    
    # Formato para celdas positivas (verde) y negativas (rojo)
    positive_format = workbook.add_format({
        'num_format': '+0.00%',
        'font_color': 'green',
        'border': 1
    })
    
    negative_format = workbook.add_format({
        'num_format': '+0.00%',
        'font_color': 'red',
        'border': 1
    })
    
    # 1. Hoja de Resumen
    ws_resumen = workbook.add_worksheet('Resumen')
    
    # Configurar ancho de columnas
    ws_resumen.set_column('A:A', 25)
    ws_resumen.set_column('B:B', 15)
    ws_resumen.set_column('C:D', 20)
    
    # Título y período
    ws_resumen.merge_range('A1:D1', 'DASHBOARD COMERCIAL - RESUMEN', title_format)
    ws_resumen.merge_range('A2:D2', f'Período: {fecha_inicio.strftime("%d/%m/%Y")} - {fecha_fin.strftime("%d/%m/%Y")}', header_format)
    
    # Agregar filtros aplicados
    row = 3
    ws_resumen.write(row, 0, 'Filtros aplicados:', header_format)
    row += 1
    ws_resumen.write(row, 0, 'Fecha inicio:', text_format)
    ws_resumen.write(row, 1, fecha_inicio, date_format)
    row += 1
    ws_resumen.write(row, 0, 'Fecha fin:', text_format)
    ws_resumen.write(row, 1, fecha_fin, date_format)
    row += 1
    
    if cliente_id:
        cliente = Cliente.objects.get(id=cliente_id)
        ws_resumen.write(row, 0, 'Cliente:', text_format)
        ws_resumen.write(row, 1, cliente.nombre, text_format)
        row += 1
    
    if intermediario_id:
        intermediario = Intermediario.objects.get(id=intermediario_id)
        ws_resumen.write(row, 0, 'Intermediario:', text_format)
        ws_resumen.write(row, 1, intermediario.nombre, text_format)
        row += 1
    
    if fruta_id:
        fruta = Fruta.objects.get(id=fruta_id)
        ws_resumen.write(row, 0, 'Fruta:', text_format)
        ws_resumen.write(row, 1, fruta.nombre, text_format)
        row += 1
    
    if exportador_id:
        exportador = Exportador.objects.get(id=exportador_id)
        ws_resumen.write(row, 0, 'Exportador:', text_format)
        ws_resumen.write(row, 1, exportador.nombre, text_format)
        row += 1
    
    # Agregar espacio
    row += 1
    
    # Tabla de métricas principales con comparativo
    ws_resumen.merge_range(row, 0, row, 3, 'MÉTRICAS PRINCIPALES', header_format)
    row += 1
    
    # Encabezados
    ws_resumen.write(row, 0, 'Métrica', header_format)
    ws_resumen.write(row, 1, 'Valor Actual', header_format)
    ws_resumen.write(row, 2, 'Valor Periodo Anterior', header_format)
    ws_resumen.write(row, 3, 'Variación (%)', header_format)
    row += 1
    
    # Agregar datos de métricas principales
    metricas = [
        ('Total Kilos', context['global_total_kilos'], context.get('kilos_prev', 0), context.get('kilos_percent', 0)),
        ('Total Cajas', context['global_total_cajas'], context.get('cajas_prev', 0), context.get('cajas_percent', 0)),
        ('Total Facturado (USD)', context['global_total_facturado'], context.get('facturado_prev', 0), context.get('facturado_percent', 0)),
        ('Total Utilidades (USD)', context['global_total_utilidades_usd'], context.get('utilidad_usd_prev', 0), context.get('utilidad_usd_percent', 0)),
        ('Total Notas Crédito (USD)', context['global_total_notas_credito'], context.get('notas_credito_prev', 0), context.get('notas_credito_percent', 0)),
        ('Total Pedidos Cancelados', context['global_total_cancelados'], context.get('cancelados_prev', 0), context.get('cancelados_percent', 0))
    ]
    
    for metrica, valor_actual, valor_anterior, variacion in metricas:
        ws_resumen.write(row, 0, metrica, text_format)
        
        # Determinar el formato adecuado según el tipo de métrica
        if 'Kilos' in metrica or 'Cajas' in metrica or 'Cancelados' in metrica:
            ws_resumen.write(row, 1, valor_actual, integer_format)
            ws_resumen.write(row, 2, valor_anterior, integer_format)
        elif 'USD' in metrica:
            ws_resumen.write(row, 1, valor_actual, money_format)
            ws_resumen.write(row, 2, valor_anterior, money_format)
        else:
            ws_resumen.write(row, 1, valor_actual, number_format)
            ws_resumen.write(row, 2, valor_anterior, number_format)
        
        # Aplicar formato condicional para la variación
        variacion_decimal = variacion / 100  # Convertir a decimal para el formato de porcentaje
        if variacion > 0:
            ws_resumen.write(row, 3, variacion_decimal, positive_format)
        else:
            ws_resumen.write(row, 3, variacion_decimal, negative_format)
        
        row += 1
    
    # 2. Hoja de Datos Mensuales
    ws_mensual = workbook.add_worksheet('Datos Mensuales')
    
    # Configurar ancho de columnas
    ws_mensual.set_column('A:A', 10)  # Año
    ws_mensual.set_column('B:B', 12)  # Mes
    ws_mensual.set_column('C:G', 15)  # Datos
    
    # Título
    ws_mensual.merge_range('A1:G1', 'DATOS MENSUALES', title_format)
    ws_mensual.merge_range('A2:G2', f'Período: {fecha_inicio.strftime("%d/%m/%Y")} - {fecha_fin.strftime("%d/%m/%Y")}', header_format)
    
    # Encabezados
    row = 3
    ws_mensual.write(row, 0, 'Año', header_format)
    ws_mensual.write(row, 1, 'Mes', header_format)
    ws_mensual.write(row, 2, 'Total Kilos', header_format)
    ws_mensual.write(row, 3, 'Total Cajas', header_format)
    ws_mensual.write(row, 4, 'Total Utilidad (USD)', header_format)
    ws_mensual.write(row, 5, 'Notas Crédito (USD)', header_format)
    ws_mensual.write(row, 6, 'Utilidad Neta (USD)', header_format)
    row += 1
    
    # Datos mensuales
    for dato in context['datos_mensuales']:
        ws_mensual.write(row, 0, dato['año'], text_format)
        ws_mensual.write(row, 1, dato['nombre_mes'], text_format)
        ws_mensual.write(row, 2, dato['total_kilos'], integer_format)
        ws_mensual.write(row, 3, dato['total_cajas'], integer_format)
        ws_mensual.write(row, 4, dato['total_utilidad'], money_format)
        ws_mensual.write(row, 5, dato['total_nc'], money_format)
        
        # Calcular utilidad neta (utilidad - notas crédito)
        utilidad_neta = dato['total_utilidad'] - dato['total_nc']
        ws_mensual.write(row, 6, utilidad_neta, money_format)
        
        row += 1
    
    # 3. Hoja de Análisis por Cliente
    ws_clientes = workbook.add_worksheet('Clientes')
    
    # Configurar ancho de columnas
    ws_clientes.set_column('A:A', 30)  # Nombre cliente
    ws_clientes.set_column('B:G', 15)  # Datos
    
    # Título
    ws_clientes.merge_range('A1:G1', 'ANÁLISIS POR CLIENTE', title_format)
    ws_clientes.merge_range('A2:G2', f'Período: {fecha_inicio.strftime("%d/%m/%Y")} - {fecha_fin.strftime("%d/%m/%Y")}', header_format)
    
    # Encabezados
    row = 3
    ws_clientes.write(row, 0, 'Cliente', header_format)
    ws_clientes.write(row, 1, 'Pedidos', header_format)
    ws_clientes.write(row, 2, 'Total Kilos', header_format)
    ws_clientes.write(row, 3, '% Kilos', header_format)
    ws_clientes.write(row, 4, 'Total Facturado (USD)', header_format)
    ws_clientes.write(row, 5, 'Total Utilidad (USD)', header_format)
    ws_clientes.write(row, 6, '% Utilidad', header_format)
    row += 1
    
    # Datos de clientes
    for cliente in context['clientes_data']:
        ws_clientes.write(row, 0, cliente['cliente__nombre'], text_format)
        ws_clientes.write(row, 1, cliente['num_pedidos'], integer_format)
        ws_clientes.write(row, 2, cliente['total_kilos'], integer_format)
        ws_clientes.write(row, 3, cliente['percent_kilos'] / 100, percent_format)  # Convertir a decimal para el formato
        ws_clientes.write(row, 4, cliente['total_facturado'], money_format)
        ws_clientes.write(row, 5, cliente['total_utilidades'], money_format)
        ws_clientes.write(row, 6, cliente['percent_utilidad'] / 100, percent_format)  # Convertir a decimal para el formato
        
        row += 1
    
    # 4. Hoja de Análisis por Fruta
    ws_frutas = workbook.add_worksheet('Análisis por Fruta')
    
    # Configurar ancho de columnas
    ws_frutas.set_column('A:A', 25)  # Nombre fruta
    ws_frutas.set_column('B:C', 15)  # Datos
    
    # Título
    ws_frutas.merge_range('A1:C1', 'ANÁLISIS POR FRUTA', title_format)
    ws_frutas.merge_range('A2:C2', f'Período: {fecha_inicio.strftime("%d/%m/%Y")} - {fecha_fin.strftime("%d/%m/%Y")}', header_format)
    
    # Encabezados para utilidad por fruta
    row = 3
    ws_frutas.merge_range(row, 0, row, 2, 'UTILIDAD POR FRUTA', header_format)
    row += 1
    
    ws_frutas.write(row, 0, 'Fruta', header_format)
    ws_frutas.write(row, 1, 'Utilidad (USD)', header_format)
    ws_frutas.write(row, 2, '% del Total', header_format)
    row += 1
    
    # Datos de utilidad por fruta
    total_utilidad_fruta = sum(fruta['total_utilidad'] for fruta in context['utilidad_por_fruta'])
    
    for fruta in context['utilidad_por_fruta']:
        ws_frutas.write(row, 0, fruta['fruta__nombre'], text_format)
        ws_frutas.write(row, 1, fruta['total_utilidad'], money_format)
        
        # Calcular porcentaje
        porcentaje = fruta['total_utilidad'] / total_utilidad_fruta if total_utilidad_fruta else 0
        ws_frutas.write(row, 2, porcentaje, percent_format)
        
        row += 1
    
    # Espacio entre tablas
    row += 2
    
    # Encabezados para kilos por fruta
    ws_frutas.merge_range(row, 0, row, 2, 'KILOS POR FRUTA', header_format)
    row += 1
    
    ws_frutas.write(row, 0, 'Fruta', header_format)
    ws_frutas.write(row, 1, 'Kilos', header_format)
    ws_frutas.write(row, 2, '% del Total', header_format)
    row += 1
    
    # Datos de kilos por fruta
    total_kilos_fruta = sum(fruta['total_kilos'] for fruta in context['kilos_por_fruta'])
    
    for fruta in context['kilos_por_fruta']:
        ws_frutas.write(row, 0, fruta['fruta__nombre'], text_format)
        ws_frutas.write(row, 1, fruta['total_kilos'], integer_format)
        
        # Calcular porcentaje
        porcentaje = fruta['total_kilos'] / total_kilos_fruta if total_kilos_fruta else 0
        ws_frutas.write(row, 2, porcentaje, percent_format)
        
        row += 1
    
    # 5. Hoja de Análisis por Exportador
    ws_exportadores = workbook.add_worksheet('Exportadores')
    
    # Configurar ancho de columnas
    ws_exportadores.set_column('A:A', 30)  # Nombre exportador
    ws_exportadores.set_column('B:C', 15)  # Datos
    
    # Título
    ws_exportadores.merge_range('A1:C1', 'ANÁLISIS POR EXPORTADOR', title_format)
    ws_exportadores.merge_range('A2:C2', f'Período: {fecha_inicio.strftime("%d/%m/%Y")} - {fecha_fin.strftime("%d/%m/%Y")}', header_format)
    
    # Encabezados
    row = 3
    ws_exportadores.write(row, 0, 'Exportador', header_format)
    ws_exportadores.write(row, 1, 'Utilidad (USD)', header_format)
    ws_exportadores.write(row, 2, '% del Total', header_format)
    row += 1
    
    # Datos de exportadores
    total_utilidad_exportadores = sum(exp['total_utilidad'] for exp in context['utilidad_por_exportador'])
    
    for exportador in context['utilidad_por_exportador']:
        ws_exportadores.write(row, 0, exportador['exportadora__nombre'], text_format)
        ws_exportadores.write(row, 1, exportador['total_utilidad'], money_format)
        
        # Calcular porcentaje
        porcentaje = exportador['total_utilidad'] / total_utilidad_exportadores if total_utilidad_exportadores else 0
        ws_exportadores.write(row, 2, porcentaje, percent_format)
        
        row += 1
    
    # 6. Agregar una hoja de gráficos si lo desea
    ws_graficos = workbook.add_worksheet('Gráficos')
    
    # Título
    ws_graficos.merge_range('A1:G1', 'GRÁFICOS DE ANÁLISIS', title_format)
    
    # Crear un gráfico de columnas para datos mensuales
    chart_mensual = workbook.add_chart({'type': 'column'})
    
    # Configurar datos de las series (usando los datos de la hoja de datos mensuales)
    num_meses = len(context['datos_mensuales'])
    
    # Serie para kilos
    chart_mensual.add_series({
        'name': 'Total Kilos (miles)',
        'categories': ['Datos Mensuales', 4, 1, 3 + num_meses, 1],  # Rango de etiquetas
        'values': ['Datos Mensuales', 4, 2, 3 + num_meses, 2],  # Rango de valores
        'data_labels': {'value': True},
        'y2_axis': True,  # Usar eje Y secundario para kilos
    })
    
    # Serie para utilidad
    chart_mensual.add_series({
        'name': 'Utilidad Neta (USD)',
        'categories': ['Datos Mensuales', 4, 1, 3 + num_meses, 1],  # Rango de etiquetas
        'values': ['Datos Mensuales', 4, 6, 3 + num_meses, 6],  # Rango de valores
        'data_labels': {'value': True},
    })
    
    # Configurar el gráfico
    chart_mensual.set_title({'name': 'Evolución Mensual de Kilos y Utilidad'})
    chart_mensual.set_x_axis({'name': 'Mes'})
    chart_mensual.set_y_axis({'name': 'Utilidad (USD)'})
    chart_mensual.set_y2_axis({'name': 'Kilos (miles)'})
    chart_mensual.set_style(11)  # Estilo del gráfico
    
    # Insertar el gráfico en la hoja
    ws_graficos.insert_chart('A3', chart_mensual, {'x_offset': 25, 'y_offset': 10, 'x_scale': 2.5, 'y_scale': 2.5})
    
    # Crear un gráfico circular para la distribución de utilidad por cliente
    chart_clientes = workbook.add_chart({'type': 'pie'})
    
    # Configurar datos
    num_clientes = min(5, len(context['utilidad_por_cliente']))  # Limitar a los 5 principales clientes
    
    chart_clientes.add_series({
        'name': 'Utilidad por Cliente',
        'categories': ['Clientes', 4, 0, 3 + num_clientes, 0],  # Rango de etiquetas
        'values': ['Clientes', 4, 5, 3 + num_clientes, 5],  # Rango de valores
        'data_labels': {'percentage': True},
    })
    
    # Configurar el gráfico
    chart_clientes.set_title({'name': 'Distribución de Utilidad por Cliente (Top 5)'})
    chart_clientes.set_style(10)
    
    # Insertar el gráfico en la hoja
    ws_graficos.insert_chart('U3', chart_clientes, {'x_offset': 25, 'y_offset': 10, 'x_scale': 2, 'y_scale': 2})
    
    # Cerrar el libro y preparar la respuesta
    workbook.close()
    output.seek(0)
    
    # Crear la respuesta HTTP
    response = HttpResponse(
        output.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    
    # Configurar el nombre del archivo
    nombre_archivo = f'Dashboard_Comercial_{filtro_descripcion}.xlsx'
    response['Content-Disposition'] = f'attachment; filename="{nombre_archivo}"'
    
    return response


def get_dashboard_comercial_data(request):
    # Obtener parámetros del filtro
    fecha_inicio_str = request.GET.get('fecha_inicio')
    fecha_fin_str = request.GET.get('fecha_fin')
    cliente_id = request.GET.get('cliente')
    intermediario_id = request.GET.get('intermediario')
    fruta_id = request.GET.get('fruta')
    exportador_id = request.GET.get('exportador')

    # Establecer fechas por defecto si no están definidas
    if not fecha_inicio_str:
        fecha_inicio = datetime.now().date() - timedelta(days=30)
        fecha_inicio_str = fecha_inicio.strftime('%Y-%m-%d')
    else:
        fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()

    if not fecha_fin_str:
        fecha_fin = datetime.now().date()
        fecha_fin_str = fecha_fin.strftime('%Y-%m-%d')
    else:
        fecha_fin = datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()

    # Construir filtro base
    filter_args = {
        'fecha_entrega__range': [fecha_inicio, fecha_fin],
    }

    # Aplicar filtros adicionales si están presentes
    if cliente_id:
        filter_args['cliente_id'] = cliente_id
    if intermediario_id:
        filter_args['intermediario_id'] = intermediario_id
    if exportador_id:
        filter_args['exportadora_id'] = exportador_id

    # Base queryset
    pedidos = Pedido.objects.filter(**filter_args)
    pedidos_ids = pedidos.values_list('id', flat=True)

    # Obtener datos mensuales para el gráfico temporal
    with connection.cursor() as cursor:
        # Construir el filtro para la consulta SQL
        where_clause = "WHERE p.fecha_entrega BETWEEN %s AND %s"
        params = [fecha_inicio, fecha_fin]

        if cliente_id:
            where_clause += " AND p.cliente_id = %s"
            params.append(cliente_id)
        if intermediario_id:
            where_clause += " AND p.intermediario_id = %s"
            params.append(intermediario_id)
        if exportador_id:
            where_clause += " AND p.exportadora_id = %s"
            params.append(exportador_id)
        if fruta_id:
            where_clause += " AND dp.fruta_id = %s"
            params.append(fruta_id)

        cursor.execute(f"""
            SELECT 
                EXTRACT(YEAR FROM p.fecha_entrega) AS año,
                EXTRACT(MONTH FROM p.fecha_entrega) AS mes, 
                SUM(dp.kilos_enviados) AS total_kilos,
                SUM(dp.cajas_enviadas) AS total_cajas,
                SUM(dp.valor_total_utilidad_x_producto) AS total_utilidad,
                SUM(dp.valor_nota_credito_usd) AS total_nc
            FROM comercial_pedido p
            JOIN comercial_detallepedido dp ON p.id = dp.pedido_id
            {where_clause}
            GROUP BY año, mes
            ORDER BY año, mes
        """, params)

        datos_mensuales = []
        for row in cursor.fetchall():
            año = int(row[0])
            mes = int(row[1])
            datos_mensuales.append({
                'año': año,
                'mes': mes,
                'fecha': f"{año}-{mes:02d}",
                'nombre_mes': obtener_nombre_mes(mes),
                'total_kilos': float(row[2]) if row[2] else 0,
                'total_cajas': int(row[3]) if row[3] else 0,
                'total_utilidad': float(row[4]) if row[4] else 0,
                'total_nc': float(row[5]) if row[5] else 0
            })

    # Calcular periodos comparativos
    periodo_anterior_inicio = fecha_inicio - timedelta(days=(fecha_fin - fecha_inicio).days)
    periodo_anterior_fin = fecha_inicio - timedelta(days=1)

    filtros_periodo_anterior = filter_args.copy()
    filtros_periodo_anterior['fecha_entrega__range'] = [periodo_anterior_inicio, periodo_anterior_fin]
    pedidos_periodo_anterior = Pedido.objects.filter(**filtros_periodo_anterior)

    # Obtener datos mensuales del periodo anterior para comparación en gráficos
    datos_mensuales_anterior = []
    with connection.cursor() as cursor:
        # Construir el filtro para la consulta SQL del periodo anterior
        where_clause = "WHERE p.fecha_entrega BETWEEN %s AND %s"
        params = [periodo_anterior_inicio, periodo_anterior_fin]

        if cliente_id:
            where_clause += " AND p.cliente_id = %s"
            params.append(cliente_id)
        if intermediario_id:
            where_clause += " AND p.intermediario_id = %s"
            params.append(intermediario_id)
        if exportador_id:
            where_clause += " AND p.exportadora_id = %s"
            params.append(exportador_id)
        if fruta_id:
            where_clause += " AND dp.fruta_id = %s"
            params.append(fruta_id)

        cursor.execute(f"""
            SELECT 
                EXTRACT(YEAR FROM p.fecha_entrega) AS año,
                EXTRACT(MONTH FROM p.fecha_entrega) AS mes, 
                SUM(dp.kilos_enviados) AS total_kilos,
                SUM(dp.cajas_enviadas) AS total_cajas,
                SUM(dp.valor_total_utilidad_x_producto) AS total_utilidad,
                SUM(dp.valor_nota_credito_usd) AS total_nc
            FROM comercial_pedido p
            JOIN comercial_detallepedido dp ON p.id = dp.pedido_id
            {where_clause}
            GROUP BY año, mes
            ORDER BY año, mes
        """, params)

        for row in cursor.fetchall():
            año = int(row[0])
            mes = int(row[1])
            datos_mensuales_anterior.append({
                'año': año,
                'mes': mes,
                'fecha': f"{año}-{mes:02d}",
                'nombre_mes': obtener_nombre_mes(mes),
                'total_kilos': float(row[2]) if row[2] else 0,
                'total_cajas': int(row[3]) if row[3] else 0,
                'total_utilidad': float(row[4]) if row[4] else 0,
                'total_nc': float(row[5]) if row[5] else 0
            })

    # Calcular métricas principales
    if fruta_id:
        # Si hay filtro de fruta, calculamos desde DetallePedido
        detalles = DetallePedido.objects.filter(pedido__in=pedidos, fruta_id=fruta_id)

        total_kilos = detalles.aggregate(total=Coalesce(Sum('kilos_enviados'), 0.0, output_field=DecimalField()))[
            'total']
        total_cajas = detalles.aggregate(total=Coalesce(Sum('cajas_enviadas'), 0, output_field=IntegerField()))['total']
        total_facturado = detalles.aggregate(total=Coalesce(Sum('valor_x_producto'), 0.0, output_field=DecimalField()))[
            'total']
        total_utilidad_usd = \
            detalles.aggregate(
                total=Coalesce(Sum('valor_total_utilidad_x_producto'), 0.0, output_field=DecimalField()))[
                'total']
        total_notas_credito = \
            detalles.aggregate(total=Coalesce(Sum('valor_nota_credito_usd'), 0.0, output_field=DecimalField()))['total']
    else:
        # Sin filtro de fruta, usamos DetallePedido sumando todos los pedidos
        detalles = DetallePedido.objects.filter(pedido__in=pedidos)
        
        # Siempre usamos kilos_enviados para total_kilos
        total_kilos = detalles.aggregate(total=Coalesce(Sum('kilos_enviados'), 0.0, output_field=DecimalField()))['total']
        
        # El resto de los cálculos se mantienen como estaban
        total_cajas = pedidos.aggregate(total=Coalesce(Sum('total_cajas_enviadas'), 0, output_field=IntegerField()))[
            'total']
        total_facturado = \
            pedidos.aggregate(total=Coalesce(Sum('valor_total_factura_usd'), 0.0, output_field=DecimalField()))['total']
        total_utilidad_usd = \
            pedidos.aggregate(total=Coalesce(Sum('valor_total_utilidad_usd'), 0.0, output_field=DecimalField()))[
                'total']
        total_notas_credito = \
            pedidos.aggregate(total=Coalesce(Sum('valor_total_nota_credito_usd'), 0.0, output_field=DecimalField()))[
                'total']

    # Conteo de pedidos cancelados (siempre a nivel de pedido)
    total_pedidos_cancelados = pedidos.filter(
        Q(estado_cancelacion='Autorizado') | Q(estado_cancelacion='Pendiente')
    ).count()

    # Datos para gráfico de utilidad por cliente
    if fruta_id:
        # Si hay filtro de fruta, calculamos desde DetallePedido agrupando por cliente
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT c.nombre, SUM(dp.valor_total_utilidad_x_producto) as total_utilidad
                FROM comercial_pedido p
                JOIN comercial_detallepedido dp ON p.id = dp.pedido_id
                JOIN comercial_cliente c ON p.cliente_id = c.id
                WHERE p.id IN %s AND dp.fruta_id = %s
                GROUP BY c.nombre
                ORDER BY total_utilidad DESC
                LIMIT 10
            """, [tuple(pedidos_ids) or (0,), fruta_id])
            utilidad_por_cliente = [{'cliente__nombre': row[0], 'total_utilidad': float(row[1])}
                                    for row in cursor.fetchall()]
    else:
        # Sin filtro de fruta, usamos la consulta original
        utilidad_por_cliente = list(pedidos.values('cliente__nombre').annotate(
            total_utilidad=Coalesce(Sum('valor_total_utilidad_usd'), 0.0, output_field=DecimalField())
        ).order_by('-total_utilidad')[:10])

    # Datos para gráfico de utilidad por fruta
    # Aquí necesitamos agrupar por fruta, pero como la relación es a través de DetallePedido
    # y un pedido puede tener múltiples frutas, debemos usar un enfoque diferente
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT f.nombre, SUM(dp.valor_total_utilidad_x_producto) as total_utilidad
            FROM comercial_pedido p
            JOIN comercial_detallepedido dp ON p.id = dp.pedido_id
            JOIN comercial_fruta f ON dp.fruta_id = f.id
            WHERE p.id IN %s
            GROUP BY f.nombre
            ORDER BY total_utilidad DESC
            LIMIT 10
        """, [tuple(pedidos_ids) or (0,)])
        utilidad_por_fruta = [{'fruta__nombre': row[0], 'total_utilidad': float(row[1])}
                              for row in cursor.fetchall()]

    # Datos para gráfico de utilidad por fruta específicos del cliente (cuando se filtra por cliente)
    utilidad_por_fruta_cliente = []
    if cliente_id:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT f.nombre, SUM(dp.valor_total_utilidad_x_producto) as total_utilidad
                FROM comercial_pedido p
                JOIN comercial_detallepedido dp ON p.id = dp.pedido_id
                JOIN comercial_fruta f ON dp.fruta_id = f.id
                WHERE p.id IN %s AND p.cliente_id = %s
                GROUP BY f.nombre
                ORDER BY total_utilidad DESC
                LIMIT 10
            """, [tuple(pedidos_ids) or (0,), cliente_id])
            utilidad_por_fruta_cliente = [{'fruta__nombre': row[0], 'total_utilidad': float(row[1])}
                                          for row in cursor.fetchall()]

    # Datos para gráfico de participación de kilos por fruta
    # Usamos el mismo enfoque SQL para obtener datos precisos
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT f.nombre, SUM(dp.kilos_enviados) as total_kilos
            FROM comercial_pedido p
            JOIN comercial_detallepedido dp ON p.id = dp.pedido_id
            JOIN comercial_fruta f ON dp.fruta_id = f.id
            WHERE p.id IN %s
            GROUP BY f.nombre
            ORDER BY total_kilos DESC
        """, [tuple(pedidos_ids) or (0,)])
        kilos_por_fruta = [{'fruta__nombre': row[0], 'total_kilos': float(row[1])}
                           for row in cursor.fetchall()]

    # Datos para gráfico de utilidad por exportador
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT e.nombre, SUM(p.valor_total_utilidad_usd) as total_utilidad
            FROM comercial_pedido p
            JOIN comercial_exportador e ON p.exportadora_id = e.id
            WHERE p.id IN %s
            GROUP BY e.nombre
            ORDER BY total_utilidad DESC
            LIMIT 10
        """, [tuple(pedidos_ids) or (0,)])
        utilidad_por_exportador = [{'exportadora__nombre': row[0], 'total_utilidad': float(row[1])}
                                   for row in cursor.fetchall()]

    # Get real data for client, fruit and exporter comparison for previous period
    utilidad_por_cliente_anterior = []
    pedidos_anterior_ids = pedidos_periodo_anterior.values_list('id', flat=True)
    
    if pedidos_anterior_ids:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT c.nombre, SUM(dp.valor_total_utilidad_x_producto) as total_utilidad
                FROM comercial_pedido p
                JOIN comercial_detallepedido dp ON p.id = dp.pedido_id
                JOIN comercial_cliente c ON p.cliente_id = c.id
                WHERE p.id IN %s
                GROUP BY c.nombre
                ORDER BY total_utilidad DESC
                LIMIT 10
            """, [tuple(pedidos_anterior_ids) or (0,)])
            utilidad_por_cliente_anterior = [{'cliente__nombre': row[0], 'total_utilidad': float(row[1])}
                                        for row in cursor.fetchall()]
    
    # Get real data for fruit utilidad for previous period
    utilidad_por_fruta_anterior = []
    if pedidos_anterior_ids:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT f.nombre, SUM(dp.valor_total_utilidad_x_producto) as total_utilidad
                FROM comercial_pedido p
                JOIN comercial_detallepedido dp ON p.id = dp.pedido_id
                JOIN comercial_fruta f ON dp.fruta_id = f.id
                WHERE p.id IN %s
                GROUP BY f.nombre
                ORDER BY total_utilidad DESC
                LIMIT 10
            """, [tuple(pedidos_anterior_ids) or (0,)])
            utilidad_por_fruta_anterior = [{'fruta__nombre': row[0], 'total_utilidad': float(row[1])}
                                      for row in cursor.fetchall()]
    
    # Get real data for exportador utilidad for previous period
    utilidad_por_exportador_anterior = []
    if pedidos_anterior_ids:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT e.nombre, SUM(p.valor_total_utilidad_usd) as total_utilidad
                FROM comercial_pedido p
                JOIN comercial_exportador e ON p.exportadora_id = e.id
                WHERE p.id IN %s
                GROUP BY e.nombre
                ORDER BY total_utilidad DESC
                LIMIT 10
            """, [tuple(pedidos_anterior_ids) or (0,)])
            utilidad_por_exportador_anterior = [{'exportadora__nombre': row[0], 'total_utilidad': float(row[1])}
                                           for row in cursor.fetchall()]

    # Datos para tabla de clientes
    clientes_data = []
    if total_kilos > 0:
        if fruta_id:
            # Si hay filtro de fruta, calculamos los totales por cliente usando solo los detalles de esa fruta
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        c.nombre, 
                        COUNT(DISTINCT p.id) as num_pedidos,
                        SUM(dp.kilos_enviados) as total_kilos,
                        SUM(dp.valor_x_producto) as total_facturado,
                        SUM(dp.valor_total_utilidad_x_producto) as total_utilidades
                    FROM comercial_pedido p
                    JOIN comercial_detallepedido dp ON p.id = dp.pedido_id
                    JOIN comercial_cliente c ON p.cliente_id = c.id
                    JOIN comercial_referencias r ON dp.referencia_id = r.id
                    WHERE p.id IN %s AND dp.fruta_id = %s
                    GROUP BY c.nombre
                    ORDER BY total_utilidades DESC
                """, [tuple(pedidos_ids) or (0,), fruta_id])

                clientes_data = [
                    {
                        'cliente__nombre': row[0],
                        'num_pedidos': int(row[1]),
                        'total_kilos': float(row[2]),
                        'total_facturado': float(row[3]),
                        'total_utilidades': float(row[4]),
                    }
                    for row in cursor.fetchall()
                ]
        else:
            # Sin filtro de fruta, usamos la consulta original a nivel de pedido
            clientes_data = list(pedidos.values('cliente__nombre').annotate(
                num_pedidos=Count('id', distinct=True),
                total_kilos=Coalesce(Sum('total_peso_bruto_enviado'), 0.0, output_field=DecimalField()),
                total_facturado=Coalesce(Sum('valor_total_factura_usd'), 0.0, output_field=DecimalField()),
                total_utilidades=Coalesce(Sum('valor_total_utilidad_usd'), 0.0, output_field=DecimalField()),
            ).order_by('-total_utilidades'))

        # Calcular porcentajes
        for cliente in clientes_data:
            cliente['percent_kilos'] = round((float(cliente['total_kilos']) / float(total_kilos)) * 100,
                                             2) if total_kilos else 0
            cliente['percent_utilidad'] = round((float(cliente['total_utilidades']) / float(total_utilidad_usd)) * 100,
                                                2) if total_utilidad_usd else 0

    # Obtener listas para opciones de filtro
    clientes = Cliente.objects.filter(pedido__isnull=False).distinct().order_by('nombre')
    intermediarios = Intermediario.objects.all().order_by('nombre')
    frutas = Fruta.objects.all().order_by('nombre')
    exportadores = Exportador.objects.all().order_by('nombre')

    # Calcular periodos comparativos
    periodo_anterior_inicio = fecha_inicio - timedelta(days=(fecha_fin - fecha_inicio).days)
    periodo_anterior_fin = fecha_inicio - timedelta(days=1)

    filtros_periodo_anterior = filter_args.copy()
    filtros_periodo_anterior['fecha_entrega__range'] = [periodo_anterior_inicio, periodo_anterior_fin]
    pedidos_periodo_anterior = Pedido.objects.filter(**filtros_periodo_anterior)

    if fruta_id:
        pedidos_periodo_anterior = pedidos_periodo_anterior.filter(detallepedido__fruta_id=fruta_id).distinct()

    # Métricas del periodo anterior
    if fruta_id:
        # Si hay filtro de fruta, calculamos desde DetallePedido para el periodo anterior
        detalles_prev = DetallePedido.objects.filter(
            pedido__in=pedidos_periodo_anterior,
            fruta_id=fruta_id
        )

        kilos_prev = detalles_prev.aggregate(total=Coalesce(Sum('kilos_enviados'), 0.0, output_field=DecimalField()))[
            'total']
        cajas_prev = detalles_prev.aggregate(total=Coalesce(Sum('cajas_enviadas'), 0, output_field=IntegerField()))[
            'total']
        facturado_prev = \
            detalles_prev.aggregate(total=Coalesce(Sum('valor_x_producto'), 0.0, output_field=DecimalField()))['total']
        utilidad_usd_prev = detalles_prev.aggregate(
            total=Coalesce(Sum('valor_total_utilidad_x_producto'), 0.0, output_field=DecimalField()))['total']
        notas_credito_prev = \
            detalles_prev.aggregate(total=Coalesce(Sum('valor_nota_credito_usd'), 0.0, output_field=DecimalField()))[
                'total']
    else:
        # Sin filtro de fruta, usamos DetallePedido para calcular kilos_prev
        detalles_prev = DetallePedido.objects.filter(pedido__in=pedidos_periodo_anterior)
        kilos_prev = detalles_prev.aggregate(
            total=Coalesce(Sum('kilos_enviados'), 0.0, output_field=DecimalField()))['total']
        
        # El resto sigue igual
        cajas_prev = \
            pedidos_periodo_anterior.aggregate(
                total=Coalesce(Sum('total_cajas_enviadas'), 0, output_field=IntegerField()))[
                'total']
        facturado_prev = pedidos_periodo_anterior.aggregate(
            total=Coalesce(Sum('valor_total_factura_usd'), 0.0, output_field=DecimalField()))['total']
        utilidad_usd_prev = pedidos_periodo_anterior.aggregate(
            total=Coalesce(Sum('valor_total_utilidad_usd'), 0.0, output_field=DecimalField()))['total']
        notas_credito_prev = pedidos_periodo_anterior.aggregate(
            total=Coalesce(Sum('valor_total_nota_credito_usd'), 0.0, output_field=DecimalField()))['total']

    # Conteo de pedidos cancelados periodo anterior (siempre a nivel de pedido)
    cancelados_prev = pedidos_periodo_anterior.filter(
        Q(estado_cancelacion='autorizado') | Q(estado_cancelacion='pendiente')
    ).count()

    # Calcular porcentajes de cambio
    def calcular_porcentaje(actual, anterior):
        if anterior == 0:
            return 100 if actual > 0 else 0
        return round(((actual - anterior) / anterior) * 100, 2)

    kilos_percent = calcular_porcentaje(total_kilos, kilos_prev)
    cajas_percent = calcular_porcentaje(total_cajas, cajas_prev)
    facturado_percent = calcular_porcentaje(total_facturado, facturado_prev)
    utilidad_usd_percent = calcular_porcentaje(total_utilidad_usd, utilidad_usd_prev)
    notas_credito_percent = calcular_porcentaje(total_notas_credito, notas_credito_prev)
    cancelados_percent = calcular_porcentaje(total_pedidos_cancelados, cancelados_prev)

    context = {
        'fecha_inicio': fecha_inicio_str,
        'fecha_fin': fecha_fin_str,
        'cliente_id': cliente_id,
        'intermediario_id': intermediario_id,
        'fruta_id': fruta_id,
        'exportador_id': exportador_id,

        'clientes': clientes,
        'intermediarios': intermediarios,
        'frutas': frutas,
        'exportadores': exportadores,

        # Métricas principales
        'global_total_kilos': total_kilos,
        'global_total_cajas': total_cajas,
        'global_total_facturado': total_facturado,
        'global_total_utilidades_usd': total_utilidad_usd,
        'global_total_notas_credito': total_notas_credito,
        'global_total_cancelados': total_pedidos_cancelados,

        # Datos para gráficos
        'utilidad_por_cliente': utilidad_por_cliente,
        'utilidad_por_fruta': utilidad_por_fruta,
        'utilidad_por_fruta_cliente': utilidad_por_fruta_cliente,
        'utilidad_por_exportador': utilidad_por_exportador,
        'kilos_por_fruta': kilos_por_fruta,

        # Datos para el gráfico mensual
        'datos_mensuales': datos_mensuales,
        'datos_mensuales_anterior': datos_mensuales_anterior,
        
        # Datos reales del periodo anterior para los gráficos
        'utilidad_por_cliente_anterior': utilidad_por_cliente_anterior,
        'utilidad_por_fruta_anterior': utilidad_por_fruta_anterior,
        'utilidad_por_exportador_anterior': utilidad_por_exportador_anterior,
        
        # Fechas de los periodos para referencia en JavaScript
        'periodo_actual_inicio': fecha_inicio.strftime('%Y-%m-%d'),
        'periodo_actual_fin': fecha_fin.strftime('%Y-%m-%d'),
        'periodo_anterior_inicio': periodo_anterior_inicio.strftime('%Y-%m-%d'),
        'periodo_anterior_fin': periodo_anterior_fin.strftime('%Y-%m-%d'),

        # Datos para tabla
        'clientes_data': clientes_data,

        # Datos de comparaciones
        'kilos_prev': kilos_prev > 0,
        'kilos_percent': kilos_percent,
        'cajas_prev': cajas_prev > 0,
        'cajas_percent': cajas_percent,
        'facturado_prev': facturado_prev > 0,
        'facturado_percent': facturado_percent,
        'utilidad_usd_prev': utilidad_usd_prev > 0,
        'utilidad_usd_percent': utilidad_usd_percent,
        'notas_credito_prev': notas_credito_prev > 0,
        'notas_credito_percent': notas_credito_percent,
        'cancelados_prev': cancelados_prev > 0,
        'cancelados_percent': cancelados_percent,
    }

    return context