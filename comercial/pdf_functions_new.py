
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
    Matches the frontend 'Avant-Garde' aesthetic with Slate/Blue colors and clean typography.
    """
    buffer = io.BytesIO()
    # A4 Landscape: 11.69 x 8.27 inches
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                           rightMargin=15, leftMargin=15,
                           topMargin=20, bottomMargin=20)
    
    story = []
    styles = getSampleStyleSheet()
    
    # --- Custom Colors ---
    c_slate_900 = colors.HexColor('#0f172a')
    c_slate_700 = colors.HexColor('#334155')
    c_slate_500 = colors.HexColor('#64748b')
    c_slate_100 = colors.HexColor('#f1f5f9') # Borde/Bg ligero
    c_blue_600 = colors.HexColor('#2563eb')
    c_emerald_600 = colors.HexColor('#059669')
    c_white = colors.white

    # --- Styles ---
    # Main Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=2,
        alignment=TA_LEFT,
        textColor=c_slate_900,
        fontName='Helvetica-Bold'
    )
    
    # Subtitle / Metadata
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontSize=7,
        textColor=c_slate_500,
        fontName='Helvetica-Bold',
        alignment=TA_LEFT
    )
    
    meta_value_style = ParagraphStyle(
        'MetaValue',
        parent=styles['Normal'],
        fontSize=10,
        textColor=c_slate_900,
        fontName='Helvetica',  # Regular for values
        leading=12,
        alignment=TA_LEFT
    )

    # Table Header Style
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=7,
        alignment=TA_CENTER,
        textColor=c_slate_500,
        fontName='Helvetica-Bold',
        textTransform='uppercase'
    )
    
    # Table Content Styles
    cell_normal = ParagraphStyle(
        'CellNormal',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_LEFT,
        textColor=c_slate_700,
        leading=10,
        fontName='Helvetica'
    )

    cell_bold_num = ParagraphStyle(
        'CellBoldNum',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_RIGHT,
        textColor=c_slate_700,
        fontName='Helvetica-Bold'
    )
    
    cell_green = ParagraphStyle('CellGreen', parent=cell_bold_num, textColor=c_emerald_600)
    cell_blue = ParagraphStyle('CellBlue', parent=cell_bold_num, textColor=c_blue_600)

    # --- Header Section ---
    # Title
    story.append(Paragraph(f"Pedido #{pedido.id}", title_style))
    story.append(Paragraph("Resumen de operación y logística", ParagraphStyle('Sub', parent=styles['Normal'], fontSize=9, textColor=c_slate_500)))
    story.append(Spacer(1, 15))

    # Info Cards (Simulated with a Table)
    # Row 1: Cliente, Exportador
    # Row 2: Destino, Entrega
    # We'll use a single row table for a horizontal layout
    
    def get_info_cell(label, value, icon_char=""):
        return [
            Paragraph(label.upper(), meta_label_style),
            Paragraph(str(value), meta_value_style)
        ]

    # Info Data Structure
    # Columns: Cliente | Exportador | Destino | Entrega | Total Cajas | Peso Total | Piezas
    info_data = [[
        get_info_cell("Cliente", pedido.cliente.nombre if pedido.cliente else "-"),
        get_info_cell("Exportador", pedido.exportadora.nombre if pedido.exportadora else "-"),
        get_info_cell("Destino", str(pedido.destino) if pedido.destino else "-"),
        get_info_cell("Entrega", pedido.fecha_entrega.strftime('%d/%m/%Y') if pedido.fecha_entrega else "-"),
        get_info_cell("Cajas", pedido.total_cajas_solicitadas),
        get_info_cell("Peso Total", f"{total_peso:,.2f} Kg"),
        get_info_cell("Piezas", total_piezas)
    ]]

    # Helper to flatten the lists for valid Table data
    flat_info_data = []
    for row in info_data:
        flat_row = []
        for cell in row:
            flat_row.append(cell) # List of Paragraphs
        flat_info_data.append(flat_row)
        
    # We need a table where each cell actually contains the two paragraphs (Label, Value)
    # ReportLab Table cells can take a list of flowables.
    
    info_table = Table(flat_info_data, colWidths=[2.2*inch, 1.5*inch, 2.5*inch, 1.2*inch, 1.0*inch, 1.2*inch, 1.0*inch])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, c_slate_100),
        ('BACKGROUND', (0,0), (-1,-1), c_white),
        # Add side borders to simulate cards looks nice, or just simple grid
        ('BOX', (0,0), (-1,-1), 0.5, c_slate_100),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]), # Reportlab recent versions support this? safe to omit if unsure
    ]))
    
    story.append(info_table)
    story.append(Spacer(1, 20))

    # --- Products Table ---
    
    # Header Row
    headers = [
        Paragraph("FRUTA / PRESENTACIÓN", header_style),
        Paragraph("CAJAS", header_style),
        Paragraph("KILOS NETOS", header_style),
        Paragraph("PESO BRUTO", header_style),
        Paragraph("REFERENCIA / MARCA", header_style),
        Paragraph("OBSERVACIONES", header_style),
        Paragraph("CONT", header_style),
        Paragraph("P. BASE", header_style),
        Paragraph("PROFORMA", header_style),
        Paragraph("UTILIDAD", header_style),
        Paragraph("RECUP", header_style),
        Paragraph("P. FINAL", header_style),
    ]

    table_data = [headers]

    for d in detalles:
        # Fruta / Pres Composition
        fruta_pres_text = f"<b>{d.fruta.nombre}</b><br/><font size=7 color='#64748b'>{d.presentacion.nombre}</font><br/><font size=7 color='#64748b'>{d.presentacion_peso} kg</font>"
        
        # Ref / Marca Composition
        ref_text = f"{d.referencia.nombre}"
        if d.tipo_caja:
            ref_text += f"<br/><font size=7 color='#64748b'>{d.tipo_caja.nombre}</font>"
            
        # Obs
        obs_text = d.observaciones if d.observaciones else "-"
        
        # Contenedor
        cont_icon = "SI" if d.lleva_contenedor else "-"
        cont_style = ParagraphStyle('ContYes', parent=cell_normal, alignment=TA_CENTER, textColor=c_emerald_600) if d.lleva_contenedor else cell_normal

        # Financials - Calculate precio_und_caja (not a model field)
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
            Paragraph(f"{d.kilos:,.2f} kg", cell_bold_num),
            Paragraph(f"{d.calcular_peso_bruto():,.2f} kg", cell_bold_num),
            Paragraph(ref_text, cell_normal),
            Paragraph(obs_text, cell_normal),
            Paragraph(cont_icon, cont_style),
            Paragraph(p_base, cell_bold_num),
            Paragraph(proforma, cell_bold_num),
            Paragraph(utilidad, cell_green),
            Paragraph(recup, cell_blue),
            Paragraph(p_final, ParagraphStyle('CellTotal', parent=cell_bold_num, fontSize=9, textColor=c_slate_900)),
        ]
        table_data.append(row)

    # Column Widths
    # Total available ~11 inches
    # Fruta: 1.8, Cajas: 0.5, Netos: 0.7, Brutos: 0.7, Ref: 1.6, Obs: 1.0, Cont: 0.4, Prices (5)
    # Prices: 0.7 * 5 = 3.5
    # Sum: 1.8+0.5+0.7+0.7+1.6+1.0+0.4+3.5 = 10.2 inch. Good fit.
    
    col_widths = [
        1.8*inch, # Fruta
        0.5*inch, # Cajas
        0.7*inch, # Netos
        0.7*inch, # Bruto
        1.6*inch, # Ref
        1.0*inch, # Obs
        0.4*inch, # Cont
        0.7*inch, # Base
        0.7*inch, # Proforma
        0.7*inch, # Utilidad
        0.7*inch, # Recup
        0.8*inch, # Final
    ]

    t = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    t_styles = [
        # Global
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        
        # Header
        ('BACKGROUND', (0,0), (-1,0), c_slate_100),
        ('LINEBELOW', (0,0), (-1,0), 1, c_slate_700),
        
        # Grid lines (Horizontal only for clean look)
        ('LINEBELOW', (0,1), (-1,-1), 0.5, c_slate_100),
    ]
    
    # Alternating row colors? Maybe distinct background for financials
    for i, _ in enumerate(table_data):
        if i == 0: continue
        # Highlight Prices Background subtly
        # Base/Proforma
        t_styles.append(('BACKGROUND', (7, i), (8, i), colors.HexColor('#f8fafc'))) # Slate 50
        # Utilidad
        t_styles.append(('BACKGROUND', (9, i), (9, i), colors.HexColor('#ecfdf5'))) # Emerald 50
        # Recup
        t_styles.append(('BACKGROUND', (10, i), (10, i), colors.HexColor('#eff6ff'))) # Blue 50
        # Total
        t_styles.append(('BACKGROUND', (11, i), (11, i), colors.HexColor('#f1f5f9'))) # Slate 100

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