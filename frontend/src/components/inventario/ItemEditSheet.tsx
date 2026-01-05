"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Item } from "@/types/inventario";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface ItemEditSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: Item | null;
    onItemUpdated: () => void;
}

export function ItemEditSheet({ open, onOpenChange, item, onItemUpdated }: ItemEditSheetProps) {
    const [loading, setLoading] = useState(false);

    // Form fields
    const [cantidad, setCantidad] = useState("");
    const [documento, setDocumento] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [fechaMovimiento, setFechaMovimiento] = useState("");

    useEffect(() => {
        if (item && open) {
            setCantidad(item.cantidad_cajas.toString());
            setDocumento(item.documento || "");
            setObservaciones(item.observaciones || "");
            setFechaMovimiento(item.fecha_movimiento || "");
        }
    }, [item, open]);

    const handleSubmit = async () => {
        if (!item) return;

        setLoading(true);
        try {
            await axiosClient.patch(`/inventarios/api/items/${item.id}/`, {
                cantidad_cajas: parseInt(cantidad),
                documento: documento,
                observaciones: observaciones,
                fecha_movimiento: fechaMovimiento
            });

            toast.success("Movimiento actualizado");
            onItemUpdated();
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating item:", error);
            toast.error("Error al actualizar movimiento");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Editar Movimiento</SheetTitle>
                    <SheetDescription>
                        {item?.numero_item_nombre} - {item?.bodega_nombre}
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-4 py-6">
                    <div className="space-y-2">
                        <Label>Fecha Movimiento</Label>
                        <Input
                            type="date"
                            value={fechaMovimiento}
                            onChange={(e) => setFechaMovimiento(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Cantidad Cajas</Label>
                        <Input
                            type="number"
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Documento Ref.</Label>
                        <Input
                            value={documento}
                            onChange={(e) => setDocumento(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Observaciones</Label>
                        <Textarea
                            rows={4}
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                        />
                    </div>
                </div>

                <SheetFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
