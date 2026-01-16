
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
    Generates a clean, highly readable PDF summary for an order.
    Single unified table with all 16 columns from ResumenPedidoTable.
    """
    buffer = io.BytesIO()
    # A4 Landscape with minimal margins for maximum table width
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                           rightMargin=8, leftMargin=8,
                           topMargin=12, bottomMargin=12)
    
    story = []
    styles = getSampleStyleSheet()
    
    # --- Color Palette (Emerald Green Theme) ---
    c_emerald_dark = colors.HexColor('#064e3b')   # Header green (darker)
    c_emerald_medium = colors.HexColor('#059669') # Accent green
    c_emerald_light = colors.HexColor('#10b981')  # Border green
    c_dark = colors.HexColor('#1e293b')           # Main text
    c_medium = colors.HexColor('#475569')         # Secondary text
    c_light = colors.HexColor('#94a3b8')          # Muted text
    c_border = colors.HexColor('#e2e8f0')         # Borders
    c_bg_alt = colors.HexColor('#f8fafc')         # Alternating rows
    c_green = colors.HexColor('#16a34a')          # Checkmark green
    c_red = colors.HexColor('#dc2626')            # X red
    c_white = colors.white

    # --- Typography Styles ---
    # Title bar style
    title_bar_style = ParagraphStyle(
        'TitleBar',
        parent=styles['Normal'],
        fontSize=12,
        alignment=TA_CENTER,
        textColor=c_white,
        fontName='Helvetica-Bold'
    )
    
    # Info card label
    info_label_style = ParagraphStyle(
        'InfoLabel',
        parent=styles['Normal'],
        fontSize=8,
        textColor=c_emerald_dark,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER,
        spaceAfter=2
    )
    
    # Info card value
    info_value_style = ParagraphStyle(
        'InfoValue',
        parent=styles['Normal'],
        fontSize=9,
        textColor=c_dark,
        fontName='Helvetica',
        alignment=TA_CENTER
    )

    # Table header style
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=7,
        alignment=TA_CENTER,
        textColor=c_dark,
        fontName='Helvetica-Bold',
        leading=9
    )
    
    # Table cell styles
    cell_text = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontSize=7,
        alignment=TA_CENTER,
        textColor=c_dark,
        leading=9,
        fontName='Helvetica'
    )
    
    cell_text_left = ParagraphStyle(
        'CellTextLeft',
        parent=cell_text,
        alignment=TA_LEFT
    )
    
    cell_number = ParagraphStyle(
        'CellNumber',
        parent=styles['Normal'],
        fontSize=7,
        alignment=TA_CENTER,
        textColor=c_dark,
        fontName='Helvetica'
    )

    # =========================================================================
    # TITLE BAR - Emerald green header
    # =========================================================================
    fecha_solicitud = pedido.fecha_solicitud.strftime('%d de %B de %Y') if pedido.fecha_solicitud else "-"
    title_text = f"Resumen Para El Pedido: #{pedido.id} Fecha de Solicitud: {fecha_solicitud}"
    
    title_data = [[Paragraph(title_text, title_bar_style)]]
    title_table = Table(title_data, colWidths=[11.5*inch])
    title_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_emerald_dark),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(title_table)
    story.append(Spacer(1, 6))

    # =========================================================================
    # INFO CARDS - Two rows of 4 cards each
    # =========================================================================
    def info_card(label, value):
        return [
            Paragraph(label, info_label_style),
            Paragraph(str(value), info_value_style)
        ]
    
    # Row 1: Exportador, Cliente, Intermediario, Fecha de Entrega Final
    row1_data = [[
        info_card("Exportador", pedido.exportadora.nombre if pedido.exportadora else "-"),
        info_card("Cliente", pedido.cliente.nombre if pedido.cliente else "-"),
        info_card("Intermediario", pedido.intermediario.nombre if pedido.intermediario else "--"),
        info_card("Fecha de Entrega Final", pedido.fecha_entrega.strftime('%d de %B de %Y') if pedido.fecha_entrega else "-"),
    ]]
    
    row1_table = Table(row1_data, colWidths=[2.875*inch, 2.875*inch, 2.875*inch, 2.875*inch])
    row1_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('BOX', (0,0), (-1,-1), 1, c_emerald_medium),
        ('INNERGRID', (0,0), (-1,-1), 1, c_emerald_medium),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('BACKGROUND', (0,0), (-1,-1), c_white),
    ]))
    story.append(row1_table)
    story.append(Spacer(1, 4))
    
    # Row 2: Total Peso Bruto, Número de Piezas, Total De Cajas Pedido, Destino
    row2_data = [[
        info_card("Total Peso Bruto", f"{total_peso:,.2f}" if total_peso is not None else "-"),
        info_card("Número de Piezas", f"{total_piezas:,}" if total_piezas is not None else "-"),
        info_card("Total De Cajas Pedido", f"{pedido.total_cajas_solicitadas:,}" if pedido.total_cajas_solicitadas is not None else "-"),
        info_card("Destino", str(pedido.destino) if pedido.destino else "-"),
    ]]
    
    row2_table = Table(row2_data, colWidths=[2.875*inch, 2.875*inch, 2.875*inch, 2.875*inch])
    row2_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('BOX', (0,0), (-1,-1), 1, c_emerald_medium),
        ('INNERGRID', (0,0), (-1,-1), 1, c_emerald_medium),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('BACKGROUND', (0,0), (-1,-1), c_white),
    ]))
    story.append(row2_table)
    story.append(Spacer(1, 10))

    # =========================================================================
    # MAIN DATA TABLE
    # =========================================================================
    
    # Header row with emerald background
    headers = [
        Paragraph("Fruta", header_style),
        Paragraph("Presentación", header_style),
        Paragraph("Cajas Pedido", header_style),
        Paragraph("Peso Caja", header_style),
        Paragraph("Kilos Netos", header_style),
        Paragraph("Peso Bruto", header_style),
        Paragraph("Marca Caja", header_style),
        Paragraph("Referencia", header_style),
        Paragraph("Stickers", header_style),
        Paragraph("Contenedor", header_style),
        Paragraph("Observaciones", header_style),
        Paragraph("$Precio Caja", header_style),
        Paragraph("$Utilidad Caja", header_style),
        Paragraph("$ Recuperacion Caja", header_style),
        Paragraph("$Precio Final", header_style),
        Paragraph("$Proforma", header_style),
    ]
    
    table_data = [headers]
    
    for d in detalles:
        # Calculate precio_und_caja
        precio_und_caja = 0
        if d.valor_x_caja_usd and d.tarifa_utilidad is not None and d.tarifa_recuperacion is not None:
            precio_und_caja = d.valor_x_caja_usd - d.tarifa_utilidad - d.tarifa_recuperacion
        
        # Contenedor visual - green checkmark or red X
        if d.lleva_contenedor:
            cont_text = "<font color='#16a34a'><b>✔</b></font>"
        else:
            cont_text = "<font color='#dc2626'><b>✘</b></font>"
        
        row = [
            Paragraph(str(d.fruta.nombre) if d.fruta else "-", cell_text),
            Paragraph(str(d.presentacion.nombre) if d.presentacion else "-", cell_text),
            Paragraph(str(d.cajas_solicitadas), cell_number),
            Paragraph(f"{d.presentacion_peso}" if d.presentacion_peso else "-", cell_number),
            Paragraph(f"{d.kilos:,.2f}" if d.kilos is not None else "-", cell_number),
            Paragraph(f"{d.calcular_peso_bruto():,.2f}" if d.calcular_peso_bruto() is not None else "-", cell_number),
            Paragraph(str(d.tipo_caja.nombre) if d.tipo_caja else "-", cell_text),
            Paragraph(str(d.referencia.nombre) if d.referencia else "-", cell_text),
            Paragraph(str(d.stickers) if d.stickers else "-", cell_text),
            Paragraph(cont_text, cell_text),
            Paragraph("—", cell_text) if not d.observaciones else Paragraph(str(d.observaciones)[:20], cell_text_left),
            Paragraph(f"${precio_und_caja:,.2f}" if precio_und_caja else "-", cell_number),
            Paragraph(f"${d.tarifa_utilidad:,.2f}" if d.tarifa_utilidad else "-", cell_number),
            Paragraph(f"${d.tarifa_recuperacion:,.2f}" if d.tarifa_recuperacion else "-", cell_number),
            Paragraph(f"${d.valor_x_caja_usd:,.2f}" if d.valor_x_caja_usd else "-", cell_number),
            Paragraph(f"${d.precio_proforma:,.2f}" if d.precio_proforma else "—", cell_number),
        ]
        table_data.append(row)
    
    # Column widths optimized for 16 columns (~11.5 inches usable)
    col_widths = [
        0.65*inch, 0.75*inch, 0.5*inch, 0.45*inch, 0.55*inch, 0.55*inch, 
        0.65*inch, 0.75*inch, 0.5*inch, 0.55*inch, 0.7*inch, 0.65*inch, 
        0.6*inch, 0.75*inch, 0.65*inch, 0.55*inch,
    ]
    
    main_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    # Emerald header, white/alternating rows
    c_header_bg = colors.HexColor('#ecfdf5')  # Light emerald
    c_header_border = colors.HexColor('#10b981')  # Emerald border
    
    table_styles = [
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
        ('BACKGROUND', (0,0), (-1,0), c_header_bg),
        ('TEXTCOLOR', (0,0), (-1,0), c_dark),
        ('LINEBELOW', (0,0), (-1,0), 1.5, c_header_border),
        ('LINEABOVE', (0,0), (-1,0), 1.5, c_header_border),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
    ]
    
    for i in range(1, len(table_data)):
        if i % 2 == 0:
            table_styles.append(('BACKGROUND', (0, i), (-1, i), c_bg_alt))
        else:
            table_styles.append(('BACKGROUND', (0, i), (-1, i), c_white))
    
    main_table.setStyle(TableStyle(table_styles))
    story.append(main_table)

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