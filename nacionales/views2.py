import datetime
from decimal import Decimal
from django import forms
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db.models import Sum, Avg
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from comercial.models import Fruta
from nacionales.models import CompraNacional, VentaNacional, ReporteCalidadExportador, ReporteCalidadProveedor, \
    Exportador, ProveedorNacional, TransferenciasProveedor


def es_miembro_del_grupo(nombre_grupo):
    def es_miembro(user):
        return user.groups.filter(name=nombre_grupo).exists()

    return es_miembro

class DateRangeForm(forms.Form):
    exportador = forms.ModelChoiceField(
        queryset=Exportador.objects.all(),
        label="Exportador",
        widget=forms.Select(attrs={'class': 'form-control'}),
        required=True
    )
    fecha_inicio = forms.DateField(
        label="Fecha Inicio", 
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
        required=True
    )
    fecha_final = forms.DateField(
        label="Fecha Final", 
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
        required=True
    )

class GuiaSearchForm(forms.Form):
    numero_guia = forms.CharField(
        label="Número de Guía", 
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Buscar por número de guía...',
            'id': 'id_numero_guia_search'
        })
    )

@login_required
@user_passes_test(user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home'))
def relacion_facturas_vencidas(request):
    today = timezone.now().date()
    form = DateRangeForm(request.GET or None)
    facturas_vencidas = []
    total_a_pagar = Decimal('0.00')
    
    # Inicializa las variables de contexto con valores predeterminados
    fecha_inicio = None
    fecha_final = None
    exportador_seleccionado = None
    
    if form.is_valid():
        fecha_inicio = form.cleaned_data['fecha_inicio']
        fecha_final = form.cleaned_data['fecha_final']
        exportador = form.cleaned_data['exportador']
        exportador_seleccionado = exportador
        
        # Obtener reportes vencidos no pagados y en estado "Facturado"
        # Usar fecha_final en lugar de today para determinar facturas vencidas
        reportes = ReporteCalidadExportador.objects.filter(
            vencimiento_factura__range=(fecha_inicio, fecha_final),
            vencimiento_factura__lt=fecha_final,  # Usar fecha_final en vez de today
            pagado=False,
            estado_reporte_exp="Facturado",
            venta_nacional__exportador=exportador  # Filtrar por exportador seleccionado
        ).select_related(
            'venta_nacional__compra_nacional__fruta',
            'venta_nacional__compra_nacional__proveedor',
            'venta_nacional__exportador'
        )
        
        # Agrupar por factura
        facturas_agrupadas = {}
        for reporte in reportes:
            # Calcular valores requeridos
            valor_exp = reporte.precio_venta_kg_exp * reporte.kg_exportacion
            valor_nal = reporte.precio_venta_kg_nal * reporte.kg_nacional
            
            # Calcular días de vencimiento usando today
            dias_vencidos = (today - reporte.vencimiento_factura).days
            
            if reporte.factura not in facturas_agrupadas:
                facturas_agrupadas[reporte.factura] = {
                    'factura': reporte.factura,
                    'vencimiento_factura': reporte.vencimiento_factura,
                    'exportador': reporte.venta_nacional.compra_nacional.proveedor,
                    'dias_vencidos': dias_vencidos,  # Añadir días vencidos
                    'items': [],
                    'subtotal': Decimal('0.00')
                }
                
            facturas_agrupadas[reporte.factura]['items'].append({
                'remision_exp': reporte.remision_exp,
                'numero_guia': reporte.venta_nacional.compra_nacional.numero_guia,
                'fecha_reporte': reporte.fecha_reporte,
                'fruta': reporte.venta_nacional.compra_nacional.fruta,
                'valor_exp': valor_exp,
                'valor_nal': valor_nal,
                'precio_total': reporte.precio_total,
                'id': reporte.pk
            })
            
            facturas_agrupadas[reporte.factura]['subtotal'] += reporte.precio_total
            total_a_pagar += reporte.precio_total
            
        facturas_vencidas = list(facturas_agrupadas.values())
    
    context = {
        'form': form,
        'facturas_vencidas': facturas_vencidas,
        'total_a_pagar': total_a_pagar,
        'fecha_actual': today,
        'f_inicial': fecha_inicio,
        'f_final': fecha_final,
        'exportador_seleccionado': exportador_seleccionado,
    }
    
    return render(request, 'relacion_facturas_vencidas.html', context)

@login_required
@user_passes_test(user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home'))
def relacion_reportes_vencidos(request):
    today = timezone.now().date()
    form = DateRangeForm(request.GET or None)
    reportes_vencidos = []
    total_reportes = 0
    
    # Inicializa las variables de contexto con valores predeterminados
    fecha_inicio = None
    fecha_final = None
    exportador_seleccionado = None
    
    if form.is_valid():
        fecha_inicio = form.cleaned_data['fecha_inicio']
        fecha_final = form.cleaned_data['fecha_final']
        exportador = form.cleaned_data['exportador']
        exportador_seleccionado = exportador
        
        # Obtener ventas nacionales con reportes vencidos
        reportes = VentaNacional.objects.filter(
            fecha_vencimiento__range=(fecha_inicio, fecha_final),
            fecha_vencimiento__lt=fecha_final,
            exportador=exportador,
            estado_venta="Vencido"
        ).select_related(
            'compra_nacional__fruta',
            'compra_nacional__proveedor',
            'compra_nacional__tipo_empaque'
        )
        
        for reporte in reportes:
            # Calcular días de vencimiento usando today
            dias_vencidos = (today - reporte.fecha_vencimiento).days
            
            reportes_vencidos.append({
                'numero_guia': reporte.compra_nacional.numero_guia,
                'fecha_llegada': reporte.fecha_llegada,
                'fecha_vencimiento': reporte.fecha_vencimiento,
                'fruta': reporte.compra_nacional.fruta,
                'origen': reporte.compra_nacional.origen_compra,
                'peso_bruto_recibido': reporte.peso_bruto_recibido,
                'peso_neto_recibido': reporte.peso_neto_recibido,
                'cantidad_empaque_recibida': reporte.cantidad_empaque_recibida,
                'tipo_empaque': reporte.compra_nacional.tipo_empaque,
                'dias_vencidos': dias_vencidos,
                'id': reporte.pk
            })
            
        total_reportes = len(reportes_vencidos)
    
    context = {
        'form': form,
        'reportes_vencidos': reportes_vencidos,
        'total_reportes': total_reportes,
        'fecha_actual': today,
        'f_inicial': fecha_inicio,
        'f_final': fecha_final,
        'exportador_seleccionado': exportador_seleccionado,
    }
    
    return render(request, 'relacion_reportes_vencidos.html', context)



 # Vistas para el estado de cuenta de proveedores: #
@login_required
@user_passes_test(user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home'))
def reporte_cuenta_proveedor(request, proveedor_id):
    # Obtener el proveedor
    proveedor = get_object_or_404(ProveedorNacional, id=proveedor_id)
    fecha_actual = timezone.now().date()
    
    # Obtener compras completas (completado=True y reporte_enviado=True)
    compras_completas = ReporteCalidadProveedor.objects.filter(
        rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
        completado=True,
        reporte_enviado=True
    ).select_related(
        'rep_cal_exp', 
        'rep_cal_exp__venta_nacional', 
        'rep_cal_exp__venta_nacional__compra_nacional',
        'rep_cal_exp__venta_nacional__compra_nacional__fruta'
    ).order_by('-p_fecha_reporte')
    
    # Obtener todas las compras del proveedor
    todas_compras = CompraNacional.objects.filter(
        proveedor=proveedor
    ).select_related('fruta', 'tipo_empaque')
    
    # Crear un conjunto para almacenar los IDs de las compras que ya están completas
    compras_completas_ids = set(
        ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
            completado=True, 
            reporte_enviado=True
        ).values_list('rep_cal_exp__venta_nacional__compra_nacional_id', flat=True)
    )
    
    # Preparar datos para compras en proceso
    compras_proceso = []
    for compra in todas_compras:
        # Excluir compras ya completadas
        if compra.id in compras_completas_ids:
            continue
            
        # Datos básicos de la compra
        datos_compra = {
            'numero_guia': compra.numero_guia,
            'fecha_compra': compra.fecha_compra,
            'peso_recibido': None,
            'fecha_reporte': None,
            'estado': 'Registrado',
        }
        
        # Verificar si tiene venta relacionada
        try:
            venta = VentaNacional.objects.get(compra_nacional=compra)
            datos_compra['peso_recibido'] = venta.peso_neto_recibido
            datos_compra['estado'] = venta.estado_venta
            
            # Verificar si tiene reporte de exportador
            try:
                reporte_exp = ReporteCalidadExportador.objects.get(venta_nacional=venta)
                datos_compra['estado'] = reporte_exp.estado_reporte_exp
                
                # Verificar si tiene reporte de proveedor
                try:
                    reporte_prov = ReporteCalidadProveedor.objects.get(rep_cal_exp=reporte_exp)
                    datos_compra['fecha_reporte'] = reporte_prov.p_fecha_reporte
                    datos_compra['estado'] = reporte_prov.estado_reporte_prov
                except ReporteCalidadProveedor.DoesNotExist:
                    datos_compra['estado'] = 'Sin Reporte Proveedor'
            except ReporteCalidadExportador.DoesNotExist:
                datos_compra['estado'] = 'Sin Reporte Calidad'
        except VentaNacional.DoesNotExist:
            datos_compra['estado'] = 'Sin Ingreso'
        
        compras_proceso.append(datos_compra)
    
    # Obtener transferencias realizadas al proveedor
    transferencias = TransferenciasProveedor.objects.filter(
        proveedor=proveedor
    ).order_by('-fecha_transferencia')
    
    # Calcular el saldo total
    total_por_pagar = ReporteCalidadProveedor.objects.filter(
        rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
        completado=True,
        reporte_enviado=True
    ).aggregate(total=Sum('p_total_pagar'))['total'] or 0
    
    total_pagado = TransferenciasProveedor.objects.filter(
        proveedor=proveedor
    ).aggregate(total=Sum('valor_transferencia'))['total'] or 0
    
    saldo_actual = total_por_pagar - total_pagado
    
    # Calcular la utilidad total para mostrar en tarjeta adicional
    total_utilidad = ReporteCalidadProveedor.objects.filter(
        rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor,
        completado=True,
        reporte_enviado=True
    ).aggregate(total=Sum('p_utilidad'))['total'] or 0
    
    context = {
        'proveedor': proveedor,
        'fecha_actual': fecha_actual,
        'compras_completas': compras_completas,
        'compras_proceso': compras_proceso,
        'transferencias': transferencias,
        'saldo_actual': saldo_actual,
        'total_por_pagar': total_por_pagar,
        'total_pagado': total_pagado,
        'total_utilidad': total_utilidad,
    }
    
    return render(request, 'reporte_estado_cuenta_proveedor.html', context)

@login_required
@user_passes_test(user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home'))
def reporte_individual_proveedor(request):
    """
    Muestra un reporte individual detallado para un reporte de calidad de proveedor 
    basado en la búsqueda por número de guía.
    """
    form = GuiaSearchForm(request.GET or None)
    reporte_proveedor = None
    reporte_exportador = None
    venta = None
    compra = None
    proveedor = None
    valor_promedio_kg = 0
    today = timezone.now().date()
    
    if form.is_valid():
        numero_guia = form.cleaned_data['numero_guia']
        
        try:
            # Buscar la compra nacional por número de guía
            compra = CompraNacional.objects.get(numero_guia=numero_guia)
            
            # Obtener la venta relacionada con la compra
            venta = VentaNacional.objects.get(compra_nacional=compra)
            
            # Obtener el reporte de exportador relacionado con la venta
            reporte_exportador = ReporteCalidadExportador.objects.filter(
                venta_nacional=venta
            ).first()
            
            if reporte_exportador:
                # Obtener el reporte de proveedor relacionado con el reporte de exportador
                reporte_proveedor = ReporteCalidadProveedor.objects.get(
                    rep_cal_exp=reporte_exportador
                )
                
                # Obtener el proveedor
                proveedor = compra.proveedor
                
                # Calcular el valor promedio por kilogramo
                if reporte_proveedor.p_kg_totales > 0:
                    valor_promedio_kg = reporte_proveedor.p_total_pagar / reporte_proveedor.p_kg_totales
        
        except (CompraNacional.DoesNotExist, VentaNacional.DoesNotExist, 
                ReporteCalidadExportador.DoesNotExist, ReporteCalidadProveedor.DoesNotExist):
            # No se encontraron resultados, dejar todo como None
            pass
    
    context = {
        'form': form,
        'reporte_proveedor': reporte_proveedor,
        'reporte_exportador': reporte_exportador,
        'venta': venta,
        'compra': compra,
        'proveedor': proveedor,
        'valor_promedio_kg': valor_promedio_kg,
        'today': today,
        'total_en_letras': reporte_proveedor.p_total_pagar if reporte_proveedor else 0,
        'search_submitted': form.is_valid(),  # Indica si se ha enviado una búsqueda
    }
    
    return render(request, 'reporte_inidivual_nacionales.html', context)


@login_required
@user_passes_test(user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home'))
def dashboard_nacionales(request):
    # Obtener parámetros de filtro
    fecha_inicio = request.GET.get('fecha_inicio')
    fecha_fin = request.GET.get('fecha_fin')
    proveedor_id = request.GET.get('proveedor')
    fruta_id = request.GET.get('fruta')

    # Si no hay fechas, establecer valores predeterminados
    if not fecha_fin:
        fecha_fin = datetime.date.today()
    else:
        fecha_fin = datetime.datetime.strptime(fecha_fin, '%Y-%m-%d').date()

    if not fecha_inicio:
        fecha_inicio = fecha_fin - datetime.timedelta(days=30)
    else:
        fecha_inicio = datetime.datetime.strptime(fecha_inicio, '%Y-%m-%d').date()

    # Calcular período anterior para comparaciones
    periodo_anterior_inicio = fecha_inicio - (fecha_fin - fecha_inicio)
    periodo_anterior_fin = fecha_inicio - datetime.timedelta(days=1)

    # Consultar todos los proveedores
    proveedores = ProveedorNacional.objects.all()

    # Base queryset for CompraNacional
    compras_base = CompraNacional.objects.all()
    compras_periodo_anterior = CompraNacional.objects.filter(
        fecha_compra__gte=periodo_anterior_inicio,
        fecha_compra__lte=periodo_anterior_fin
    )

    # Apply filters if provided
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

    # Aggregate data
    proveedores_data = []

    # Variables para totales
    total_compras_valor = Decimal('0')
    total_kilos = Decimal('0')
    total_utilidades = Decimal('0')
    total_reportes_pendientes = 0

    # Valores del período anterior
    if not compras_periodo_anterior.exists():
        compras_prev = Decimal('0')
        kilos_prev = Decimal('0')
        utilidades_prev = Decimal('0')
        reportes_pendientes_prev = 0
    else:
        compras_prev = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras_periodo_anterior
        ).aggregate(total=Sum('p_total_facturar'))['total'] or Decimal('0')

        kilos_prev = compras_periodo_anterior.aggregate(
            total=Sum('peso_compra')
        )['total'] or Decimal('0')

        utilidades_prev = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras_periodo_anterior
        ).aggregate(total=Sum('p_utilidad'))['total'] or Decimal('0')

        reportes_pendientes_prev = 0
        for compra in compras_periodo_anterior:
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
                reportes_pendientes_prev += 1

    # Datos para utilidades por fruta
    frutas_data = {}
    
    # Variables para análisis de calidad
    kg_exportacion = 0
    kg_nacional = 0
    kg_merma = 0
    porcentaje_exportacion = 0
    porcentaje_nacional = 0
    porcentaje_merma = 0

    for proveedor in proveedores:
        compras = compras_base.filter(proveedor=proveedor)
        numero_de_compras = compras.count()

        # Count incomplete reports
        compras_incompletas = []
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
                compras_incompletas.append(compra)
        reportes_pendientes = len(compras_incompletas)
        total_reportes_pendientes += reportes_pendientes

        valor_total_compras = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras
        ).aggregate(total=Sum('p_total_facturar'))['total'] or Decimal('0')
        total_compras_valor += valor_total_compras

        total_pagado_proveedor = TransferenciasProveedor.objects.filter(
            proveedor=proveedor,
            fecha_transferencia__gte=fecha_inicio,
            fecha_transferencia__lte=fecha_fin,
        ).aggregate(total=Sum('valor_transferencia'))['total'] or Decimal('0')

        total_facturado_exportadores = ReporteCalidadExportador.objects.filter(
            venta_nacional__compra_nacional__in=compras
        ).aggregate(total=Sum('precio_total'))['total'] or Decimal('0')

        total_kilos_comprados = compras.aggregate(total=Sum('peso_compra'))['total'] or Decimal('0')
        total_kilos += total_kilos_comprados

        total_utilidad = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras
        ).aggregate(total=Sum('p_utilidad'))['total'] or Decimal('0')
        total_utilidades += total_utilidad

        # Obtener peso neto recibido total por proveedor para gráfico de evolución
        total_peso_recibido = VentaNacional.objects.filter(
            compra_nacional__in=compras
        ).aggregate(total=Sum('peso_neto_recibido'))['total'] or Decimal('0')

        # Agrupar utilidades por fruta para este proveedor
        reportes_proveedor = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras
        )
        
        for reporte in reportes_proveedor:
            fruta_nombre = reporte.rep_cal_exp.venta_nacional.compra_nacional.fruta.nombre
            if fruta_nombre not in frutas_data:
                frutas_data[fruta_nombre] = Decimal('0')
            frutas_data[fruta_nombre] += reporte.p_utilidad

        proveedores_data.append({
            'proveedor': proveedor,
            'numero_de_compras': numero_de_compras,
            'reportes_pendientes': reportes_pendientes,
            'valor_total_compras': valor_total_compras,
            'total_pagado_proveedor': total_pagado_proveedor,
            'total_facturado_exportadores': total_facturado_exportadores,
            'total_kilos_comprados': total_kilos_comprados,
            'total_utilidades': total_utilidad,
            'total_peso_recibido': total_peso_recibido,
        })

    # Convertir frutas_data en una lista para el template
    utilidades_frutas = []
    for fruta_nombre, utilidad in frutas_data.items():
        utilidades_frutas.append({
            'fruta': fruta_nombre,
            'utilidad': utilidad
        })
    
    # Ordenar por utilidad descendente
    utilidades_frutas = sorted(utilidades_frutas, key=lambda x: x['utilidad'], reverse=True)

    # Datos para análisis de calidad (totales y promedios)
    reportes_calidad = ReporteCalidadExportador.objects.filter(
        venta_nacional__compra_nacional__in=compras_base
    )
    
    calidad_data = reportes_calidad.aggregate(
        kg_exportacion=Sum('kg_exportacion'),
        kg_nacional=Sum('kg_nacional'),
        kg_merma=Sum('kg_merma'),
        porcentaje_exportacion=Avg('porcentaje_exportacion'),
        porcentaje_nacional=Avg('porcentaje_nacional'),
        porcentaje_merma=Avg('porcentaje_merma')
    )
    
    kg_exportacion = calidad_data['kg_exportacion'] or 0
    kg_nacional = calidad_data['kg_nacional'] or 0
    kg_merma = calidad_data['kg_merma'] or 0
    porcentaje_exportacion = calidad_data['porcentaje_exportacion'] or 0
    porcentaje_nacional = calidad_data['porcentaje_nacional'] or 0
    porcentaje_merma = calidad_data['porcentaje_merma'] or 0

    # Calculate global totals and percentages
    for item in proveedores_data:
        item['percent_kilos'] = (item['total_kilos_comprados'] / total_kilos * 100) if total_kilos else 0
        item['percent_utilidad'] = (item['total_utilidades'] / total_utilidades * 100) if total_utilidades else 0

    # Calcular porcentajes comparativos
    if compras_prev:
        compras_percent = ((total_compras_valor - compras_prev) / compras_prev * 100)
    else:
        compras_percent = 0

    if kilos_prev:
        kilos_percent = ((total_kilos - kilos_prev) / kilos_prev * 100)
    else:
        kilos_percent = 0

    if utilidades_prev:
        utilidades_percent = ((total_utilidades - utilidades_prev) / utilidades_prev * 100)
    else:
        utilidades_percent = 0

    if reportes_pendientes_prev:
        reportes_percent = ((total_reportes_pendientes - reportes_pendientes_prev) / reportes_pendientes_prev * 100)
    else:
        reportes_percent = 0

    context = {
        'proveedores_data': proveedores_data,
        'global_total_compras': total_compras_valor,
        'global_total_kilos': total_kilos,
        'global_total_utilidades': total_utilidades,
        'global_total_reportes': total_reportes_pendientes,
        'proveedores': ProveedorNacional.objects.all(),
        'frutas': Fruta.objects.all(),
        'fecha_inicio': fecha_inicio,
        'fecha_fin': fecha_fin,
        'proveedor_id': proveedor_id,
        'fruta_id': fruta_id,
        'compras_prev': compras_prev,
        'kilos_prev': kilos_prev,
        'utilidades_prev': utilidades_prev,
        'reportes_prev': reportes_pendientes_prev,
        'compras_percent': round(compras_percent, 2),
        'kilos_percent': round(kilos_percent, 2),
        'utilidades_percent': round(utilidades_percent, 2),
        'reportes_percent': round(reportes_percent, 2),
        # Datos adicionales para nuevos gráficos
        'utilidades_frutas': utilidades_frutas,
        'kg_exportacion': kg_exportacion,
        'kg_nacional': kg_nacional,
        'kg_merma': kg_merma,
        'porcentaje_exportacion': porcentaje_exportacion,
        'porcentaje_nacional': porcentaje_nacional,
        'porcentaje_merma': porcentaje_merma,
    }

    return render(request, 'dashboard_nacionales.html', context)