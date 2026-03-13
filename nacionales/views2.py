import datetime
from decimal import Decimal
from django import forms
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db.models import Sum, Avg
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.http import require_GET
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

class ReportesAsociadosForm(forms.Form):
    factura = forms.CharField(
        label="Número de Factura", 
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Buscar por número de factura...',
        })
    )
    numero_guia = forms.CharField(
        label="Número de Guía", 
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Buscar por número de guía...',
        })
    )
    remision = forms.CharField(
        label="Número de Remisión/Reporte", 
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Buscar por número de remisión o reporte...',
        })
    )
    
    def clean(self):
        cleaned_data = super().clean()
        factura = cleaned_data.get('factura')
        numero_guia = cleaned_data.get('numero_guia')
        remision = cleaned_data.get('remision')
        
        # Al menos uno de los campos debe tener un valor
        if not factura and not numero_guia and not remision:
            raise forms.ValidationError(
                "Debe ingresar al menos un criterio de búsqueda (Factura, Guía o Remisión)."
            )
        
        return cleaned_data

class GuiaSearchForm(forms.Form):
    numero_guia = forms.CharField(
        label="Número de Guía", 
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Buscar por número de guía...',
            'id': 'id_numero_guia'  # <-- Cambia el id aquí para coincidir con el JS
        })
    )

@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def relacion_facturas_remision_guia(request):
    today = timezone.now().date()
    form = ReportesAsociadosForm(request.GET or None)
    facturas_vencidas = []
    total_a_pagar = Decimal('0.00')
    
    # Inicializa las variables de contexto con valores predeterminados
    criterio_busqueda = None
    
    if form.is_valid():
        factura = form.cleaned_data.get('factura')
        numero_guia = form.cleaned_data.get('numero_guia')
        remision = form.cleaned_data.get('remision')
        
        # Base query
        reportes = ReporteCalidadExportador.objects.all().select_related(
            'venta_nacional__compra_nacional__fruta',
            'venta_nacional__compra_nacional__proveedor',
            'venta_nacional__exportador'
        )
        
        # Lista para almacenar facturas encontradas
        facturas_encontradas = set()
        
        # Aplicar filtros según los criterios proporcionados
        if factura:
            reportes = reportes.filter(factura=factura)
            criterio_busqueda = f"Factura: {factura}"
            facturas_encontradas.add(factura)
            
        if numero_guia:
            # Primero buscamos los reportes que cumplen este criterio
            reportes_guia = reportes.filter(venta_nacional__compra_nacional__numero_guia=numero_guia)
            criterio_busqueda = f"Guía: {numero_guia}"
            
            # Si alguno de estos reportes tiene factura, incluimos todas las entradas con esa factura
            for reporte in reportes_guia:
                if reporte.factura:
                    facturas_encontradas.add(reporte.factura)
            
            # Si encontramos facturas asociadas, actualizamos la búsqueda
            if facturas_encontradas:
                reportes = reportes.filter(factura__in=facturas_encontradas)
            else:
                reportes = reportes_guia
            
        if remision:
            # Similar al número de guía
            reportes_remision = reportes.filter(remision_exp=remision)
            criterio_busqueda = f"Remisión/Reporte: {remision}"
            
            # Si alguno de estos reportes tiene factura, incluimos todas las entradas con esa factura
            for reporte in reportes_remision:
                if reporte.factura:
                    facturas_encontradas.add(reporte.factura)
            
            # Si encontramos facturas asociadas, actualizamos la búsqueda
            if facturas_encontradas and not numero_guia:  # Solo si no ya buscamos por guía
                reportes = reportes.filter(factura__in=facturas_encontradas)
            elif not facturas_encontradas and not numero_guia:  # Si no hay facturas asociadas y no buscamos por guía
                reportes = reportes_remision
        
        # Agrupar por factura
        facturas_agrupadas = {}
        for reporte in reportes:
            # Calcular valores requeridos
            valor_exp = reporte.precio_venta_kg_exp * reporte.kg_exportacion
            valor_nal = reporte.precio_venta_kg_nal * reporte.kg_nacional
            
            # Ya no necesitamos calcular días vencidos
            
            if reporte.factura not in facturas_agrupadas:
                facturas_agrupadas[reporte.factura or 'Sin Factura'] = {
                    'factura': reporte.factura or 'Sin Factura',
                    'fecha_factura': reporte.fecha_factura,
                    'vencimiento_factura': reporte.vencimiento_factura,
                    'exportador': reporte.venta_nacional.exportador,
                    'items': [],
                    'subtotal': Decimal('0.00')
                }
                
            facturas_agrupadas[reporte.factura or 'Sin Factura']['items'].append({
                'remision_exp': reporte.remision_exp,
                'numero_guia': reporte.venta_nacional.compra_nacional.numero_guia,
                'fecha_reporte': reporte.fecha_reporte,
                'fruta': reporte.venta_nacional.compra_nacional.fruta,
                'valor_exp': valor_exp,
                'valor_nal': valor_nal,
                'precio_total': reporte.precio_total,
                'id': reporte.pk
            })
            
            facturas_agrupadas[reporte.factura or 'Sin Factura']['subtotal'] += reporte.precio_total
            total_a_pagar += reporte.precio_total
            
        facturas_vencidas = list(facturas_agrupadas.values())
    
    context = {
        'form': form,
        'facturas_vencidas': facturas_vencidas,
        'total_a_pagar': total_a_pagar,
        'fecha_actual': today,
        'criterio_busqueda': criterio_busqueda
    }
    
    return render(request, 'relacion_facturas_remision_guia.html', context)

@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
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


@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def reporte_individual_proveedor(request):
    form = GuiaSearchForm(request.GET or None)
    reporte_proveedor = None
    reporte_exportador = None
    venta = None
    compra = None
    proveedor = None
    today = timezone.now().date()
    
    if form.is_valid():
        numero_guia = form.cleaned_data['numero_guia']
        
        try:
            # Buscar la compra nacional por número de guía
            compra = CompraNacional.objects.get(numero_guia=numero_guia)
            ventas = VentaNacional.objects.filter(compra_nacional=compra)
            
            reportes_proveedor_list = []
            for v in ventas:
                rep_exp = ReporteCalidadExportador.objects.select_related(
                    'venta_nacional__compra_nacional'
                ).filter(venta_nacional=v).first()
                if rep_exp:
                    try:
                        rep_prov = ReporteCalidadProveedor.objects.select_related(
                            'rep_cal_exp__venta_nacional__compra_nacional'
                        ).get(rep_cal_exp=rep_exp)
                        reportes_proveedor_list.append(rep_prov)
                    except ReporteCalidadProveedor.DoesNotExist:
                        pass
            
            if reportes_proveedor_list:
                first_reporte = reportes_proveedor_list[0]
                
                # Helper: get effective prices (fallback for stale p_precio_kg_nal)
                def get_effective_precio_exp(r):
                    if r.p_precio_kg_exp and r.p_precio_kg_exp > 0:
                        return Decimal(str(r.p_precio_kg_exp))
                    return Decimal(str(r.rep_cal_exp.venta_nacional.compra_nacional.precio_compra_exp or 0))
                
                def get_effective_precio_nal(r):
                    if r.p_precio_kg_nal and r.p_precio_kg_nal > 0:
                        return Decimal(str(r.p_precio_kg_nal))
                    return Decimal(str(r.rep_cal_exp.precio_venta_kg_nal or 0))
                
                # Consolidate kg
                total_kg = sum(Decimal(str(r.p_kg_totales or 0)) for r in reportes_proveedor_list)
                total_kg_exp = sum(Decimal(str(r.p_kg_exportacion or 0)) for r in reportes_proveedor_list)
                total_kg_nal = sum(Decimal(str(r.p_kg_nacional or 0)) for r in reportes_proveedor_list)
                total_kg_merma = sum(Decimal(str(r.p_kg_merma or 0)) for r in reportes_proveedor_list)
                
                # Compute total values using effective (corrected) prices
                total_valor_exp = sum(
                    Decimal(str(r.p_kg_exportacion or 0)) * get_effective_precio_exp(r)
                    for r in reportes_proveedor_list
                )
                total_valor_nal = sum(
                    Decimal(str(r.p_kg_nacional or 0)) * get_effective_precio_nal(r)
                    for r in reportes_proveedor_list
                )
                
                # Recalculate total_facturar from corrected values
                total_facturar = total_valor_exp + total_valor_nal
                
                # Recalculate retenciones based on corrected total_facturar
                prov = compra.proveedor
                if prov.asohofrucol:
                    total_asohofrucol = (total_facturar * Decimal('1.00') / Decimal('100.00')).quantize(Decimal('0.01'))
                else:
                    total_asohofrucol = Decimal('0')
                
                if prov.rte_fte:
                    total_rte_fte = (total_facturar * Decimal('1.50') / Decimal('100.00')).quantize(Decimal('0.01'))
                else:
                    total_rte_fte = Decimal('0')
                
                if prov.rte_ica:
                    total_rte_ica = (total_facturar * Decimal('4.14') / Decimal('1000.00')).quantize(Decimal('0.01'))
                else:
                    total_rte_ica = Decimal('0')
                
                total_pagar = total_facturar - total_asohofrucol - total_rte_fte - total_rte_ica
                
                if total_kg > 0:
                    porc_exp = (total_kg_exp / total_kg * 100).quantize(Decimal('0.01'))
                    porc_nal = (total_kg_nal / total_kg * 100).quantize(Decimal('0.01'))
                    porc_merma = (total_kg_merma / total_kg * 100).quantize(Decimal('0.01'))
                else:
                    porc_exp = porc_nal = porc_merma = Decimal('0')

                if total_kg_exp > 0:
                    precio_kg_exp = total_valor_exp / total_kg_exp
                else:
                    precio_kg_exp = get_effective_precio_exp(first_reporte)
                    
                if total_kg_nal > 0:
                    precio_kg_nal = total_valor_nal / total_kg_nal
                else:
                    precio_kg_nal = get_effective_precio_nal(first_reporte)
                
                # Create mock object for the template
                reporte_proveedor = ReporteCalidadProveedor()
                reporte_proveedor.pk = first_reporte.pk
                reporte_proveedor.p_kg_totales = total_kg
                reporte_proveedor.p_kg_exportacion = total_kg_exp
                reporte_proveedor.p_porcentaje_exportacion = porc_exp
                reporte_proveedor.p_precio_kg_exp = precio_kg_exp
                reporte_proveedor.p_kg_nacional = total_kg_nal
                reporte_proveedor.p_porcentaje_nacional = porc_nal
                reporte_proveedor.p_precio_kg_nal = precio_kg_nal
                reporte_proveedor.p_kg_merma = total_kg_merma
                reporte_proveedor.p_porcentaje_merma = porc_merma
                reporte_proveedor.p_total_facturar = total_facturar
                reporte_proveedor.asohofrucol = total_asohofrucol
                reporte_proveedor.rte_fte = total_rte_fte
                reporte_proveedor.rte_ica = total_rte_ica
                reporte_proveedor.p_total_pagar = total_pagar
                
                reporte_exportador = ReporteCalidadExportador.objects.filter(venta_nacional=ventas.first()).first()
                venta = ventas.first()
                proveedor = compra.proveedor
        
        except CompraNacional.DoesNotExist:
            pass
    
    context = {
        'form': form,
        'reporte_proveedor': reporte_proveedor,
        'reporte_exportador': reporte_exportador,
        'venta': venta,
        'compra': compra,
        'proveedor': proveedor,
        'today': today,
        'total_en_letras': reporte_proveedor.p_total_pagar if reporte_proveedor else 0,
        'search_submitted': form.is_valid(),  # Indica si se ha enviado una búsqueda
    }
    
    return render(request, 'reporte_inidivual_nacionales.html', context)


@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
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
    total_kilos_brutos = Decimal('0')
    total_kilos_netos = Decimal('0')
    total_utilidades = Decimal('0')
    total_utilidades_sin_ajuste = Decimal('0')
    total_reportes_pendientes = 0

    # Valores del período anterior
    if not compras_periodo_anterior.exists():
        compras_prev = Decimal('0')
        kilos_brutos_prev = Decimal('0')
        kilos_netos_prev = Decimal('0')
        utilidades_prev = Decimal('0')
        utilidades_sin_ajuste_prev = Decimal('0')
        reportes_pendientes_prev = 0
    else:
        compras_prev = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras_periodo_anterior
        ).aggregate(total=Sum('p_total_pagar'))['total'] or Decimal('0')

        kilos_brutos_prev = VentaNacional.objects.filter(
            compra_nacional__in=compras_periodo_anterior
        ).aggregate(total=Sum('peso_bruto_recibido'))['total'] or Decimal('0')

        kilos_netos_prev = VentaNacional.objects.filter(
            compra_nacional__in=compras_periodo_anterior
        ).aggregate(total=Sum('peso_neto_recibido'))['total'] or Decimal('0')

        utilidades_prev = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras_periodo_anterior
        ).aggregate(total=Sum('p_utilidad'))['total'] or Decimal('0')

        utilidades_sin_ajuste_prev = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras_periodo_anterior
        ).aggregate(total=Sum('p_utilidad_sin_ajuste'))['total'] or Decimal('0')

        reportes_pendientes_prev = 0
        for compra in compras_periodo_anterior:
            ventas = compra.ventas.all()
            tiene_venta = ventas.exists()
            tiene_reporte_exp = False
            tiene_reporte_prov = False

            if tiene_venta:
                venta = ventas.first()
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
            ventas = compra.ventas.all()
            tiene_venta = ventas.exists()
            tiene_reporte_exp = False
            tiene_reporte_prov = False

            if tiene_venta:
                venta = ventas.first()
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
        ).aggregate(total=Sum('p_total_pagar'))['total'] or Decimal('0')
        total_compras_valor += valor_total_compras

        total_pagado_proveedor = TransferenciasProveedor.objects.filter(
            proveedor=proveedor,
            fecha_transferencia__gte=fecha_inicio,
            fecha_transferencia__lte=fecha_fin,
        ).aggregate(total=Sum('valor_transferencia'))['total'] or Decimal('0')

        total_facturado_exportadores = ReporteCalidadExportador.objects.filter(
            venta_nacional__compra_nacional__in=compras
        ).aggregate(total=Sum('precio_total'))['total'] or Decimal('0')

        total_kilos_brutos_proveedor = VentaNacional.objects.filter(
            compra_nacional__in=compras
        ).aggregate(total=Sum('peso_bruto_recibido'))['total'] or Decimal('0')
        total_kilos_brutos += total_kilos_brutos_proveedor

        total_kilos_netos_proveedor = VentaNacional.objects.filter(
            compra_nacional__in=compras
        ).aggregate(total=Sum('peso_neto_recibido'))['total'] or Decimal('0')
        total_kilos_netos += total_kilos_netos_proveedor

        total_utilidad = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras
        ).aggregate(total=Sum('p_utilidad'))['total'] or Decimal('0')
        total_utilidades += total_utilidad

        total_utilidad_sin_ajuste = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras
        ).aggregate(total=Sum('p_utilidad_sin_ajuste'))['total'] or Decimal('0')
        total_utilidades_sin_ajuste += total_utilidad_sin_ajuste

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
            'total_kilos_brutos': total_kilos_brutos_proveedor,
            'total_kilos_netos': total_kilos_netos_proveedor,
            'total_utilidades': total_utilidad,
            'total_utilidades_sin_ajuste': total_utilidad_sin_ajuste,
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
    
    # Calcular totales primero
    totales = reportes_calidad.aggregate(
        kg_exportacion=Sum('kg_exportacion'),
        kg_nacional=Sum('kg_nacional'),
        kg_merma=Sum('kg_merma'),
        kg_totales=Sum('kg_totales')
    )
    
    # Calcular promedios ponderados
    if totales['kg_totales'] and totales['kg_totales'] > 0:
        porcentaje_exportacion = (totales['kg_exportacion'] / totales['kg_totales'] * 100).quantize(Decimal('0.01'))
        porcentaje_nacional = (totales['kg_nacional'] / totales['kg_totales'] * 100).quantize(Decimal('0.01'))
        porcentaje_merma = (totales['kg_merma'] / totales['kg_totales'] * 100).quantize(Decimal('0.01'))
    else:
        porcentaje_exportacion = Decimal('0')
        porcentaje_nacional = Decimal('0')
        porcentaje_merma = Decimal('0')
    
    kg_exportacion = totales['kg_exportacion'] or 0
    kg_nacional = totales['kg_nacional'] or 0
    kg_merma = totales['kg_merma'] or 0


    for item in proveedores_data:
        if total_utilidades < 0:
            item['percent_kilos'] = (item['total_kilos_brutos'] / total_kilos_brutos * 100) if total_kilos_brutos else 0
            item['percent_utilidad'] = ((item['total_utilidades'] / total_utilidades * 100) * - 1) if total_utilidades else 0
            item['percent_utilidad_facturado'] = (item['total_utilidades'] / item['valor_total_compras'] * 100) if item['valor_total_compras'] else 0
        else:
            item['percent_kilos'] = (item['total_kilos_brutos'] / total_kilos_brutos * 100) if total_kilos_brutos else 0
            item['percent_utilidad'] = (item['total_utilidades'] / total_utilidades * 100) if total_utilidades else 0
            item['percent_utilidad_facturado'] = (item['total_utilidades'] / item['valor_total_compras'] * 100) if item['valor_total_compras'] else 0

    # Calcular porcentajes comparativos
    if compras_prev:
        compras_percent = ((total_compras_valor - compras_prev) / compras_prev * 100)
    else:
        compras_percent = 0

    if kilos_brutos_prev:
        kilos_brutos_percent = ((total_kilos_brutos - kilos_brutos_prev) / kilos_brutos_prev * 100)
    else:
        kilos_brutos_percent = 0

    if kilos_netos_prev:
        kilos_netos_percent = ((total_kilos_netos - kilos_netos_prev) / kilos_netos_prev * 100)
    else:
        kilos_netos_percent = 0

    if utilidades_prev:
        utilidades_percent = ((total_utilidades - utilidades_prev) / utilidades_prev * 100)
    else:
        utilidades_percent = 0

    if utilidades_sin_ajuste_prev:
        utilidades_sin_ajuste_percent = ((total_utilidades_sin_ajuste - utilidades_sin_ajuste_prev) / utilidades_sin_ajuste_prev * 100)
    else:
        utilidades_sin_ajuste_percent = 0

    if reportes_pendientes_prev:
        reportes_percent = ((total_reportes_pendientes - reportes_pendientes_prev) / reportes_pendientes_prev * 100)
    else:
        reportes_percent = 0

    # Generar datos para evolución mensual de calidad por proveedor
    evolucion_calidad_meses = []
    current_date = fecha_inicio.replace(day=1)
    
    # Generar lista de meses entre las fechas seleccionadas
    while current_date <= fecha_fin:
        evolucion_calidad_meses.append(current_date.strftime('%Y-%m'))
        # Avanzar al siguiente mes
        if current_date.month == 12:
            current_date = current_date.replace(year=current_date.year + 1, month=1)
        else:
            current_date = current_date.replace(month=current_date.month + 1)
    
    # Datos de evolución por proveedor - Simplificado para mostrar solo exportación
    evolucion_proveedores = []
    
    for proveedor in proveedores:
        datos_proveedor = {
            'proveedor': proveedor.nombre,
            'exportacion': []
        }
        
        for mes_str in evolucion_calidad_meses:
            año, mes = mes_str.split('-')
            mes_inicio = datetime.date(int(año), int(mes), 1)
            
            # Calcular final del mes
            if int(mes) == 12:
                mes_fin = datetime.date(int(año) + 1, 1, 1) - datetime.timedelta(days=1)
            else:
                mes_fin = datetime.date(int(año), int(mes) + 1, 1) - datetime.timedelta(days=1)
            
            # Limitar al rango de fechas del filtro
            if mes_fin > fecha_fin:
                mes_fin = fecha_fin
            
            # Reportes para este proveedor en este mes
            reportes_mes = ReporteCalidadExportador.objects.filter(
                venta_nacional__compra_nacional__proveedor=proveedor,
                fecha_reporte__gte=mes_inicio,
                fecha_reporte__lte=mes_fin
            )
            
            if fruta_id:
                reportes_mes = reportes_mes.filter(venta_nacional__compra_nacional__fruta_id=fruta_id)
            
            # Solo obtenemos el promedio de exportación
            prom_exp = reportes_mes.aggregate(prom_exp=Avg('porcentaje_exportacion'))['prom_exp'] or 0
            
            # Convertir a float para asegurar que es serializable a JSON
            datos_proveedor['exportacion'].append(float(round(prom_exp, 2)))
        
        evolucion_proveedores.append(datos_proveedor)
    
    context = {
        'proveedores_data': proveedores_data,
        'global_total_compras': total_compras_valor,
        'global_total_kilos_brutos': total_kilos_brutos,
        'global_total_kilos_netos': total_kilos_netos,
        'global_total_utilidades': total_utilidades,
        'global_total_utilidades_sin_ajuste': total_utilidades_sin_ajuste,
        'global_total_reportes': total_reportes_pendientes,
        'proveedores': ProveedorNacional.objects.all(),
        'frutas': Fruta.objects.all(),
        'fecha_inicio': fecha_inicio,
        'fecha_fin': fecha_fin,
        'proveedor_id': proveedor_id,
        'fruta_id': fruta_id,
        'compras_prev': compras_prev,
        'kilos_brutos_prev': kilos_brutos_prev,
        'kilos_netos_prev': kilos_netos_prev,
        'utilidades_prev': utilidades_prev,
        'utilidades_sin_ajuste_prev': utilidades_sin_ajuste_prev,
        'reportes_prev': reportes_pendientes_prev,
        'compras_percent': round(compras_percent, 2),
        'kilos_brutos_percent': round(kilos_brutos_percent, 2),
        'kilos_netos_percent': round(kilos_netos_percent, 2),
        'utilidades_percent': round(utilidades_percent, 2),
        'utilidades_sin_ajuste_percent': round(utilidades_sin_ajuste_percent, 2),
        'reportes_percent': round(reportes_percent, 2),
        # Datos adicionales para nuevos gráficos
        'utilidades_frutas': utilidades_frutas,
        'kg_exportacion': kg_exportacion,
        'kg_nacional': kg_nacional,
        'kg_merma': kg_merma,
        'porcentaje_exportacion': porcentaje_exportacion,
        'porcentaje_nacional': porcentaje_nacional,
        'porcentaje_merma': porcentaje_merma,
        'evolucion_calidad_meses': evolucion_calidad_meses,
        'evolucion_proveedores': evolucion_proveedores,
    }

    return render(request, 'dashboard_nacionales.html', context)


@require_GET
@login_required
def autocomplete_guia(request):
    term = request.GET.get('term', '')
    guias = CompraNacional.objects.filter(numero_guia__icontains=term).values_list('numero_guia', flat=True).distinct()[:10]
    results = list(guias)
    return JsonResponse(results, safe=False)

@require_GET
@login_required
def autocomplete_factura(request):
    term = request.GET.get('term', '')
    facturas = ReporteCalidadExportador.objects.filter(factura__icontains=term).exclude(factura__isnull=True).values_list('factura', flat=True).distinct()[:10]
    results = list(facturas)
    return JsonResponse(results, safe=False)

@require_GET
@login_required
def autocomplete_remision(request):
    term = request.GET.get('term', '')
    remisiones = ReporteCalidadExportador.objects.filter(remision_exp__icontains=term).exclude(remision_exp__isnull=True).values_list('remision_exp', flat=True).distinct()[:10]
    results = list(remisiones)
    return JsonResponse(results, safe=False)
