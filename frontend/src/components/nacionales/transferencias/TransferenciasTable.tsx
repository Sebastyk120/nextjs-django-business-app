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
import { Edit2, Trash2, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
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



import { Pagination } from "@/components/comercial/Pagination";

interface TransferenciasTableProps {
    filters: any;
    refreshTrigger: number;
    onEdit: (transferencia: Transferencia) => void;
}

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

            // Handle Paginated Response
            if (response.data.results) {
                setData(response.data.results);
                setTotalItems(response.data.count);
                // If backend provides total value (custom pagination), use it. 
                // Otherwise we might need another way, but we implemented custom pagination.
                if (response.data.total_valor !== undefined) {
                    setTotalValue(response.data.total_valor);
                } else {
                    // Fallback if backend update is not yet effective (should not happen if deployed correctly)
                    const currentSum = response.data.results.reduce((sum: number, item: any) => sum + Number(item.valor_transferencia), 0);
                    setTotalValue(currentSum);
                }
            } else {
                // Fallback for non-paginated (legacy)
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

    // Reset to page 1 when filters change (except just pagination)
    useEffect(() => {
        setPage(1);
    }, [filters]);

    const handleDelete = async () => {
        if (!transferToDelete) return;
        try {
            await axiosClient.delete(`/nacionales/api/transferencias/${transferToDelete.id}/`);
            toast.success("Transferencia eliminada");
            fetchData();
        } catch (error) {
            toast.error("Error al eliminar");
        } finally {
            setTransferToDelete(null);
        }
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/80">
                        <TableRow>
                            <TableHead className="w-[120px] font-semibold text-slate-700">Fecha</TableHead>
                            <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                            <TableHead className="font-semibold text-slate-700">Origen</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Valor</TableHead>
                            <TableHead className="font-semibold text-slate-700 w-[30%]">Observaciones</TableHead>
                            <TableHead className="w-[100px] text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex justify-center items-center gap-2 text-slate-500">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                                        Cargando datos...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                    No se encontraron transferencias
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium text-slate-700">
                                        {format(new Date(item.fecha_transferencia), "dd MMM yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell className="font-medium text-blue-900">
                                        {item.proveedor_nombre}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-slate-600 bg-slate-50 font-normal">
                                            {item.origen_transferencia}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-emerald-600">
                                        $ {Number(item.valor_transferencia).toLocaleString('es-CO')}
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm truncate max-w-[200px]" title={item.observaciones}>
                                        {item.observaciones}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
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
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Footer with totals */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col gap-4">
                    <div className="flex justify-between items-center px-4">
                        <span className="text-slate-500 font-medium text-sm"></span>
                        <div className="flex items-center gap-4">
                            <span className="text-slate-600 font-semibold">Total (Filtro Actual):</span>
                            <span className="text-xl font-bold text-emerald-600">
                                $ {totalValue.toLocaleString('es-CO')}
                            </span>
                        </div>
                    </div>

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

            <AlertDialog open={!!transferToDelete} onOpenChange={() => setTransferToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de eliminar esta transferencia?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm text-slate-500">
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-900 mt-2">
                                    <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Detalles del registro:</p>
                                    <div className="mt-1 font-bold">
                                        {transferToDelete?.proveedor_nombre}
                                    </div>
                                    <div className="text-lg font-bold text-red-600">
                                        $ {Number(transferToDelete?.valor_transferencia || 0).toLocaleString('es-CO')}
                                    </div>
                                    <p className="text-xs mt-1 italic">
                                        {transferToDelete?.fecha_transferencia && format(new Date(transferToDelete.fecha_transferencia), "dd 'de' MMMM, yyyy", { locale: es })}
                                    </p>
                                </div>
                                <p className="pt-2">
                                    Esta acción eliminará permanentemente la transferencia. Esto afectará el balance y los pagos del proveedor.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Sí, eliminar registro
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
