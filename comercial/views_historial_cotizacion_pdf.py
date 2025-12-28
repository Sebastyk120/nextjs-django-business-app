import json
import io
import json
from django.contrib.auth.decorators import user_passes_test, login_required
from django.utils.decorators import method_decorator
from django.urls import reverse_lazy
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views import View
from django.views.generic import TemplateView
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable
)

from .models import (
    CotizacionConjuntaHistorico
)

def es_miembro_del_grupo(nombre_grupo):
    def es_miembro(user):
        return user.groups.filter(name=nombre_grupo).exists()

    return es_miembro

@method_decorator(login_required, name='dispatch')
@method_decorator(user_passes_test(es_miembro_del_grupo('Heavens'), login_url=reverse_lazy('home')), name='dispatch')
class HistorialCotizacionesView(TemplateView):
    template_name = 'historial_cotizaciones.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Optimizar consulta
        qs = CotizacionConjuntaHistorico.objects.select_related(
            'cliente', 'aerolinea', 'destino', 'usuario'
        ).order_by('-fecha_aprobacion')

        historico_data = []
        for h in qs:
            # Serializar datos para el modal
            meta = {
                'fecha': h.fecha_aprobacion.strftime('%d/%m/%Y %H:%M'),
                'numero': h.numero_cotizacion,
                'trm': float(h.trm),
                'utilidad_pct': float(h.utilidad_general_pct),
                'heavens_pct': float(h.heavens_pct),
                'exportador_pct': float(h.exportador_pct),
                'tipo_negociacion': h.tipo_negociacion,
                'total_cajas': h.total_cajas,
            }

            modal_payload = {
                'cabecera': h.cabecera_snapshot,
                'costos_globales': h.costos_globales_snapshot,
                'items': h.items_snapshot,
                'totales': h.totales_snapshot,
                'meta': meta
            }

            # Helper para formatear moneda/decimales
            item = {
                'id': h.id,
                'fecha': h.fecha_aprobacion,
                'numero': h.numero_cotizacion,
                'cliente': h.cliente.nombre if h.cliente else 'N/A',
                'aerolinea': h.aerolinea.nombre if h.aerolinea else 'N/A',
                'destino': h.destino.codigo if h.destino else 'N/A',
                'tipo': h.tipo_negociacion,
                'total_cajas': h.total_cajas,
                'total_utilidad': 0,
                'usuario': h.usuario.get_full_name() or h.usuario.username if h.usuario else 'Sistema',
                'json_data': json.dumps(modal_payload, default=str)
            }

            # Intentar obtener total utilidad del snapshot, sino calcularlo o dejar 0
            if h.totales_snapshot and 'total_utilidad_usd' in h.totales_snapshot:
                item['total_utilidad'] = h.totales_snapshot['total_utilidad_usd']

            historico_data.append(item)

        context['historico_list'] = historico_data
        return context


# -------------------------------------------------------------------------

@method_decorator(login_required, name='dispatch')
@method_decorator(user_passes_test(es_miembro_del_grupo('Heavens'), login_url=reverse_lazy('home')), name='dispatch')
class HistorialCotizacionPDFView(View):
    """Genera un PDF profesional para una cotización histórica."""
    
    # =========================================================================
    # PALETA DE COLORES UNIFICADA
    # =========================================================================
    # Colores primarios (azul corporativo)
    PRIMARY_DARK = '#1e3a5f'      # Azul oscuro - headers principales
    PRIMARY = '#2c5282'            # Azul medio - headers de tabla
    PRIMARY_LIGHT = '#3182ce'      # Azul claro - acentos
    PRIMARY_BG = '#ebf4ff'         # Azul muy claro - fondos
    
    # Colores secundarios (grises)
    TEXT_DARK = '#1a202c'          # Texto principal
    TEXT_MEDIUM = '#4a5568'        # Texto secundario
    TEXT_LIGHT = '#718096'         # Texto terciario/fórmulas
    
    # Colores de fondo
    BG_LIGHT = '#f7fafc'           # Fondo general claro
    BG_ALT = '#edf2f7'             # Fondo alternado filas
    BORDER = '#cbd5e0'             # Bordes de tabla
    
    # Colores de acento (para destacar)
    ACCENT_SUCCESS = '#276749'     # Verde - totales positivos
    ACCENT_SUCCESS_BG = '#c6f6d5'  # Verde claro - fondo destacado
    ACCENT_WARNING = '#c05621'     # Naranja - insumos
    ACCENT_WARNING_BG = '#feebc8'  # Naranja claro
    
    # Ancho estándar de tablas (7.4 pulgadas = ancho útil de Letter con márgenes de 0.5")
    TABLE_WIDTH = 7.4 * inch
    
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
        
        # Estilos base
        styles = getSampleStyleSheet()
        
        # =====================================================================
        # ESTILOS PERSONALIZADOS
        # =====================================================================
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor(self.PRIMARY_DARK),
            spaceAfter=4,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor(self.TEXT_MEDIUM),
            spaceAfter=16,
            alignment=TA_CENTER
        )
        
        section_header_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontSize=13,
            textColor=colors.white,
            spaceBefore=16,
            spaceAfter=10,
            fontName='Helvetica-Bold',
            backColor=colors.HexColor(self.PRIMARY_DARK),
            leftIndent=8,
            rightIndent=8,
            borderPadding=(8, 8, 8, 8)
        )
        
        subsection_style = ParagraphStyle(
            'SubsectionHeader',
            parent=styles['Heading3'],
            fontSize=10,
            textColor=colors.HexColor(self.PRIMARY),
            spaceBefore=12,
            spaceAfter=6,
            fontName='Helvetica-Bold'
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor(self.TEXT_DARK),
            spaceBefore=4,
            spaceAfter=4
        )
        
        formula_style = ParagraphStyle(
            'Formula',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor(self.TEXT_LIGHT),
            leftIndent=12,
            spaceBefore=4,
            spaceAfter=8,
            fontName='Courier'
        )
        
        # Elementos del documento
        elements = []
        
        # =====================================================================
        # HELPERS DE FORMATO
        # =====================================================================
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
        
        def create_table_style(header_color=None, total_row=True, alt_rows=True):
            """Genera un estilo de tabla consistente."""
            header_bg = header_color or self.PRIMARY
            style_commands = [
                # Header
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(header_bg)),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                # Alineación general
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                # Bordes
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(self.BORDER)),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor(self.BORDER)),
                # Padding
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ]
            
            if total_row:
                style_commands.extend([
                    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor(self.PRIMARY_BG)),
                ])
            
            return style_commands
        
        def add_alt_row_colors(table_style, num_data_rows, start_row=1):
            """Agrega colores alternados a las filas de datos."""
            for i in range(start_row, start_row + num_data_rows):
                if i % 2 == 0:
                    table_style.add('BACKGROUND', (0, i), (-1, i), colors.HexColor(self.BG_ALT))
        
        # =====================================================================
        # CABECERA DEL DOCUMENTO
        # =====================================================================
        elements.append(Paragraph("INFORME DETALLADO DE COTIZACIÓN", title_style))
        elements.append(Paragraph(
            f"<b>{historico.numero_cotizacion}</b> | {historico.fecha_aprobacion.strftime('%d/%m/%Y %H:%M')}",
            subtitle_style
        ))
        
        # Información general en tabla compacta
        cabecera = historico.cabecera_snapshot or {}
        total_cajas = historico.total_cajas or 1
        trm = float(historico.trm) if historico.trm else 1
        
        # Calcular anchos proporcionales (total 7.4")
        col_label = 1.3 * inch
        col_value = 2.4 * inch
        
        info_data = [
            ['Cliente:', cabecera.get('cliente', 'N/A'), 'Tipo Negociación:', historico.tipo_negociacion],
            ['Aerolínea:', cabecera.get('aerolinea', 'N/A'), 'TRM:', fmt_money(historico.trm)],
            ['Destino:', f"{cabecera.get('destino_codigo', '')} - {cabecera.get('destino_ciudad', '')} ({cabecera.get('destino_pais', '')})", 
             'Utilidad General:', f"{fmt_number(historico.utilidad_general_pct)}%"],
            ['Total Cajas:', str(historico.total_cajas), 
             'Distribución Util.:', f"H: {fmt_number(historico.heavens_pct)}% | E: {fmt_number(historico.exportador_pct)}%"],
        ]
        
        info_table = Table(info_data, colWidths=[col_label, col_value, col_label, col_value])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor(self.TEXT_MEDIUM)),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor(self.TEXT_MEDIUM)),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor(self.TEXT_DARK)),
            ('TEXTCOLOR', (3, 0), (3, -1), colors.HexColor(self.TEXT_DARK)),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(self.BG_LIGHT)),
            ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor(self.PRIMARY)),
            ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor(self.BORDER)),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 16))
        
        # =====================================================================
        # SECCIÓN 1: COSTOS GLOBALES DE EMBARQUE
        # =====================================================================
        costos_globales = historico.costos_globales_snapshot or {}
        
        # Header de sección con fondo
        section_table = Table([['1. COSTOS GLOBALES DE EMBARQUE']], colWidths=[self.TABLE_WIDTH])
        section_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(self.PRIMARY_DARK)),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(section_table)
        elements.append(Spacer(1, 8))
        
        # 1.1 Costos Base FOB
        costos_embarque = costos_globales.get('costos_embarque', {})
        if costos_embarque:
            elements.append(Paragraph("1.1 Costos Base FOB (en COP)", subsection_style))
            
            # Anchos de columna proporcionales (total 7.4")
            col_widths_4 = [2.6*inch, 1.6*inch, 1.6*inch, 1.6*inch]
            
            embarque_data = [['Concepto', 'Valor Total COP', 'Valor/Caja COP', 'Valor/Caja USD']]
            
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
                embarque_data.append([nombre, fmt_money(valor), fmt_money(por_caja_cop), fmt_money(por_caja_usd)])
            
            embarque_data.append(['TOTAL COSTOS FOB', fmt_money(total_fob_cop), 
                                  fmt_money(total_fob_cop / total_cajas), 
                                  fmt_money(total_fob_cop / total_cajas / trm)])
            
            embarque_table = Table(embarque_data, colWidths=col_widths_4)
            style = TableStyle(create_table_style())
            # Colores alternados
            for i in range(1, len(embarque_data) - 1):
                if i % 2 == 0:
                    style.add('BACKGROUND', (0, i), (-1, i), colors.HexColor(self.BG_ALT))
            embarque_table.setStyle(style)
            elements.append(embarque_table)
            elements.append(Spacer(1, 12))
            
            # 1.2 Costos CIF Adicionales
            elements.append(Paragraph("1.2 Costos CIF Adicionales (en USD)", subsection_style))
            
            col_widths_3 = [3.4*inch, 2*inch, 2*inch]
            
            cif_data = [['Concepto', 'Total USD', 'Por Caja USD']]
            
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
                cif_data.append([nombre, fmt_money(valor), fmt_money(valor / total_cajas)])
            
            cif_data.append(['TOTAL CIF', fmt_money(total_cif_usd), fmt_money(total_cif_usd / total_cajas)])
            
            cif_table = Table(cif_data, colWidths=col_widths_3)
            style = TableStyle(create_table_style())
            for i in range(1, len(cif_data) - 1):
                if i % 2 == 0:
                    style.add('BACKGROUND', (0, i), (-1, i), colors.HexColor(self.BG_ALT))
            cif_table.setStyle(style)
            elements.append(cif_table)
        
        # 1.3 Costos de Estibado
        costos_estibado = costos_globales.get('costos_estibado', {})
        if costos_estibado:
            elements.append(Spacer(1, 12))
            elements.append(Paragraph("1.3 Costos de Estibado (por Pallet)", subsection_style))
            
            col_widths_2 = [4.4*inch, 3*inch]
            
            estibado_data = [['Concepto', 'Valor COP']]
            
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
            
            estibado_table = Table(estibado_data, colWidths=col_widths_2)
            style = TableStyle(create_table_style())
            for i in range(1, len(estibado_data) - 1):
                if i % 2 == 0:
                    style.add('BACKGROUND', (0, i), (-1, i), colors.HexColor(self.BG_ALT))
            estibado_table.setStyle(style)
            elements.append(estibado_table)
            
            # Fórmula de estibado por caja
            estibado_caja = float(costos_globales.get('estibado_por_caja_usd_global', 0))
            elements.append(Paragraph(
                f"→ Estibado prorrateado por caja: <b>${estibado_caja:.4f} USD</b> = ({historico.total_pallets} pallets × costo) / {total_cajas} cajas",
                formula_style
            ))
        
        # 1.4 Tarifa Aérea
        tarifa_aerea = costos_globales.get('tarifa_aerea', {})
        if tarifa_aerea:
            elements.append(Spacer(1, 12))
            elements.append(Paragraph("1.4 Tarifa Aérea Activa", subsection_style))
            
            tarifa_data = [
                ['Aerolínea', tarifa_aerea.get('aerolinea', 'N/A')],
                ['Destino', f"{tarifa_aerea.get('destino_codigo', '')} - {tarifa_aerea.get('destino_ciudad', '')} ({tarifa_aerea.get('destino_pais', '')})"],
                ['Tarifa por Kg', f"${tarifa_aerea.get('tarifa_por_kilo', 0):.2f} USD/Kg"],
            ]
            
            tarifa_table = Table(tarifa_data, colWidths=[2.4*inch, 5*inch])
            tarifa_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor(self.TEXT_MEDIUM)),
                ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor(self.TEXT_DARK)),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(self.PRIMARY_BG)),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor(self.PRIMARY)),
                ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor(self.BORDER)),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ]))
            elements.append(tarifa_table)
        
        # =====================================================================
        # SECCIÓN 2: DETALLE DE PRODUCTOS
        # =====================================================================
        elements.append(Spacer(1, 20))
        
        section_table = Table([['2. DETALLE DE PRODUCTOS']], colWidths=[self.TABLE_WIDTH])
        section_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(self.PRIMARY_DARK)),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(section_table)
        elements.append(Spacer(1, 8))
        
        items = historico.items_snapshot or []
        
        for idx, item in enumerate(items, 1):
            meta = item.get('meta', {})
            breakdown = item.get('breakdown', {})
            fruta_snap = item.get('fruta_snapshot', {})
            ref_snap = item.get('referencia_snapshot', {})
            config_snap = item.get('config_snapshot', {})
            
            # Header del producto con fondo
            product_title = f"2.{idx} {meta.get('fruta', 'N/A')} - {meta.get('presentacion', 'N/A')}"
            if meta.get('exportador'):
                product_title += f" ({meta.get('exportador')})"
            
            product_elements = []
            
            # Título del producto
            product_header = Table([[product_title]], colWidths=[self.TABLE_WIDTH])
            product_header.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(self.PRIMARY_LIGHT)),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ]))
            product_elements.append(product_header)
            product_elements.append(Spacer(1, 6))
            
            # Info básica del producto
            cajas = item.get('cajas', 0)
            kilos_neto = float(meta.get('kilos_neto', 0))
            kilos_fob = float(item.get('kilos_fob', 0))
            kilos_cif = float(item.get('kilos_cif', 0))
            precio_kilo_fruta = float(fruta_snap.get('precio_kilo', 0))
            precio_ref = float(ref_snap.get('precio', 0))
            mano_obra_cop = float(config_snap.get('mano_obra_cop', 0))
            deshidratacion_pct = float(config_snap.get('deshidratacion_pct', 0))
            
            # Tabla de información básica compacta
            info_col_widths = [1.2*inch, 1.65*inch, 1.2*inch, 1.65*inch, 1.7*inch]
            product_info = [
                ['Cajas:', str(cajas), 'Pallets:', str(item.get('pallets_item', 0)), 
                 f"Contenedor: {'Sí' if item.get('use_contenedor') else 'No'}"],
                ['Kg Neto:', f"{kilos_neto:.2f}", 'Kg FOB:', f"{kilos_fob:.4f}", f"Kg CIF: {kilos_cif:.4f}"],
            ]
            
            product_table = Table(product_info, colWidths=info_col_widths)
            product_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor(self.TEXT_MEDIUM)),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(self.BG_LIGHT)),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor(self.BORDER)),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            product_elements.append(product_table)
            product_elements.append(Spacer(1, 6))
            
            # Datos Base (Fruta, Referencia, etc.)
            product_elements.append(Paragraph("<b>Datos Base:</b>", normal_style))
            base_col_widths = [1.85*inch, 1.85*inch, 1.85*inch, 1.85*inch]
            base_data = [
                [f"Precio Fruta: ${precio_kilo_fruta:,.0f}/kg", f"Precio Ref: ${precio_ref:,.0f}", 
                 f"Mano Obra: ${mano_obra_cop:,.0f}/kg", f"Deshidrat.: {deshidratacion_pct}%"],
            ]
            base_table = Table(base_data, colWidths=base_col_widths)
            base_table.setStyle(TableStyle([
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor(self.TEXT_DARK)),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(self.PRIMARY_BG)),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor(self.PRIMARY)),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            product_elements.append(base_table)
            product_elements.append(Spacer(1, 6))
            
            # Insumos utilizados
            insumos_snapshot = item.get('insumos_snapshot', [])
            if insumos_snapshot:
                product_elements.append(Paragraph("<b>Insumos Utilizados:</b>", normal_style))
                
                insumos_col_widths = [2.9*inch, 1.5*inch, 1.5*inch, 1.5*inch]
                insumos_data = [['Insumo', 'Cantidad', 'Precio Unit. (COP)', 'Costo Total (COP)']]
                
                total_insumos_cop = 0
                for insumo in insumos_snapshot:
                    insumo_nombre = insumo.get('insumo_nombre', 'N/A')
                    cantidad = float(insumo.get('cantidad', 0))
                    precio_unitario = float(insumo.get('insumo_precio', 0))
                    costo_total_insumo = float(insumo.get('costo_total', 0))
                    total_insumos_cop += costo_total_insumo
                    
                    insumos_data.append([insumo_nombre, fmt_number(cantidad, 2), 
                                         fmt_money(precio_unitario), fmt_money(costo_total_insumo)])
                
                insumos_data.append(['TOTAL INSUMOS', '', '', fmt_money(total_insumos_cop)])
                
                insumos_table = Table(insumos_data, colWidths=insumos_col_widths)
                insumo_style = TableStyle(create_table_style(header_color=self.ACCENT_WARNING))
                # Fila total con color de acento
                insumo_style.add('BACKGROUND', (0, -1), (-1, -1), colors.HexColor(self.ACCENT_WARNING_BG))
                for i in range(1, len(insumos_data) - 1):
                    if i % 2 == 0:
                        insumo_style.add('BACKGROUND', (0, i), (-1, i), colors.HexColor(self.BG_ALT))
                insumos_table.setStyle(insumo_style)
                product_elements.append(insumos_table)
                product_elements.append(Spacer(1, 6))
            
            # Desglose de costos
            product_elements.append(Paragraph("<b>Desglose de Costos por Caja:</b>", normal_style))
            
            insumos_usd = float(breakdown.get('insumos_usd', 0))
            fruta_usd = float(breakdown.get('fruta_usd', 0))
            ref_usd = float(breakdown.get('referencia_usd', 0))
            cont_usd = float(breakdown.get('contenedor_usd', 0))
            mo_usd = float(breakdown.get('mano_obra_usd', 0))
            emb_usd = float(breakdown.get('costos_embarque_base_usd', 0))
            est_usd = float(breakdown.get('estibado_usd', 0))
            
            insumos_cop = insumos_usd * trm
            fruta_cop = kilos_neto * precio_kilo_fruta
            mo_cop = mano_obra_cop * kilos_neto
            
            costs_col_widths = [1.7*inch, 1.5*inch, 1.3*inch, 2.9*inch]
            costs_data = [
                ['Concepto', 'Valor COP', 'Valor USD', 'Fórmula/Cálculo'],
                ['Insumos', fmt_money(insumos_cop), fmt_money(insumos_usd), f'${insumos_cop:,.0f} ÷ TRM'],
                ['Fruta', fmt_money(fruta_cop), fmt_money(fruta_usd), f'{kilos_neto}kg × ${precio_kilo_fruta:,.0f}/kg ÷ TRM'],
                ['Referencia', fmt_money(precio_ref), fmt_money(ref_usd), f'${precio_ref:,.0f} ÷ TRM'],
                ['Contenedor', '-', fmt_money(cont_usd), 'Prorrateado si aplica'],
                ['Mano Obra', fmt_money(mo_cop), fmt_money(mo_usd), f'${mano_obra_cop:,.0f}/kg × {kilos_neto}kg ÷ TRM'],
                ['Embarque', '-', fmt_money(emb_usd), 'Costos FOB ÷ cajas ÷ TRM'],
                ['Estibado', '-', fmt_money(est_usd), f'Pallet ÷ {total_cajas} cajas'],
            ]
            
            fob_box = float(item.get('fob_box', 0))
            costs_data.append(['= COSTO FOB', '', fmt_money(fob_box), 'Suma de todos los costos'])
            
            if historico.tipo_negociacion == 'CIF':
                cif_usd = float(breakdown.get('costos_cif_usd', 0))
                tarifa_usd = float(breakdown.get('tarifa_aerea_usd', 0))
                tarifa_kg = float(tarifa_aerea.get('tarifa_por_kilo', 0)) if tarifa_aerea else 0
                costs_data.append(['+ Costos CIF', '', fmt_money(cif_usd), 'Due + Carrier + Fito + CO'])
                costs_data.append(['+ Tarifa Aérea', '', fmt_money(tarifa_usd), f'{kilos_cif:.2f}kg × ${tarifa_kg:.2f}/kg'])
                cif_box = float(item.get('cif_box', 0) or 0)
                costs_data.append(['= COSTO CIF', '', fmt_money(cif_box), 'FOB + CIF + Tarifa'])
            
            costs_table = Table(costs_data, colWidths=costs_col_widths)
            costs_style = TableStyle(create_table_style(total_row=False))
            # Destacar fila FOB
            fob_row_idx = 8
            costs_style.add('BACKGROUND', (0, fob_row_idx), (-1, fob_row_idx), colors.HexColor(self.PRIMARY_BG))
            costs_style.add('FONTNAME', (0, fob_row_idx), (-1, fob_row_idx), 'Helvetica-Bold')
            # Si es CIF, destacar fila CIF también
            if historico.tipo_negociacion == 'CIF':
                costs_style.add('BACKGROUND', (0, -1), (-1, -1), colors.HexColor(self.ACCENT_SUCCESS_BG))
                costs_style.add('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold')
            # Color de fórmulas
            costs_style.add('TEXTCOLOR', (3, 1), (3, -1), colors.HexColor(self.TEXT_LIGHT))
            costs_style.add('FONTSIZE', (3, 1), (3, -1), 7)
            # Filas alternadas
            for i in range(1, 8):
                if i % 2 == 0:
                    costs_style.add('BACKGROUND', (0, i), (-1, i), colors.HexColor(self.BG_ALT))
            costs_table.setStyle(costs_style)
            product_elements.append(costs_table)
            product_elements.append(Spacer(1, 8))
            
            # Precio de venta y utilidad
            product_elements.append(Paragraph("<b>Cálculo de Precio de Venta y Utilidad:</b>", normal_style))
            
            precio_fob = float(item.get('precio_final_fob', 0))
            precio_cif = float(item.get('precio_final_cif', 0) or 0)
            utilidad_total = float(item.get('utilidad_total', 0))
            util_heavens = float(item.get('util_heavens', 0))
            util_exportador = float(item.get('util_exportador', 0))
            margen_adic = float(config_snap.get('margen_adicional_usd', 0))
            
            util_pct = float(historico.utilidad_general_pct)
            denom = 1 - (util_pct / 100)
            precio_sin_margen = fob_box / denom if denom > 0 else fob_box
            
            venta_col_widths = [2.3*inch, 1.4*inch, 3.7*inch]
            venta_data = [
                ['Concepto', 'Valor USD', 'Fórmula'],
                [f'Fórmula Utilidad ({util_pct}%)', '-', f'Denominador: 1 - ({util_pct}%/100) = {denom:.2f}'],
                ['Precio (sin margen)', fmt_money(precio_sin_margen), f'${fob_box:.2f} ÷ {denom:.2f}'],
                ['+ Margen Adicional', fmt_money(margen_adic), 'Definido por usuario'],
                ['= Precio Venta FOB', fmt_money(precio_fob), f'${precio_sin_margen:.2f} + ${margen_adic:.2f}'],
            ]
            
            if historico.tipo_negociacion == 'CIF':
                cif_add = float(breakdown.get('costos_cif_usd', 0)) + float(breakdown.get('tarifa_aerea_usd', 0))
                venta_data.append(['= Precio Venta CIF', fmt_money(precio_cif), f'${precio_fob:.2f} + ${cif_add:.2f}'])
            
            venta_data.extend([
                ['', '', ''],
                ['Utilidad por Caja', fmt_money(utilidad_total), f'Precio FOB - Costo FOB - Margen'],
                [f'→ Heavens ({historico.heavens_pct}%)', fmt_money(util_heavens), f'${utilidad_total:.2f} × {historico.heavens_pct}%'],
                [f'→ Exportador ({historico.exportador_pct}%)', fmt_money(util_exportador), f'${utilidad_total:.2f} × {historico.exportador_pct}%'],
                ['', '', ''],
                [f'TOTAL ITEM ({cajas} cajas)', fmt_money(utilidad_total * cajas), f'${utilidad_total:.2f} × {cajas}'],
            ])
            
            venta_table = Table(venta_data, colWidths=venta_col_widths)
            venta_style = TableStyle(create_table_style(total_row=False))
            # Destacar precio FOB
            fob_price_row = 4
            venta_style.add('BACKGROUND', (0, fob_price_row), (-1, fob_price_row), colors.HexColor(self.PRIMARY_BG))
            venta_style.add('FONTNAME', (0, fob_price_row), (-1, fob_price_row), 'Helvetica-Bold')
            # Destacar total
            venta_style.add('BACKGROUND', (0, -1), (-1, -1), colors.HexColor(self.ACCENT_SUCCESS_BG))
            venta_style.add('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold')
            venta_style.add('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor(self.ACCENT_SUCCESS))
            # Color de fórmulas
            venta_style.add('TEXTCOLOR', (2, 1), (2, -1), colors.HexColor(self.TEXT_LIGHT))
            venta_style.add('FONTSIZE', (2, 1), (2, -1), 7)
            venta_table.setStyle(venta_style)
            product_elements.append(venta_table)
            product_elements.append(Spacer(1, 16))
            
            # Agregar todos los elementos del producto directamente
            # (sin KeepTogether para permitir flujo natural entre páginas)
            for elem in product_elements:
                elements.append(elem)
        
        # =====================================================================
        # SECCIÓN 3: RESUMEN EJECUTIVO
        # =====================================================================
        elements.append(Spacer(1, 20))
        
        section_table = Table([['3. RESUMEN EJECUTIVO']], colWidths=[self.TABLE_WIDTH])
        section_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(self.PRIMARY_DARK)),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(section_table)
        elements.append(Spacer(1, 12))
        
        totales = historico.totales_snapshot or {}
        
        # Calcular totales del embarque
        total_venta_fob = sum(float(item.get('precio_final_fob', 0)) * int(item.get('cajas', 0)) for item in items)
        total_venta_cif = sum(float(item.get('precio_final_cif', 0) or 0) * int(item.get('cajas', 0)) for item in items)
        total_utilidad = sum(float(item.get('utilidad_total', 0)) * int(item.get('cajas', 0)) for item in items)
        total_util_heavens = sum(float(item.get('util_heavens', 0)) * int(item.get('cajas', 0)) for item in items)
        total_util_exportador = sum(float(item.get('util_exportador', 0)) * int(item.get('cajas', 0)) for item in items)
        
        # Tabla de resumen general
        resumen_col_widths = [3.7*inch, 3.7*inch]
        resumen_data = [
            ['INFORMACIÓN GENERAL', 'VALOR'],
            ['Cliente', cabecera.get('cliente', 'N/A')],
            ['Aerolínea / Destino', f"{cabecera.get('aerolinea', 'N/A')} → {cabecera.get('destino_codigo', 'N/A')}"],
            ['Tipo de Negociación', historico.tipo_negociacion],
            ['TRM Aplicada', fmt_money(historico.trm)],
            ['', ''],
            ['VOLUMEN', ''],
            ['Total de Cajas', str(historico.total_cajas)],
            ['Total de Pallets', str(historico.total_pallets)],
            ['Número de Productos', str(totales.get('total_items', len(items)))],
            ['', ''],
            ['VALOR TOTAL DE VENTA', ''],
            ['Venta Total FOB (USD)', fmt_money(total_venta_fob)],
        ]
        
        # Agregar CIF solo si aplica
        if historico.tipo_negociacion == 'CIF':
            resumen_data.append(['Venta Total CIF (USD)', fmt_money(total_venta_cif)])
        
        resumen_data.extend([
            ['', ''],
            ['UTILIDADES DEL EMBARQUE', ''],
            ['Utilidad Total (USD)', fmt_money(total_utilidad)],
            [f'→ Heavens ({fmt_number(historico.heavens_pct)}%)', fmt_money(total_util_heavens)],
            [f'→ Exportador ({fmt_number(historico.exportador_pct)}%)', fmt_money(total_util_exportador)],
        ])
        
        resumen_table = Table(resumen_data, colWidths=resumen_col_widths)
        
        # Determinar índices de filas dinámicamente
        info_header_idx = 0
        volumen_header_idx = 6
        venta_header_idx = 11
        utilidades_header_idx = 14 if historico.tipo_negociacion == 'CIF' else 13
        utilidad_total_idx = utilidades_header_idx + 1
        
        resumen_style = TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(self.PRIMARY)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            # Headers de sección - VOLUMEN
            ('BACKGROUND', (0, volumen_header_idx), (-1, volumen_header_idx), colors.HexColor(self.PRIMARY)),
            ('TEXTCOLOR', (0, volumen_header_idx), (-1, volumen_header_idx), colors.white),
            ('FONTNAME', (0, volumen_header_idx), (-1, volumen_header_idx), 'Helvetica-Bold'),
            # Headers de sección - VALOR TOTAL DE VENTA
            ('BACKGROUND', (0, venta_header_idx), (-1, venta_header_idx), colors.HexColor(self.PRIMARY)),
            ('TEXTCOLOR', (0, venta_header_idx), (-1, venta_header_idx), colors.white),
            ('FONTNAME', (0, venta_header_idx), (-1, venta_header_idx), 'Helvetica-Bold'),
            # Destacar Venta FOB
            ('BACKGROUND', (0, venta_header_idx + 1), (-1, venta_header_idx + 1), colors.HexColor(self.PRIMARY_BG)),
            ('FONTNAME', (0, venta_header_idx + 1), (-1, venta_header_idx + 1), 'Helvetica-Bold'),
            # Headers de sección - UTILIDADES
            ('BACKGROUND', (0, utilidades_header_idx), (-1, utilidades_header_idx), colors.HexColor(self.PRIMARY)),
            ('TEXTCOLOR', (0, utilidades_header_idx), (-1, utilidades_header_idx), colors.white),
            ('FONTNAME', (0, utilidades_header_idx), (-1, utilidades_header_idx), 'Helvetica-Bold'),
            # Destacar utilidad total
            ('BACKGROUND', (0, utilidad_total_idx), (-1, utilidad_total_idx), colors.HexColor(self.ACCENT_SUCCESS_BG)),
            ('FONTNAME', (0, utilidad_total_idx), (-1, utilidad_total_idx), 'Helvetica-Bold'),
            ('TEXTCOLOR', (0, utilidad_total_idx), (-1, utilidad_total_idx), colors.HexColor(self.ACCENT_SUCCESS)),
            # General
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(self.BORDER)),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor(self.PRIMARY)),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ])
        
        # Si es CIF, destacar también la fila de Venta CIF
        if historico.tipo_negociacion == 'CIF':
            resumen_style.add('BACKGROUND', (0, venta_header_idx + 2), (-1, venta_header_idx + 2), colors.HexColor(self.PRIMARY_BG))
            resumen_style.add('FONTNAME', (0, venta_header_idx + 2), (-1, venta_header_idx + 2), 'Helvetica-Bold')
        
        # Filas alternadas para datos de información general
        for i in [2, 3, 4]:
            resumen_style.add('BACKGROUND', (0, i), (-1, i), colors.HexColor(self.BG_ALT))
        # Filas alternadas para volumen
        for i in [8, 9]:
            resumen_style.add('BACKGROUND', (0, i), (-1, i), colors.HexColor(self.BG_ALT))
        # Filas de distribución de utilidades
        resumen_style.add('BACKGROUND', (0, -2), (-1, -2), colors.HexColor(self.BG_ALT))
        resumen_style.add('BACKGROUND', (0, -1), (-1, -1), colors.HexColor(self.BG_ALT))
        
        resumen_table.setStyle(resumen_style)
        elements.append(resumen_table)
        
        # Tabla resumen por producto
        elements.append(Spacer(1, 16))
        elements.append(Paragraph("<b>Resumen por Producto:</b>", normal_style))
        
        items_col_widths = [2.5*inch, 0.8*inch, 1.0*inch, 1.0*inch, 1.05*inch, 1.05*inch]
        items_resumen_data = [['Producto', 'Cajas', 'FOB/Caja', 'CIF/Caja', 'Util./Caja', 'Util. Total']]
        
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
        
        total_util = sum(float(item.get('utilidad_total', 0)) * int(item.get('cajas', 0)) for item in items)
        items_resumen_data.append(['TOTAL', str(historico.total_cajas), '', '', '', fmt_money(total_util)])
        
        items_table = Table(items_resumen_data, colWidths=items_col_widths)
        items_style = TableStyle(create_table_style())
        # Destacar total en verde
        items_style.add('BACKGROUND', (0, -1), (-1, -1), colors.HexColor(self.ACCENT_SUCCESS_BG))
        items_style.add('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor(self.ACCENT_SUCCESS))
        for i in range(1, len(items_resumen_data) - 1):
            if i % 2 == 0:
                items_style.add('BACKGROUND', (0, i), (-1, i), colors.HexColor(self.BG_ALT))
        items_table.setStyle(items_style)
        elements.append(items_table)
        
        # =====================================================================
        # PIE DE PÁGINA
        # =====================================================================
        elements.append(Spacer(1, 30))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor(self.BORDER)))
        elements.append(Spacer(1, 8))
        
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor(self.TEXT_LIGHT),
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
