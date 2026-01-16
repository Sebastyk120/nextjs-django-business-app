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
import { ChevronDown, ChevronUp, Package, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { EstadoCuentaCompra } from "@/types/nacionales";

interface ComprasProveedorTableProps {
    compras: EstadoCuentaCompra[];
}

const formatCurrency = (value: number | null): string => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const formatNumber = (value: number | null): string => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat('es-CO', {
        maximumFractionDigits: 2,
    }).format(value);
};

const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

function ValueCell({ value, showColor = false }: { value: number | null; showColor?: boolean }) {
    if (value === null || value === undefined) {
        return <span className="text-slate-400">-</span>;
    }
    
    const formatted = formatCurrency(value);
    
    if (showColor) {
        return (
            <span className={cn(
                "font-medium",
                value > 0 ? "text-emerald-600" : value < 0 ? "text-rose-600" : "text-slate-600"
            )}>
                {formatted}
            </span>
        );
    }
    
    return <span>{formatted}</span>;
}

function ProgressBar({ value }: { value: number }) {
    const percentage = Math.min(100, Math.max(0, value));
    const isComplete = percentage === 100;
    
    return (
        <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all",
                        isComplete ? "bg-emerald-500" : "bg-amber-500"
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className={cn(
                "text-xs font-medium",
                isComplete ? "text-emerald-600" : "text-amber-600"
            )}>
                {percentage.toFixed(0)}%
            </span>
        </div>
    );
}

const COLLAPSE_THRESHOLD = 25;

export function ComprasProveedorTable({ compras }: ComprasProveedorTableProps) {
    const [isExpanded, setIsExpanded] = useState(compras.length <= COLLAPSE_THRESHOLD);

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader 
                className="cursor-pointer hover:bg-slate-50 transition-colors py-3"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <Package className="h-4 w-4 text-indigo-600" />
                        Compras Realizadas
                        <span className="text-xs font-normal text-slate-500 ml-2">
                            ({compras.length} registros)
                        </span>
                    </CardTitle>
                    {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                </div>
            </CardHeader>
            
            {isExpanded && (
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="text-xs font-semibold text-slate-600">Fecha</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600">Guía</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600">Fruta</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Peso (kg)</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Precio Exp</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Precio Nal</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Total a Pagar</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Utilidad</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Util. Sin Ajuste</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Diferencia</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600">Progreso</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {compras.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <Info className="h-8 w-8" />
                                                <span>No hay compras en este período</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    compras.map((compra) => (
                                        <TableRow key={compra.id} className="hover:bg-slate-50/50">
                                            <TableCell className="text-sm">{formatDate(compra.fecha_compra)}</TableCell>
                                            <TableCell className="text-sm font-medium">{compra.numero_guia}</TableCell>
                                            <TableCell className="text-sm">{compra.fruta_nombre}</TableCell>
                                            <TableCell className="text-sm text-right tabular-nums">
                                                {formatNumber(compra.peso_compra)}
                                            </TableCell>
                                            <TableCell className="text-sm text-right tabular-nums">
                                                {formatCurrency(compra.precio_compra_exp)}
                                            </TableCell>
                                            <TableCell className="text-sm text-right tabular-nums">
                                                {formatCurrency(compra.precio_compra_nal)}
                                            </TableCell>
                                            <TableCell className="text-sm text-right tabular-nums">
                                                {formatCurrency(compra.total_pagar)}
                                            </TableCell>
                                            <TableCell className="text-sm text-right">
                                                <ValueCell value={compra.utilidad} showColor />
                                            </TableCell>
                                            <TableCell className="text-sm text-right">
                                                <ValueCell value={compra.utilidad_sin_ajuste} showColor />
                                            </TableCell>
                                            <TableCell className="text-sm text-right">
                                                <ValueCell value={compra.diferencia_utilidad} showColor />
                                            </TableCell>
                                            <TableCell>
                                                <ProgressBar value={compra.porcentaje_completitud} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
