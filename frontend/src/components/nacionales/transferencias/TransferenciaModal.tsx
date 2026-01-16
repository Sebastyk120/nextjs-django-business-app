"use client";

import { useEffect, useState } from "react";
import axiosClient from "@/lib/axios";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Transferencia, TransferenciaFormData, Proveedor, ORIGEN_OPTIONS } from "./types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TransferenciaModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transferencia?: Transferencia | null;
    onSuccess: () => void;
}

export function TransferenciaModal({
    open,
    onOpenChange,
    transferencia,
    onSuccess,
}: TransferenciaModalProps) {
    const [loading, setLoading] = useState(false);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);

    // Form state
    const [formData, setFormData] = useState<TransferenciaFormData>({
        proveedor: "",
        fecha_transferencia: new Date().toISOString().split('T')[0],
        valor_transferencia: "",
        origen_transferencia: "",
        observaciones: "",
    });

    useEffect(() => {
        // Fetch proveedores on mount
        const fetchProveedores = async () => {
            try {
                const response = await axiosClient.get("/nacionales/api/proveedores/");
                setProveedores(response.data);
            } catch (error) {
                console.error("Error loading providers:", error);
                toast.error("Error al cargar proveedores");
            }
        };
        fetchProveedores();
    }, []);

    useEffect(() => {
        // Reset or populate form when opening
        if (open) {
            if (transferencia) {
                setFormData({
                    proveedor: transferencia.proveedor.toString(),
                    fecha_transferencia: transferencia.fecha_transferencia,
                    valor_transferencia: transferencia.valor_transferencia.toString(),
                    origen_transferencia: transferencia.origen_transferencia,
                    observaciones: transferencia.observaciones || "",
                });
            } else {
                setFormData({
                    proveedor: "",
                    fecha_transferencia: new Date().toISOString().split('T')[0],
                    valor_transferencia: "",
                    origen_transferencia: "",
                    observaciones: "",
                });
            }
        }
    }, [open, transferencia]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (transferencia) {
                await axiosClient.put(`/nacionales/api/transferencias/${transferencia.id}/`, formData);
                toast.success("Transferencia actualizada exitosamente");
            } else {
                await axiosClient.post("/nacionales/api/transferencias/", formData);
                toast.success("Transferencia creada exitosamente");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error saving transfer:", error);
            const msg = error.response?.data?.message || "Error al guardar la transferencia";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl bg-white/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {transferencia ? "Editar Transferencia" : "Nueva Transferencia"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="proveedor" className="text-slate-600 font-medium">Proveedor</Label>
                            <Select
                                value={formData.proveedor}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, proveedor: val }))}
                            >
                                <SelectTrigger className="border-slate-200 focus:ring-blue-500/20">
                                    <SelectValue placeholder="Seleccione un proveedor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {proveedores.map((prov) => (
                                        <SelectItem key={prov.id} value={prov.id.toString()}>
                                            {prov.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fecha" className="text-slate-600 font-medium">Fecha</Label>
                            <Input
                                id="fecha"
                                type="date"
                                required
                                value={formData.fecha_transferencia}
                                onChange={(e) => setFormData(prev => ({ ...prev, fecha_transferencia: e.target.value }))}
                                className="border-slate-200 focus:ring-blue-500/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="valor" className="text-slate-600 font-medium">Valor</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                                <Input
                                    id="valor"
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.valor_transferencia}
                                    onChange={(e) => setFormData(prev => ({ ...prev, valor_transferencia: e.target.value }))}
                                    className="pl-7 border-slate-200 focus:ring-blue-500/20"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="origen" className="text-slate-600 font-medium">Origen de Fondos</Label>
                            <Select
                                value={formData.origen_transferencia}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, origen_transferencia: val }))}
                            >
                                <SelectTrigger className="border-slate-200 focus:ring-blue-500/20">
                                    <SelectValue placeholder="Seleccione origen" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ORIGEN_OPTIONS.map((opt) => (
                                        <SelectItem key={opt} value={opt}>
                                            {opt}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="obs" className="text-slate-600 font-medium">Observaciones</Label>
                            <Textarea
                                id="obs"
                                value={formData.observaciones}
                                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                                className="border-slate-200 focus:ring-blue-500/20 min-h-[100px]"
                                placeholder="Detalles adicionales..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="mr-2 text-slate-500 hover:text-slate-700"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {transferencia ? "Guardar Cambios" : "Crear Transferencia"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
