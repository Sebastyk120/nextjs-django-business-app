"use client";

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
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Inventario } from "@/types/inventario";
import {
    ChevronDown,
    MoreHorizontal,
    Pencil,
    Trash2,
    ArrowUpDown,
    AlertCircle,
    CheckCircle2,
    History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface InventoryTableProps {
    data: Inventario[];
    loading: boolean;
    onEdit?: (item: Inventario) => void;
    onDelete?: (item: Inventario) => void;
    userGroups?: string[];
}

export function InventoryTable({
    data,
    loading,
    onEdit,
    onDelete,
    userGroups = []
}: InventoryTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof Inventario; direction: 'asc' | 'desc' } | null>(null);

    // Columns Configuration
    const columns = [
        { key: 'numero_item_nombre', label: 'Referencia', sortable: true },
        { key: 'exportador_nombre', label: 'Exportador', sortable: true },
        { key: 'compras_efectivas', label: 'Compras Efec.', sortable: true, format: 'number' },
        { key: 'saldos_iniciales', label: 'Saldos Ini.', sortable: true, format: 'number' },
        { key: 'salidas', label: 'Salidas/Bajas', sortable: true, format: 'number' },
        { key: 'traslado_propio', label: 'Trasl. Propio', sortable: true, format: 'number' },
        { key: 'traslado_remisionado', label: 'Trasl. Remis.', sortable: true, format: 'number' },
        { key: 'ventas', label: 'Ventas', sortable: true, format: 'number' },
        { key: 'venta_contenedor', label: 'Venta Cont.', sortable: true, format: 'number' },
        { key: 'stock_actual', label: 'Stock Actual', sortable: true, format: 'stock' },
    ];

    const handleSort = (key: keyof Inventario) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return sortConfig.direction === 'asc'
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue));
    });

    const formatValue = (value: any, type?: string) => {
        if (value === null || value === undefined) return '-';
        if (type === 'number') return value.toLocaleString('es-CO');
        if (type === 'stock') {
            const num = Number(value);
            let colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";

            if (num < 0) {
                colorClass = "bg-rose-50 text-rose-700 border-rose-100";
            } else if (num === 0) {
                colorClass = "bg-slate-50 text-slate-600 border-slate-200";
            } else if (num < 100) {
                colorClass = "bg-amber-50 text-amber-700 border-amber-100";
            }

            return (
                <div className={cn("inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-bold border", colorClass)}>
                    {num.toLocaleString()}
                </div>
            );
        }
        return value;
    };

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
                No se encontraron registros de inventario.
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow className="hover:bg-transparent border-slate-200">
                        {columns.map((col) => (
                            <TableHead key={col.key} className="h-10 px-2 py-2 text-[11px] font-semibold uppercase tracking-tight text-slate-600 whitespace-nowrap">
                                <div className="flex items-center">
                                    {col.label}
                                    {col.sortable && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleSort(col.key as keyof Inventario)}
                                            className="h-6 w-6 p-0 ml-1 hover:bg-slate-200"
                                        >
                                            <ChevronDown className={cn(
                                                "h-3 w-3 transition-transform",
                                                sortConfig?.key === col.key && sortConfig.direction === 'desc' ? "rotate-180" : ""
                                            )} />
                                        </Button>
                                    )}
                                </div>
                            </TableHead>
                        ))}
                        <TableHead className="w-[40px] px-2 text-[10px] font-black uppercase text-slate-400 text-center">
                            Acc.
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedData.map((row) => (
                        <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                            {columns.map((col) => (
                                <TableCell key={`${row.id}-${col.key}`} className={cn(
                                    "px-2 py-1.5 text-[12px] whitespace-nowrap whitespace-nowrap",
                                    col.key === 'numero_item_nombre' ? "font-bold text-slate-900" : "font-medium text-slate-600",
                                    col.format === 'number' || col.format === 'stock' ? "text-right" : "text-left"
                                )}>
                                    {formatValue(row[col.key as keyof Inventario], col.format)}
                                </TableCell>
                            ))}
                            <TableCell className="px-2 py-1.5 text-center">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-slate-200 rounded-full bg-slate-100/50">
                                            <MoreHorizontal className="h-4 w-4 text-slate-600" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuCheckboxItem
                                            className="py-2 cursor-pointer"
                                            onClick={() => onEdit?.(row)}
                                        >
                                            <History className="mr-2 h-4 w-4 text-indigo-500" />
                                            Ver Historial
                                        </DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem
                                            className="py-2 cursor-pointer"
                                            onClick={() => onEdit?.(row)}
                                        >
                                            <Pencil className="mr-2 h-4 w-4 text-slate-400" />
                                            Ajustar
                                        </DropdownMenuCheckboxItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
