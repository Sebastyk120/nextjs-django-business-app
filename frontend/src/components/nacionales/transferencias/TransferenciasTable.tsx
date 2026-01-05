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

interface TransferenciasTableProps {
    filters: any;
    refreshTrigger: number;
    onEdit: (transferencia: Transferencia) => void;
}

export function TransferenciasTable({ filters, refreshTrigger, onEdit }: TransferenciasTableProps) {
    const [data, setData] = useState<Transferencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.proveedor) params.append("proveedor", filters.proveedor);
            if (filters.fecha_inicio) params.append("fecha_inicio", filters.fecha_inicio);
            if (filters.fecha_fin) params.append("fecha_fin", filters.fecha_fin);
            if (filters.origen) params.append("origen", filters.origen);

            const response = await axiosClient.get(`/nacionales/api/transferencias/?${params.toString()}`);
            setData(response.data);
        } catch (error) {
            console.error("Error fetching transfers:", error);
            toast.error("Error al cargar las transferencias");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters, refreshTrigger]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await axiosClient.delete(`/nacionales/api/transferencias/${deleteId}/`);
            toast.success("Transferencia eliminada");
            fetchData();
        } catch (error) {
            toast.error("Error al eliminar");
        } finally {
            setDeleteId(null);
        }
    };

    // Calculate total
    const totalValue = data.reduce((sum, item) => sum + Number(item.valor_transferencia), 0);

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
                                                onClick={() => setDeleteId(item.id)}
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
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center px-8">
                    <span className="text-slate-500 font-medium text-sm">Total Registros: {data.length}</span>
                    <div className="flex items-center gap-4">
                        <span className="text-slate-600 font-semibold">Total Transferido:</span>
                        <span className="text-xl font-bold text-emerald-600">
                            $ {totalValue.toLocaleString('es-CO')}
                        </span>
                    </div>
                </div>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente la transferencia. Esto afectará el balance y los pagos del proveedor.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
