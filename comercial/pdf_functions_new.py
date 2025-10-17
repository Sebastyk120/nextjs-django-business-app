import io
import math
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER


def crear_pdf_resumen_pedido(pedido, detalles, total_cajas, total_peso, total_piezas):
    """
    Función para generar un PDF profesional con el resumen de un pedido usando ReportLab
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                           rightMargin=15, leftMargin=15,
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
    
    # Estilo para subtítulos
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading3'],
        fontSize=11,
        spaceAfter=8,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#283593'),
        fontName='Helvetica-Bold'
    )
    
    # Estilo para celdas con word wrap
    cell_style = ParagraphStyle(
        'CellStyle',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        leading=10,
        fontName='Helvetica'
    )
    
    header_style_cell = ParagraphStyle(
        'HeaderCell',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.white,
        fontName='Helvetica-Bold',
        leading=10
    )
    
    # Título principal
    title = Paragraph(f"RESUMEN PEDIDO #{pedido.id} - {pedido.fecha_solicitud.strftime('%d/%m/%Y') if pedido.fecha_solicitud else ''}", title_style)
    story.append(title)
    story.append(Spacer(1, 8))
    
    # Tabla de información del pedido con mejor diseño
    info_data = [
        ['Exportador', pedido.exportadora.nombre if pedido.exportadora else '', 'Cliente', pedido.cliente.nombre if pedido.cliente else ''],
        ['Intermediario', pedido.intermediario.nombre if pedido.intermediario else 'N/A', 'Fecha Entrega', pedido.fecha_entrega.strftime('%d/%m/%Y') if pedido.fecha_entrega else ''],
        ['Peso Bruto (kg)', f"{total_peso:.2f}", 'Piezas', str(total_piezas)],
        ['Cajas Pedido', str(total_cajas), 'Destino', pedido.destino.codigo if pedido.destino else '']
    ]
    
    info_table = Table(info_data, colWidths=[1.8*inch, 2.2*inch, 1.5*inch, 2.5*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e3f2fd')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#e3f2fd')),
        ('BACKGROUND', (1, 0), (1, -1), colors.white),
        ('BACKGROUND', (3, 0), (3, -1), colors.white),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('ALIGN', (3, 0), (3, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#1976d2'))
    ]))
    
    story.append(info_table)
    story.append(Spacer(1, 12))
    
    # Encabezado de la tabla de detalles
    story.append(Paragraph("DETALLES DEL PEDIDO", subtitle_style))
    story.append(Spacer(1, 6))
    
    # Datos de la tabla de detalles usando Paragraph para word wrap automático
    detalles_data = [[
        Paragraph('<b>Fruta</b>', header_style_cell),
        Paragraph('<b>Presentación</b>', header_style_cell),
        Paragraph('<b>Cajas</b>', header_style_cell),
        Paragraph('<b>Peso<br/>(kg)</b>', header_style_cell),
        Paragraph('<b>P.Bruto<br/>(kg)</b>', header_style_cell),
        Paragraph('<b>Tipo<br/>Caja</b>', header_style_cell),
        Paragraph('<b>Referencia</b>', header_style_cell),
        Paragraph('<b>Stickers</b>', header_style_cell),
        Paragraph('<b>Cont</b>', header_style_cell),
        Paragraph('<b>Observaciones</b>', header_style_cell),
        Paragraph('<b>$ Precio<br/>Caja</b>', header_style_cell),
        Paragraph('<b>$ Utilidad<br/>Caja</b>', header_style_cell),
        Paragraph('<b>$ Recup<br/>Caja</b>', header_style_cell),
        Paragraph('<b>$ Precio<br/>Final</b>', header_style_cell),
        Paragraph('<b>$ Proforma</b>', header_style_cell)
    ]]
    
    for detalle in detalles:
        detalles_data.append([
            Paragraph(detalle.fruta.nombre if detalle.fruta else '', cell_style),
            Paragraph(detalle.presentacion.nombre if detalle.presentacion else '', cell_style),
            Paragraph(str(detalle.cajas_solicitadas), cell_style),
            Paragraph(f"{detalle.presentacion_peso:.2f}" if detalle.presentacion_peso else '', cell_style),
            Paragraph(f"{detalle.calcular_peso_bruto():.2f}", cell_style),
            Paragraph(detalle.tipo_caja.nombre if detalle.tipo_caja else '', cell_style),
            Paragraph(detalle.referencia.nombre if detalle.referencia else '', cell_style),
            Paragraph('Sí' if detalle.stickers else 'No', cell_style),
            Paragraph('Sí' if detalle.lleva_contenedor else 'No', cell_style),
            Paragraph(detalle.observaciones if detalle.observaciones else '', cell_style),
            Paragraph(f"${detalle.valor_x_caja_usd - detalle.tarifa_utilidad - detalle.tarifa_recuperacion:.2f}" if detalle.valor_x_caja_usd else '', cell_style),
            Paragraph(f"${detalle.tarifa_utilidad:.2f}" if detalle.tarifa_utilidad else '', cell_style),
            Paragraph(f"${detalle.tarifa_recuperacion:.2f}" if detalle.tarifa_recuperacion else '', cell_style),
            Paragraph(f"${detalle.valor_x_caja_usd:.2f}" if detalle.valor_x_caja_usd else '', cell_style),
            Paragraph(f"${detalle.precio_proforma:.2f}" if detalle.precio_proforma else '', cell_style)
        ])
    
    # Crear tabla de detalles con anchos optimizados para texto completo
    col_widths = [0.7*inch, 0.75*inch, 0.4*inch, 0.45*inch, 0.5*inch, 0.55*inch,
                  0.8*inch, 0.45*inch, 0.4*inch, 1.0*inch,
                  0.55*inch, 0.55*inch, 0.55*inch, 0.55*inch, 0.65*inch]
    
    detalles_table = Table(detalles_data, colWidths=col_widths, repeatRows=1)
    detalles_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#fafafa')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#1976d2')),
    ]))
    
    # Alternar colores de filas para mejor legibilidad
    for i in range(1, len(detalles_data)):
        if i % 2 == 0:
            detalles_table.setStyle(TableStyle([
                ('BACKGROUND', (0, i), (-1, i), colors.HexColor('#e8eaf6'))
            ]))
    
    story.append(detalles_table)
    
    # Construir el PDF
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
    
    # Alternar colores de filas para mejor legibilidad
    for i in range(1, len(resumen_data)):
        if i % 2 == 0:
            resumen_table.setStyle(TableStyle([
                ('BACKGROUND', (0, i), (-1, i), colors.HexColor('#e8eaf6'))
            ]))
    
    story.append(resumen_table)
    
    # Construir el PDF
    doc.build(story)
    buffer.seek(0)
    return buffer