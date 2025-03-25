import datetime
import io
import xlsxwriter
from decimal import Decimal
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db.models import Sum, Prefetch, Avg
from django.http import HttpResponse
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.template.loader import render_to_string
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django_tables2 import RequestConfig, SingleTableView
from comercial.models import Fruta
from .forms import CompraNacionalForm, VentaNacionalForm, ReporteCalidadExportadorForm, ReporteCalidadProveedorForm, \
    TransferenciasProveedorForm
from .models import CompraNacional, VentaNacional, ReporteCalidadExportador, ReporteCalidadProveedor, \
    TransferenciasProveedor, ProveedorNacional
from .tables import (
    CompraNacionalTable,
    VentaNacionalTable,
    ReporteCalidadExportadorTable,
    ReporteCalidadProveedorTable, TransferenciasProveedorTable
)
from datetime import date
from .choices import origen_transferencia


def es_miembro_del_grupo(nombre_grupo):
    def es_miembro(user):
        return user.groups.filter(name=nombre_grupo).exists()

    return es_miembro


@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def autocomplete_guia(request):
    """
    Vista para proporcionar autocompletado de números de guía para búsquedas.
    """
    query = request.GET.get('term', '')
    if query:
        # Buscar guías que coincidan con el término de búsqueda
        guias = CompraNacional.objects.filter(numero_guia__icontains=query)[:10]
        results = [guia.numero_guia for guia in guias]
        return JsonResponse(results, safe=False)
    return JsonResponse([], safe=False)


@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def nacionales_list_general(request):
    filtro_completado = request.GET.get('completed') == 'true'
    if filtro_completado:
        compra_qs = CompraNacional.objects.filter(
            ventanacional__reportecalidadexportador__reportecalidadproveedor__completado=True
        )
        venta_qs = VentaNacional.objects.filter(
            compra_nacional__ventanacional__reportecalidadexportador__reportecalidadproveedor__completado=True
        )
        calidad_exp_qs = ReporteCalidadExportador.objects.filter(
            reportecalidadproveedor__completado=True
        )
        calidad_prov_qs = ReporteCalidadProveedor.objects.filter(completado=True)
    else:
        compra_qs = CompraNacional.objects.all()
        venta_qs = VentaNacional.objects.all()
        calidad_exp_qs = ReporteCalidadExportador.objects.all()
        calidad_prov_qs = ReporteCalidadProveedor.objects.all()

    compra_table = CompraNacionalTable(compra_qs)
    venta_table = VentaNacionalTable(venta_qs)
    calidad_exp_table = ReporteCalidadExportadorTable(calidad_exp_qs)
    calidad_prov_table = ReporteCalidadProveedorTable(calidad_prov_qs)

    RequestConfig(request, paginate={"per_page": 5}).configure(compra_table)
    RequestConfig(request, paginate={"per_page": 5}).configure(venta_table)
    RequestConfig(request, paginate={"per_page": 5}).configure(calidad_exp_table)
    RequestConfig(request, paginate={"per_page": 5}).configure(calidad_prov_table)

    return render(request, 'nacionales_list_general.html', {
        'compra_table': compra_table,
        'venta_table': venta_table,
        'calidad_exp_table': calidad_exp_table,
        'calidad_prov_table': calidad_prov_table,
        'filtro_completado': filtro_completado,
    })

@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def nacionales_list_detallada(request):
    guia = request.GET.get('search', '')
    data = {}
    compras_incompletas = []  # Inicializamos la lista para compras incompletas

    # Búsqueda por guía (sin cambios)
    if guia:
        try:
            compra = CompraNacional.objects.filter(numero_guia=guia).first()
            if compra:
                data['compra'] = compra
                venta = VentaNacional.objects.filter(compra_nacional=compra).first()
                if venta:
                    data['venta'] = venta
                    reporte_exp = ReporteCalidadExportador.objects.filter(venta_nacional=venta).first()
                    if reporte_exp:
                        data['reporte_exp'] = reporte_exp
                        reporte_prov = ReporteCalidadProveedor.objects.filter(rep_cal_exp=reporte_exp).first()
                        if reporte_prov:
                            data['reporte_prov'] = reporte_prov
        except:
            pass

    # Lógica para obtener compras incompletas
    compras_nacionales = CompraNacional.objects.all()
    for compra in compras_nacionales:
        tiene_venta = hasattr(compra, 'ventanacional')
        tiene_reporte_exp = False
        tiene_reporte_prov = False
        reporte_prov_completado = False  # Nueva variable para el estado de completado

        if tiene_venta:
            venta = compra.ventanacional
            tiene_reporte_exp = hasattr(venta, 'reportecalidadexportador')
            if tiene_reporte_exp:
                reporte_exp = venta.reportecalidadexportador
                tiene_reporte_prov = hasattr(reporte_exp, 'reportecalidadproveedor')
                if tiene_reporte_prov:
                    reporte_prov = reporte_exp.reportecalidadproveedor
                    reporte_prov_completado = reporte_prov.completado  # Verificamos el campo completado

        # Condición actualizada: la compra es incompleta si faltan relaciones o completado es False
        if not (tiene_venta and tiene_reporte_exp and tiene_reporte_prov and reporte_prov_completado):
            if hasattr(compra, 'ventanacional'):
                compra.estado_venta = compra.ventanacional.estado_venta
                if hasattr(compra.ventanacional, 'reportecalidadexportador'):
                    compra.estado_reporte_exp = compra.ventanacional.reportecalidadexportador.estado_reporte_exp
                    if hasattr(compra.ventanacional.reportecalidadexportador, 'reportecalidadproveedor'):
                        compra.estado_reporte_prov = compra.ventanacional.reportecalidadexportador.reportecalidadproveedor.estado_reporte_prov
                    else:
                        compra.estado_reporte_prov = 'Sin reporte Proveedor'
                else:
                    compra.estado_reporte_exp = 'Sin reporte Exportador'
                    compra.estado_reporte_prov = 'Sin reporte Proveedor'
            else:
                compra.estado_venta = 'Sin venta'
                compra.estado_reporte_exp = 'Sin reporte Exportador'
                compra.estado_reporte_prov = 'Sin reporte Proveedor'
            compras_incompletas.append(compra)

    chunk_size = 100  # Ajusta este valor según tus necesidades
    ventas = VentaNacional.objects.filter(
        fecha_vencimiento__lt=date.today()
    ).exclude(
        estado_venta="Completado"
    ).iterator(chunk_size=chunk_size)
    ventas_a_actualizar = []
    
    for vn in ventas:
        if hasattr(vn, 'reportecalidadexportador'):
            vn.estado_venta = "Completado"
        elif date.today() > vn.fecha_vencimiento:
            vn.estado_venta = "Vencido"

        ventas_a_actualizar.append(vn)
        if len(ventas_a_actualizar) >= chunk_size:
            VentaNacional.objects.bulk_update(ventas_a_actualizar, ['estado_venta'])
            ventas_a_actualizar = []
    
    if ventas_a_actualizar:
        VentaNacional.objects.bulk_update(ventas_a_actualizar, ['estado_venta'])

    data['compras_incompletas'] = compras_incompletas
    return render(request, 'nacionales_list_detallada.html', data)


@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def compra_nacional_create(request):
    if request.method == 'POST':
        form = CompraNacionalForm(request.POST)
        if form.is_valid():
            compra = form.save()
            return JsonResponse({
                'success': True,
                'message': f"✅ Compra nacional para {compra.proveedor} creada exitosamente"
            })
        return JsonResponse({
            'success': False,
            'errors': form.errors,
            'message': '❌ Error en el formulario' 
        })

    form = CompraNacionalForm()
    html = render_to_string('create_compra_nacional_form.html', {'form': form}, request=request)
    return JsonResponse({'html': html})


@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def venta_nacional_create(request, compra_id):
    compra = get_object_or_404(CompraNacional, id=compra_id)

    if request.method == 'POST':
        form = VentaNacionalForm(request.POST, compra_nacional=compra) # Pasa compra_nacional aquí
        if form.is_valid():
            venta = form.save(commit=False)
            venta.compra_nacional = compra
            venta.save()
            return JsonResponse({
                'success': True,
                'message': f"✅ Venta nacional para {venta.exportador} creada exitosamente"
            })
        else:
            html = render_to_string('create_venta_nacional_form.html',
                                    {'form': form, 'compra': compra},
                                    request=request)
            return JsonResponse({'success': False, 'html': html, 'message': '❌ Corrige los errores'})

    form = VentaNacionalForm(compra_nacional=compra) # Pasa compra_nacional aquí
    html = render_to_string('create_venta_nacional_form.html', {'form': form, 'compra': compra}, request=request)
    return JsonResponse({'html': html})


@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def reporte_exportador_create(request, venta_id):
    venta = get_object_or_404(VentaNacional, compra_nacional_id=venta_id)

    if request.method == 'POST':
        form = ReporteCalidadExportadorForm(request.POST, venta_nacional=venta)

        if form.is_valid():
            reporte = form.save(commit=False)
            reporte.venta_nacional = venta
            reporte.save()
            return JsonResponse({'success': True, 'message': '✅ Reporte creado'})
        else:
            html = render_to_string('create_report_exp_nacional_form.html',
                                    {'form': form, 'venta': venta},
                                    request=request)
            return JsonResponse({'success': False, 'html': html, 'message': '❌ Corrige los errores'})

    # GET request
    form = ReporteCalidadExportadorForm(venta_nacional=venta)
    html = render_to_string('create_report_exp_nacional_form.html',
                            {'form': form, 'venta': venta},
                            request=request)
    return JsonResponse({'html': html})


# Reporte proveedor

@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def reporte_proveedor_create(request, reporte_exp_id):
    reporte_exp = get_object_or_404(ReporteCalidadExportador, venta_nacional_id=reporte_exp_id)

    if request.method == 'POST':
        # Pasa venta_nacional al formulario
        form = ReporteCalidadProveedorForm(request.POST, rep_cal_exp=reporte_exp)

        if form.is_valid():
            reporte = form.save(commit=False)
            reporte.rep_cal_exp = reporte_exp
            reporte.save()
            return JsonResponse({'success': True, 'message': '✅ Reporte creado'})
        else:
            html = render_to_string('create_report_prov_nacional_form.html',
                                    {'form': form, 'reporte_exp': reporte_exp},
                                    request=request)
            return JsonResponse({'success': False, 'html': html, 'message': '❌ Corrige los errores'})

    # GET request
    form = ReporteCalidadProveedorForm(rep_cal_exp=reporte_exp)  # Pasa venta_nacional
    html = render_to_string('create_report_prov_nacional_form.html',
                            {'form': form, 'reporte_exp': reporte_exp},
                            request=request)
    return JsonResponse({'html': html})


# Vista para editar CompraNacional
@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def compra_nacional_edit(request, pk):
    compra = get_object_or_404(CompraNacional, pk=pk)
    if request.method == 'POST':
        form = CompraNacionalForm(request.POST, instance=compra)
        if form.is_valid():
            form.save()
            return JsonResponse({
                'success': True,
                'message': f"✅ Compra nacional para {compra.proveedor} actualizada exitosamente"
            })
        return JsonResponse({
            'success': False,
            'errors': form.errors,
            'message': '❌ Error en el formulario'
        })
    else:
        form = CompraNacionalForm(instance=compra)
        html = render_to_string('edit_compra_nacional_form.html', {'form': form, 'compra': compra}, request=request)
        return JsonResponse({'html': html})

# Vista para editar VentaNacional
@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def venta_nacional_edit(request, pk):
    venta = get_object_or_404(VentaNacional, pk=pk)
    compra = venta.compra_nacional  # Obtén el objeto CompraNacional asociado

    if request.method == 'POST':
        form = VentaNacionalForm(request.POST, instance=venta, compra_nacional=compra) # Pasa compra_nacional aquí
        if form.is_valid():
            form.save()
            return JsonResponse({
                'success': True,
                'message': f"✅ Venta nacional para {venta.exportador} actualizada exitosamente"
            })
        return JsonResponse({
            'success': False,
            'errors': form.errors,
            'message': '❌ Error en el formulario'
        })
    else:
        form = VentaNacionalForm(instance=venta, compra_nacional=compra) # Pasa compra_nacional aquí
        html = render_to_string('edit_venta_nacional_form.html', {'form': form, 'venta': venta}, request=request)
        return JsonResponse({'html': html})

# Vista para editar ReporteCalidadExportador
@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def reporte_exportador_edit(request, pk):
    reporte = get_object_or_404(ReporteCalidadExportador, pk=pk)
    if request.method == 'POST':
        form = ReporteCalidadExportadorForm(request.POST, instance=reporte, venta_nacional=reporte.venta_nacional)
        if form.is_valid():
            form.save()
            return JsonResponse({
                'success': True,
                'message': '✅ Reporte de calidad exportador actualizado exitosamente'
            })
        html = render_to_string('edit_report_exp_nacional_form.html', {'form': form, 'reporte': reporte}, request=request)
        return JsonResponse({
            'success': False,
            'html': html,
            'message': '❌ Corrige los errores'
        })
    else:
        form = ReporteCalidadExportadorForm(instance=reporte, venta_nacional=reporte.venta_nacional)
        html = render_to_string('edit_report_exp_nacional_form.html', {'form': form, 'reporte': reporte}, request=request)
        return JsonResponse({'html': html})

# Vista para editar ReporteCalidadProveedor
@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def reporte_proveedor_edit(request, pk):
    reporte = get_object_or_404(ReporteCalidadProveedor, pk=pk)
    if request.method == 'POST':
        form = ReporteCalidadProveedorForm(request.POST, instance=reporte, rep_cal_exp=reporte.rep_cal_exp)
        if form.is_valid():
            form.save()
            return JsonResponse({
                'success': True,
                'message': '✅ Reporte de calidad proveedor actualizado exitosamente'
            })
        html = render_to_string('edit_report_prov_nacional_form.html', {'form': form, 'reporte': reporte}, request=request)
        return JsonResponse({
            'success': False,
            'html': html,
            'message': '❌ Corrige los errores'
        })
    else:
        form = ReporteCalidadProveedorForm(instance=reporte, rep_cal_exp=reporte.rep_cal_exp)
        html = render_to_string('edit_report_prov_nacional_form.html', {'form': form, 'reporte': reporte}, request=request)
        return JsonResponse({'html': html})

@method_decorator(login_required, name='dispatch')
@method_decorator(user_passes_test(es_miembro_del_grupo('Heavens'), login_url=reverse_lazy('home')), name='dispatch')
class TransferenciasListView(SingleTableView):
    model = TransferenciasProveedor
    table_class = TransferenciasProveedorTable
    template_name = "nacionales_list_tranferencias.html"
    context_object_name = "transferencias"
    table_pagination = {"per_page": 10}

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by provider if provided
        proveedor_id = self.request.GET.get('proveedor')
        fecha_inicio = self.request.GET.get('fecha_inicio')
        fecha_fin = self.request.GET.get('fecha_fin')
        origen = self.request.GET.get('origen')
        
        if proveedor_id:
            queryset = queryset.filter(proveedor_id=proveedor_id)
        if fecha_inicio:
            queryset = queryset.filter(fecha_transferencia__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha_transferencia__lte=fecha_fin)
        if origen:
            queryset = queryset.filter(origen_transferencia=origen)
            
        return queryset.order_by('-fecha_transferencia')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['table'] = self.get_table()
        
        # Add providers list for filter dropdown
        context['proveedores'] = ProveedorNacional.objects.all().order_by('nombre')
        
        # Add origen choices for filter dropdown
        context['origenes'] = origen_transferencia
        
        # Keep selected filters in context
        context['selected_proveedor'] = self.request.GET.get('proveedor', '')
        context['selected_origen'] = self.request.GET.get('origen', '')
        
        # Calculate total value of transfers in the filtered queryset
        total_valor = self.get_queryset().aggregate(total=Sum('valor_transferencia'))['total'] or 0
        context['total_valor'] = total_valor
        
        return context


@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def transferencia_nacional_create(request):
    if request.method == 'POST':
        form = TransferenciasProveedorForm(request.POST)
        if form.is_valid():
            transferencia = form.save()
            return JsonResponse({
                'success': True,
                'message': f"✅ Compra nacional para {transferencia.proveedor} creada exitosamente"  # Mensaje personalizado
            })
        return JsonResponse({
            'success': False,
            'errors': form.errors,
            'message': '❌ Error en el formulario'  
        })

    form = TransferenciasProveedorForm()
    html = render_to_string('create_transferencia_nacional_form.html', {'form': form}, request=request)
    return JsonResponse({'html': html})

@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def transferencia_nacional_edit(request, pk):
    transferencia = get_object_or_404(TransferenciasProveedor, pk=pk)
    if request.method == 'POST':
        form = TransferenciasProveedorForm(request.POST, instance=transferencia)
        if form.is_valid():
            transferencia = form.save()
            return JsonResponse({
                'success': True,
                'message': f"✅ Transferencia actualizada para {transferencia.proveedor}"
            })
        return JsonResponse({
            'success': False,
            'errors': form.errors,
            'message': '❌ Error en el formulario'
        })

    form = TransferenciasProveedorForm(instance=transferencia)
    html = render_to_string('edit_transferencia_nacional_form.html', {
        'form': form,
        'record': transferencia,  
    }, request=request)
    return JsonResponse({'html': html})




@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def export_data(request):
    # Obtener parámetros de filtro
    fecha_inicio = request.GET.get('fecha_inicio')
    fecha_fin = request.GET.get('fecha_fin')
    proveedor_id = request.GET.get('proveedor')
    fruta_id = request.GET.get('fruta')
    data_types = request.GET.getlist('data')

    # Si no hay fechas, establecer valores predeterminados
    if not fecha_fin:
        fecha_fin = datetime.date.today()
    else:
        fecha_fin = datetime.datetime.strptime(fecha_fin, '%Y-%m-%d').date()

    if not fecha_inicio:
        fecha_inicio = fecha_fin - datetime.timedelta(days=30)
    else:
        fecha_inicio = datetime.datetime.strptime(fecha_inicio, '%Y-%m-%d').date()

    # Crear un buffer en memoria para el archivo Excel
    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output, {'in_memory': True})
    
    # Definir formatos para el Excel
    header_format = workbook.add_format({
        'bold': True,
        'bg_color': '#3498db',
        'font_color': 'white',
        'border': 1,
        'align': 'center',
        'valign': 'vcenter',
        'font_size': 12
    })
    
    subheader_format = workbook.add_format({
        'bold': True,
        'bg_color': '#2c3e50',
        'font_color': 'white',
        'border': 1,
        'align': 'center',
        'valign': 'vcenter',
        'font_size': 14
    })
    
    date_format = workbook.add_format({
        'num_format': 'dd/mm/yyyy',
        'border': 1
    })
    
    currency_format = workbook.add_format({
        'num_format': '$ #,##0',
        'border': 1
    })
    
    number_format = workbook.add_format({
        'num_format': '#,##0.00',
        'border': 1
    })
    
    percent_format = workbook.add_format({
        'num_format': '0.00%',
        'border': 1
    })
    
    cell_format = workbook.add_format({
        'border': 1
    })
    
    # Filtro base para compras nacionales
    compras_filter = {}
    if fecha_inicio:
        compras_filter['fecha_compra__gte'] = fecha_inicio
    if fecha_fin:
        compras_filter['fecha_compra__lte'] = fecha_fin
    if proveedor_id:
        compras_filter['proveedor_id'] = proveedor_id
    if fruta_id:
        compras_filter['fruta_id'] = fruta_id
    
    # 1. Exportar datos relacionados (CompraNacional, VentaNacional, ReporteCalidadExportador, ReporteCalidadProveedor)
    if any(data_type in data_types for data_type in ['compra_nacional', 'venta_nacional', 'reporte_exportador', 'reporte_proveedor']):
        # Crear hoja para datos relacionados
        sheet_relacionados = workbook.add_worksheet('Datos Completos')
        row = 0
        
        # Definir los tamaños de cada sección
        compra_nacional_cols = 12  # 12 columnas para compra nacional
        venta_nacional_cols = 8    # 8 columnas para venta nacional
        reporte_exp_cols = 16      # 16 columnas para reporte exportador
        reporte_prov_cols = 17     # 17 columnas para reporte proveedor
        
        # Calcular el rango total de columnas basado en los data_types seleccionados
        total_columns = 0
        if 'compra_nacional' in data_types: total_columns += compra_nacional_cols
        if 'venta_nacional' in data_types: total_columns += venta_nacional_cols
        if 'reporte_exportador' in data_types: total_columns += reporte_exp_cols
        if 'reporte_proveedor' in data_types: total_columns += reporte_prov_cols
        
        # Calcular posiciones iniciales de cada sección para referencia posterior
        compra_start = 0
        venta_start = compra_start + (compra_nacional_cols if 'compra_nacional' in data_types else 0)
        reporte_exp_start = venta_start + (venta_nacional_cols if 'venta_nacional' in data_types else 0)
        reporte_prov_start = reporte_exp_start + (reporte_exp_cols if 'reporte_exportador' in data_types else 0)
        
        # Título principal
        sheet_relacionados.merge_range(row, 0, row, total_columns-1, 'REPORTE COMPLETO COMPRAS NACIONALES', subheader_format)
        row += 2
        
        # Información de filtros
        sheet_relacionados.write(row, 0, 'Periodo:', cell_format)
        sheet_relacionados.write(row, 1, f"{fecha_inicio.strftime('%d/%m/%Y')} - {fecha_fin.strftime('%d/%m/%Y')}", cell_format)
        row += 1
        
        if proveedor_id:
            proveedor = ProveedorNacional.objects.get(id=proveedor_id)
            sheet_relacionados.write(row, 0, 'Proveedor:', cell_format)
            sheet_relacionados.write(row, 1, proveedor.nombre, cell_format)
            row += 1
        
        if fruta_id:
            fruta = Fruta.objects.get(id=fruta_id)
            sheet_relacionados.write(row, 0, 'Fruta:', cell_format)
            sheet_relacionados.write(row, 1, fruta.nombre, cell_format)
            row += 1
        
        row += 1
        
        # Obtener todas las compras según los filtros
        compras = CompraNacional.objects.filter(**compras_filter).order_by('-fecha_compra')
        
        # Preparar encabezados
        headers = []
        
        # Crear formato para encabezados de sección
        section_header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#1F618D',
            'font_color': 'white',
            'border': 1,
            'align': 'center',
            'valign': 'vcenter',
            'font_size': 12
        })
        
        # Definir los encabezados para cada sección
        compra_headers = [
            'ID Compra', 'Proveedor', 'Origen', 'Fruta', 'Peso Compra', 
            'Fecha Compra', 'Número Guía', 'Remisión', 'Precio Compra Exp', 
            'Precio Compra Nal', 'Tipo Empaque', 'Cantidad Empaque'
        ]
        
        venta_headers = [
            'Exportador', 'Fecha Llegada', 'Fecha Vencimiento', 
            'Cantidad Empaque Recibida', 'Peso Bruto Recibido', 
            'Peso Neto Recibido', 'Diferencia Peso', 'Diferencia Empaque'
        ]
        
        reporte_exp_headers = [
            'Remisión Exp', 'Fecha Reporte Exp', 'Kg Totales', 'Kg Exportación', 
            '% Exportación', 'Precio Venta Kg Exp', 'Kg Nacional', '% Nacional', 
            'Precio Venta Kg Nal', 'Kg Merma', '% Merma', 'Precio Total', 
            'Factura', 'Fecha Factura', 'Vencimiento Factura', 'Finalizado'
        ]
        
        reporte_prov_headers = [
            'Fecha Reporte Prov', 'P Kg Totales', 'P Kg Exportación', 
            'P % Exportación', 'P Precio Kg Exp', 'P Kg Nacional', 
            'P % Nacional', 'P Precio Kg Nal', 'P Kg Merma', 
            'P % Merma', 'P Total Facturar', 'Asohofrucol', 
            'Rte Fte', 'Rte Ica', 'P Total Pagar', 
            'P Utilidad', 'P % Utilidad'
        ]
        
        # Escribir encabezados de sección
        if 'compra_nacional' in data_types:
            sheet_relacionados.merge_range(row, compra_start, row, compra_start + compra_nacional_cols - 1, 'COMPRA NACIONAL', section_header_format)
            headers.extend(compra_headers)
        
        if 'venta_nacional' in data_types:
            sheet_relacionados.merge_range(row, venta_start, row, venta_start + venta_nacional_cols - 1, 'VENTA NACIONAL', section_header_format)
            headers.extend(venta_headers)
        
        if 'reporte_exportador' in data_types:
            sheet_relacionados.merge_range(row, reporte_exp_start, row, reporte_exp_start + reporte_exp_cols - 1, 'REPORTE CALIDAD EXPORTADOR', section_header_format)
            headers.extend(reporte_exp_headers)
        
        if 'reporte_proveedor' in data_types:
            sheet_relacionados.merge_range(row, reporte_prov_start, row, reporte_prov_start + reporte_prov_cols - 1, 'REPORTE CALIDAD PROVEEDOR', section_header_format)
            headers.extend(reporte_prov_headers)
        
        row += 1
        
        # Escribir encabezados de columna
        for col, header in enumerate(headers):
            sheet_relacionados.write(row, col, header, header_format)
        
        sheet_relacionados.freeze_panes(row + 1, 0)  # Congelar fila de encabezados
        row += 1
        
        # Escribir datos
        for compra in compras:
            # Usar las posiciones iniciales calculadas anteriormente para cada sección
            
            # Compra Nacional
            if 'compra_nacional' in data_types:
                col = compra_start
                sheet_relacionados.write(row, col, compra.id, cell_format)
                col += 1
                sheet_relacionados.write(row, col, compra.proveedor.nombre, cell_format)
                col += 1
                sheet_relacionados.write(row, col, compra.origen_compra, cell_format)
                col += 1
                sheet_relacionados.write(row, col, compra.fruta.nombre, cell_format)
                col += 1
                sheet_relacionados.write(row, col, float(compra.peso_compra), number_format)
                col += 1
                sheet_relacionados.write(row, col, compra.fecha_compra, date_format)
                col += 1
                sheet_relacionados.write(row, col, compra.numero_guia, cell_format)
                col += 1
                sheet_relacionados.write(row, col, compra.remision or 'N/A', cell_format)
                col += 1
                sheet_relacionados.write(row, col, float(compra.precio_compra_exp), currency_format)
                col += 1
                sheet_relacionados.write(row, col, float(compra.precio_compra_nal) if compra.precio_compra_nal else 0, currency_format)
                col += 1
                sheet_relacionados.write(row, col, compra.tipo_empaque.nombre, cell_format)
                col += 1
                sheet_relacionados.write(row, col, compra.cantidad_empaque, cell_format)
            
            # Venta Nacional
            if 'venta_nacional' in data_types:
                col = venta_start
                try:
                    venta = compra.ventanacional
                    sheet_relacionados.write(row, col, venta.exportador.nombre, cell_format)
                    col += 1
                    sheet_relacionados.write(row, col, venta.fecha_llegada, date_format)
                    col += 1
                    sheet_relacionados.write(row, col, venta.fecha_vencimiento, date_format)
                    col += 1
                    sheet_relacionados.write(row, col, venta.cantidad_empaque_recibida, cell_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(venta.peso_bruto_recibido), number_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(venta.peso_neto_recibido), number_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(venta.diferencia_peso) if venta.diferencia_peso else 0, number_format)
                    col += 1
                    sheet_relacionados.write(row, col, venta.diferencia_empaque if venta.diferencia_empaque else 0, cell_format)
                except:
                    for i in range(venta_nacional_cols):
                        sheet_relacionados.write(row, col + i, 'N/A', cell_format)
            
            # Reporte Calidad Exportador
            if 'reporte_exportador' in data_types:
                col = reporte_exp_start
                try:
                    reporte_exp = compra.ventanacional.reportecalidadexportador
                    sheet_relacionados.write(row, col, reporte_exp.remision_exp or 'N/A', cell_format)
                    col += 1
                    sheet_relacionados.write(row, col, reporte_exp.fecha_reporte, date_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_exp.kg_totales), number_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_exp.kg_exportacion), number_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_exp.porcentaje_exportacion) / 100, percent_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_exp.precio_venta_kg_exp), currency_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_exp.kg_nacional), number_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_exp.porcentaje_nacional) / 100, percent_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_exp.precio_venta_kg_nal), currency_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_exp.kg_merma), number_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_exp.porcentaje_merma) / 100, percent_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_exp.precio_total), currency_format)
                    col += 1
                    sheet_relacionados.write(row, col, reporte_exp.factura or 'N/A', cell_format)
                    col += 1
                    sheet_relacionados.write(row, col, reporte_exp.fecha_factura or '', date_format)
                    col += 1
                    sheet_relacionados.write(row, col, reporte_exp.vencimiento_factura or '', date_format)
                    col += 1
                    sheet_relacionados.write(row, col, "Sí" if reporte_exp.finalizado else "No", cell_format)
                except:
                    for i in range(reporte_exp_cols):
                        sheet_relacionados.write(row, col + i, 'N/A', cell_format)
            
            # Reporte Calidad Proveedor
            if 'reporte_proveedor' in data_types:
                col = reporte_prov_start
                try:
                    reporte_prov = compra.ventanacional.reportecalidadexportador.reportecalidadproveedor
                    sheet_relacionados.write(row, col, reporte_prov.p_fecha_reporte, date_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_prov.p_kg_totales), number_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_prov.p_kg_exportacion), number_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_prov.p_porcentaje_exportacion) / 100, percent_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_prov.p_precio_kg_exp), currency_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_prov.p_kg_nacional), number_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_prov.p_porcentaje_nacional) / 100, percent_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_prov.p_precio_kg_nal), currency_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_prov.p_kg_merma), number_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_prov.p_porcentaje_merma) / 100, percent_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_prov.p_total_facturar), currency_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_prov.asohofrucol), currency_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_prov.rte_fte), currency_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_prov.rte_ica), currency_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_prov.p_total_pagar), currency_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_prov.p_utilidad), currency_format)
                    col += 1
                    sheet_relacionados.write(row, col, float(reporte_prov.p_porcentaje_utilidad) / 100, percent_format)
                except:
                    for i in range(reporte_prov_cols):
                        sheet_relacionados.write(row, col + i, 'N/A', cell_format)
            
            row += 1
        
        # Definir anchos de columna para cada sección
        section_widths = {
            # Compra Nacional
            'compra_nacional': [10, 25, 15, 20, 15, 15, 15, 15, 15, 15, 20, 15],
            # Venta Nacional
            'venta_nacional': [25, 15, 15, 15, 15, 15, 15, 15],
            # Reporte Exportador
            'reporte_exportador': [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
            # Reporte Proveedor
            'reporte_proveedor': [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15]
        }
        
        # Aplicar anchos de columna por sección
        col_index = 0
        for section in ['compra_nacional', 'venta_nacional', 'reporte_exportador', 'reporte_proveedor']:
            if section in data_types:
                widths = section_widths[section]
                for i, width in enumerate(widths):
                    sheet_relacionados.set_column(col_index + i, col_index + i, width)
                col_index += len(widths)

    # 2. Exportar transferencias
    if 'transferencias' in data_types:
        sheet_transferencias = workbook.add_worksheet('Transferencias')
        row = 0
        
        # Título principal
        sheet_transferencias.merge_range(row, 0, row, 6, 'REPORTE DE TRANSFERENCIAS A PROVEEDORES', subheader_format)
        row += 2
        
        # Información de filtros
        sheet_transferencias.write(row, 0, 'Periodo:', cell_format)
        sheet_transferencias.write(row, 1, f"{fecha_inicio.strftime('%d/%m/%Y')} - {fecha_fin.strftime('%d/%m/%Y')}", cell_format)
        row += 1
        
        if proveedor_id:
            proveedor = ProveedorNacional.objects.get(id=proveedor_id)
            sheet_transferencias.write(row, 0, 'Proveedor:', cell_format)
            sheet_transferencias.write(row, 1, proveedor.nombre, cell_format)
            row += 1
        
        row += 1
        
        # Encabezados
        headers = ['ID', 'Proveedor', 'Fecha Transferencia', 'Valor Transferencia', 'Origen Transferencia', 'Observaciones']
        
        for col, header in enumerate(headers):
            sheet_transferencias.write(row, col, header, header_format)
        
        sheet_transferencias.freeze_panes(row + 1, 0)  # Congelar fila de encabezados
        row += 1
        
        # Filtro para transferencias
        transferencias_filter = {}
        if fecha_inicio:
            transferencias_filter['fecha_transferencia__gte'] = fecha_inicio
        if fecha_fin:
            transferencias_filter['fecha_transferencia__lte'] = fecha_fin
        if proveedor_id:
            transferencias_filter['proveedor_id'] = proveedor_id
        
        transferencias = TransferenciasProveedor.objects.filter(**transferencias_filter).order_by('-fecha_transferencia')
        
        # Escribir datos
        for t in transferencias:
            sheet_transferencias.write(row, 0, t.id, cell_format)
            sheet_transferencias.write(row, 1, t.proveedor.nombre, cell_format)
            sheet_transferencias.write(row, 2, t.fecha_transferencia, date_format)
            sheet_transferencias.write(row, 3, float(t.valor_transferencia), currency_format)
            sheet_transferencias.write(row, 4, t.origen_transferencia, cell_format)
            sheet_transferencias.write(row, 5, t.observaciones or 'N/A', cell_format)
            row += 1
        
        # Calcular total de transferencias
        if transferencias.exists():
            total_transferencias = transferencias.aggregate(total=Sum('valor_transferencia'))['total'] or 0
            
            row += 1
            sheet_transferencias.merge_range(row, 0, row, 2, 'TOTAL TRANSFERENCIAS:', header_format)
            sheet_transferencias.write(row, 3, float(total_transferencias), currency_format)
        
        # Ajustar anchos de columna
        sheet_transferencias.set_column(0, 0, 10)
        sheet_transferencias.set_column(1, 1, 30)
        sheet_transferencias.set_column(2, 2, 20)
        sheet_transferencias.set_column(3, 3, 20)
        sheet_transferencias.set_column(4, 4, 25)
        sheet_transferencias.set_column(5, 5, 40)

    # 3. Exportar datos de dashboard
    if 'dashboard' in data_types:
        sheet_dashboard = workbook.add_worksheet('Dashboard')
        row = 0
        
        # Título principal
        sheet_dashboard.merge_range(row, 0, row, 10, 'RESUMEN DEL DASHBOARD', subheader_format)
        row += 2
        
        # Información de filtros
        sheet_dashboard.write(row, 0, 'Periodo:', cell_format)
        sheet_dashboard.write(row, 1, f"{fecha_inicio.strftime('%d/%m/%Y')} - {fecha_fin.strftime('%d/%m/%Y')}", cell_format)
        row += 1
        
        if proveedor_id:
            proveedor = ProveedorNacional.objects.get(id=proveedor_id)
            sheet_dashboard.write(row, 0, 'Proveedor:', cell_format)
            sheet_dashboard.write(row, 1, proveedor.nombre, cell_format)
            row += 1
        
        if fruta_id:
            fruta = Fruta.objects.get(id=fruta_id)
            sheet_dashboard.write(row, 0, 'Fruta:', cell_format)
            sheet_dashboard.write(row, 1, fruta.nombre, cell_format)
            row += 1
        
        row += 2
        
        # Indicadores de cabecera (KPIs)
        sheet_dashboard.merge_range(row, 0, row, 10, 'INDICADORES PRINCIPALES', header_format)
        row += 1
        
        # Calcular datos del dashboard similar a la vista dashboard_nacionales
        proveedores = ProveedorNacional.objects.all()
        compras_base = CompraNacional.objects.all()
        compras_periodo_anterior = CompraNacional.objects.filter(
            fecha_compra__gte=fecha_inicio - (fecha_fin - fecha_inicio),
            fecha_compra__lte=fecha_inicio - datetime.timedelta(days=1)
        )

        # Aplicar filtros
        if fecha_inicio:
            compras_base = compras_base.filter(fecha_compra__gte=fecha_inicio)
        if fecha_fin:
            compras_base = compras_base.filter(fecha_compra__lte=fecha_fin)
        if proveedor_id:
            compras_base = compras_base.filter(proveedor_id=proveedor_id)
            proveedores = proveedores.filter(id=proveedor_id)
            compras_periodo_anterior = compras_periodo_anterior.filter(proveedor_id=proveedor_id)
        if fruta_id:
            compras_base = compras_base.filter(fruta_id=fruta_id)
            compras_periodo_anterior = compras_periodo_anterior.filter(fruta_id=fruta_id)

        # Calcular métricas de forma coherente
        # Usar prefetch_related para optimizar consultas
        compras_base = compras_base.prefetch_related(
            Prefetch('ventanacional', 
                     queryset=VentaNacional.objects.prefetch_related(
                         'reportecalidadexportador',
                         'reportecalidadexportador__reportecalidadproveedor'
                     )
            )
        )
        
        total_compras_valor = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras_base
        ).aggregate(total=Sum('p_total_facturar'))['total'] or Decimal('0')
        
        # Cambiar a usar VentaNacional para el peso neto recibido (más preciso)
        total_kilos = VentaNacional.objects.filter(
            compra_nacional__in=compras_base
        ).aggregate(
            total=Sum('peso_neto_recibido')
        )['total'] or Decimal('0')
        
        total_facturado_exportadores = ReporteCalidadExportador.objects.filter(
            venta_nacional__compra_nacional__in=compras_base
        ).aggregate(total=Sum('precio_total'))['total'] or Decimal('0')
        
        total_utilidades = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras_base
        ).aggregate(total=Sum('p_utilidad'))['total'] or Decimal('0')
        
        # Calcular porcentaje de utilidad sobre facturado total
        percent_utilidad_facturado_total = (total_utilidades / total_facturado_exportadores * 100) if total_facturado_exportadores else 0
        
        total_reportes_pendientes = 0
        for compra in compras_base:
            tiene_venta = hasattr(compra, 'ventanacional')
            tiene_reporte_exp = False
            tiene_reporte_prov = False
            
            if tiene_venta:
                venta = compra.ventanacional
                tiene_reporte_exp = hasattr(venta, 'reportecalidadexportador')
                if tiene_reporte_exp:
                    reporte_exp = venta.reportecalidadexportador
                    tiene_reporte_prov = hasattr(reporte_exp, 'reportecalidadproveedor')
                    
            if not (tiene_venta and tiene_reporte_exp and tiene_reporte_prov):
                total_reportes_pendientes += 1
        
        # Escribir KPIs en el Excel
        # Encabezados de KPIs
        kpis = [
            {'title': 'COMPRAS TOTALES', 'value': float(total_compras_valor), 'format': currency_format},
            {'title': 'KILOS COMPRADOS', 'value': float(total_kilos), 'format': number_format},
            {'title': 'FACTURADO EXP.', 'value': float(total_facturado_exportadores), 'format': currency_format},
            {'title': 'UTILIDADES TOTALES', 'value': float(total_utilidades), 'format': currency_format},
            {'title': '% UTILIDAD/FACTURADO', 'value': float(percent_utilidad_facturado_total/100), 'format': percent_format},
        ]
        
        for i, kpi in enumerate(kpis):
            col = i * 2
            sheet_dashboard.write(row, col, kpi['title'], header_format)
            sheet_dashboard.write(row, col + 1, kpi['value'], kpi['format'])
        
        row += 3
        
        # Tabla de proveedores
        sheet_dashboard.merge_range(row, 0, row, 10, 'DETALLE DE PROVEEDORES', header_format)
        row += 1
        
        # Encabezados de tabla - Añadir la nueva columna
        headers = ['Proveedor', 'Nº Compras', 'Rep. Pendientes', 'Valor Compras', 'Total Pagado', 
                   'Facturado Exp.', 'Kilos Comprados', 'Utilidades', '% Kilos', '% Utilidad', '% Util/Fact']
        
        for col, header in enumerate(headers):
            sheet_dashboard.write(row, col, header, header_format)
        
        sheet_dashboard.freeze_panes(row + 1, 0)  # Congelar fila de encabezados
        row += 1
        
        # Calcular datos para cada proveedor
        for proveedor in proveedores:
            compras = compras_base.filter(proveedor=proveedor)
            numero_de_compras = compras.count()
            
            # Contar reportes pendientes
            reportes_pendientes = 0
            for compra in compras:
                tiene_venta = hasattr(compra, 'ventanacional')
                tiene_reporte_exp = False
                tiene_reporte_prov = False
                
                if tiene_venta:
                    venta = compra.ventanacional
                    tiene_reporte_exp = hasattr(venta, 'reportecalidadexportador')
                    if tiene_reporte_exp:
                        reporte_exp = venta.reportecalidadexportador
                        tiene_reporte_prov = hasattr(reporte_exp, 'reportecalidadproveedor')
                        
                if not (tiene_venta and tiene_reporte_exp and tiene_reporte_prov):
                    reportes_pendientes += 1
            
            # Calcular valores totales coherentes con los totales generales
            valor_total_compras = ReporteCalidadProveedor.objects.filter(
                rep_cal_exp__venta_nacional__compra_nacional__in=compras
            ).aggregate(total=Sum('p_total_facturar'))['total'] or Decimal('0')
            
            total_pagado_proveedor = TransferenciasProveedor.objects.filter(
                proveedor=proveedor,
                fecha_transferencia__gte=fecha_inicio,
                fecha_transferencia__lte=fecha_fin,
            ).aggregate(total=Sum('valor_transferencia'))['total'] or Decimal('0')
            
            total_facturado_exportadores_prov = ReporteCalidadExportador.objects.filter(
                venta_nacional__compra_nacional__in=compras
            ).aggregate(total=Sum('precio_total'))['total'] or Decimal('0')
            
            # Usar peso_neto_recibido para consistencia
            total_kilos_comprados = VentaNacional.objects.filter(
                compra_nacional__in=compras
            ).aggregate(
                total=Sum('peso_neto_recibido')
            )['total'] or Decimal('0')
            
            total_utilidad = ReporteCalidadProveedor.objects.filter(
                rep_cal_exp__venta_nacional__compra_nacional__in=compras
            ).aggregate(total=Sum('p_utilidad'))['total'] or Decimal('0')
            
            # Calcular porcentajes
            percent_kilos = (total_kilos_comprados / total_kilos * 100) if total_kilos else 0
            percent_utilidad = (total_utilidad / total_utilidades * 100) if total_utilidades else 0
            
            # Calcular porcentaje de utilidad sobre facturado para este proveedor
            percent_utilidad_facturado_prov = (total_utilidad / total_facturado_exportadores_prov * 100) if total_facturado_exportadores_prov else 0
            
            # Escribir fila de datos
            sheet_dashboard.write(row, 0, proveedor.nombre, cell_format)
            sheet_dashboard.write(row, 1, numero_de_compras, cell_format)
            sheet_dashboard.write(row, 2, reportes_pendientes, cell_format)
            sheet_dashboard.write(row, 3, float(valor_total_compras), currency_format)
            sheet_dashboard.write(row, 4, float(total_pagado_proveedor), currency_format)
            sheet_dashboard.write(row, 5, float(total_facturado_exportadores_prov), currency_format)
            sheet_dashboard.write(row, 6, float(total_kilos_comprados), number_format)
            sheet_dashboard.write(row, 7, float(total_utilidad), currency_format)
            # Dividir por 100 los porcentajes para el formato correcto
            sheet_dashboard.write(row, 8, float(percent_kilos/100), percent_format)
            sheet_dashboard.write(row, 9, float(percent_utilidad/100), percent_format)
            sheet_dashboard.write(row, 10, float(percent_utilidad_facturado_prov/100), percent_format)
            
            row += 1
        
        # Ajustar anchos de columna
        sheet_dashboard.set_column(0, 0, 30)  # Proveedor
        sheet_dashboard.set_column(1, 2, 15)  # Nº Compras, Rep. Pendientes
        sheet_dashboard.set_column(3, 7, 20)  # Valores monetarios y kilos
        sheet_dashboard.set_column(8, 10, 12)  # Porcentajes

    # Cerrar el libro y preparar la respuesta
    workbook.close()
    
    # Preparar el nombre del archivo
    proveedor_nombre = ''
    if proveedor_id:
        proveedor = ProveedorNacional.objects.get(id=proveedor_id)
        proveedor_nombre = f'_{proveedor.nombre}'
    
    fruta_nombre = ''
    if fruta_id:
        fruta = Fruta.objects.get(id=fruta_id)
        fruta_nombre = f'_{fruta.nombre}'
    
    periodo = f'{fecha_inicio.strftime("%d-%m-%Y")}_{fecha_fin.strftime("%d-%m-%Y")}'
    filename = f'Reporte_Nacionales{proveedor_nombre}{fruta_nombre}_{periodo}.xlsx'
    
    # Configurar la respuesta HTTP para devolver el archivo Excel
    output.seek(0)
    response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response

@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def estado_cuenta_proveedor(request, proveedor_id):
    # Obtener proveedor
    proveedor = get_object_or_404(ProveedorNacional, id=proveedor_id)

    # Filtros desde request
    fecha_inicio = request.GET.get('fecha_inicio')
    fecha_fin = request.GET.get('fecha_fin')
    fruta_id = request.GET.get('fruta')

    # Establecer fechas por defecto
    fecha_fin = fecha_fin or datetime.date.today()
    if isinstance(fecha_fin, str):
        fecha_fin = datetime.datetime.strptime(fecha_fin, '%Y-%m-%d').date()
    fecha_inicio = fecha_inicio or (fecha_fin - datetime.timedelta(days=30))
    if isinstance(fecha_inicio, str):
        fecha_inicio = datetime.datetime.strptime(fecha_inicio, '%Y-%m-%d').date()

    # Filtrar compras del proveedor
    compras = CompraNacional.objects.filter(proveedor=proveedor)
    if fecha_inicio:
        compras = compras.filter(fecha_compra__gte=fecha_inicio)
    if fecha_fin:
        compras = compras.filter(fecha_compra__lte=fecha_fin)
    if fruta_id:
        compras = compras.filter(fruta_id=fruta_id)

    # Calcular totales
    total_compras_valor = ReporteCalidadProveedor.objects.filter(
        rep_cal_exp__venta_nacional__compra_nacional__in=compras
    ).aggregate(total=Sum('p_total_facturar'))['total'] or Decimal('0')

    total_kilos = VentaNacional.objects.filter(
        compra_nacional__in=compras
    ).aggregate(
        total=Sum('peso_neto_recibido')
    )['total'] or Decimal('0')

    total_transferido = TransferenciasProveedor.objects.filter(
        proveedor=proveedor,
        fecha_transferencia__gte=fecha_inicio,
        fecha_transferencia__lte=fecha_fin
    ).aggregate(total=Sum('valor_transferencia'))['total'] or Decimal('0')

    saldo_pendiente = total_compras_valor - total_transferido

    total_utilidad = ReporteCalidadProveedor.objects.filter(
        rep_cal_exp__venta_nacional__compra_nacional__in=compras
    ).aggregate(total=Sum('p_utilidad'))['total'] or Decimal('0')

    # Datos para gráficos
    compras_por_fecha = compras.values('fecha_compra').annotate(
    total_valor=Avg('precio_compra_exp')  
    ).order_by('fecha_compra')

    # Contexto para el template
    context = {
        'proveedor': proveedor,
        'compras': compras,
        'transferencias': TransferenciasProveedor.objects.filter(
            proveedor=proveedor, fecha_transferencia__gte=fecha_inicio, fecha_transferencia__lte=fecha_fin
        ),
        'total_compras_valor': total_compras_valor,
        'total_kilos': total_kilos,
        'total_transferido': total_transferido,
        'saldo_pendiente': saldo_pendiente,
        'total_utilidad': total_utilidad,
        'fecha_inicio': fecha_inicio,
        'fecha_fin': fecha_fin,
        'fruta_id': fruta_id,
        'compras_por_fecha': list(compras_por_fecha),  # Para gráficos
        'proveedores': ProveedorNacional.objects.all(),  # Para dropdown
    }

    return render(request, 'estado_cuenta_proveedor.html', context)