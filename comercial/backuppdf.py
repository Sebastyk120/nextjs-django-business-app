import math
import json
import io
from decimal import Decimal

from django.contrib import messages
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views import View
from django.views.generic import TemplateView

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

from .models import (
    Cliente, Aerolinea, Iata, ClientePresentacion,
    CostoPresentacionCliente, CostosEstibado, TarifaAerea,
    CostosUnicosEmbarque, ListaPreciosFrutaExportador, Contenedor,
    CotizacionConjuntaHistorico
)


class HistorialCotizacionPDFView(View):
    """Genera un PDF profesional para una cotización histórica."""
    
    def get(self, request, historico_id):
        historico = get_object_or_404(CotizacionConjuntaHistorico, id=historico_id)
        
        # Crear el buffer para el PDF
        buffer = io.BytesIO()
        
        # Crear el documento
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        
        # Estilos
        styles = getSampleStyleSheet()
        
        # Estilos personalizados
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1a365d'),
            spaceAfter=6,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#4a5568'),
            spaceAfter=20,
            alignment=TA_CENTER
        )
        
        section_header_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontSize=12,
            textColor=colors.HexColor('#2d3748'),
            spaceBefore=15,
            spaceAfter=8,
            fontName='Helvetica-Bold',
            borderColor=colors.HexColor('#4299e1'),
            borderWidth=0,
            borderPadding=5,
            backColor=colors.HexColor('#ebf8ff')
        )
        
        subsection_style = ParagraphStyle(
            'SubsectionHeader',
            parent=styles['Heading3'],
            fontSize=10,
            textColor=colors.HexColor('#2b6cb0'),
            spaceBefore=10,
            spaceAfter=5,
            fontName='Helvetica-Bold'
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#2d3748')
        )
        
        formula_style = ParagraphStyle(
            'Formula',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#718096'),
            leftIndent=20,
            fontName='Courier'
        )
        
        # Elementos del documento
        elements = []
        
        # Helper para formatear moneda
        def fmt_money(val, decimals=2):
            if val is None:
                return '-'
            try:
                return f"${float(val):,.{decimals}f}"
            except:
                return str(val)
        
        def fmt_number(val, decimals=2):
            if val is None:
                return '-'
            try:
                return f"{float(val):,.{decimals}f}"
            except:
                return str(val)
        
        # ============================================================================
        # CABECERA
        # ============================================================================
        elements.append(Paragraph("INFORME DETALLADO DE COTIZACIÓN", title_style))
        elements.append(Paragraph(
            f"Cotización {historico.numero_cotizacion} | {historico.fecha_aprobacion.strftime('%d/%m/%Y %H:%M')}",
            subtitle_style
        ))
        
        # Información general
        cabecera = historico.cabecera_snapshot or {}
        info_data = [
            ['Cliente:', cabecera.get('cliente', 'N/A'), 'Tipo:', historico.tipo_negociacion],
            ['Aerolínea:', cabecera.get('aerolinea', 'N/A'), 'TRM:', fmt_money(historico.trm)],
            ['Destino:', f"{cabecera.get('destino_codigo', '')} - {cabecera.get('destino_ciudad', '')} - {cabecera.get('destino_pais', '')}", 
             'Utilidad General:', f"{fmt_number(historico.utilidad_general_pct)}%"],
            ['Total Cajas:', str(historico.total_cajas), 
             'Distribución:', f"H: {fmt_number(historico.heavens_pct)}% | E: {fmt_number(historico.exportador_pct)}%"],
        ]
        
        info_table = Table(info_data, colWidths=[1.2*inch, 2.5*inch, 1.2*inch, 2.5*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#4a5568')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#4a5568')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1a202c')),
            ('TEXTCOLOR', (3, 0), (3, -1), colors.HexColor('#1a202c')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f7fafc')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor('#e2e8f0')),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 20))
        
        # ============================================================================
        # COSTOS GLOBALES
        # ============================================================================
        costos_globales = historico.costos_globales_snapshot or {}
        
        elements.append(Paragraph("1. COSTOS GLOBALES DE EMBARQUE", section_header_style))
        
        # Costos de embarque
        costos_embarque = costos_globales.get('costos_embarque', {})
        if costos_embarque:
            elements.append(Paragraph("1.1 Costos Base FOB (en COP)", subsection_style))
            
            embarque_data = [
                ['Concepto', 'Valor COP', 'Valor/Caja COP', 'Valor/Caja USD'],
            ]
            
            total_cajas = historico.total_cajas or 1
            trm = float(historico.trm) if historico.trm else 1
            
            costos_fob_items = [
                ('Transporte Aeropuerto', costos_embarque.get('transporte_aeropuerto', 0)),
                ('Termoregistro', costos_embarque.get('termo', 0)),
                ('Precinto', costos_embarque.get('precinto', 0)),
                ('Aduana', costos_embarque.get('aduana', 0)),
                ('Comisión Bancaria', costos_embarque.get('comision_bancaria', 0)),
            ]
            
            total_fob_cop = 0
            for nombre, valor in costos_fob_items:
                valor = float(valor or 0)
                total_fob_cop += valor
                por_caja_cop = valor / total_cajas
                por_caja_usd = por_caja_cop / trm
                embarque_data.append([
                    nombre,
                    fmt_money(valor),
                    fmt_money(por_caja_cop),
                    fmt_money(por_caja_usd, 4)
                ])
            
            # Total
            embarque_data.append([
                'TOTAL COSTOS FOB',
                fmt_money(total_fob_cop),
                fmt_money(total_fob_cop / total_cajas),
                fmt_money(total_fob_cop / total_cajas / trm, 4)
            ])
            
            embarque_table = Table(embarque_data, colWidths=[2.2*inch, 1.5*inch, 1.5*inch, 1.5*inch])
            embarque_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4299e1')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#bee3f8')),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(embarque_table)
            elements.append(Spacer(1, 10))
            
            # Costos CIF
            elements.append(Paragraph("1.2 Costos CIF Adicionales (en USD)", subsection_style))
            
            cif_data = [
                ['Concepto', 'Total USD', 'Por Caja USD'],
            ]
            
            costos_cif_items = [
                ('Due Agent', costos_embarque.get('due_agent_usd', 0)),
                ('Due Carrier', costos_embarque.get('due_carrier_usd', 0)),
                ('Fito', costos_embarque.get('fito_usd', 0)),
                ('Certificado Origen', costos_embarque.get('certificado_origen_usd', 0)),
            ]
            
            total_cif_usd = 0
            for nombre, valor in costos_cif_items:
                valor = float(valor or 0)
                total_cif_usd += valor
                cif_data.append([nombre, fmt_money(valor), fmt_money(valor / total_cajas, 4)])
            
            cif_data.append(['TOTAL CIF', fmt_money(total_cif_usd), fmt_money(total_cif_usd / total_cajas, 4)])
            
            cif_table = Table(cif_data, colWidths=[2.2*inch, 2*inch, 2*inch])
            cif_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#38a169')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#c6f6d5')),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(cif_table)
        
        # Costos de estibado
        costos_estibado = costos_globales.get('costos_estibado', {})
        if costos_estibado:
            elements.append(Spacer(1, 10))
            elements.append(Paragraph("1.3 Costos de Estibado", subsection_style))
            
            estibado_data = [
                ['Concepto', 'Valor COP'],
            ]
            
            estibado_items = [
                ('Estiba', costos_estibado.get('estiba', 0)),
                ('Malla Tela', costos_estibado.get('malla_tela', 0)),
                ('Malla Térmica', costos_estibado.get('malla_termica', 0)),
                ('Esquineros/Zuncho', costos_estibado.get('esquineros_zuncho', 0)),
                ('Entrega', costos_estibado.get('entrega', 0)),
            ]
            
            for nombre, valor in estibado_items:
                estibado_data.append([nombre, fmt_money(float(valor or 0))])
            
            estibado_data.append(['TOTAL POR PALLET', fmt_money(float(costos_estibado.get('costo_total', 0)))])
            
            estibado_table = Table(estibado_data, colWidths=[3*inch, 2*inch])
            estibado_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#805ad5')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e9d8fd')),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(estibado_table)
            
            # Estibado por caja
            estibado_caja = float(costos_globales.get('estibado_por_caja_usd_global', 0))
            elements.append(Paragraph(
                f"→ Estibado prorrateado por caja: ${estibado_caja:.4f} USD ({historico.total_pallets} pallets / {total_cajas} cajas)",
                formula_style
            ))
        
        # Tarifa aérea
        tarifa_aerea = costos_globales.get('tarifa_aerea', {})
        if tarifa_aerea:
            elements.append(Spacer(1, 10))
            elements.append(Paragraph("1.4 Tarifa Aérea Activa", subsection_style))
            
            tarifa_data = [
                ['Aerolínea', tarifa_aerea.get('aerolinea', 'N/A')],
                ['Destino', f"{tarifa_aerea.get('destino_codigo', '')} - {tarifa_aerea.get('destino_ciudad', '')} ({tarifa_aerea.get('destino_pais', '')})"],
                ['Tarifa por Kg', f"${tarifa_aerea.get('tarifa_por_kilo', 0):.2f} USD/Kg"],
            ]
            
            tarifa_table = Table(tarifa_data, colWidths=[2*inch, 4*inch])
            tarifa_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#4a5568')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fefcbf')),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#d69e2e')),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(tarifa_table)
        
        # ============================================================================
        # ITEMS DETALLADOS
        # ============================================================================
        elements.append(PageBreak())
        elements.append(Paragraph("2. DETALLE DE PRODUCTOS", section_header_style))
        
        items = historico.items_snapshot or []
        
        for idx, item in enumerate(items, 1):
            meta = item.get('meta', {})
            breakdown = item.get('breakdown', {})
            fruta_snap = item.get('fruta_snapshot', {})
            ref_snap = item.get('referencia_snapshot', {})
            config_snap = item.get('config_snapshot', {})
            
            # Header del producto
            product_title = f"2.{idx} {meta.get('fruta', 'N/A')} - {meta.get('presentacion', 'N/A')}"
            if meta.get('exportador'):
                product_title += f" ({meta.get('exportador')})"
            
            product_elements = []
            product_elements.append(Paragraph(product_title, subsection_style))
            
            # Info básica del producto
            cajas = item.get('cajas', 0)
            kilos_neto = float(meta.get('kilos_neto', 0))
            kilos_fob = float(item.get('kilos_fob', 0))
            kilos_cif = float(item.get('kilos_cif', 0))
            precio_kilo_fruta = float(fruta_snap.get('precio_kilo', 0))
            precio_ref = float(ref_snap.get('precio', 0))
            mano_obra_cop = float(config_snap.get('mano_obra_cop', 0))
            deshidratacion_pct = float(config_snap.get('deshidratacion_pct', 0))
            
            product_info = [
                ['Cajas:', str(cajas), 'Kg Neto/Caja:', f"{kilos_neto:.2f} kg"],
                ['Pallets:', str(item.get('pallets_item', 0)), 'Kg FOB/Caja:', f"{kilos_fob:.4f} kg"],
                ['Contenedor:', 'Sí' if item.get('use_contenedor') else 'No', 'Kg CIF/Caja:', f"{kilos_cif:.4f} kg"],
            ]
            
            product_table = Table(product_info, colWidths=[1*inch, 1.5*inch, 1.2*inch, 1.5*inch])
            product_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#718096')),
                ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#718096')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ]))
            product_elements.append(product_table)
            product_elements.append(Spacer(1, 5))
            
            # Datos de referencia/fruta
            product_elements.append(Paragraph("Datos Base:", normal_style))
            base_data = [
                ['Precio Fruta:', f"${precio_kilo_fruta:,.0f} COP/kg", 'Precio Caja:', f"${precio_ref:,.0f} COP"],
                ['Mano Obra:', f"${mano_obra_cop:,.0f} COP/kg", 'Deshidratación:', f"{deshidratacion_pct}%"],
            ]
            base_table = Table(base_data, colWidths=[1.2*inch, 1.8*inch, 1.2*inch, 1.8*inch])
            base_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 7),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff5f5')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ]))
            product_elements.append(base_table)
            product_elements.append(Spacer(1, 5))
            
            # Insumos utilizados
            insumos_snapshot = item.get('insumos_snapshot', [])
            if insumos_snapshot:
                product_elements.append(Paragraph("Insumos Utilizados:", normal_style))
                
                insumos_data = [
                    ['Insumo', 'Cantidad', 'Precio Unit. (COP)', 'Costo Total (COP)'],
                ]
                
                total_insumos_cop = 0
                for insumo in insumos_snapshot:
                    insumo_nombre = insumo.get('insumo_nombre', 'N/A')
                    cantidad = float(insumo.get('cantidad', 0))
                    precio_unitario = float(insumo.get('insumo_precio', 0))
                    costo_total_insumo = float(insumo.get('costo_total', 0))
                    total_insumos_cop += costo_total_insumo
                    
                    insumos_data.append([
                        insumo_nombre,
                        fmt_number(cantidad, 2),
                        fmt_money(precio_unitario),
                        fmt_money(costo_total_insumo)
                    ])
                
                # Fila de total
                insumos_data.append([
                    'TOTAL INSUMOS', '', '', fmt_money(total_insumos_cop)
                ])
                
                insumos_table = Table(insumos_data, colWidths=[2.2*inch, 1.2*inch, 1.5*inch, 1.5*inch])
                insumos_table.setStyle(TableStyle([
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 7),
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ed8936')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#feebc8')),
                    ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
                    ('TOPPADDING', (0, 0), (-1, -1), 3),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ]))
                product_elements.append(insumos_table)
                product_elements.append(Spacer(1, 5))
            
            # Desglose de costos con FORMULAS EXPLICITAS
            product_elements.append(Paragraph("Desglose de Costos por Caja:", normal_style))
            
            insumos_usd = float(breakdown.get('insumos_usd', 0))
            fruta_usd = float(breakdown.get('fruta_usd', 0))
            ref_usd = float(breakdown.get('referencia_usd', 0))
            cont_usd = float(breakdown.get('contenedor_usd', 0))
            mo_usd = float(breakdown.get('mano_obra_usd', 0))
            emb_usd = float(breakdown.get('costos_embarque_base_usd', 0))
            est_usd = float(breakdown.get('estibado_usd', 0))
            
            # Calcular valores COP para mostrar fórmulas explícitas
            insumos_cop = insumos_usd * trm
            fruta_cop = kilos_neto * precio_kilo_fruta
            mo_cop = mano_obra_cop * kilos_neto
            
            costs_data = [
                ['Concepto', 'COP', 'USD', 'Cálculo'],
                ['Insumos', fmt_money(insumos_cop), fmt_money(insumos_usd, 4), f'${insumos_cop:,.0f} / {trm:,.0f}'],
                ['Fruta', fmt_money(fruta_cop), fmt_money(fruta_usd, 4), f'{kilos_neto}kg × ${precio_kilo_fruta:,.0f}/kg / TRM'],
                ['Referencia', fmt_money(precio_ref), fmt_money(ref_usd, 4), f'${precio_ref:,.0f} / {trm:,.0f}'],
                ['Contenedor', '-', fmt_money(cont_usd, 4), 'Prorrateado si aplica'],
                ['Mano Obra', fmt_money(mo_cop), fmt_money(mo_usd, 4), f'${mano_obra_cop:,.0f}/kg × {kilos_neto}kg / TRM'],
                ['Embarque', '-', fmt_money(emb_usd, 4), 'Total embarque / cajas / TRM'],
                ['Estibado', '-', fmt_money(est_usd, 4), f'({historico.total_pallets} pallets × costo) / {total_cajas} cajas'],
            ]
            
            # Calcular FOB
            fob_box = float(item.get('fob_box', 0))
            costs_data.append(['= COSTO FOB', '', fmt_money(fob_box, 4), 'Suma de todos los costos'])
            
            # Agregar costos CIF si aplica
            if historico.tipo_negociacion == 'CIF':
                cif_usd = float(breakdown.get('costos_cif_usd', 0))
                tarifa_usd = float(breakdown.get('tarifa_aerea_usd', 0))
                tarifa_kg = float(tarifa_aerea.get('tarifa_por_kilo', 0)) if tarifa_aerea else 0
                costs_data.append(['+ Costos CIF', '', fmt_money(cif_usd, 4), 'Due + Carrier + Fito + CO'])
                costs_data.append(['+ Tarifa Aérea', '', fmt_money(tarifa_usd, 4), f'{kilos_cif:.2f}kg × ${tarifa_kg:.2f}/kg'])
                cif_box = float(item.get('cif_box', 0) or 0)
                costs_data.append(['= COSTO CIF', '', fmt_money(cif_box, 4), 'FOB + CIF + Tarifa'])
            
            costs_table = Table(costs_data, colWidths=[1.3*inch, 1.2*inch, 1*inch, 2.5*inch])
            costs_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 8), (0, -1), 'Helvetica-Bold'),  # Totals
                ('FONTSIZE', (0, 0), (-1, -1), 7),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('TEXTCOLOR', (3, 1), (3, -1), colors.HexColor('#718096')),
                ('ALIGN', (1, 0), (2, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                # Highlight FOB row
                ('BACKGROUND', (0, 8), (-1, 8), colors.HexColor('#edf2f7')),
            ]))
            product_elements.append(costs_table)
            product_elements.append(Spacer(1, 8))
            
            # Precio de venta y utilidad
            product_elements.append(Paragraph("Cálculo de Precio de Venta y Utilidad:", normal_style))
            
            precio_fob = float(item.get('precio_final_fob', 0))
            precio_cif = float(item.get('precio_final_cif', 0) or 0)
            utilidad_total = float(item.get('utilidad_total', 0))
            util_heavens = float(item.get('util_heavens', 0))
            util_exportador = float(item.get('util_exportador', 0))
            margen_adic = float(config_snap.get('margen_adicional_usd', 0))
            
            util_pct = float(historico.utilidad_general_pct)
            denom = 1 - (util_pct / 100)
            precio_sin_margen = fob_box / denom
            
            venta_data = [
                ['Fórmula de Utilidad:', f'{util_pct}%', f'Denominador: 1 - ({util_pct}%/100) = {denom:.4f}'],
                ['Precio (sin margen):', fmt_money(precio_sin_margen, 4), f'${fob_box:.4f} / {denom:.4f} = ${precio_sin_margen:.4f}'],
                ['+ Margen Adicional:', fmt_money(margen_adic, 4), ''],
                ['= Precio Venta FOB:', fmt_money(precio_fob, 4), f'${precio_sin_margen:.4f} + ${margen_adic:.2f} = ${precio_fob:.4f}'],
            ]
            
            if historico.tipo_negociacion == 'CIF':
                cif_add = float(breakdown.get('costos_cif_usd', 0)) + float(breakdown.get('tarifa_aerea_usd', 0))
                venta_data.append(['= Precio Venta CIF:', fmt_money(precio_cif, 4), f'${precio_fob:.4f} + ${cif_add:.4f} = ${precio_cif:.4f}'])
            
            venta_data.extend([
                ['', '', ''],
                ['Utilidad/Caja:', fmt_money(utilidad_total, 4), f'${precio_fob:.4f} - ${fob_box:.4f} - ${margen_adic:.2f} = ${utilidad_total:.4f}'],
                [f'→ Heavens ({historico.heavens_pct}%):', fmt_money(util_heavens, 4), f'${utilidad_total:.4f} × {historico.heavens_pct}% = ${util_heavens:.4f}'],
                [f'→ Exportador ({historico.exportador_pct}%):', fmt_money(util_exportador, 4), f'${utilidad_total:.4f} × {historico.exportador_pct}% = ${util_exportador:.4f}'],
                ['', '', ''],
                ['TOTAL ITEM ({} cajas):'.format(cajas), fmt_money(utilidad_total * cajas), f'${utilidad_total:.4f} × {cajas} = ${utilidad_total * cajas:.2f}'],
            ])
            
            venta_table = Table(venta_data, colWidths=[1.8*inch, 1.2*inch, 3*inch])
            venta_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 7),
                ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#718096')),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#ebf8ff')),  # FOB price row
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#c6f6d5')),  # Total row
            ]))
            product_elements.append(venta_table)
            product_elements.append(Spacer(1, 15))
            
            # Agregar como bloque para evitar page breaks en medio
            elements.append(KeepTogether(product_elements))
        
        # ============================================================================
        # RESUMEN EJECUTIVO
        # ============================================================================
        elements.append(PageBreak())
        elements.append(Paragraph("3. RESUMEN EJECUTIVO", section_header_style))
        
        totales = historico.totales_snapshot or {}
        
        # Tabla de resumen
        resumen_data = [
            ['DESCRIPCIÓN', 'VALOR'],
            ['Cliente', cabecera.get('cliente', 'N/A')],
            ['Aerolínea / Destino', f"{cabecera.get('aerolinea', 'N/A')} → {cabecera.get('destino_codigo', 'N/A')}"],
            ['Tipo de Negociación', historico.tipo_negociacion],
            ['TRM Aplicada', fmt_money(historico.trm)],
            ['', ''],
            ['Total de Cajas', str(historico.total_cajas)],
            ['Total de Pallets', str(historico.total_pallets)],
            ['Número de Productos', str(totales.get('total_items', len(items)))],
            ['', ''],
            ['UTILIDADES', ''],
            ['Utilidad Total USD', fmt_money(totales.get('total_utilidad_usd', 0))],
            [f'→ Heavens ({fmt_number(historico.heavens_pct)}%)', fmt_money(totales.get('total_util_heavens_usd', 0))],
            [f'→ Exportador ({fmt_number(historico.exportador_pct)}%)', fmt_money(totales.get('total_util_exportador_usd', 0))],
        ]
        
        resumen_table = Table(resumen_data, colWidths=[3.5*inch, 3*inch])
        resumen_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 10), (-1, 10), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a365d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BACKGROUND', (0, 10), (-1, 10), colors.HexColor('#2d3748')),
            ('TEXTCOLOR', (0, 10), (-1, 10), colors.white),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            # Highlight utility total
            ('BACKGROUND', (0, 11), (-1, 11), colors.HexColor('#c6f6d5')),
            ('FONTNAME', (0, 11), (-1, 11), 'Helvetica-Bold'),
        ]))
        elements.append(resumen_table)
        
        # Tabla de items resumen
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("Resumen por Producto:", subsection_style))
        
        items_resumen_data = [
            ['Producto', 'Cajas', 'FOB/Caja', 'CIF/Caja', 'Utilidad/Caja', 'Utilidad Total']
        ]
        
        for item in items:
            meta = item.get('meta', {})
            items_resumen_data.append([
                f"{meta.get('fruta', 'N/A')} - {meta.get('presentacion', 'N/A')}",
                str(item.get('cajas', 0)),
                fmt_money(item.get('precio_final_fob', 0)),
                fmt_money(item.get('precio_final_cif', 0) or 0) if historico.tipo_negociacion == 'CIF' else '-',
                fmt_money(item.get('utilidad_total', 0)),
                fmt_money(float(item.get('utilidad_total', 0)) * int(item.get('cajas', 0)))
            ])
        
        # Total row
        total_util = sum(float(item.get('utilidad_total', 0)) * int(item.get('cajas', 0)) for item in items)
        items_resumen_data.append([
            'TOTAL', str(historico.total_cajas), '', '', '', fmt_money(total_util)
        ])
        
        items_table = Table(items_resumen_data, colWidths=[2.2*inch, 0.7*inch, 1*inch, 1*inch, 1*inch, 1.1*inch])
        items_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4299e1')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#bee3f8')),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(items_table)
        
        # Pie de página
        elements.append(Spacer(1, 30))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0')))
        elements.append(Spacer(1, 10))
        
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#a0aec0'),
            alignment=TA_CENTER
        )
        
        usuario = historico.usuario.get_full_name() or historico.usuario.username if historico.usuario else 'Sistema'
        elements.append(Paragraph(
            f"Generado el {timezone.now().strftime('%d/%m/%Y %H:%M')} | Aprobado por: {usuario} | {historico.numero_cotizacion}",
            footer_style
        ))
        
        # Construir el PDF
        doc.build(elements)
        
        # Obtener el valor del buffer
        pdf = buffer.getvalue()
        buffer.close()
        
        # Crear la respuesta HTTP
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{historico.numero_cotizacion}.pdf"'
        response.write(pdf)
        
        return response
