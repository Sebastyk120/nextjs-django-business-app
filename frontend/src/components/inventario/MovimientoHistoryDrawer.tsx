"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import axiosClient from "@/lib/axios";
import { Item, Inventario } from "@/types/inventario";
import { Loader2, Calendar, FileText, User, ArrowRight, Trash2, Pencil, Package, ArrowUpRight, ArrowDownRight, History, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DeleteItemDialog } from "./DeleteItemDialog";
import { ItemEditSheet } from "./ItemEditSheet";
import { motion, AnimatePresence } from "framer-motion";

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
            const response = await axiosClient.get(`/inventarios/api/items/?numero_item=${inventarioItem?.numero_item}&page_size=100`);
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

    const getMovementType = (bodegaNombre: string) => {
        const lower = bodegaNombre.toLowerCase();
        if (lower.includes('ingreso') || lower.includes('compra')) return { type: 'in', label: 'Entrada', color: 'emerald' };
        if (lower.includes('salida') || lower.includes('venta')) return { type: 'out', label: 'Salida', color: 'rose' };
        if (lower.includes('traslado')) return { type: 'transfer', label: 'Traslado', color: 'blue' };
        return { type: 'other', label: 'Ajuste', color: 'slate' };
    };

    const totalIn = movements.filter(m => getMovementType(m.bodega_nombre).type === 'in').reduce((sum, m) => sum + m.cantidad_cajas, 0);
    const totalOut = movements.filter(m => getMovementType(m.bodega_nombre).type === 'out').reduce((sum, m) => sum + m.cantidad_cajas, 0);

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:max-w-[700px] flex flex-col h-full p-0">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
                        <SheetHeader className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-xl">
                                        <History className="h-5 w-5 text-indigo-300" />
                                    </div>
                                    <div>
                                        <SheetTitle className="text-xl font-bold text-white">Historial de Movimientos</SheetTitle>
                                        <SheetDescription className="text-slate-400">
                                            {inventarioItem?.numero_item_nombre}
                                        </SheetDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onOpenChange(false)}
                                    className="text-slate-400 hover:text-white hover:bg-white/10"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                                    <p className="text-xs text-slate-400 mb-1">Total Movimientos</p>
                                    <p className="text-2xl font-bold text-white">{movements.length}</p>
                                </div>
                                <div className="bg-emerald-500/10 backdrop-blur-sm rounded-lg p-3 border border-emerald-500/20">
                                    <p className="text-xs text-emerald-400 mb-1">Entradas</p>
                                    <p className="text-2xl font-bold text-emerald-400">+{totalIn.toLocaleString()}</p>
                                </div>
                                <div className="bg-rose-500/10 backdrop-blur-sm rounded-lg p-3 border border-rose-500/20">
                                    <p className="text-xs text-rose-400 mb-1">Salidas</p>
                                    <p className="text-2xl font-bold text-rose-400">-{totalOut.toLocaleString()}</p>
                                </div>
                            </div>
                        </SheetHeader>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden bg-slate-50/50">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 border-3 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                                </div>
                                <p className="text-sm text-slate-500">Cargando historial...</p>
                            </div>
                        ) : movements.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                    <History className="h-8 w-8 text-slate-300" />
                                </div>
                                <p className="text-lg font-medium text-slate-600 mb-1">Sin movimientos</p>
                                <p className="text-sm text-slate-400 text-center">No hay registros de movimientos para esta referencia.</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-full">
                                <div className="p-4 space-y-3">
                                    <AnimatePresence>
                                        {movements.map((move, index) => {
                                            const moveType = getMovementType(move.bodega_nombre);
                                            const isIn = moveType.type === 'in';
                                            const Icon = isIn ? ArrowUpRight : ArrowDownRight;

                                            return (
                                                <motion.div
                                                    key={move.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all duration-200"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        {/* Icon */}
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                                            moveType.color === 'emerald' && "bg-emerald-50 text-emerald-600",
                                                            moveType.color === 'rose' && "bg-rose-50 text-rose-600",
                                                            moveType.color === 'blue' && "bg-blue-50 text-blue-600",
                                                            moveType.color === 'slate' && "bg-slate-50 text-slate-600"
                                                        )}>
                                                            <Icon className="h-6 w-6" />
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div>
                                                                    <h4 className="font-semibold text-slate-900">{move.bodega_nombre}</h4>
                                                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {move.fecha_movimiento}
                                                                    </p>
                                                                </div>
                                                                <Badge
                                                                    className={cn(
                                                                        "font-bold px-2.5 py-1 text-sm",
                                                                        isIn
                                                                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                                                            : "bg-rose-100 text-rose-700 hover:bg-rose-100"
                                                                    )}
                                                                >
                                                                    {isIn ? "+" : "-"}{move.cantidad_cajas}
                                                                </Badge>
                                                            </div>

                                                            {/* Details */}
                                                            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                                                                <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                                    <FileText className="h-3 w-3" />
                                                                    {move.documento || "S/D"}
                                                                </span>
                                                                <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                                    <User className="h-3 w-3" />
                                                                    {move.user_username.split('@')[0]}
                                                                </span>
                                                                <span className={cn(
                                                                    "px-2 py-1 rounded-md font-medium",
                                                                    moveType.color === 'emerald' && "bg-emerald-50 text-emerald-700",
                                                                    moveType.color === 'rose' && "bg-rose-50 text-rose-700",
                                                                    moveType.color === 'blue' && "bg-blue-50 text-blue-700",
                                                                    moveType.color === 'slate' && "bg-slate-50 text-slate-700"
                                                                )}>
                                                                    {moveType.label}
                                                                </span>
                                                            </div>

                                                            {move.observaciones && (
                                                                <p className="text-xs text-slate-500 mt-2 italic bg-slate-50 p-2 rounded-lg">
                                                                    "{move.observaciones}"
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                                onClick={() => {
                                                                    setEditItem(move);
                                                                    setIsEditSheetOpen(true);
                                                                }}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                                onClick={() => {
                                                                    setDeleteItem(move);
                                                                    setIsDeleteDialogOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
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
                description={`Estas seguro de eliminar el movimiento de ${deleteItem?.cantidad_cajas} cajas? Esto actualizara el stock automaticamente.`}
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
