
import io
import math
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

def crear_pdf_resumen_pedido_new(pedido, detalles, total_cajas, total_peso, total_piezas):
    """
    Generates a premium, professional PDF summary for an order.
    Enhanced UX/UI with vibrant colors, larger fonts, and modern card-style layout.
    """
    buffer = io.BytesIO()
    # A4 Landscape: 11.69 x 8.27 inches - Using minimal margins for max width
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                           rightMargin=10, leftMargin=10,
                           topMargin=15, bottomMargin=15)
    
    story = []
    styles = getSampleStyleSheet()
    
    # --- Enhanced Color Palette ---
    c_slate_900 = colors.HexColor('#0f172a')
    c_slate_700 = colors.HexColor('#334155')
    c_slate_500 = colors.HexColor('#64748b')
    c_slate_200 = colors.HexColor('#e2e8f0')
    c_slate_100 = colors.HexColor('#f1f5f9')
    c_slate_50 = colors.HexColor('#f8fafc')
    
    # Vibrant accent colors
    c_blue_700 = colors.HexColor('#1d4ed8')
    c_blue_600 = colors.HexColor('#2563eb')
    c_blue_500 = colors.HexColor('#3b82f6')
    c_blue_50 = colors.HexColor('#eff6ff')
    
    c_emerald_700 = colors.HexColor('#047857')
    c_emerald_600 = colors.HexColor('#059669')
    c_emerald_50 = colors.HexColor('#ecfdf5')
    
    c_violet_600 = colors.HexColor('#7c3aed')
    c_violet_50 = colors.HexColor('#f5f3ff')
    
    c_amber_600 = colors.HexColor('#d97706')
    c_amber_50 = colors.HexColor('#fffbeb')
    
    c_white = colors.white

    # --- Enhanced Styles with Larger Fonts ---
    # Main Title - Bold and Impactful
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=22,
        spaceAfter=4,
        alignment=TA_LEFT,
        textColor=c_slate_900,
        fontName='Helvetica'
    )
    
    # Subtitle
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=c_slate_500,
        fontName='Helvetica'
    )
    
    # Info Card Label - Larger and more visible
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontSize=8,
        textColor=c_slate_500,
        fontName='Helvetica-Bold',
        alignment=TA_LEFT,
        spaceAfter=2
    )
    
    # Info Card Value - Larger for readability
    meta_value_style = ParagraphStyle(
        'MetaValue',
        parent=styles['Normal'],
        fontSize=11,
        textColor=c_slate_900,
        fontName='Helvetica-Bold',
        leading=14,
        alignment=TA_LEFT
    )

    # Table Header Style - Larger
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=c_white,
        fontName='Helvetica-Bold',
        leading=10
    )
    
    # Table Content Styles - Increased sizes
    cell_normal = ParagraphStyle(
        'CellNormal',
        parent=styles['Normal'],
        fontSize=9,
        alignment=TA_LEFT,
        textColor=c_slate_700,
        leading=11,
        fontName='Helvetica'
    )

    cell_bold_num = ParagraphStyle(
        'CellBoldNum',
        parent=styles['Normal'],
        fontSize=9,
        alignment=TA_RIGHT,
        textColor=c_slate_700,
        fontName='Helvetica-Bold'
    )
    
    cell_green = ParagraphStyle('CellGreen', parent=cell_bold_num, textColor=c_emerald_700)
    cell_blue = ParagraphStyle('CellBlue', parent=cell_bold_num, textColor=c_blue_600)
    cell_violet = ParagraphStyle('CellViolet', parent=cell_bold_num, textColor=c_violet_600)

    # --- Header Section with Blue Accent ---
    # Title with decorative element
    story.append(Paragraph(f"<font color='#2563eb'>●</font>  Pedido #{pedido.id}", title_style))
    story.append(Paragraph("Resumen de operación y logística", subtitle_style))
    story.append(Spacer(1, 12))

    # Info Cards Helper - Enhanced with colored accent
    def get_info_cell(label, value):
        return [
            Paragraph(label.upper(), meta_label_style),
            Paragraph(str(value), meta_value_style)
        ]

    # Info Data Structure - 8 columns with all key info
    info_data = [[
        get_info_cell("Cliente", pedido.cliente.nombre if pedido.cliente else "-"),
        get_info_cell("Exportador", pedido.exportadora.nombre if pedido.exportadora else "-"),
        get_info_cell("Intermediario", pedido.intermediario.nombre if pedido.intermediario else "-"),
        get_info_cell("Destino", str(pedido.destino) if pedido.destino else "-"),
        get_info_cell("Entrega", pedido.fecha_entrega.strftime('%d/%m/%Y') if pedido.fecha_entrega else "-"),
        get_info_cell("Cajas", f"{pedido.total_cajas_solicitadas:,}"),
        get_info_cell("Peso Total", f"{total_peso:,.2f} Kg"),
        get_info_cell("Piezas", f"{total_piezas:,}")
    ]]

    # Flatten for Table
    flat_info_data = []
    for row in info_data:
        flat_row = [cell for cell in row]
        flat_info_data.append(flat_row)
    
    # Optimized column widths for full page width (~11.5 usable inches)
    info_table = Table(flat_info_data, colWidths=[1.6*inch, 1.4*inch, 1.4*inch, 1.8*inch, 1.0*inch, 1.0*inch, 1.2*inch, 1.0*inch])
    
    info_table_styles = [
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('BACKGROUND', (0,0), (-1,-1), c_white),
        ('BOX', (0,0), (-1,-1), 1, c_slate_200),
        # Individual cell borders for card effect
        ('LINEAFTER', (0,0), (-2,-1), 0.5, c_slate_200),
        # Colored top accent for each card
        ('LINEABOVE', (0,0), (0,-1), 3, c_blue_600),      # Cliente - Blue
        ('LINEABOVE', (1,0), (1,-1), 3, c_violet_600),    # Exportador - Violet
        ('LINEABOVE', (2,0), (2,-1), 3, c_amber_600),     # Intermediario - Amber
        ('LINEABOVE', (3,0), (3,-1), 3, c_blue_500),      # Destino - Light Blue
        ('LINEABOVE', (4,0), (4,-1), 3, c_slate_500),     # Entrega - Slate
        ('LINEABOVE', (5,0), (5,-1), 3, c_emerald_600),   # Cajas - Emerald
        ('LINEABOVE', (6,0), (6,-1), 3, c_emerald_700),   # Peso - Dark Emerald
        ('LINEABOVE', (7,0), (7,-1), 3, c_blue_700),      # Piezas - Dark Blue
    ]
    info_table.setStyle(TableStyle(info_table_styles))
    
    story.append(info_table)
    story.append(Spacer(1, 18))

    # --- Products Table ---
    # Header Row with enhanced styling
    headers = [
        Paragraph("FRUTA / PRES.", header_style),
        Paragraph("CAJAS", header_style),
        Paragraph("KG NETOS", header_style),
        Paragraph("PESO BRUTO", header_style),
        Paragraph("REF / MARCA", header_style),
        Paragraph("OBS", header_style),
        Paragraph("CONT", header_style),
        Paragraph("PRECIO CAJA", header_style),
        Paragraph("PROFORMA", header_style),
        Paragraph("UTILIDAD", header_style),
        Paragraph("RECUP", header_style),
        Paragraph("PRECIO FINAL", header_style),
    ]

    table_data = [headers]

    for d in detalles:
        # Fruta / Pres - Enhanced visibility
        fruta_pres_text = f"<b>{d.fruta.nombre}</b><br/><font size=8 color='#64748b'>{d.presentacion.nombre}</font><br/><font size=8 color='#94a3b8'>{d.presentacion_peso} kg</font>"
        
        # Ref / Marca
        ref_text = f"<b>{d.referencia.nombre}</b>"
        if d.tipo_caja:
            ref_text += f"<br/><font size=8 color='#64748b'>{d.tipo_caja.nombre}</font>"
            
        # Obs
        obs_text = d.observaciones if d.observaciones else "-"
        
        # Contenedor with visual indicator
        if d.lleva_contenedor:
            cont_text = "<font color='#059669'><b>✓</b></font>"
            cont_style = ParagraphStyle('ContYes', parent=cell_normal, alignment=TA_CENTER, fontSize=11)
        else:
            cont_text = "<font color='#94a3b8'>-</font>"
            cont_style = ParagraphStyle('ContNo', parent=cell_normal, alignment=TA_CENTER)

        # Financials
        precio_und_caja = 0
        if d.valor_x_caja_usd and d.tarifa_utilidad is not None and d.tarifa_recuperacion is not None:
            precio_und_caja = d.valor_x_caja_usd - d.tarifa_utilidad - d.tarifa_recuperacion
        
        p_base = f"${precio_und_caja:,.2f}" if precio_und_caja else "-"
        proforma = f"${d.precio_proforma:,.2f}" if d.precio_proforma else "-"
        utilidad = f"${d.tarifa_utilidad:,.2f}" if d.tarifa_utilidad else "-"
        recup = f"${d.tarifa_recuperacion:,.2f}" if d.tarifa_recuperacion else "-"
        p_final = f"${d.valor_x_caja_usd:,.2f}" if d.valor_x_caja_usd else "-"

        row = [
            Paragraph(fruta_pres_text, cell_normal),
            Paragraph(str(d.cajas_solicitadas), cell_bold_num),
            Paragraph(f"{d.kilos:,.2f}", cell_bold_num),
            Paragraph(f"{d.calcular_peso_bruto():,.2f}", cell_bold_num),
            Paragraph(ref_text, cell_normal),
            Paragraph(obs_text, cell_normal),
            Paragraph(cont_text, cont_style),
            Paragraph(p_base, cell_violet),
            Paragraph(proforma, cell_bold_num),
            Paragraph(utilidad, cell_green),
            Paragraph(recup, cell_blue),
            Paragraph(p_final, ParagraphStyle('CellTotal', parent=cell_bold_num, fontSize=10, textColor=c_slate_900)),
        ]
        table_data.append(row)

    # Optimized Column Widths for full width (~11.5 inches usable)
    col_widths = [
        1.5*inch,  # Fruta
        0.55*inch, # Cajas
        0.7*inch,  # Netos
        0.75*inch, # Bruto
        1.5*inch,  # Ref
        1.0*inch,  # Obs
        0.4*inch,  # Cont
        0.75*inch, # Base
        0.75*inch, # Proforma
        0.75*inch, # Utilidad
        0.75*inch, # Recup
        0.85*inch, # Final
    ]

    t = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    t_styles = [
        # Global
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        
        # Header - Vibrant Blue Background
        ('BACKGROUND', (0,0), (-1,0), c_blue_600),
        ('TEXTCOLOR', (0,0), (-1,0), c_white),
        ('LINEBELOW', (0,0), (-1,0), 2, c_blue_700),
        
        # Outer box
        ('BOX', (0,0), (-1,-1), 1, c_slate_200),
        
        # Grid lines (Horizontal only for clean look)
        ('LINEBELOW', (0,1), (-1,-1), 0.5, c_slate_200),
    ]
    
    # Dynamic row styling with alternating colors and financial highlights
    for i in range(1, len(table_data)):
        # Alternating row background
        if i % 2 == 0:
            t_styles.append(('BACKGROUND', (0, i), (6, i), c_slate_50))
        
        # Financial columns with distinct coloring
        t_styles.append(('BACKGROUND', (7, i), (7, i), c_violet_50))   # P. Caja - Violet
        t_styles.append(('BACKGROUND', (8, i), (8, i), c_slate_50))    # Proforma - Neutral
        t_styles.append(('BACKGROUND', (9, i), (9, i), c_emerald_50))  # Utilidad - Emerald
        t_styles.append(('BACKGROUND', (10, i), (10, i), c_blue_50))   # Recup - Blue
        t_styles.append(('BACKGROUND', (11, i), (11, i), c_slate_100)) # Total - Highlighted

    t.setStyle(TableStyle(t_styles))
    
    story.append(t)

    doc.build(story)
    buffer.seek(0)
    return buffer

def crear_pdf_resumen_semana(pedidos, semana, exportador_nombre):
    """
    Función para generar un PDF profesional con el resumen de exportaciones de la semana usando ReportLab
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                           rightMargin=12, leftMargin=12,
                           topMargin=20, bottomMargin=20)
    
    # Contenedor para los elementos del PDF
    story = []
    
    # Estilos
    styles = getSampleStyleSheet()
    
    # Estilo personalizado para el título
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=14,
        spaceAfter=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1a237e'),
        fontName='Helvetica-Bold'
    )
    
    # Estilo para celdas
    cell_style = ParagraphStyle(
        'CellStyle',
        parent=styles['Normal'],
        fontSize=7,
        alignment=TA_CENTER,
        leading=8,
        fontName='Helvetica'
    )
    
    header_style_cell = ParagraphStyle(
        'HeaderCell',
        parent=styles['Normal'],
        fontSize=7,
        alignment=TA_CENTER,
        textColor=colors.white,
        fontName='Helvetica-Bold',
        leading=8
    )
    
    # Título principal
    title_text = f"RESUMEN EXPORTACIONES - SEMANA {semana}"
    if exportador_nombre:
        title_text += f" - {exportador_nombre}"
    
    title = Paragraph(title_text, title_style)
    story.append(title)
    story.append(Spacer(1, 8))
    
    # Datos de la tabla de resumen usando Paragraph para word wrap
    resumen_data = [[
        Paragraph('<b>Sem</b>', header_style_cell),
        Paragraph('<b>Ord</b>', header_style_cell),
        Paragraph('<b>Exportador</b>', header_style_cell),
        Paragraph('<b>Cliente</b>', header_style_cell),
        Paragraph('<b>Dest</b>', header_style_cell),
        Paragraph('<b>Productos</b>', header_style_cell),
        Paragraph('<b>Caj<br/>Sol</b>', header_style_cell),
        Paragraph('<b>Caj<br/>Env</b>', header_style_cell),
        Paragraph('<b>Pal<br/>Sol</b>', header_style_cell),
        Paragraph('<b>F.Entrega</b>', header_style_cell),
        Paragraph('<b>Resp.<br/>Reserva</b>', header_style_cell),
        Paragraph('<b>Est.<br/>Res</b>', header_style_cell),
        Paragraph('<b>AWB</b>', header_style_cell),
        Paragraph('<b>Aerolínea</b>', header_style_cell),
        Paragraph('<b>Ag.<br/>Carga</b>', header_style_cell),
        Paragraph('<b>P.Bruto<br/>Sol</b>', header_style_cell),
        Paragraph('<b>Est.<br/>Ped</b>', header_style_cell),
        Paragraph('<b>Est.<br/>Doc</b>', header_style_cell),
        Paragraph('<b>Comentarios</b>', header_style_cell)
    ]]
    
    for pedido in pedidos:
        resumen_data.append([
            Paragraph(str(pedido.semana) if pedido.semana else '', cell_style),
            Paragraph(str(pedido.id), cell_style),
            Paragraph(pedido.exportadora.nombre if pedido.exportadora else '', cell_style),
            Paragraph(pedido.cliente.nombre if pedido.cliente else '', cell_style),
            Paragraph(pedido.destino.codigo if pedido.destino else '', cell_style),
            Paragraph(pedido.variedades if pedido.variedades else '', cell_style),
            Paragraph(str(pedido.total_cajas_solicitadas), cell_style),
            Paragraph(str(pedido.total_cajas_enviadas), cell_style),
            Paragraph(str(pedido.total_piezas_solicitadas), cell_style),
            Paragraph(pedido.fecha_entrega.strftime('%d/%m/%y') if pedido.fecha_entrega else '', cell_style),
            Paragraph(pedido.responsable_reserva.nombre if pedido.responsable_reserva else '', cell_style),
            Paragraph(pedido.estatus_reserva or '', cell_style),
            Paragraph(pedido.awb or '', cell_style),
            Paragraph(pedido.aerolinea.nombre if pedido.aerolinea else '', cell_style),
            Paragraph(pedido.agencia_carga.nombre if pedido.agencia_carga else '', cell_style),
            Paragraph(f"{pedido.total_peso_bruto_solicitado:.0f}" if pedido.total_peso_bruto_solicitado else '', cell_style),
            Paragraph(pedido.estado_pedido or '', cell_style),
            Paragraph(pedido.estado_documentos or '', cell_style),
            Paragraph(pedido.observaciones_tracking if pedido.observaciones_tracking else '', cell_style)
        ])
    
    # Crear tabla de resumen con anchos optimizados
    col_widths = [0.3*inch, 0.35*inch, 0.75*inch, 0.85*inch, 0.4*inch, 0.9*inch,
                  0.4*inch, 0.4*inch, 0.4*inch,
                  0.5*inch, 0.7*inch, 0.5*inch,
                  0.7*inch, 0.7*inch, 0.65*inch, 0.5*inch,
                  0.5*inch, 0.5*inch, 0.9*inch]
    
    resumen_table = Table(resumen_data, colWidths=col_widths, repeatRows=1)
    resumen_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 7),
        ('FONTSIZE', (0, 1), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#fafafa')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#1976d2')),
    ]))
    
    # Alternar colores de filas para mejor legibilidad y resaltar pedidos cancelados
    for i in range(1, len(resumen_data)):
        pedido = pedidos[i-1]
        if pedido.estado_pedido and pedido.estado_pedido.lower() == 'cancelado':
            resumen_table.setStyle(TableStyle([
                ('BACKGROUND', (0, i), (-1, i), colors.HexColor('#ffebee'))
            ]))
        elif i % 2 == 0:
            resumen_table.setStyle(TableStyle([
                ('BACKGROUND', (0, i), (-1, i), colors.HexColor('#e8eaf6'))
            ]))
    
    story.append(resumen_table)
    
    # Construir el PDF
    doc.build(story)
    buffer.seek(0)
    return buffer