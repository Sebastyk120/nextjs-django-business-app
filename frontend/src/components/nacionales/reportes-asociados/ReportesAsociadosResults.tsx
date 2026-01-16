'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Building, DollarSign } from 'lucide-react';
import type { FacturaAgrupada } from '@/types/nacionales';

interface ReportesAsociadosResultsProps {
    facturas: FacturaAgrupada[];
    totalAPagar: number;
    criterioBusqueda: string | null;
    fechaConsulta: string;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    try {
        return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: es });
    } catch {
        return dateStr;
    }
}

export default function ReportesAsociadosResults({
    facturas,
    totalAPagar,
    criterioBusqueda,
    fechaConsulta,
}: ReportesAsociadosResultsProps) {
    if (facturas.length === 0) {
        return (
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 ring-1 ring-slate-200">
                <CardContent className="py-16 text-center">
                    <div className="bg-slate-100 p-6 rounded-full inline-block mb-4">
                        <FileText className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700">No se encontraron reportes</h3>
                    <p className="text-slate-500 mt-1">
                        Intente con otros criterios de búsqueda
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with criteria */}
            <div className="flex items-center justify-between">
                {criterioBusqueda && (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 px-4 py-1.5 text-sm font-medium">
                        {criterioBusqueda}
                    </Badge>
                )}
                <span className="text-sm text-slate-500">
                    Consulta: {formatDate(fechaConsulta)}
                </span>
            </div>

            {/* Invoice Cards */}
            {facturas.map((factura, index) => (
                <Card
                    key={factura.factura + index}
                    className="bg-white/90 backdrop-blur-sm shadow-lg border-0 ring-1 ring-slate-200 overflow-hidden"
                >
                    {/* Invoice Header */}
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 pb-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <FileText className="h-5 w-5 text-indigo-600" />
                                </div>
                                <CardTitle className="text-lg font-semibold text-slate-800">
                                    Factura: {factura.factura}
                                </CardTitle>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                {factura.fecha_factura && (
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <span>Fecha: {formatDate(factura.fecha_factura)}</span>
                                    </div>
                                )}
                                {factura.vencimiento_factura && (
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <Calendar className="h-4 w-4 text-orange-400" />
                                        <span>Vence: {formatDate(factura.vencimiento_factura)}</span>
                                    </div>
                                )}
                                {factura.exportador && (
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <Building className="h-4 w-4 text-slate-400" />
                                        <span>{factura.exportador}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                                    <DollarSign className="h-4 w-4" />
                                    <span>Subtotal: {formatCurrency(factura.subtotal)}</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    {/* Items Table */}
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="font-semibold text-slate-700">Guía</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Remisión/Reporte</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Fecha Reporte</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Fruta</TableHead>
                                        <TableHead className="font-semibold text-slate-700 text-right">Valor Exp</TableHead>
                                        <TableHead className="font-semibold text-slate-700 text-right">Valor Nal</TableHead>
                                        <TableHead className="font-semibold text-slate-700 text-right">Precio Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {factura.items.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="font-medium text-slate-800">{item.numero_guia || '-'}</TableCell>
                                            <TableCell className="text-slate-600">{item.remision_exp || '-'}</TableCell>
                                            <TableCell className="text-slate-600">{formatDate(item.fecha_reporte)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-800">
                                                    {item.fruta || '-'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-slate-700">
                                                {formatCurrency(item.valor_exp)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-slate-700">
                                                {formatCurrency(item.valor_nal)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-semibold text-slate-800">
                                                {formatCurrency(item.precio_total)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Grand Total */}
            <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 shadow-xl border-0">
                <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                        <span className="text-emerald-100 text-lg font-medium">Total General:</span>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-white">
                                {formatCurrency(totalAPagar)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
