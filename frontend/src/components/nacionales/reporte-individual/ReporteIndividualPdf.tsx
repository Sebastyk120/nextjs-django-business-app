'use client';

import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    Image,
} from '@react-pdf/renderer';
import type { ReporteIndividualResponse } from '@/types/nacionales';

// Usando fuentes estándar de PDF para evitar errores de carga externa
const FONT_FAMILY = 'Helvetica';


const styles = StyleSheet.create({
    page: {
        fontFamily: FONT_FAMILY,
        fontSize: 10,
        padding: 30,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 140,
        height: 'auto',
        marginBottom: 10,
        objectFit: 'contain',
    },
    companyInfo: {
        textAlign: 'right',
    },
    companyName: {
        fontSize: 18,
        fontWeight: 700,
        color: '#2563eb',
        marginBottom: 2,
    },
    companySubtitle: {
        fontSize: 10,
        color: '#475569',
    },
    infoSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#f1f5f9',
        borderRadius: 6,
    },
    infoBlock: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 9,
        fontWeight: 600,
        textTransform: 'uppercase',
        color: '#1e40af',
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
    },
    infoText: {
        fontSize: 9,
        color: '#334155',
        marginBottom: 3,
    },
    infoTextBold: {
        fontWeight: 500,
        color: '#0f172a',
    },
    reportNumber: {
        fontSize: 14,
        fontWeight: 700,
        color: '#2563eb',
    },
    providerSection: {
        marginBottom: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 6,
        backgroundColor: '#ffffff',
    },
    providerTitle: {
        fontSize: 12,
        color: '#2563eb',
        marginBottom: 10,
        fontWeight: 600,
    },
    providerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    providerItem: {
        width: '48%',
        fontSize: 9,
    },
    providerLabel: {
        fontWeight: 600,
        color: '#334155',
    },
    table: {
        marginBottom: 16,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1e40af',
        padding: 8,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
    },
    tableHeaderCell: {
        color: '#ffffff',
        fontSize: 8,
        fontWeight: 600,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        padding: 8,
    },
    tableRowAlt: {
        backgroundColor: '#f8fafc',
    },
    tableCell: {
        fontSize: 9,
        color: '#334155',
    },
    tableFooter: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        padding: 10,
        borderBottomLeftRadius: 6,
        borderBottomRightRadius: 6,
    },
    col1: { width: '25%' },
    col2: { width: '15%' },
    col3: { width: '20%', textAlign: 'right' },
    col4: { width: '20%', textAlign: 'right' },
    col5: { width: '20%', textAlign: 'right' },
    totalFacturarSection: {
        backgroundColor: '#2563eb',
        padding: 20,
        borderRadius: 8,
        marginVertical: 16,
        alignItems: 'center',
    },
    totalFacturarHeader: {
        fontSize: 10,
        fontWeight: 600,
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
        opacity: 0.9,
    },
    totalFacturarAmount: {
        fontSize: 24,
        fontWeight: 700,
        color: '#ffffff',
        marginVertical: 4,
    },
    totalFacturarWords: {
        marginTop: 10,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 4,
        width: '100%',
    },
    totalFacturarWordsText: {
        fontSize: 9,
        color: '#ffffff',
        textAlign: 'center',
    },
    totalFacturarNote: {
        marginTop: 8,
        fontSize: 8,
        color: '#ffffff',
        opacity: 0.8,
        textAlign: 'center',
    },
    taxSection: {
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 6,
        overflow: 'hidden',
    },
    taxTitle: {
        padding: 10,
        backgroundColor: '#ede9fe',
        fontSize: 11,
        fontWeight: 600,
        color: '#7c3aed',
    },
    taxRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    taxLabel: {
        fontSize: 9,
        color: '#334155',
    },
    taxValue: {
        fontSize: 9,
        fontWeight: 600,
        color: '#1e293b',
    },
    taxTotal: {
        color: '#7c3aed',
    },
    totalPagarSection: {
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        padding: 12,
        borderRadius: 6,
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    totalPagarLabel: {
        fontSize: 9,
        fontWeight: 500,
        color: '#475569',
        marginBottom: 2,
    },
    totalPagarValue: {
        fontSize: 14,
        fontWeight: 600,
        color: '#1e293b',
    },
    summarySection: {
        marginBottom: 16,
        padding: 14,
        backgroundColor: '#f1f5f9',
        borderRadius: 6,
    },
    summaryTitle: {
        textAlign: 'center',
        fontSize: 11,
        fontWeight: 600,
        color: '#1e40af',
        marginBottom: 12,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 10,
    },
    summaryCard: {
        flex: 1,
        padding: 10,
        backgroundColor: '#ffffff',
        borderRadius: 4,
        alignItems: 'center',
        borderTopWidth: 3,
    },
    summaryCardExport: {
        borderTopColor: '#10b981',
    },
    summaryCardNational: {
        borderTopColor: '#f59e0b',
    },
    summaryCardLoss: {
        borderTopColor: '#ef4444',
    },
    summaryCardName: {
        fontSize: 8,
        fontWeight: 600,
        color: '#334155',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    summaryCardValue: {
        fontSize: 12,
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: 2,
    },
    summaryCardPercent: {
        fontSize: 8,
        color: '#64748b',
    },
    footer: {
        textAlign: 'center',
        color: '#64748b',
        fontSize: 8,
        marginTop: 16,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#cbd5e1',
    },
    footerText: {
        marginBottom: 2,
    },
});

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatNumber = (num?: number): string => {
    if (num === undefined || num === null) return '-';
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(num);
};

const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const numeroALetras = (num: number): string => {
    if (num === 0) return 'CERO PESOS M/CTE';
    const units = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const convertLessThanThousand = (n: number): string => {
        if (n === 0) return '';
        if (n === 100) return 'CIEN';
        let result = '';
        const hundred = Math.floor(n / 100);
        const remainder = n % 100;
        if (hundred > 0) result += hundreds[hundred];
        if (remainder >= 10 && remainder < 20) {
            result += (result ? ' ' : '') + teens[remainder - 10];
        } else {
            const ten = Math.floor(remainder / 10);
            const unit = remainder % 10;
            if (ten > 0) result += (result ? ' ' : '') + tens[ten];
            if (unit > 0) {
                if (ten > 2) result += ' Y ' + units[unit];
                else if (ten === 2) result += (unit === 1 ? 'IUNO' : units[unit]);
                else result += (result ? ' ' : '') + units[unit];
            }
        }
        return result;
    };

    let result = '';
    const absNum = Math.abs(Math.floor(num));
    const millions = Math.floor((absNum % 1000000000) / 1000000);
    const thousands = Math.floor((absNum % 1000000) / 1000);
    const remainder = Math.floor(absNum % 1000);

    if (millions > 0) result += (result ? ' ' : '') + convertLessThanThousand(millions) + (millions === 1 ? ' MILLON' : ' MILLONES');
    if (thousands > 0) result += (result ? ' ' : '') + (thousands === 1 ? 'MIL' : convertLessThanThousand(thousands) + ' MIL');
    if (remainder > 0) result += (result ? ' ' : '') + convertLessThanThousand(remainder);

    return (num < 0 ? 'MENOS ' : '') + result + ' PESOS M/CTE';
};

interface ReporteIndividualPdfProps {
    data: ReporteIndividualResponse;
}

const ReporteIndividualPdf: React.FC<ReporteIndividualPdfProps> = ({ data }) => {
    const { proveedor, compra, venta, reporte_proveedor, today } = data;

    const totalExportacion = reporte_proveedor.p_kg_exportacion * reporte_proveedor.p_precio_kg_exp;
    const totalNacional = reporte_proveedor.p_kg_nacional * reporte_proveedor.p_precio_kg_nal;
    const totalRetenciones = reporte_proveedor.asohofrucol + reporte_proveedor.rte_fte + reporte_proveedor.rte_ica;

    // Construir URL absoluta para la imagen (requerido por @react-pdf/renderer)
    // NOTA: WebP no está soportado por @react-pdf/renderer, se necesita PNG o JPG
    const logoUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/img/heavens.png`
        : '/img/heavens.png';

    return (
        <Document>
            <Page size="TABLOID" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Image
                        src={logoUrl}
                        style={{ width: 120, height: 40, objectFit: 'contain' }}
                    />
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>Heaven&apos;s Fruits SAS</Text>
                        <Text style={styles.companySubtitle}>Reporte De Ingreso Fruta</Text>
                        <Text style={styles.companySubtitle}>NIT: 900468802-4</Text>
                    </View>
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <View style={styles.infoBlock}>
                        <Text style={styles.infoTitle}>Información del Documento</Text>
                        <Text style={styles.infoText}>
                            Fecha: <Text style={styles.infoTextBold}>{formatDate(today)}</Text>
                        </Text>
                        <Text style={styles.infoText}>
                            Ciudad: <Text style={styles.infoTextBold}>Bogotá D.C.</Text>
                        </Text>
                        <Text style={styles.infoText}>
                            Fruta: <Text style={styles.infoTextBold}>{compra.fruta_nombre}</Text>
                        </Text>
                    </View>
                    <View style={styles.infoBlock}>
                        <Text style={styles.infoTitle}>Reporte</Text>
                        <Text style={styles.infoText}>
                            No. Reporte: <Text style={styles.reportNumber}>{reporte_proveedor.pk}</Text>
                        </Text>
                        <Text style={styles.infoText}>
                            Número de guía: <Text style={styles.infoTextBold}>{compra.numero_guia}</Text>
                        </Text>
                    </View>
                </View>

                {/* Provider Section */}
                <View style={styles.providerSection}>
                    <Text style={styles.providerTitle}>Datos del Proveedor</Text>
                    <View style={styles.providerGrid}>
                        <Text style={styles.providerItem}>
                            <Text style={styles.providerLabel}>Nombre: </Text>{proveedor.nombre}
                        </Text>
                        <Text style={styles.providerItem}>
                            <Text style={styles.providerLabel}>NIT/C.C: </Text>{proveedor.nit || 'N/A'}
                        </Text>
                        <Text style={styles.providerItem}>
                            <Text style={styles.providerLabel}>Ciudad: </Text>{proveedor.ciudad || 'N/A'}
                        </Text>
                        <Text style={styles.providerItem}>
                            <Text style={styles.providerLabel}>Fecha de ingreso: </Text>{formatDate(venta.fecha_llegada)}
                        </Text>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.col1]}>Detalle</Text>
                        <Text style={[styles.tableHeaderCell, styles.col2]}>% Calidad</Text>
                        <Text style={[styles.tableHeaderCell, styles.col3]}>Cantidad</Text>
                        <Text style={[styles.tableHeaderCell, styles.col4]}>Precio Unit.</Text>
                        <Text style={[styles.tableHeaderCell, styles.col5]}>Total</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.col1]}>Kg Exportación</Text>
                        <Text style={[styles.tableCell, styles.col2]}>{reporte_proveedor.p_porcentaje_exportacion.toFixed(2)}%</Text>
                        <Text style={[styles.tableCell, styles.col3]}>{formatNumber(reporte_proveedor.p_kg_exportacion)} Kg</Text>
                        <Text style={[styles.tableCell, styles.col4]}>{formatCurrency(reporte_proveedor.p_precio_kg_exp)}</Text>
                        <Text style={[styles.tableCell, styles.col5]}>{formatCurrency(totalExportacion)}</Text>
                    </View>
                    <View style={[styles.tableRow, styles.tableRowAlt]}>
                        <Text style={[styles.tableCell, styles.col1]}>Kg Nacional</Text>
                        <Text style={[styles.tableCell, styles.col2]}>{reporte_proveedor.p_porcentaje_nacional.toFixed(2)}%</Text>
                        <Text style={[styles.tableCell, styles.col3]}>{formatNumber(reporte_proveedor.p_kg_nacional)} Kg</Text>
                        <Text style={[styles.tableCell, styles.col4]}>{formatCurrency(reporte_proveedor.p_precio_kg_nal)}</Text>
                        <Text style={[styles.tableCell, styles.col5]}>{formatCurrency(totalNacional)}</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.col1]}>Kg Merma</Text>
                        <Text style={[styles.tableCell, styles.col2]}>{reporte_proveedor.p_porcentaje_merma.toFixed(2)}%</Text>
                        <Text style={[styles.tableCell, styles.col3]}>{formatNumber(reporte_proveedor.p_kg_merma)} Kg</Text>
                        <Text style={[styles.tableCell, styles.col4]}>$0</Text>
                        <Text style={[styles.tableCell, styles.col5]}>$0</Text>
                    </View>
                    <View style={styles.tableFooter}>
                        <Text style={[styles.tableCell, { width: '40%', fontWeight: 500 }]}>
                            Kg Totales: {formatNumber(reporte_proveedor.p_kg_totales)} Kg
                        </Text>
                        <Text style={[styles.tableCell, { width: '60%', textAlign: 'right', fontWeight: 500 }]}>
                            Subtotal antes de retenciones
                        </Text>
                    </View>
                </View>

                {/* Total a Facturar */}
                <View style={styles.totalFacturarSection}>
                    <Text style={styles.totalFacturarHeader}>Total Que Debe Facturar el Proveedor</Text>
                    <Text style={styles.totalFacturarAmount}>{formatCurrency(reporte_proveedor.p_total_facturar)}</Text>
                    <View style={styles.totalFacturarWords}>
                        <Text style={styles.totalFacturarWordsText}>
                            Son: {numeroALetras(reporte_proveedor.p_total_facturar)}
                        </Text>
                    </View>
                    <Text style={styles.totalFacturarNote}>
                        Este es el valor total que debe aparecer en su factura (incluye retenciones)
                    </Text>
                </View>

                {/* Taxes */}
                <View style={styles.taxSection}>
                    <Text style={styles.taxTitle}>Impuestos y Retenciones</Text>
                    <View style={styles.taxRow}>
                        <Text style={styles.taxLabel}>Asohofrucol (1%)</Text>
                        <Text style={styles.taxValue}>{formatCurrency(reporte_proveedor.asohofrucol)}</Text>
                    </View>
                    <View style={styles.taxRow}>
                        <Text style={styles.taxLabel}>Retefuente (1,50%)</Text>
                        <Text style={styles.taxValue}>{formatCurrency(reporte_proveedor.rte_fte)}</Text>
                    </View>
                    <View style={styles.taxRow}>
                        <Text style={styles.taxLabel}>Reteica (4,14/1000)</Text>
                        <Text style={styles.taxValue}>{formatCurrency(reporte_proveedor.rte_ica)}</Text>
                    </View>
                    <View style={[styles.taxRow, { borderBottomWidth: 0 }]}>
                        <Text style={[styles.taxLabel, { fontWeight: 600 }]}>Total Impuestos y Retenciones:</Text>
                        <Text style={[styles.taxValue, styles.taxTotal]}>{formatCurrency(totalRetenciones)}</Text>
                    </View>
                </View>

                {/* Total a Pagar */}
                <View style={styles.totalPagarSection}>
                    <Text style={styles.totalPagarLabel}>Total Neto a Pagar (Heaven&apos;s Fruits al Proveedor):</Text>
                    <Text style={styles.totalPagarValue}>{formatCurrency(reporte_proveedor.p_total_pagar)}</Text>
                </View>

                {/* Summary */}
                <View style={styles.summarySection}>
                    <Text style={styles.summaryTitle}>Resumen de Categorías de Fruta</Text>
                    <View style={styles.summaryGrid}>
                        <View style={[styles.summaryCard, styles.summaryCardExport]}>
                            <Text style={styles.summaryCardName}>Exportación</Text>
                            <Text style={styles.summaryCardValue}>{formatNumber(reporte_proveedor.p_kg_exportacion)} Kg</Text>
                            <Text style={styles.summaryCardPercent}>{reporte_proveedor.p_porcentaje_exportacion.toFixed(2)}%</Text>
                        </View>
                        <View style={[styles.summaryCard, styles.summaryCardNational]}>
                            <Text style={styles.summaryCardName}>Nacional</Text>
                            <Text style={styles.summaryCardValue}>{formatNumber(reporte_proveedor.p_kg_nacional)} Kg</Text>
                            <Text style={styles.summaryCardPercent}>{reporte_proveedor.p_porcentaje_nacional.toFixed(2)}%</Text>
                        </View>
                        <View style={[styles.summaryCard, styles.summaryCardLoss]}>
                            <Text style={styles.summaryCardName}>Merma</Text>
                            <Text style={styles.summaryCardValue}>{formatNumber(reporte_proveedor.p_kg_merma)} Kg</Text>
                            <Text style={styles.summaryCardPercent}>{reporte_proveedor.p_porcentaje_merma.toFixed(2)}%</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>© {new Date().getFullYear()} Heaven&apos;s Fruits SAS. Todos los derechos reservados.</Text>
                    <Text>Este documento es un soporte de liquidación y fue generado automáticamente.</Text>
                </View>
            </Page>
        </Document>
    );
};

export default ReporteIndividualPdf;
