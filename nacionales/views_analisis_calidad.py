from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render, get_object_or_404
from django.db.models import Q, Avg, Sum, F, ExpressionWrapper, fields, Case, When, Value, DecimalField
from django.db.models.functions import TruncWeek, Coalesce
from .models import CompraNacional, VentaNacional, ReporteCalidadExportador, ReporteCalidadProveedor, ProveedorNacional, Fruta
from comercial.models import Exportador # Asumiendo que Exportador está en la app comercial
from datetime import datetime, timedelta
from decimal import Decimal
import json
import xlsxwriter
from io import BytesIO
from django.core.paginator import Paginator


def es_miembro_del_grupo(nombre_grupo):
    def es_miembro(user):
        return user.groups.filter(name=nombre_grupo).exists()

    return es_miembro
@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def analisis_calidad_view(request):
    # Obtener todos los datos inicialmente
    query = VentaNacional.objects.select_related(
        'compra_nacional__proveedor',
        'compra_nacional__fruta',
        'exportador',
        'reportecalidadexportador__reportecalidadproveedor'
    ).all()

    # Obtener opciones para los filtros
    proveedores = ProveedorNacional.objects.all().order_by('nombre')
    exportadores = Exportador.objects.all().order_by('nombre')
    frutas = Fruta.objects.all().order_by('nombre')

    # Aplicar filtros si existen en la petición GET
    proveedor_id = request.GET.get('proveedor')
    exportador_id = request.GET.get('exportador')
    fruta_id = request.GET.get('fruta')
    fecha_inicio_str = request.GET.get('fecha_inicio')
    fecha_fin_str = request.GET.get('fecha_fin')

    if proveedor_id:
        query = query.filter(compra_nacional__proveedor_id=proveedor_id)
    if exportador_id:
        query = query.filter(exportador_id=exportador_id)
    if fruta_id:
        query = query.filter(compra_nacional__fruta_id=fruta_id)
    if fecha_inicio_str:
        query = query.filter(fecha_llegada__gte=fecha_inicio_str)
    if fecha_fin_str:
        query = query.filter(fecha_llegada__lte=fecha_fin_str)

    # Preparar datos para la tabla
    data_list = list(query.values(
        'compra_nacional_id',
        'compra_nacional__proveedor__nombre',
        'compra_nacional__fruta__nombre',
        'compra_nacional__numero_guia',
        'exportador__nombre',
        'fecha_llegada',
        'peso_neto_recibido',
        'reportecalidadexportador__kg_exportacion',
        'reportecalidadexportador__porcentaje_exportacion',
        'reportecalidadexportador__kg_nacional',
        'reportecalidadexportador__porcentaje_nacional',
        'reportecalidadexportador__kg_merma',
        'reportecalidadexportador__porcentaje_merma',
        'compra_nacional__precio_compra_exp'
    ).order_by('-fecha_llegada'))

    # Implementar paginación
    paginator = Paginator(data_list, 25)  # 25 elementos por página
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    # Preparar datos para gráficos
    calidad_semanal_labels = []
    calidad_semanal_data = []
    precio_semanal_labels = []
    precio_semanal_data = []

    # Solo procesar para gráficos si hay datos filtrados
    if query.exists():
        # Comportamiento de calidad semanal (% Exportación Promedio Ponderado)
        calidad_semanal = query.annotate(
            semana=TruncWeek('fecha_llegada')
        ).values('semana').annotate(
            total_kg_exp_semana=Sum(
                Case(
                    When(reportecalidadexportador__kg_exportacion__isnull=False, then=F('reportecalidadexportador__kg_exportacion')),
                    default=Value(0, output_field=DecimalField()),
                    output_field=DecimalField()
                )
            ),
            sum_prod_calidad_kg=Sum(
                Case(
                    When(reportecalidadexportador__porcentaje_exportacion__isnull=False, 
                         then=F('reportecalidadexportador__porcentaje_exportacion') * F('reportecalidadexportador__kg_exportacion')),
                    default=Value(0, output_field=DecimalField()),
                    output_field=DecimalField()
                )
            )
        ).order_by('semana')
        
        for item in calidad_semanal:
            if item['total_kg_exp_semana'] and item['total_kg_exp_semana'] > 0:
                promedio_ponderado_calidad = (item['sum_prod_calidad_kg'] / item['total_kg_exp_semana']).quantize(Decimal('0.01'))
                calidad_semanal_labels.append(item['semana'].strftime("%Y-%m-%d"))
                calidad_semanal_data.append(float(promedio_ponderado_calidad))

        # Comportamiento de precio semanal (Promedio Ponderado $/Kg)
        precio_semanal = query.filter(
            reportecalidadexportador__reportecalidadproveedor__p_precio_kg_exp__isnull=False,
            reportecalidadexportador__kg_exportacion__isnull=False,
            reportecalidadexportador__kg_exportacion__gt=0
        ).annotate(
            semana=TruncWeek('fecha_llegada')
        ).values('semana').annotate(
            total_kg_exp_precio_semana=Sum(F('reportecalidadexportador__kg_exportacion')),
            sum_prod_precio_kg=Sum(
                F('reportecalidadexportador__reportecalidadproveedor__p_precio_kg_exp') * F('reportecalidadexportador__kg_exportacion')
            )
        ).order_by('semana')

        for item in precio_semanal:
            if item['total_kg_exp_precio_semana'] and item['total_kg_exp_precio_semana'] > 0:
                promedio_ponderado_precio = (item['sum_prod_precio_kg'] / item['total_kg_exp_precio_semana']).quantize(Decimal('0.01'))
            else:
                promedio_ponderado_precio = Decimal('0.00')
            precio_semanal_labels.append(item['semana'].strftime("%Y-%m-%d"))
            precio_semanal_data.append(float(promedio_ponderado_precio))

    context = {
        'page_obj': page_obj,
        'proveedores': proveedores,
        'exportadores': exportadores,
        'frutas': frutas,
        'calidad_semanal_labels': json.dumps(calidad_semanal_labels),
        'calidad_semanal_data': json.dumps(calidad_semanal_data),
        'precio_semanal_labels': json.dumps(precio_semanal_labels),
        'precio_semanal_data': json.dumps(precio_semanal_data),
        'request': request,
    }
    return render(request, 'analisis_calidad.html', context)


def get_reporte_detalle(request):
    """API para obtener los detalles completos de un reporte de calidad para mostrar en el modal"""
    compra_id = request.GET.get('compra_id')
    
    if not compra_id:
        return JsonResponse({'error': 'No se proporcionó un ID de compra'})
    
    try:
        # Obtener la compra nacional y sus relaciones
        compra = get_object_or_404(CompraNacional.objects.select_related(
            'proveedor',
            'fruta',
            'tipo_empaque',
            'ventanacional',
            'ventanacional__exportador',
            'ventanacional__reportecalidadexportador',
            'ventanacional__reportecalidadexportador__reportecalidadproveedor'
        ), pk=compra_id)
        
        venta = compra.ventanacional
        rep_exp = venta.reportecalidadexportador if hasattr(venta, 'reportecalidadexportador') else None
        rep_prov = rep_exp.reportecalidadproveedor if rep_exp and hasattr(rep_exp, 'reportecalidadproveedor') else None

        # Estructurar los datos para el modal
        data = {
            'compra': {
                'title': 'Datos de Compra',
                'class': 'compra-card',
                'fields': {
                    'Guía': compra.numero_guia,
                    'Proveedor': compra.proveedor.nombre,
                    'Fruta': compra.fruta.nombre,
                    'Origen': compra.origen_compra,
                    'Fecha Compra': compra.fecha_compra.strftime('%Y-%m-%d'),
                    'Peso Compra': f"{compra.peso_compra:,.2f} kg",
                    'Tipo Empaque': compra.tipo_empaque.nombre,
                    'Cantidad Empaque': f"{compra.cantidad_empaque:,}",
                    'Precio Compra Exp': f"${compra.precio_compra_exp:,.2f}",
                    'Precio Compra Nal': f"${compra.precio_compra_nal:,.2f}" if compra.precio_compra_nal else "N/A",
                    'Estado': f"{compra.calcular_porcentaje_completitud()}% Completado"
                }
            },
            'venta': {
                'title': 'Datos de Recepción',
                'class': 'venta-card',
                'fields': {
                    'Exportador': venta.exportador.nombre,
                    'Fecha Llegada': venta.fecha_llegada.strftime('%Y-%m-%d'),
                    'Fecha Vencimiento': venta.fecha_vencimiento.strftime('%Y-%m-%d'),
                    'Cantidad Empaque Recibida': f"{venta.cantidad_empaque_recibida:,}",
                    'Peso Bruto Recibido': f"{venta.peso_bruto_recibido:,.2f} kg",
                    'Peso Neto Recibido': f"{venta.peso_neto_recibido:,.2f} kg",
                    'Diferencia Peso': f"{venta.diferencia_peso:,.2f} kg" if venta.diferencia_peso else "N/A",
                    'Diferencia Empaque': f"{venta.diferencia_empaque:,}" if venta.diferencia_empaque else "N/A",
                    'Estado Venta': venta.estado_venta
                }
            }
        }

        if rep_exp:
            data['reporte_exp'] = {
                'title': 'Reporte Exportador',
                'class': 'exportador-card',
                'fields': {
                    'Remisión': rep_exp.remision_exp,
                    'Fecha Reporte': rep_exp.fecha_reporte.strftime('%Y-%m-%d'),
                    'Kg Totales': f"{rep_exp.kg_totales:,.2f} kg",
                    'Kg Exportación': f"{rep_exp.kg_exportacion:,.2f} kg",
                    '% Exportación': f"{rep_exp.porcentaje_exportacion:,.2f}%",
                    'Precio Kg Exp': f"${rep_exp.precio_venta_kg_exp:,.2f}",
                    'Kg Nacional': f"{rep_exp.kg_nacional:,.2f} kg",
                    '% Nacional': f"{rep_exp.porcentaje_nacional:,.2f}%",
                    'Precio Kg Nal': f"${rep_exp.precio_venta_kg_nal:,.2f}",
                    'Kg Merma': f"{rep_exp.kg_merma:,.2f} kg",
                    '% Merma': f"{rep_exp.porcentaje_merma:,.2f}%",
                    'Total Factura': f"${rep_exp.precio_total:,.2f}",
                    'Factura': rep_exp.factura if rep_exp.factura else "Pendiente",
                    'Fecha Factura': rep_exp.fecha_factura.strftime('%Y-%m-%d') if rep_exp.fecha_factura else "Pendiente",
                    'Vencimiento Factura': rep_exp.vencimiento_factura.strftime('%Y-%m-%d') if rep_exp.vencimiento_factura else "Pendiente",
                    'Estado': rep_exp.estado_reporte_exp,
                }
            }

        if rep_prov:
            data['reporte_prov'] = {
                'title': 'Reporte Proveedor Nacional',
                'class': 'proveedor-card',
                'fields': {
                    'Fecha Reporte': rep_prov.p_fecha_reporte.strftime('%Y-%m-%d'),
                    'Kg Totales': f"{rep_prov.p_kg_totales:,.2f} kg" if rep_prov.p_kg_totales else "N/A",
                    'Kg Exportación': f"{rep_prov.p_kg_exportacion:,.2f} kg" if rep_prov.p_kg_exportacion else "N/A",
                    '% Exportación': f"{rep_prov.p_porcentaje_exportacion:,.2f}%" if rep_prov.p_porcentaje_exportacion else "N/A",
                    'Precio Kg Exp': f"${rep_prov.p_precio_kg_exp:,.2f}" if rep_prov.p_precio_kg_exp else "N/A",
                    'Kg Nacional': f"{rep_prov.p_kg_nacional:,.2f} kg" if rep_prov.p_kg_nacional else "N/A",
                    '% Nacional': f"{rep_prov.p_porcentaje_nacional:,.2f}%" if rep_prov.p_porcentaje_nacional else "N/A",
                    'Precio Kg Nal': f"${rep_prov.p_precio_kg_nal:,.2f}" if rep_prov.p_precio_kg_nal else "N/A",
                    'Kg Merma': f"{rep_prov.p_kg_merma:,.2f} kg" if rep_prov.p_kg_merma else "N/A",
                    '% Merma': f"{rep_prov.p_porcentaje_merma:,.2f}%" if rep_prov.p_porcentaje_merma else "N/A",
                    'Total Facturar': f"${rep_prov.p_total_facturar:,.2f}" if rep_prov.p_total_facturar else "N/A",
                    'Factura Proveedor': rep_prov.factura_prov if rep_prov.factura_prov else "Pendiente",
                    'Total a Pagar': f"${rep_prov.p_total_pagar:,.2f}" if rep_prov.p_total_pagar else "N/A",
                    'Utilidad': f"${rep_prov.p_utilidad:,.2f}" if rep_prov.p_utilidad else "N/A",
                    '% Utilidad': f"{rep_prov.p_porcentaje_utilidad:,.2f}%" if rep_prov.p_porcentaje_utilidad else "N/A",
                    'Asohofrucol': f"${rep_prov.asohofrucol:,.2f}" if rep_prov.asohofrucol else "N/A",
                    'Rte Fte': f"${rep_prov.rte_fte:,.2f}" if rep_prov.rte_fte else "N/A",
                    'Rte Ica': f"${rep_prov.rte_ica:,.2f}" if rep_prov.rte_ica else "N/A",
                    'Estado': rep_prov.estado_reporte_prov,
                    'Reporte Enviado': "Sí" if rep_prov.reporte_enviado else "No",
                    'Reporte Pago': "Sí" if rep_prov.reporte_pago else "No",
                    'Completado': "Sí" if rep_prov.completado else "No"
                }
            }

        return JsonResponse({'data': data})
        
    except Exception as e:
        return JsonResponse({'error': str(e)})

@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def exportar_excel_analisis_calidad(request):
    """Genera un informe Excel con los datos filtrados del análisis de calidad"""
    # Obtener los mismos datos que en la vista principal
    query = VentaNacional.objects.select_related(
        'compra_nacional__proveedor',
        'compra_nacional__fruta',
        'exportador',
        'reportecalidadexportador__reportecalidadproveedor'
    ).all()

    # Aplicar los mismos filtros solo si tienen valor
    proveedor_id = request.GET.get('proveedor')
    exportador_id = request.GET.get('exportador')
    fruta_id = request.GET.get('fruta')
    fecha_inicio_str = request.GET.get('fecha_inicio')
    fecha_fin_str = request.GET.get('fecha_fin')

    if proveedor_id and proveedor_id.strip():
        query = query.filter(compra_nacional__proveedor_id=proveedor_id)
    if exportador_id and exportador_id.strip():
        query = query.filter(exportador_id=exportador_id)
    if fruta_id and fruta_id.strip():
        query = query.filter(compra_nacional__fruta_id=fruta_id)
    if fecha_inicio_str and fecha_inicio_str.strip():
        query = query.filter(fecha_llegada__gte=fecha_inicio_str)
    if fecha_fin_str and fecha_fin_str.strip():
        query = query.filter(fecha_llegada__lte=fecha_fin_str)

    # Crear el archivo Excel en memoria
    output = BytesIO()
    workbook = xlsxwriter.Workbook(output)
    worksheet = workbook.add_worksheet('Análisis de Calidad')

    # Definir formatos
    header_format = workbook.add_format({
        'bold': True,
        'text_wrap': True,
        'valign': 'top',
        'fg_color': '#D7E4BC',
        'border': 1,
        'align': 'center'
    })

    title_format = workbook.add_format({
        'bold': True,
        'font_size': 14,
        'align': 'center',
        'valign': 'vcenter'
    })

    date_format = workbook.add_format({'num_format': 'dd/mm/yyyy'})
    number_format = workbook.add_format({'num_format': '#,##0.00'})
    currency_format = workbook.add_format({'num_format': '$#,##0.00'})
    percent_format = workbook.add_format({'num_format': '0.00%'})

    # Configurar anchos de columna
    worksheet.set_column('A:A', 20)  # Proveedor
    worksheet.set_column('B:B', 15)  # Fruta
    worksheet.set_column('C:C', 15)  # Guía
    worksheet.set_column('D:D', 20)  # Exportador
    worksheet.set_column('E:E', 12)  # Fecha
    worksheet.set_column('F:L', 15)  # Valores numéricos
    worksheet.set_column('M:M', 15)  # Precio

    # Escribir título
    worksheet.merge_range('A1:M1', 'INFORME DE ANÁLISIS DE CALIDAD', title_format)
    worksheet.merge_range('A2:M2', f'Generado el {datetime.now().strftime("%d/%m/%Y %H:%M")}', workbook.add_format({'align': 'center'}))

    # Escribir encabezados
    headers = [
        'Proveedor', 'Fruta', 'Guía', 'Exportador', 'Fecha Llegada',
        'Peso Neto (Kg)', 'Kg Exportación', '% Exportación', 'Kg Nacional',
        '% Nacional', 'Kg Merma', '% Merma', 'Precio Kg Exportación'
    ]
    
    for col, header in enumerate(headers):
        worksheet.write(3, col, header, header_format)

    # Escribir datos
    row = 4
    for item in query.values(
        'compra_nacional__proveedor__nombre',
        'compra_nacional__fruta__nombre',
        'compra_nacional__numero_guia',
        'exportador__nombre',
        'fecha_llegada',
        'peso_neto_recibido',
        'reportecalidadexportador__kg_exportacion',
        'reportecalidadexportador__porcentaje_exportacion',
        'reportecalidadexportador__kg_nacional',
        'reportecalidadexportador__porcentaje_nacional',
        'reportecalidadexportador__kg_merma',
        'reportecalidadexportador__porcentaje_merma',
        'compra_nacional__precio_compra_exp'
    ).order_by('-fecha_llegada'):
        # Manejar valores nulos
        peso_neto = item['peso_neto_recibido'] or 0
        kg_exp = item['reportecalidadexportador__kg_exportacion'] or 0
        pct_exp = item['reportecalidadexportador__porcentaje_exportacion'] or 0
        kg_nac = item['reportecalidadexportador__kg_nacional'] or 0
        pct_nac = item['reportecalidadexportador__porcentaje_nacional'] or 0
        kg_merma = item['reportecalidadexportador__kg_merma'] or 0
        pct_merma = item['reportecalidadexportador__porcentaje_merma'] or 0
        precio = item['compra_nacional__precio_compra_exp'] or 0

        worksheet.write(row, 0, item['compra_nacional__proveedor__nombre'] or 'N/A')
        worksheet.write(row, 1, item['compra_nacional__fruta__nombre'] or 'N/A')
        worksheet.write(row, 2, item['compra_nacional__numero_guia'] or 'N/A')
        worksheet.write(row, 3, item['exportador__nombre'] or 'N/A')
        worksheet.write(row, 4, item['fecha_llegada'], date_format)
        worksheet.write(row, 5, peso_neto, number_format)
        worksheet.write(row, 6, kg_exp, number_format)
        worksheet.write(row, 7, pct_exp / 100 if pct_exp else 0, percent_format)
        worksheet.write(row, 8, kg_nac, number_format)
        worksheet.write(row, 9, pct_nac / 100 if pct_nac else 0, percent_format)
        worksheet.write(row, 10, kg_merma, number_format)
        worksheet.write(row, 11, pct_merma / 100 if pct_merma else 0, percent_format)
        worksheet.write(row, 12, precio, currency_format)
        row += 1

    # Agregar totales solo si hay datos
    if row > 4:
        worksheet.write(row + 1, 0, 'TOTALES', header_format)
        worksheet.write_formula(row + 1, 5, f'=SUM(F5:F{row+1})', number_format)
        worksheet.write_formula(row + 1, 6, f'=SUM(G5:G{row+1})', number_format)
        worksheet.write_formula(row + 1, 8, f'=SUM(I5:I{row+1})', number_format)
        worksheet.write_formula(row + 1, 10, f'=SUM(K5:K{row+1})', number_format)

    # Cerrar el workbook
    workbook.close()
    output.seek(0)

    # Crear la respuesta HTTP
    response = HttpResponse(
        output.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename=analisis_calidad_{datetime.now().strftime("%Y%m%d_%H%M")}.xlsx'
    
    return response
