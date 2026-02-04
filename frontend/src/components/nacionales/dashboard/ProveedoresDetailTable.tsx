"use client";

import { useState } from "react";
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
import { Users, ArrowUpRight, ArrowDownRight, TrendingUp, Building2 } from "lucide-react";
import { motion } from "framer-motion";

interface ProveedoresDetailTableProps {
    data: ProveedorDashboardData[];
    loading?: boolean;
}

export function ProveedoresDetailTable({ data, loading }: ProveedoresDetailTableProps) {
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);

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

    // Calculate totals
    const totals = data.reduce((acc, row) => ({
        compras: acc.compras + row.numero_compras,
        reportes: acc.reportes + row.reportes_pendientes,
        valor: acc.valor + row.valor_compras,
        pagado: acc.pagado + row.total_pagado,
        facturado: acc.facturado + row.facturado_exportadores,
        kilos: acc.kilos + row.kilos_netos,
        utilidad: acc.utilidad + row.utilidad_real,
    }), { compras: 0, reportes: 0, valor: 0, pagado: 0, facturado: 0, kilos: 0, utilidad: 0 });

    return (
        <Card className="border-slate-200/60 shadow-soft-md overflow-hidden bg-white">
            <CardHeader className="pb-4 pt-6 px-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200">
                            <Users className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold text-slate-800">
                                Detalle por Proveedor
                            </CardTitle>
                            <p className="text-xs text-slate-500">
                                {data.length} proveedores en el período seleccionado
                            </p>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="hidden lg:flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Utilidad Total</p>
                            <p className={cn(
                                "text-lg font-bold tabular-nums",
                                totals.utilidad >= 0 ? "text-emerald-600" : "text-rose-600"
                            )}>
                                {formatCurrency(totals.utilidad)}
                            </p>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="relative inline-block mb-4">
                            <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 border-t-slate-600" />
                        </div>
                        <p className="text-slate-500 font-medium">Cargando datos de proveedores...</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="p-4 rounded-full bg-slate-100 inline-block mb-3">
                            <Users className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">No hay datos para mostrar</p>
                        <p className="text-xs text-slate-400 mt-1">Ajusta los filtros para ver resultados</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
                                    <TableHead className="font-semibold text-slate-700 w-[200px] py-4">
                                        Proveedor
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-center py-4">
                                        Compras
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-center py-4">
                                        Reportes
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right py-4">
                                        Valor Compras
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right py-4">
                                        Total Pagado
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right py-4">
                                        Facturado
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right py-4">
                                        Kilos Netos
                                    </TableHead>
                                    <TableHead className="font-semibold text-emerald-700 text-right py-4">
                                        Utilidad Real
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right py-4">
                                        % Kilos
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right py-4">
                                        % Util.
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right py-4">
                                        Margen
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {data.map((row, index) => (
                                    <motion.tr
                                        key={index}
                                        className={cn(
                                            "border-b border-slate-100 transition-colors duration-200",
                                            hoveredRow === index ? "bg-slate-50" : "bg-white"
                                        )}
                                        onMouseEnter={() => setHoveredRow(index)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: index * 0.03 }}
                                    >
                                        <TableCell className="font-medium text-slate-900 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-slate-100">
                                                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                                                </div>
                                                <span className="truncate max-w-[140px]">{row.proveedor_nombre}</span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center tabular-nums text-slate-600 py-4">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-semibold">
                                                {row.numero_compras}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-center py-4">
                                            {row.reportes_pendientes > 0 ? (
                                                <Badge
                                                    variant="destructive"
                                                    className="text-xs font-semibold px-2.5 py-1"
                                                >
                                                    {row.reportes_pendientes}
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs font-semibold text-emerald-600 border-emerald-200 bg-emerald-50 px-2.5 py-1"
                                                >
                                                    0
                                                </Badge>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-right tabular-nums text-slate-600 py-4">
                                            {formatCurrency(row.valor_compras)}
                                        </TableCell>

                                        <TableCell className="text-right tabular-nums text-slate-600 py-4">
                                            {formatCurrency(row.total_pagado)}
                                        </TableCell>

                                        <TableCell className="text-right tabular-nums text-slate-600 py-4">
                                            {formatCurrency(row.facturado_exportadores)}
                                        </TableCell>

                                        <TableCell className="text-right tabular-nums text-slate-600 py-4">
                                            {formatNumber(row.kilos_netos)}
                                        </TableCell>

                                        <TableCell className={cn(
                                            "text-right tabular-nums font-bold py-4",
                                            row.utilidad_real >= 0 ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            <div className="flex items-center justify-end gap-1">
                                                {row.utilidad_real >= 0 ? (
                                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                                ) : (
                                                    <ArrowDownRight className="h-3.5 w-3.5" />
                                                )}
                                                {formatCurrency(row.utilidad_real)}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-right tabular-nums text-slate-500 text-xs py-4">
                                            {formatPercent(row.percent_kilos)}
                                        </TableCell>

                                        <TableCell className="text-right tabular-nums text-slate-500 text-xs py-4">
                                            {formatPercent(row.percent_utilidad)}
                                        </TableCell>

                                        <TableCell className={cn(
                                            "text-right tabular-nums text-xs font-bold py-4",
                                            row.percent_utilidad_compra >= 0 ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            <div className="flex items-center justify-end gap-1">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    row.percent_utilidad_compra >= 15 ? "bg-emerald-500" :
                                                    row.percent_utilidad_compra >= 0 ? "bg-amber-500" : "bg-rose-500"
                                                )} />
                                                {formatPercent(row.percent_utilidad_compra)}
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
