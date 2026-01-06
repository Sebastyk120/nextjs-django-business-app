import io
from datetime import date
from decimal import Decimal
from num2words import num2words
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from django.conf import settings
import os


def format_currency(value):
    if value is None:
        return "$ 0"
    try:
        val = Decimal(str(value))
        return f"$ {val:,.0f}".replace(",", ".")
    except:
        return "$ 0"


def format_number(value):
    if value is None:
        return "-"
    try:
        return f"{Decimal(str(value)):,.1f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except:
        return "-"


def format_percent(value):
    if value is None:
        return "-"
    try:
        return f"{Decimal(str(value)):.1f}%"
    except:
        return "-"


def format_date(value):
    if value is None:
        return "-"
    if isinstance(value, str):
        try:
            from datetime import datetime
            dt = datetime.strptime(value[:10], "%Y-%m-%d")
            return dt.strftime("%d/%m/%Y")
        except:
            return value
    return value.strftime("%d/%m/%Y")


def numero_a_letras(numero):
    try:
        entero = int(abs(numero))
        texto = num2words(entero, lang='es').upper()
        texto = texto.replace(" Y ", " ").replace("  ", " ")
        return f"{texto} PESOS M/CTE"
    except:
        return "CERO PESOS M/CTE"


def generate_resumen_reportes_pdf(data):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=1*cm,
        leftMargin=1*cm,
        topMargin=1*cm,
        bottomMargin=1*cm
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=14,
        alignment=TA_LEFT,
        spaceAfter=6,
    )
    
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_LEFT,
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.white,
    )
    
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=10,
        alignment=TA_LEFT,
        spaceAfter=4,
        spaceBefore=10,
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=7,
        alignment=TA_LEFT,
    )
    
    right_style = ParagraphStyle(
        'RightAlign',
        parent=styles['Normal'],
        fontSize=7,
        alignment=TA_RIGHT,
    )
    
    center_style = ParagraphStyle(
        'CenterAlign',
        parent=styles['Normal'],
        fontSize=7,
        alignment=TA_CENTER,
    )
    
    elements = []
    
    # Header
    proveedor = data.get('proveedor', {})
    proveedor_nombre = proveedor.get('nombre', 'N/A')
    proveedor_nit = proveedor.get('nit', 'N/A')
    fecha_actual = format_date(date.today())
    
    header_data = [
        [
            Paragraph("<b>Heaven's Fruits SAS</b><br/>Estado de Cuenta de Proveedor", header_style),
            "",
            Paragraph(f"<b>{proveedor_nombre}</b><br/>NIT/CC: {proveedor_nit}<br/>Fecha: {fecha_actual}", 
                     ParagraphStyle('RightHeader', parent=header_style, alignment=TA_RIGHT))
        ]
    ]
    header_table = Table(header_data, colWidths=[8*cm, 10*cm, 8*cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.5*cm))
    
    # Saldo Real Card
    monto_pendiente_total = data.get('monto_pendiente_total', 0)
    valor_consignar = data.get('valor_consignar', 0)
    is_positive = valor_consignar >= 0
    saldo_color = colors.green if is_positive else colors.red
    
    saldo_text = f"SALDO REAL: {format_currency(monto_pendiente_total)}"
    saldo_words = numero_a_letras(monto_pendiente_total)
    
    saldo_data = [[Paragraph(f"<b>{saldo_text}</b>", 
                             ParagraphStyle('SaldoStyle', fontSize=12, alignment=TA_CENTER, textColor=saldo_color))],
                  [Paragraph(saldo_words, ParagraphStyle('SaldoWords', fontSize=8, alignment=TA_CENTER))]]
    saldo_table = Table(saldo_data, colWidths=[26*cm])
    saldo_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.Color(0.95, 1, 0.95) if is_positive else colors.Color(1, 0.95, 0.95)),
        ('BOX', (0, 0), (-1, -1), 1, saldo_color),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(saldo_table)
    elements.append(Spacer(1, 0.5*cm))
    
    # Helper function for tables
    def create_section_table(title, headers, rows, col_widths):
        section_elements = []
        section_elements.append(Paragraph(f"<b>{title}</b>", section_title_style))
        
        header_row = [Paragraph(f"<b>{h}</b>", table_header_style) for h in headers]
        table_data = [header_row] + rows
        
        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.2, 0.2, 0.2)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTSIZE', (0, 0), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('TOPPADDING', (0, 0), (-1, 0), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 3),
            ('TOPPADDING', (0, 1), (-1, -1), 3),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.Color(0.97, 0.97, 0.97)]),
        ]))
        section_elements.append(table)
        return section_elements
    
    # Reportes Pendientes de Pago
    reportes_pendientes = data.get('reportes_pendientes', [])
    if reportes_pendientes:
        headers = ['Guía', 'F. Compra', 'F. Reporte', 'Peso', 'Export.', 'Nacional', 'Factura', 'Saldo Real']
        rows = []
        for r in reportes_pendientes:
            rows.append([
                Paragraph(str(r.get('compra_guia', '-')), normal_style),
                Paragraph(format_date(r.get('compra_fecha')), center_style),
                Paragraph(format_date(r.get('p_fecha_reporte')), center_style),
                Paragraph(f"{format_number(r.get('p_kg_totales'))} kg", center_style),
                Paragraph(f"<font color='green'>{format_percent(r.get('p_porcentaje_exportacion'))}</font>", center_style),
                Paragraph(f"<font color='orange'>{format_percent(r.get('p_porcentaje_nacional'))}</font>", center_style),
                Paragraph(format_currency(r.get('p_total_pagar')), right_style),
                Paragraph(f"<font color='red'><b>{format_currency(r.get('monto_pendiente'))}</b></font>", right_style),
            ])
        rows.append([
            Paragraph("<b>TOTAL PENDIENTE:</b>", right_style), '', '', '', '', '', '',
            Paragraph(f"<b>{format_currency(monto_pendiente_total)}</b>", right_style)
        ])
        elements.extend(create_section_table("Reportes Pendientes de Pago", headers, rows, 
                        [2.5*cm, 2*cm, 2*cm, 1.8*cm, 1.5*cm, 1.5*cm, 2.5*cm, 2.5*cm]))
    
    # Últimos Reportes Pagados
    reportes_pagados = data.get('reportes_pagados', [])[:20]
    if reportes_pagados:
        headers = ['Guía', 'F. Compra', 'F. Reporte', 'Peso', 'Export.', 'Nacional', 'Total Pagado']
        rows = []
        for r in reportes_pagados:
            rows.append([
                Paragraph(str(r.get('compra_guia', '-')), normal_style),
                Paragraph(format_date(r.get('compra_fecha')), center_style),
                Paragraph(format_date(r.get('p_fecha_reporte')), center_style),
                Paragraph(f"{format_number(r.get('p_kg_totales'))} kg", center_style),
                Paragraph(f"<font color='green'>{format_percent(r.get('p_porcentaje_exportacion'))}</font>", center_style),
                Paragraph(f"<font color='orange'>{format_percent(r.get('p_porcentaje_nacional'))}</font>", center_style),
                Paragraph(format_currency(r.get('p_total_pagar')), right_style),
            ])
        elements.extend(create_section_table("Últimos Reportes Pagados", headers, rows,
                        [3*cm, 2.2*cm, 2.2*cm, 2*cm, 1.8*cm, 1.8*cm, 3*cm]))
    
    # Compras en Proceso
    compras_proceso = data.get('compras_proceso', [])
    if compras_proceso:
        headers = ['Guía', 'F. Compra', 'F. Reporte', 'Peso Recibido', 'Estado']
        rows = []
        for c in compras_proceso:
            rows.append([
                Paragraph(str(c.get('numero_guia', '-')), normal_style),
                Paragraph(format_date(c.get('fecha_compra')), center_style),
                Paragraph(format_date(c.get('fecha_reporte')) if c.get('fecha_reporte') else 'Pendiente', center_style),
                Paragraph(f"{format_number(c.get('peso_recibido'))} kg" if c.get('peso_recibido') else 'N/A', center_style),
                Paragraph(str(c.get('estado', '-')), center_style),
            ])
        elements.extend(create_section_table("Compras en Proceso", headers, rows,
                        [3.5*cm, 2.5*cm, 2.5*cm, 3*cm, 4.5*cm]))
    
    # Transferencias
    transferencias = data.get('transferencias', [])[:15]
    if transferencias:
        headers = ['Fecha', 'Referencia', 'Origen', 'Valor']
        rows = []
        for t in transferencias:
            rows.append([
                Paragraph(format_date(t.get('fecha_transferencia')), center_style),
                Paragraph(str(t.get('referencia') or '-'), center_style),
                Paragraph(str(t.get('origen_transferencia') or t.get('banco_origen', '-')), normal_style),
                Paragraph(f"<font color='green'>{format_currency(t.get('valor_transferencia'))}</font>", right_style),
            ])
        elements.extend(create_section_table("Últimas Transferencias Realizadas", headers, rows,
                        [3*cm, 4*cm, 5*cm, 4*cm]))
    
    # Detalle del Saldo
    elements.append(Paragraph("<b>Detalle del Saldo</b>", section_title_style))
    saldo_disponible = data.get('saldo_disponible', 0)
    detalle_data = [
        [Paragraph("<b>Concepto</b>", table_header_style), Paragraph("<b>Monto</b>", table_header_style)],
        [Paragraph("Total por Pagar (Reportes pendientes)", normal_style), 
         Paragraph(format_currency(monto_pendiente_total), right_style)],
    ]
    if saldo_disponible and saldo_disponible > 0:
        detalle_data.append([
            Paragraph("Anticipo pendiente por aplicar", normal_style),
            Paragraph(f"<font color='green'>-{format_currency(saldo_disponible)}</font>", right_style)
        ])
    detalle_data.append([
        Paragraph("<b>Saldo Actual</b>", normal_style),
        Paragraph(f"<b><font color='{'green' if valor_consignar >= 0 else 'red'}'>{format_currency(valor_consignar)}</font></b>", right_style)
    ])
    
    detalle_table = Table(detalle_data, colWidths=[10*cm, 6*cm])
    detalle_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.2, 0.2, 0.2)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, -1), (-1, -1), colors.Color(0.95, 0.95, 0.95)),
    ]))
    elements.append(detalle_table)
    elements.append(Spacer(1, 0.5*cm))
    
    # Final Balance
    balance_text = "TOTAL A PAGAR AL PROVEEDOR" if valor_consignar >= 0 else "TOTAL A COBRAR AL PROVEEDOR"
    final_color = colors.green if valor_consignar >= 0 else colors.red
    
    final_data = [
        [Paragraph(f"<b>{balance_text}</b>", ParagraphStyle('Final', fontSize=11, alignment=TA_CENTER, textColor=final_color))],
        [Paragraph(f"<b>{format_currency(abs(valor_consignar))}</b>", ParagraphStyle('FinalValue', fontSize=14, alignment=TA_CENTER, textColor=final_color))],
        [Paragraph(f"({numero_a_letras(abs(valor_consignar))})", ParagraphStyle('FinalWords', fontSize=8, alignment=TA_CENTER))]
    ]
    final_table = Table(final_data, colWidths=[26*cm])
    final_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.Color(0.95, 1, 0.95) if valor_consignar >= 0 else colors.Color(1, 0.95, 0.95)),
        ('BOX', (0, 0), (-1, -1), 2, final_color),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(final_table)
    elements.append(Spacer(1, 0.3*cm))
    
    # Footer
    elements.append(Paragraph(
        "Este documento es informativo y representa el estado actual de su cuenta con Heaven's Fruits SAS",
        ParagraphStyle('Footer', fontSize=7, alignment=TA_CENTER, textColor=colors.grey)
    ))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
