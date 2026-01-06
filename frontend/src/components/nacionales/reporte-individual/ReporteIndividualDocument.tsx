'use client';

import React, { forwardRef } from 'react';
import type { ReporteIndividualResponse } from '@/types/nacionales';
import { formatCurrency, formatNumber, formatDate, numeroALetras } from '@/lib/utils';

interface ReporteIndividualDocumentProps {
    data: ReporteIndividualResponse;
}

const ReporteIndividualDocument = forwardRef<HTMLDivElement, ReporteIndividualDocumentProps>(
    ({ data }, ref) => {
        const { proveedor, compra, venta, reporte_proveedor, today } = data;

        const totalExportacion = reporte_proveedor.p_kg_exportacion * reporte_proveedor.p_precio_kg_exp;
        const totalNacional = reporte_proveedor.p_kg_nacional * reporte_proveedor.p_precio_kg_nal;
        const totalRetenciones = reporte_proveedor.asohofrucol + reporte_proveedor.rte_fte + reporte_proveedor.rte_ica;

        return (
            <div
                ref={ref}
                className="bg-white mx-auto font-sans text-gray-800"
                style={{
                    width: '279mm',
                    minHeight: '432mm',
                    padding: '15mm',
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                <style jsx>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
                    
                    @keyframes shimmer {
                        0% { transform: translateX(-100%) rotate(45deg); }
                        100% { transform: translateX(100%) rotate(45deg); }
                    }
                    
                    .shimmer-effect::before {
                        content: '';
                        position: absolute;
                        top: -50%;
                        left: -50%;
                        width: 200%;
                        height: 200%;
                        background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
                        transform: rotate(45deg);
                        animation: shimmer 3s infinite;
                    }
                    
                    @media print {
                        .shimmer-effect::before {
                            display: none;
                        }
                    }
                `}</style>

                {/* Header */}
                <header className="flex justify-between items-start pb-4 border-b-[3px] border-blue-600 mb-6">
                    <div className="invoice-logo">
                        <img
                            src="/img/heavens.webp"
                            alt="Logo Heaven's Fruits"
                            className="max-w-[160px] h-auto"
                        />
                    </div>
                    <div className="text-right">
                        <h1 className="text-[1.75rem] text-blue-600 font-bold mb-1">
                            Heaven&apos;s Fruits SAS
                        </h1>
                        <p className="text-[0.9rem] text-gray-600 mb-0.5">Reporte De Ingreso Fruta</p>
                        <p className="text-[0.9rem] text-gray-600">NIT: 900468802-4</p>
                    </div>
                </header>

                {/* Info Section */}
                <section className="flex justify-between gap-6 mb-6 p-4 bg-gray-100 rounded-lg">
                    <div className="flex-1">
                        <h2 className="text-[0.9rem] font-semibold uppercase text-blue-800 mb-3 pb-1.5 border-b border-gray-300">
                            Información del Documento
                        </h2>
                        <p className="text-[0.9rem] text-gray-700 mb-1.5">
                            Fecha: <strong className="text-gray-900 font-medium">{formatDate(today)}</strong>
                        </p>
                        <p className="text-[0.9rem] text-gray-700 mb-1.5">
                            Ciudad: <strong className="text-gray-900 font-medium">Bogotá D.C.</strong>
                        </p>
                        <p className="text-[0.9rem] text-gray-700">
                            Fruta: <strong className="text-gray-900 font-medium">{compra.fruta_nombre}</strong>
                        </p>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-[0.9rem] font-semibold uppercase text-blue-800 mb-3 pb-1.5 border-b border-gray-300">
                            Reporte
                        </h2>
                        <p className="text-[0.9rem] text-gray-700 mb-1.5">
                            No. Reporte: <strong className="text-[1.25rem] font-bold text-blue-600">{reporte_proveedor.pk}</strong>
                        </p>
                        <p className="text-[0.9rem] text-gray-700">
                            Número de guía: <strong className="text-gray-900 font-medium">{compra.numero_guia}</strong>
                        </p>
                    </div>
                </section>

                {/* Provider Data */}
                <section className="mb-6 p-5 border border-gray-200 rounded-lg bg-white">
                    <h2 className="text-[1.1rem] text-blue-600 mb-4 font-semibold">
                        Datos del Proveedor
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="text-[0.9rem]">
                            <span className="font-semibold text-gray-700 mr-2">Nombre:</span>
                            {proveedor.nombre}
                        </div>
                        <div className="text-[0.9rem]">
                            <span className="font-semibold text-gray-700 mr-2">NIT/C.C:</span>
                            {proveedor.nit || 'N/A'}
                        </div>
                        <div className="text-[0.9rem]">
                            <span className="font-semibold text-gray-700 mr-2">Ciudad:</span>
                            {proveedor.ciudad || 'N/A'}
                        </div>
                        <div className="text-[0.9rem]">
                            <span className="font-semibold text-gray-700 mr-2">Fecha de ingreso:</span>
                            {formatDate(venta.fecha_llegada)}
                        </div>
                    </div>
                </section>

                {/* Items Table */}
                <section className="mb-6">
                    <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
                        <thead>
                            <tr>
                                <th className="bg-blue-800 text-white py-3 px-4 text-left font-semibold text-[0.85rem] uppercase">
                                    Detalle
                                </th>
                                <th className="bg-blue-800 text-white py-3 px-4 text-left font-semibold text-[0.85rem] uppercase">
                                    % Calidad
                                </th>
                                <th className="bg-blue-800 text-white py-3 px-4 text-right font-semibold text-[0.85rem] uppercase">
                                    Cantidad
                                </th>
                                <th className="bg-blue-800 text-white py-3 px-4 text-right font-semibold text-[0.85rem] uppercase">
                                    Precio Unit.
                                </th>
                                <th className="bg-blue-800 text-white py-3 px-4 text-right font-semibold text-[0.85rem] uppercase">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="even:bg-gray-50">
                                <td className="py-3 px-4 border-b border-gray-200 text-[0.9rem] text-gray-700">
                                    Kg Exportación
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-[0.9rem] text-gray-700">
                                    {reporte_proveedor.p_porcentaje_exportacion.toFixed(2)}%
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-[0.9rem] text-gray-700 text-right">
                                    {formatNumber(reporte_proveedor.p_kg_exportacion)} Kg
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-[0.9rem] text-gray-700 text-right">
                                    {formatCurrency(reporte_proveedor.p_precio_kg_exp)}
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-[0.9rem] text-gray-700 text-right">
                                    {formatCurrency(totalExportacion)}
                                </td>
                            </tr>
                            <tr className="even:bg-gray-50">
                                <td className="py-3 px-4 border-b border-gray-200 text-[0.9rem] text-gray-700">
                                    Kg Nacional
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-[0.9rem] text-gray-700">
                                    {reporte_proveedor.p_porcentaje_nacional.toFixed(2)}%
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-[0.9rem] text-gray-700 text-right">
                                    {formatNumber(reporte_proveedor.p_kg_nacional)} Kg
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-[0.9rem] text-gray-700 text-right">
                                    {formatCurrency(reporte_proveedor.p_precio_kg_nal)}
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-[0.9rem] text-gray-700 text-right">
                                    {formatCurrency(totalNacional)}
                                </td>
                            </tr>
                            <tr className="even:bg-gray-50">
                                <td className="py-3 px-4 text-[0.9rem] text-gray-700">
                                    Kg Merma
                                </td>
                                <td className="py-3 px-4 text-[0.9rem] text-gray-700">
                                    {reporte_proveedor.p_porcentaje_merma.toFixed(2)}%
                                </td>
                                <td className="py-3 px-4 text-[0.9rem] text-gray-700 text-right">
                                    {formatNumber(reporte_proveedor.p_kg_merma)} Kg
                                </td>
                                <td className="py-3 px-4 text-[0.9rem] text-gray-700 text-right">
                                    $0
                                </td>
                                <td className="py-3 px-4 text-[0.9rem] text-gray-700 text-right">
                                    $0
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                                <td colSpan={2} className="py-4 px-4 text-[0.9rem] font-medium text-gray-800">
                                    Kg Totales: {formatNumber(reporte_proveedor.p_kg_totales)} Kg
                                </td>
                                <td colSpan={3} className="py-4 px-4 text-[1rem] font-medium text-right text-gray-800">
                                    Subtotal antes de retenciones
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </section>

                {/* Total a Facturar - PROMINENTE */}
                <section 
                    className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 text-white p-8 rounded-xl my-8 text-center shadow-lg shimmer-effect"
                >
                    <div className="relative z-10">
                        <div className="text-[1.1rem] font-semibold mb-2 opacity-90 uppercase tracking-wider">
                            Total Que Debe Facturar el Proveedor
                        </div>
                        <div className="text-[3rem] font-extrabold my-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                            {formatCurrency(reporte_proveedor.p_total_facturar)}
                        </div>
                        <div className="mt-4 p-4 bg-white/15 rounded-lg text-[1rem] italic text-center">
                            Son: {numeroALetras(reporte_proveedor.p_total_facturar)}
                        </div>
                        <div className="mt-3 text-[0.9rem] opacity-80 font-normal">
                            Este es el valor total que debe aparecer en su factura (incluye retenciones)
                        </div>
                    </div>
                </section>

                {/* Impuestos y Retenciones */}
                <section className="mb-6 border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <h2 className="py-3 px-4 bg-purple-100 text-purple-700 text-[1rem] font-semibold m-0">
                        Impuestos y Retenciones
                    </h2>
                    <table className="w-full border-collapse">
                        <tbody>
                            <tr>
                                <td className="py-2.5 px-4 border-b border-gray-200 text-[0.9rem] text-gray-700">
                                    Asohofrucol (1%)
                                </td>
                                <td className="py-2.5 px-4 border-b border-gray-200 text-[0.9rem] text-gray-800 text-right font-semibold">
                                    {formatCurrency(reporte_proveedor.asohofrucol)}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2.5 px-4 border-b border-gray-200 text-[0.9rem] text-gray-700">
                                    Retefuente (1,50%)
                                </td>
                                <td className="py-2.5 px-4 border-b border-gray-200 text-[0.9rem] text-gray-800 text-right font-semibold">
                                    {formatCurrency(reporte_proveedor.rte_fte)}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2.5 px-4 border-b border-gray-200 text-[0.9rem] text-gray-700">
                                    Reteica (4,14/1000)
                                </td>
                                <td className="py-2.5 px-4 border-b border-gray-200 text-[0.9rem] text-gray-800 text-right font-semibold">
                                    {formatCurrency(reporte_proveedor.rte_ica)}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2.5 px-4 text-[0.9rem] text-gray-700">
                                    <strong>Total Impuestos y Retenciones:</strong>
                                </td>
                                <td className="py-2.5 px-4 text-[0.9rem] text-right font-semibold text-purple-700">
                                    <strong>{formatCurrency(totalRetenciones)}</strong>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                {/* Total a Pagar - DISCRETO */}
                <section className="bg-gray-100 border border-gray-300 text-gray-700 py-4 px-6 rounded-lg mb-6 text-right">
                    <span className="text-[0.9rem] font-medium text-gray-600 block mb-1">
                        Total Neto a Pagar (Heaven&apos;s Fruits al Proveedor):
                    </span>
                    <span className="text-[1.25rem] font-semibold text-gray-800 block">
                        {formatCurrency(reporte_proveedor.p_total_pagar)}
                    </span>
                </section>

                {/* Resumen de Categorías */}
                <section className="mb-6 p-5 bg-gray-100 rounded-lg">
                    <h2 className="text-center text-[1.1rem] font-semibold text-blue-800 mb-4">
                        Resumen de Categorías de Fruta
                    </h2>
                    <div className="flex justify-around gap-4">
                        <div className="flex-1 p-4 bg-white rounded shadow-sm text-center border-t-4 border-green-500">
                            <div className="text-[0.85rem] font-semibold text-gray-700 mb-1 uppercase">
                                Exportación
                            </div>
                            <div className="text-[1.25rem] font-bold text-gray-900 mb-1">
                                {formatNumber(reporte_proveedor.p_kg_exportacion)} Kg
                            </div>
                            <div className="text-[0.8rem] text-gray-500">
                                {reporte_proveedor.p_porcentaje_exportacion.toFixed(2)}%
                            </div>
                        </div>
                        <div className="flex-1 p-4 bg-white rounded shadow-sm text-center border-t-4 border-orange-500">
                            <div className="text-[0.85rem] font-semibold text-gray-700 mb-1 uppercase">
                                Nacional
                            </div>
                            <div className="text-[1.25rem] font-bold text-gray-900 mb-1">
                                {formatNumber(reporte_proveedor.p_kg_nacional)} Kg
                            </div>
                            <div className="text-[0.8rem] text-gray-500">
                                {reporte_proveedor.p_porcentaje_nacional.toFixed(2)}%
                            </div>
                        </div>
                        <div className="flex-1 p-4 bg-white rounded shadow-sm text-center border-t-4 border-red-500">
                            <div className="text-[0.85rem] font-semibold text-gray-700 mb-1 uppercase">
                                Merma
                            </div>
                            <div className="text-[1.25rem] font-bold text-gray-900 mb-1">
                                {formatNumber(reporte_proveedor.p_kg_merma)} Kg
                            </div>
                            <div className="text-[0.8rem] text-gray-500">
                                {reporte_proveedor.p_porcentaje_merma.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="text-center text-gray-500 text-[0.8rem] mt-8 pt-4 border-t border-gray-300">
                    <p className="mb-1">© {new Date().getFullYear()} Heaven&apos;s Fruits SAS. Todos los derechos reservados.</p>
                    <p>Este documento es un soporte de liquidación y fue generado automáticamente.</p>
                </footer>
            </div>
        );
    }
);

ReporteIndividualDocument.displayName = 'ReporteIndividualDocument';

export default ReporteIndividualDocument;
