
"use client";

import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from '@react-pdf/renderer';
import type { ReportesVencidosResponse } from '@/types/nacionales';

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        padding: 30,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#2563eb', // Indigo color for header divider
    },
    headerLeft: {
        flexDirection: 'column',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e3a8a', // Dark blue
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 4,
    },
    companyName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2563eb',
        textAlign: 'right',
    },
    logo: {
        width: 120,
        height: 40,
        objectFit: 'contain',
    },
    metaSection: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 4,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        justifyContent: 'space-between',
    },
    metaItem: {
        flexDirection: 'column',
    },
    metaLabel: {
        fontSize: 8,
        color: '#64748b',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    metaValue: {
        fontSize: 10,
        color: '#334155',
        fontWeight: 'medium',
    },
    table: {
        width: '100%',
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderBottomWidth: 0,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1e40af', // Dark blue header
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    tableRowAlt: {
        backgroundColor: '#f8fafc', // Zebra striping
    },
    tableCellHeader: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#ffffff', // White text on dark header
        textAlign: 'left',
    },
    tableCell: {
        fontSize: 8,
        color: '#334155',
        textAlign: 'left',
    },
    // Column widths
    colGuia: { width: '12%' },
    colFecha: { width: '12%' },
    colDias: { width: '8%', textAlign: 'center' },
    colFruta: { width: '10%' },
    colOrigen: { width: '13%' },
    colPeso: { width: '9%', textAlign: 'right' },
    colNeto: { width: '9%', textAlign: 'right' },
    colCant: { width: '7%', textAlign: 'center' },
    colEmpaque: { width: '10%' },

    // Status styles
    vencidoText: {
        color: '#dc2626', // Red color for expired days
        fontWeight: 'bold',
    },

    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#94a3b8',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
    },

    summarySection: {
        marginTop: 20,
        backgroundColor: '#eff6ff', // Light blue background
        padding: 10,
        borderRadius: 4,
        alignItems: 'flex-end',
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    summaryText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1e40af',
    }
});

interface ReportesVencidosPdfProps {
    data: ReportesVencidosResponse;
}

const ReportesVencidosPdf = ({ data }: ReportesVencidosPdfProps) => {
    // Construct absolute URL for the logo
    const logoUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/img/heavens.png`
        : '/img/heavens.png';

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header with Logo and Company Name */}
                <View style={styles.header}>
                    <Image
                        src={logoUrl}
                        style={styles.logo}
                    />
                    <View style={styles.headerLeft}>
                        <Text style={styles.companyName}>HEAVEN&apos;S FRUITS SAS</Text>
                        <Text style={[styles.subtitle, { textAlign: 'right' }]}>NIT: 900468802-4</Text>
                        <Text style={[styles.subtitle, { textAlign: 'right' }]}>Bogotá D.C.</Text>
                    </View>
                </View>

                {/* Report Metadata */}
                <View style={{ marginBottom: 15 }}>
                    <Text style={[styles.title, { marginBottom: 10, textAlign: 'center' }]}>
                        INGRESOS VENCIDOS PENDIENTES POR REPORTE
                    </Text>

                    <View style={styles.metaSection}>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Exportador</Text>
                            <Text style={styles.metaValue}>{data.exportador.nombre}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Fecha de Corte</Text>
                            <Text style={styles.metaValue}>{data.fecha_actual}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Total Registros</Text>
                            <Text style={styles.metaValue}>{data.total_reportes}</Text>
                        </View>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    {/* Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCellHeader, styles.colGuia]}>Número Guía</Text>
                        <Text style={[styles.tableCellHeader, styles.colFecha]}>Fecha Recep.</Text>
                        <Text style={[styles.tableCellHeader, styles.colFecha]}>Fecha Venc.</Text>
                        <Text style={[styles.tableCellHeader, styles.colDias]}>Días Venc.</Text>
                        <Text style={[styles.tableCellHeader, styles.colFruta]}>Fruta</Text>
                        <Text style={[styles.tableCellHeader, styles.colOrigen]}>Origen</Text>
                        <Text style={[styles.tableCellHeader, styles.colPeso]}>Peso Bruto</Text>
                        <Text style={[styles.tableCellHeader, styles.colNeto]}>Peso Neto</Text>
                        <Text style={[styles.tableCellHeader, styles.colCant]}>Cantidad</Text>
                        <Text style={[styles.tableCellHeader, styles.colEmpaque]}>Empaque</Text>
                    </View>

                    {/* Rows */}
                    {data.reportes_vencidos.map((reporte, index) => (
                        <View
                            key={reporte.id}
                            style={[
                                styles.tableRow,
                                index % 2 === 1 ? styles.tableRowAlt : {} // Zebra striping
                            ]}
                        >
                            <Text style={[styles.tableCell, styles.colGuia]}>
                                {reporte.numero_guia}
                            </Text>
                            <Text style={[styles.tableCell, styles.colFecha]}>
                                {reporte.fecha_llegada}
                            </Text>
                            <Text style={[styles.tableCell, styles.colFecha]}>
                                {reporte.fecha_vencimiento}
                            </Text>
                            <Text style={[styles.tableCell, styles.colDias, styles.vencidoText]}>
                                {reporte.dias_vencidos}
                            </Text>
                            <Text style={[styles.tableCell, styles.colFruta]}>
                                {reporte.fruta}
                            </Text>
                            <Text style={[styles.tableCell, styles.colOrigen]} wrap={false}>
                                {reporte.origen?.substring(0, 20)}
                            </Text>
                            <Text style={[styles.tableCell, styles.colPeso]}>
                                {reporte.peso_bruto_recibido.toLocaleString('es-CO')}
                            </Text>
                            <Text style={[styles.tableCell, styles.colNeto]}>
                                {reporte.peso_neto_recibido.toLocaleString('es-CO')} Kg
                            </Text>
                            <Text style={[styles.tableCell, styles.colCant]}>
                                {reporte.cantidad_empaque_recibida}
                            </Text>
                            <Text style={[styles.tableCell, styles.colEmpaque]} wrap={false}>
                                {reporte.tipo_empaque}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Summary */}
                <View style={styles.summarySection}>
                    <Text style={styles.summaryText}>
                        Total Reportes Pendientes: {data.total_reportes}
                    </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>
                        Generado el {new Date().toLocaleString()} - Sistema de Gestión Comercial
                    </Text>
                    <Text>Heaven&apos;s Fruits SAS - Todos los derechos reservados</Text>
                </View>
            </Page>
        </Document>
    );
};

export default ReportesVencidosPdf;
