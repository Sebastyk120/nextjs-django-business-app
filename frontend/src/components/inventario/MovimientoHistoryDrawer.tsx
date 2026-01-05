"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import axiosClient from "@/lib/axios";
import { Item, Inventario } from "@/types/inventario";
import { Loader2, Calendar, FileText, User, ArrowRight, Trash2, Pencil } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { DeleteItemDialog } from "./DeleteItemDialog";
import { ItemEditSheet } from "./ItemEditSheet";

interface MovimientoHistoryDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inventarioItem: Inventario | null;
    userGroups?: string[];
}

export function MovimientoHistoryDrawer({
    open,
    onOpenChange,
    inventarioItem,
    userGroups = []
}: MovimientoHistoryDrawerProps) {
    const [movements, setMovements] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);

    // Delete state
    const [deleteItem, setDeleteItem] = useState<Item | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Edit state
    const [editItem, setEditItem] = useState<Item | null>(null);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

    useEffect(() => {
        if (open && inventarioItem) {
            fetchHistory();
        }
    }, [open, inventarioItem]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get(`/inventarios/api/items/?search=${inventarioItem?.numero_item_nombre}`);
            setMovements(response.data.results || []);
        } catch (error) {
            console.error("Error loading history:", error);
            toast.error("Error al cargar historial");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteItem) return;
        setIsDeleting(true);
        try {
            await axiosClient.delete(`/inventarios/api/items/${deleteItem.id}/`);
            toast.success("Movimiento eliminado");
            setMovements(movements.filter(m => m.id !== deleteItem.id));
            setIsDeleteDialogOpen(false);
            setDeleteItem(null);
        } catch (error) {
            console.error("Error deleting item:", error);
            toast.error("Error al eliminar movimiento");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:max-w-[1000px] flex flex-col h-full">
                    <SheetHeader className="mb-4">
                        <div className="flex items-center gap-3">
                            <SheetTitle className="text-2xl font-bold text-slate-900">Historial de Movimientos</SheetTitle>
                            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-medium">
                                {movements.length} Registros
                            </Badge>
                        </div>
                        <SheetDescription className="text-slate-500 mt-1">
                            Referencia: <span className="font-semibold text-slate-900">{inventarioItem?.numero_item_nombre}</span>
                            <br />
                            Exportador: {inventarioItem?.exportador_nombre}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-hidden relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                            </div>
                        ) : movements.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                <FileText className="h-12 w-12 mb-2 opacity-20" />
                                <p>No hay movimientos registrados.</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader className="bg-slate-50/50 backdrop-blur-sm sticky top-0 z-10 border-y border-slate-200/60">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-[120px] font-semibold text-slate-900">Fecha</TableHead>
                                            <TableHead className="font-semibold text-slate-900">Tipo de Movimiento</TableHead>
                                            <TableHead className="text-center font-semibold text-slate-900 w-[100px]">Cajas</TableHead>
                                            <TableHead className="font-semibold text-slate-900">Documento</TableHead>
                                            <TableHead className="font-semibold text-slate-900">Usuario</TableHead>
                                            <TableHead className="w-[120px] text-right font-semibold text-slate-900">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {movements.map((move) => {
                                            const isIngreso = move.bodega_nombre.toLowerCase().includes('ingreso');
                                            const isSalida = move.bodega_nombre.toLowerCase().includes('salida');

                                            return (
                                                <TableRow key={move.id} className="group hover:bg-indigo-50/30 transition-colors border-b border-slate-100/80">
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-2 font-medium text-slate-600">
                                                            <div className="p-1.5 bg-slate-100 rounded-md">
                                                                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                                            </div>
                                                            <span className="text-xs whitespace-nowrap">{move.fecha_movimiento}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className={cn(
                                                                "text-sm font-semibold tracking-tight",
                                                                isIngreso ? "text-emerald-700" : isSalida ? "text-rose-700" : "text-slate-800"
                                                            )}>
                                                                {move.bodega_nombre}
                                                            </span>
                                                            {move.observaciones && (
                                                                <p className="text-[11px] text-slate-400 italic line-clamp-1" title={move.observaciones}>
                                                                    "{move.observaciones}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center py-4">
                                                        <Badge
                                                            className={cn(
                                                                "font-bold px-2.5 py-0.5 rounded-full border-none shadow-sm min-w-[50px] justify-center",
                                                                isSalida
                                                                    ? "bg-rose-100 text-rose-700 hover:bg-rose-100"
                                                                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                                            )}
                                                        >
                                                            {isSalida ? "-" : "+"}{Math.abs(move.cantidad_cajas)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-600">
                                                                {move.documento || "S/D"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-2 group/user max-w-[150px]">
                                                            <div className="h-7 w-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                                                <User className="h-3.5 w-3.5 text-indigo-500" />
                                                            </div>
                                                            <span className="text-xs text-slate-600 truncate font-medium" title={move.user_username}>
                                                                {move.user_username.split('@')[0]}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right py-4">
                                                        <div className="flex justify-end gap-1.5 transition-all">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 shadow-sm"
                                                                onClick={() => {
                                                                    setEditItem(move);
                                                                    setIsEditSheetOpen(true);
                                                                }}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 border-slate-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 shadow-sm text-slate-400"
                                                                onClick={() => {
                                                                    setDeleteItem(move);
                                                                    setIsDeleteDialogOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <DeleteItemDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDelete}
                title="Eliminar Movimiento"
                description={`¿Estás seguro de eliminar el movimiento de ${deleteItem?.cantidad_cajas} cajas? Esto actualizará el stock automáticamente.`}
                isDeleting={isDeleting}
            />

            <ItemEditSheet
                open={isEditSheetOpen}
                onOpenChange={setIsEditSheetOpen}
                item={editItem}
                onItemUpdated={fetchHistory}
            />
        </>
    );
}
