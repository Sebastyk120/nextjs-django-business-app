"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Referencia } from "@/types/comercial";
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Box,
    Package,
    Plane
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReferenciasTableProps {
    data: Referencia[];
    loading: boolean;
    userGroups: string[];
    onEdit: (item: Referencia) => void;
    onDelete: (item: Referencia) => void;
}

export function ReferenciasTable({
    data,
    loading,
    userGroups,
    onEdit,
    onDelete
}: ReferenciasTableProps) {
    // Permission check for Deletion: Only Heavens/Superuser
    const canDelete = userGroups.includes("Heavens") || userGroups.includes("Superuser") || userGroups.includes("Autorizadores");

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
                No se encontraron referencias.
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-tight text-slate-600">Referencia</TableHead>
                        <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-tight text-slate-600">Ref. Nueva</TableHead>
                        <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-tight text-slate-600">Exportador</TableHead>
                        <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-tight text-slate-600">Contenedor</TableHead>
                        <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-tight text-slate-600 text-right">Cant. Cont</TableHead>
                        <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-tight text-slate-600 text-right">Precio</TableHead>
                        <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-tight text-slate-600 text-center">% Peso</TableHead>
                        <TableHead className="h-11 w-[60px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors border-slate-100 group">
                            <TableCell className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                        <Box className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                                        {row.nombre}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                                <span className="text-xs text-slate-600 font-mono">
                                    {row.referencia_nueva || "-"}
                                </span>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100 text-[10px]">
                                    {row.exportador_nombre}
                                </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                                <span className="text-[11px] text-slate-600 truncate max-w-[120px] block" title={row.contenedor_nombre}>
                                    {row.contenedor_nombre || "-"}
                                </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right">
                                <span className="text-xs font-semibold text-slate-800">
                                    {row.cant_contenedor || 0}
                                </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right">
                                <span className={cn(
                                    "text-xs font-bold",
                                    Number(row.precio) > 0 ? "text-emerald-600" : "text-slate-400"
                                )}>
                                    ${Number(row.precio).toFixed(2)}
                                </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center">
                                <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {Number(row.porcentaje_peso_bruto).toFixed(1)}%
                                </span>
                            </TableCell>
                            <TableCell className="px-2 py-3 sticky right-0 bg-white/95 backdrop-blur-sm shadow-[-4px_0_5px_-3px_rgba(0,0,0,0.05)] z-10 border-l border-slate-100/50">
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                        onClick={() => onEdit(row)}
                                        title="Editar Referencia"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    {canDelete && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                            onClick={() => onDelete(row)}
                                            title="Eliminar Referencia"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
