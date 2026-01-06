
"use client";

import React from "react";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ClipboardList, Calendar } from "lucide-react";
import type { ReporteVencido, Exportador } from "@/types/nacionales";

interface ReportesVencidosTableProps {
    reportes: ReporteVencido[];
    exportador: Exportador | null;
    fechaConsulta: string;
}

export function ReportesVencidosTable({
    reportes,
    exportador,
    fechaConsulta
}: ReportesVencidosTableProps) {
    if (reportes.length === 0) {
        return (
            <Card className="border-slate-200 shadow-sm bg-slate-50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <ClipboardList className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        Sin Ingresos Vencidos Pendientes
                    </h3>
                    <p className="text-slate-500 max-w-sm">
                        No se encontraron ingresos vencidos para el exportador seleccionado a la fecha actual.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
                        <ClipboardList className="h-5 w-5 text-emerald-600" />
                        Ingresos Vencidos Pendientes por Reporte
                    </CardTitle>
                    {exportador && (
                        <p className="text-sm text-slate-500 mt-1">
                            Exportador: <span className="font-medium text-slate-700">{exportador.nombre}</span>
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <Calendar className="h-4 w-4" />
                    <span>Consulta: {fechaConsulta}</span>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-700">Número Guía</TableHead>
                                <TableHead className="font-semibold text-slate-700">Fecha Recep.</TableHead>
                                <TableHead className="font-semibold text-slate-700">Fecha Venc.</TableHead>
                                <TableHead className="font-semibold text-red-600">Días Venc.</TableHead>
                                <TableHead className="font-semibold text-slate-700">Fruta</TableHead>
                                <TableHead className="font-semibold text-slate-700 min-w-[150px]">Origen de Compra</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-right">Peso Bruto</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-right">Peso Neto</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-center">Cantidad</TableHead>
                                <TableHead className="font-semibold text-slate-700">Tipo Empaque</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportes.map((reporte) => (
                                <TableRow key={reporte.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium text-slate-900">
                                        {reporte.numero_guia}
                                    </TableCell>
                                    <TableCell className="text-slate-600 whitespace-nowrap">
                                        {format(new Date(reporte.fecha_llegada), 'dd/MM/yy')}
                                    </TableCell>
                                    <TableCell className="text-slate-600 whitespace-nowrap">
                                        {format(new Date(reporte.fecha_vencimiento), 'dd/MM/yy')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 px-2 py-1 rounded w-fit">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            {reporte.dias_vencidos}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-700">{reporte.fruta}</TableCell>
                                    <TableCell className="text-slate-600">{reporte.origen}</TableCell>
                                    <TableCell className="text-right text-slate-700 font-medium">
                                        {reporte.peso_bruto_recibido.toLocaleString('es-CO')}
                                    </TableCell>
                                    <TableCell className="text-right text-slate-700 font-medium">
                                        {reporte.peso_neto_recibido.toLocaleString('es-CO')}
                                    </TableCell>
                                    <TableCell className="text-center text-slate-700">
                                        {reporte.cantidad_empaque_recibida}
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm">
                                        {reporte.tipo_empaque}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
                    <div className="flex items-center gap-4 text-slate-700">
                        <span className="text-sm font-medium uppercase tracking-wide text-slate-500">
                            Total Reportes:
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-emerald-700">
                                {reportes.length}
                            </span>
                            <span className="text-sm text-slate-500">pendientes por procesar</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
