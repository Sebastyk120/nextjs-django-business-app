"use client";

import { useEffect, useState } from "react";
import axiosClient from "@/lib/axios";
import { Transferencia } from "./types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, ArrowUpDown, Receipt, Calendar, User, Wallet, FileText, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/comercial/Pagination";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface TransferenciasTableProps {
    filters: any;
    refreshTrigger: number;
    onEdit: (transferencia: Transferencia) => void;
}

const origenColors: Record<string, string> = {
    'Alianza': 'bg-purple-50 text-purple-700 border-purple-200',
    'Mabelly Diaz': 'bg-pink-50 text-pink-700 border-pink-200',
    'Pedro Diaz Melo': 'bg-blue-50 text-blue-700 border-blue-200',
    'Valentina Garay': 'bg-amber-50 text-amber-700 border-amber-200',
    'HEAVENS CO': 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

export function TransferenciasTable({ filters, refreshTrigger, onEdit }: TransferenciasTableProps) {
    const [data, setData] = useState<Transferencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [transferToDelete, setTransferToDelete] = useState<Transferencia | null>(null);

    // Pagination State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalItems, setTotalItems] = useState(0);
    const [totalValue, setTotalValue] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('page_size', pageSize.toString());

            if (filters.proveedor) params.append("proveedor", filters.proveedor);
            if (filters.fecha_inicio) params.append("fecha_inicio", filters.fecha_inicio);
            if (filters.fecha_fin) params.append("fecha_fin", filters.fecha_fin);
            if (filters.origen) params.append("origen", filters.origen);

            const response = await axiosClient.get(`/nacionales/api/transferencias/?${params.toString()}`);

            if (response.data.results) {
                setData(response.data.results);
                setTotalItems(response.data.count);
                if (response.data.total_valor !== undefined) {
                    setTotalValue(response.data.total_valor);
                } else {
                    const currentSum = response.data.results.reduce((sum: number, item: any) => sum + Number(item.valor_transferencia), 0);
                    setTotalValue(currentSum);
                }
            } else {
                setData(response.data);
                setTotalItems(response.data.length);
                const sum = response.data.reduce((acc: number, item: any) => acc + Number(item.valor_transferencia), 0);
                setTotalValue(sum);
            }
        } catch (error) {
            console.error("Error fetching transfers:", error);
            toast.error("Error al cargar las transferencias");
            setData([]);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters, refreshTrigger, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [filters]);

    const handleDelete = async () => {
        if (!transferToDelete) return;
        try {
            await axiosClient.delete(`/nacionales/api/transferencias/${transferToDelete.id}/`);
            toast.success("Transferencia eliminada exitosamente");
            fetchData();
        } catch (error) {
            toast.error("Error al eliminar la transferencia");
        } finally {
            setTransferToDelete(null);
        }
    };

    const formatCurrency = (value: number | string) => {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(value));
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-50 rounded-xl">
                                <Receipt className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Listado de Transferencias</h3>
                                <p className="text-sm text-slate-500">
                                    {totalItems} {totalItems === 1 ? 'registro encontrado' : 'registros encontrados'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-emerald-50/50 px-4 py-2.5 rounded-xl border border-emerald-100">
                            <span className="text-sm text-slate-600">Total del período:</span>
                            <span className="text-lg font-bold text-emerald-600 tabular-nums">
                                {formatCurrency(totalValue)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <ScrollArea className="w-full">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                <TableHead className="w-[130px] font-semibold text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        Fecha
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-slate-400" />
                                        Proveedor
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700">Origen</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">
                                    <div className="flex items-center justify-end gap-2">
                                        <Wallet className="h-4 w-4 text-slate-400" />
                                        Valor
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700 w-[35%]">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-slate-400" />
                                        Observaciones
                                    </div>
                                </TableHead>
                                <TableHead className="w-[100px] text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="wait">
                                {data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64">
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex flex-col items-center justify-center text-center"
                                            >
                                                <div className="p-4 bg-slate-50 rounded-full mb-4">
                                                    <AlertCircle className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <h4 className="text-lg font-medium text-slate-900 mb-1">
                                                    No se encontraron transferencias
                                                </h4>
                                                <p className="text-sm text-slate-500 max-w-sm">
                                                    No hay registros que coincidan con los filtros aplicados. 
                                                    Intenta ajustar los criterios de búsqueda.
                                                </p>
                                            </motion.div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item, index) => (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="group border-b border-slate-100 hover:bg-blue-50/30 transition-colors"
                                        >
                                            <TableCell className="font-medium text-slate-700">
                                                <div className="flex flex-col">
                                                    <span>
                                                        {format(parseISO(item.fecha_transferencia), "dd MMM yyyy", { locale: es })}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {format(parseISO(item.fecha_transferencia), "EEEE", { locale: es })}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-semibold text-xs">
                                                        {item.proveedor_nombre?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <span className="font-medium text-slate-900">
                                                        {item.proveedor_nombre}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`font-medium ${origenColors[item.origen_transferencia] || 'bg-slate-50 text-slate-600 border-slate-200'}`}
                                                >
                                                    {item.origen_transferencia}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-bold text-emerald-600 tabular-nums text-base">
                                                    {formatCurrency(item.valor_transferencia)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-slate-600 text-sm line-clamp-2" title={item.observaciones}>
                                                    {item.observaciones || <span className="text-slate-400 italic">Sin observaciones</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => onEdit(item)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => setTransferToDelete(item)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {/* Footer */}
                <div className="bg-slate-50/80 p-4 border-t border-slate-200">
                    <Pagination
                        currentPage={page}
                        totalItems={totalItems}
                        totalPages={Math.ceil(totalItems / pageSize)}
                        itemsPerPage={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setPage(1);
                        }}
                        itemLabel="transferencias"
                    />
                </div>
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={!!transferToDelete} onOpenChange={() => setTransferToDelete(null)}>
                <AlertDialogContent className="border-none shadow-2xl">
                    <AlertDialogHeader>
                        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <Trash2 className="h-8 w-8 text-red-500" />
                        </div>
                        <AlertDialogTitle className="text-center text-xl">
                            ¿Eliminar transferencia?
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4 text-center">
                                <div className="p-4 bg-slate-50 rounded-xl text-left space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Proveedor:</span>
                                        <span className="font-medium text-slate-900">{transferToDelete?.proveedor_nombre}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Monto:</span>
                                        <span className="font-bold text-emerald-600">
                                            {transferToDelete && formatCurrency(transferToDelete.valor_transferencia)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Fecha:</span>
                                        <span className="font-medium text-slate-900">
                                            {transferToDelete?.fecha_transferencia && 
                                                format(parseISO(transferToDelete.fecha_transferencia), "dd 'de' MMMM, yyyy", { locale: es })}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500">
                                    Esta acción no se puede deshacer. La transferencia será eliminada permanentemente.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="border-slate-200">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
