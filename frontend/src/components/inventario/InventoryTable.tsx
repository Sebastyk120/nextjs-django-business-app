"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inventario } from "@/types/inventario";
import {
    ChevronDown,
    MoreHorizontal,
    Pencil,
    History,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    AlertCircle,
    Box
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
interface InventoryTableProps {
    data: Inventario[];
    loading: boolean;
    onEdit?: (item: Inventario) => void;
    onDelete?: (item: Inventario) => void;
    userGroups?: string[];
    totals?: {
        compras_efectivas: number;
        saldos_iniciales: number;
        salidas: number;
        traslado_propio: number;
        traslado_remisionado: number;
        ventas: number;
        stock_actual: number;
    };
}

const exporterColors: Record<string, string> = {
    Etnico: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Fieldex: "bg-blue-50 text-blue-700 border-blue-200",
    "Juan Matas": "bg-amber-50 text-amber-700 border-amber-200",
    "CI Dorado": "bg-purple-50 text-purple-700 border-purple-200",
};

export function InventoryTable({
    data,
    loading,
    onEdit,
    userGroups = [],
    totals
}: InventoryTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof Inventario; direction: 'asc' | 'desc' } | null>(null);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);

    // Columns Configuration
    const columns = [
        { key: 'numero_item_nombre', label: 'Referencia', sortable: true, width: 'w-[200px]' },
        { key: 'exportador_nombre', label: 'Exportador', sortable: true, width: 'w-[120px]' },
        { key: 'compras_efectivas', label: 'Compras', sortable: true, format: 'number', width: 'w-[90px]' },
        { key: 'saldos_iniciales', label: 'Saldos Ini.', sortable: true, format: 'number', width: 'w-[90px]' },
        { key: 'salidas', label: 'Salidas', sortable: true, format: 'number', width: 'w-[90px]' },
        { key: 'traslado_propio', label: 'Trasl. Propio', sortable: true, format: 'number', width: 'w-[100px]' },
        { key: 'traslado_remisionado', label: 'Trasl. Remis.', sortable: true, format: 'number', width: 'w-[100px]' },
        { key: 'ventas', label: 'Ventas', sortable: true, format: 'number', width: 'w-[100px]' },
        { key: 'stock_actual', label: 'Stock Actual', sortable: true, format: 'stock', width: 'w-[120px]' },
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

    const getStockStatus = (value: number) => {
        if (value <= 0) return { variant: "out", label: "Agotado", icon: AlertCircle };
        if (value < 50) return { variant: "low", label: "Bajo", icon: ArrowDownRight };
        return { variant: "ok", label: "OK", icon: ArrowUpRight };
    };

    const formatValue = (value: any, type?: string, key?: string) => {
        if (value === null || value === undefined) return <span className="text-slate-300">-</span>;

        if (type === 'number') {
            const num = Number(value);
            if (num === 0) return <span className="text-slate-300">-</span>;

            // Define which columns are "outgoing"
            const isOutgoing = ['salidas', 'traslado_propio', 'traslado_remisionado', 'ventas'].includes(key || '');
            
            return (
                <span className={cn(
                    "font-bold",
                    isOutgoing ? "text-rose-600" : "text-emerald-600"
                )}>
                    {isOutgoing ? "-" : ""}{num.toLocaleString('es-CO')}
                </span>
            );
        }

        if (type === 'stock') {
            const num = Number(value);
            const status = getStockStatus(num);
            const Icon = status.icon;

            let badgeClass = "bg-emerald-500 text-white border-emerald-600";
            if (status.variant === "out") {
                badgeClass = "bg-rose-500 text-white border-rose-600";
            } else if (status.variant === "low") {
                badgeClass = "bg-amber-500 text-white border-amber-600 shadow-amber-100";
            }

            return (
                <div className="flex items-center justify-end gap-2">
                    <Badge
                        variant="outline"
                        className={cn(
                            "font-black px-2.5 py-1 text-xs border shadow-md min-w-[65px] justify-center gap-1",
                            badgeClass
                        )}
                    >
                        <Icon className="h-3 w-3" />
                        {num.toLocaleString()}
                    </Badge>
                </div>
            );
        }

        return value;
    };

    if (loading) {
        return (
            <div className="w-full h-64 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-indigo-300 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
                </div>
                <p className="text-sm text-slate-500 font-medium">Cargando inventario...</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 px-4"
            >
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                    <Box className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No se encontraron registros</h3>
                <p className="text-sm text-slate-500 text-center max-w-sm">
                    No hay items de inventario que coincidan con tus filtros. Intenta ajustar los criterios de búsqueda.
                </p>
            </motion.div>
        );
    }

    return (
        <div className="w-full overflow-x-auto">
            <Table>
                <TableHeader className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                    <TableRow className="hover:bg-transparent border-slate-200">
                        {columns.map((col) => (
                            <TableHead
                                key={col.key}
                                className={cn(
                                    "h-11 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap",
                                    col.width
                                )}
                            >
                                <div className="flex items-center gap-1">
                                    {col.label}
                                    {col.sortable && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort(col.key as keyof Inventario)}
                                            className={cn(
                                                "h-6 w-6 p-0 ml-1 hover:bg-slate-200 rounded",
                                                sortConfig?.key === col.key && "bg-slate-200 text-slate-900"
                                            )}
                                        >
                                            <ChevronDown className={cn(
                                                "h-3 w-3 transition-transform duration-200",
                                                sortConfig?.key === col.key && sortConfig.direction === 'desc' ? "rotate-180" : "",
                                                sortConfig?.key === col.key && "text-indigo-600"
                                            )} />
                                        </Button>
                                    )}
                                </div>
                            </TableHead>
                        ))}
                        <TableHead className="w-[60px] px-2" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <AnimatePresence>
                        {sortedData.map((row, index) => {
                            const isHovered = hoveredRow === row.id;
                            const stockStatus = getStockStatus(row.stock_actual);

                            return (
                                <motion.tr
                                    key={row.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03, duration: 0.2 }}
                                    onMouseEnter={() => setHoveredRow(row.id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                    className={cn(
                                        "group border-b border-slate-100 transition-all duration-200",
                                        isHovered ? "bg-blue-50/40 shadow-sm" : "hover:bg-slate-50/50"
                                    )}
                                >
                                    {columns.map((col) => (
                                        <TableCell
                                            key={`${row.id}-${col.key}`}
                                            className={cn(
                                                "px-3 py-3 text-[13px] whitespace-nowrap transition-colors",
                                                col.key === 'numero_item_nombre'
                                                    ? "font-semibold text-slate-900"
                                                    : "text-slate-600",
                                                col.format === 'number' || col.format === 'stock'
                                                    ? "text-right"
                                                    : "text-left"
                                            )}
                                        >
                                            {col.key === 'exportador_nombre' ? (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[10px] font-medium px-2 py-0.5",
                                                        exporterColors[row.exportador_nombre] || "bg-slate-50 text-slate-600 border-slate-200"
                                                    )}
                                                >
                                                    {row[col.key as keyof Inventario] as string}
                                                </Badge>
                                            ) : col.key === 'numero_item_nombre' ? (
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                        stockStatus.variant === "out"
                                                            ? "bg-rose-100 text-rose-600"
                                                            : stockStatus.variant === "low"
                                                                ? "bg-amber-100 text-amber-600"
                                                                : "bg-emerald-100 text-emerald-600"
                                                    )}
                                                    >
                                                        <Package className="h-4 w-4" />
                                                    </div>
                                                    <span className="truncate max-w-[150px]" title={row[col.key as keyof Inventario] as string}>
                                                        {row[col.key as keyof Inventario] as string}
                                                    </span>
                                                </div>
                                            ) : (
                                                formatValue(row[col.key as keyof Inventario], col.format, col.key)
                                            )}
                                        </TableCell>
                                    ))}
                                    <TableCell className="px-2 py-3 text-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className={cn(
                                                        "h-9 w-9 rounded-lg transition-all duration-200 border-slate-200 bg-white shadow-sm",
                                                        "hover:border-blue-300 hover:text-blue-600 hover:shadow-md",
                                                        "text-slate-600"
                                                    )}
                                                >
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem
                                                    onClick={() => onEdit?.(row)}
                                                    className="cursor-pointer"
                                                >
                                                    <History className="mr-2 h-4 w-4 text-indigo-500" />
                                                    Ver Historial
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onEdit?.(row)}
                                                    className="cursor-pointer"
                                                >
                                                    <Pencil className="mr-2 h-4 w-4 text-slate-400" />
                                                    Ajustar Stock
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </motion.tr>
                            );
                        })}
                    </AnimatePresence>
                </TableBody>
                {totals && (
                    <TableFooter className="bg-slate-50/80 font-bold border-t-2 border-slate-200">
                        <TableRow>
                            <TableCell colSpan={2} className="px-3 py-4 text-[13px] text-slate-900 font-bold uppercase tracking-wider">
                                TOTAL GENERAL
                            </TableCell>
                            <TableCell className="px-3 py-4 text-[13px] text-right text-emerald-700 font-black">
                                {totals.compras_efectivas.toLocaleString('es-CO')}
                            </TableCell>
                            <TableCell className="px-3 py-4 text-[13px] text-right text-emerald-700 font-black">
                                {totals.saldos_iniciales.toLocaleString('es-CO')}
                            </TableCell>
                            <TableCell className="px-3 py-4 text-[13px] text-right text-rose-700 font-black">
                                -{totals.salidas.toLocaleString('es-CO')}
                            </TableCell>
                            <TableCell className="px-3 py-4 text-[13px] text-right text-rose-700 font-black">
                                -{totals.traslado_propio.toLocaleString('es-CO')}
                            </TableCell>
                            <TableCell className="px-3 py-4 text-[13px] text-right text-rose-700 font-black">
                                -{totals.traslado_remisionado.toLocaleString('es-CO')}
                            </TableCell>
                            <TableCell className="px-3 py-4 text-[13px] text-right text-rose-700 font-black">
                                -{totals.ventas.toLocaleString('es-CO')}
                            </TableCell>
                            <TableCell className="px-3 py-4 text-[13px] text-right">
                                <Badge 
                                    variant="outline" 
                                    className={cn(
                                        "font-black px-2.5 py-1 text-sm border-2 shadow-sm min-w-[70px] justify-center gap-1",
                                        totals.stock_actual > 0 
                                            ? "bg-indigo-600 text-white border-indigo-700 shadow-indigo-100" 
                                            : "bg-rose-600 text-white border-rose-700 shadow-rose-100"
                                    )}
                                >
                                    {totals.stock_actual.toLocaleString('es-CO')}
                                </Badge>
                            </TableCell>
                            <TableCell className="px-2 py-4" />
                        </TableRow>
                    </TableFooter>
                )}
            </Table>
        </div>
    );
}
