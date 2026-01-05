"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Movimiento } from "@/types/inventario";
import {
    ChevronDown,
    Calendar,
    User,
    Box,
    FileText,
    History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface MovementsHistoryTableProps {
    data: Movimiento[];
    loading: boolean;
}

export function MovementsHistoryTable({
    data,
    loading
}: MovementsHistoryTableProps) {
    if (loading) {
        return (
            <div className="w-full h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                No se encontraron registros en el historial.
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-tight text-slate-600">Fecha Movimiento</TableHead>
                        <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-tight text-slate-600">Referencia</TableHead>
                        <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-tight text-slate-600">Tipo Movimiento</TableHead>
                        <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-tight text-slate-600 text-right">Cant. Cajas</TableHead>
                        <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-tight text-slate-600">Propiedad</TableHead>
                        <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-tight text-slate-600">Observaciones</TableHead>
                        <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-tight text-slate-600">Usuario</TableHead>
                        <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-tight text-slate-600">Fecha Registro</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => {
                        const isIngreso = row.bodega_nombre.toLowerCase().includes('ingreso');
                        const isSalida = row.bodega_nombre.toLowerCase().includes('salida');

                        return (
                            <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                <TableCell className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="text-[12px] font-medium text-slate-600 whitespace-nowrap">
                                            {row.fecha_movimiento}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Box className="h-3.5 w-3.5 text-indigo-500" />
                                        <span className="text-[12px] font-bold text-slate-900">
                                            {row.item_historico}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <span className={cn(
                                        "text-[11px] font-semibold tracking-tight",
                                        isIngreso ? "text-emerald-700" : isSalida ? "text-rose-700" : "text-slate-800"
                                    )}>
                                        {row.bodega_nombre}
                                    </span>
                                </TableCell>
                                <TableCell className="px-4 py-3 text-right">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "font-bold text-[11px] border-none",
                                            isSalida ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                                        )}
                                    >
                                        {isSalida ? "-" : "+"}{Math.abs(row.cantidad_cajas_h)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <span className="text-[11px] font-medium text-slate-500">
                                        {row.propiedad}
                                    </span>
                                </TableCell>
                                <TableCell className="px-4 py-3 max-w-[200px]">
                                    <p className="text-[11px] text-slate-500 italic truncate" title={row.observaciones || ''}>
                                        {row.observaciones || '-'}
                                    </p>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                            <User className="h-3 w-3 text-slate-500" />
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-600">
                                            {row.user_username}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                        {new Date(row.fecha).toLocaleString('es-CO', {
                                            dateStyle: 'short',
                                            timeStyle: 'short'
                                        })}
                                    </span>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
