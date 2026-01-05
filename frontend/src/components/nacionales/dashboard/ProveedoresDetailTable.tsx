"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProveedorDashboardData } from "@/types/nacionales-dashboard";
import { cn } from "@/lib/utils";

interface ProveedoresDetailTableProps {
    data: ProveedorDashboardData[];
    loading?: boolean;
}

export function ProveedoresDetailTable({ data, loading }: ProveedoresDetailTableProps) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    };

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat('es-CO').format(val);
    };

    const formatPercent = (val: number) => {
        return `${val.toFixed(2)}%`;
    };

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                <CardTitle className="text-base font-semibold text-slate-800">
                    Detalle por Proveedor
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        Cargando datos...
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        No hay datos para mostrar
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[500px]">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="font-semibold text-slate-700 w-[180px]">Proveedor</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-center">Nº Compras</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-center">Reportes Pend.</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">Valor Compras</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">Total Pagado</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">Facturado Exp.</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">Kilos Netos</TableHead>
                                    <TableHead className="font-semibold text-emerald-700 text-right">Utilidad Real</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">% Kilos</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">% Utilidad</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">% Util/Compra</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((row, index) => (
                                    <TableRow key={index} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-medium text-slate-900 sticky left-0 bg-white md:static">
                                            {row.proveedor_nombre}
                                        </TableCell>
                                        <TableCell className="text-center tabular-nums text-slate-600">
                                            {row.numero_compras}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {row.reportes_pendientes > 0 ? (
                                                <Badge variant="destructive" className="text-xs">
                                                    {row.reportes_pendientes}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
                                                    0
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-slate-600">
                                            {formatCurrency(row.valor_compras)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-slate-600">
                                            {formatCurrency(row.total_pagado)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-slate-600">
                                            {formatCurrency(row.facturado_exportadores)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-slate-600">
                                            {formatNumber(row.kilos_netos)}
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-right tabular-nums font-medium",
                                            row.utilidad_real >= 0 ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {formatCurrency(row.utilidad_real)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-slate-500 text-xs">
                                            {formatPercent(row.percent_kilos)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-slate-500 text-xs">
                                            {formatPercent(row.percent_utilidad)}
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-right tabular-nums text-xs font-medium",
                                            row.percent_utilidad_compra >= 0 ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {formatPercent(row.percent_utilidad_compra)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
