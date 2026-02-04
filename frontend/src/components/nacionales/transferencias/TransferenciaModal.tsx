"use client";

import { useEffect, useState } from "react";
import axiosClient from "@/lib/axios";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
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
import { Loader2, ArrowRightLeft, Building2, Calendar, Wallet, FileText, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState<TransferenciaFormData>({
        proveedor: "",
        fecha_transferencia: new Date().toISOString().split('T')[0],
        valor_transferencia: "",
        origen_transferencia: "",
        observaciones: "",
    });

    useEffect(() => {
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
            setStep(1);
        }
    }, [open, transferencia]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prevent submission if in step 1 of new transfer
        if (!transferencia && step === 1) {
            setStep(2);
            return;
        }
        
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

    const isStepValid = () => {
        if (step === 1) {
            return formData.proveedor && formData.fecha_transferencia && formData.valor_transferencia;
        }
        return true;
    };

    const formatCurrency = (value: string) => {
        const num = parseFloat(value);
        if (isNaN(num)) return "";
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isStepValid()) {
            setStep(2);
        }
    };

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setStep(1);
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] border-none shadow-2xl bg-white p-0 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <ArrowRightLeft className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-white">
                                {transferencia ? "Editar Transferencia" : "Nueva Transferencia"}
                            </DialogTitle>
                            <DialogDescription className="text-blue-100 mt-0.5">
                                {transferencia 
                                    ? "Modifique los detalles de la transferencia existente" 
                                    : "Complete la información para registrar un nuevo pago"}
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Progress Steps - Only for new transfers */}
                    {!transferencia && (
                        <div className="flex items-center gap-2 mt-6">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                                    step >= 1 ? 'bg-white text-blue-600' : 'bg-white/20 text-white'
                                }`}>
                                    1
                                </div>
                                <div className={`w-12 h-0.5 ${step > 1 ? 'bg-white' : 'bg-white/20'}`} />
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                                    step >= 2 ? 'bg-white text-blue-600' : 'bg-white/20 text-white'
                                }`}>
                                    2
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Form Content - Scrollable */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-blue-500" />
                                            Proveedor *
                                        </Label>
                                        <Select
                                            value={formData.proveedor}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, proveedor: val }))}
                                        >
                                            <SelectTrigger className="h-11 border-slate-200 focus:ring-blue-500/20">
                                                <SelectValue placeholder="Seleccione un proveedor" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {proveedores.map((prov) => (
                                                    <SelectItem key={prov.id} value={prov.id.toString()}>
                                                        {prov.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-blue-500" />
                                                Fecha *
                                            </Label>
                                            <Input
                                                type="date"
                                                required
                                                value={formData.fecha_transferencia}
                                                onChange={(e) => setFormData(prev => ({ ...prev, fecha_transferencia: e.target.value }))}
                                                className="h-11 border-slate-200 focus:ring-blue-500/20"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <Wallet className="h-4 w-4 text-blue-500" />
                                                Valor *
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    required
                                                    value={formData.valor_transferencia}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, valor_transferencia: e.target.value }))}
                                                    className="pl-7 h-11 border-slate-200 focus:ring-blue-500/20"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {formData.valor_transferencia && (
                                                <p className="text-xs text-emerald-600 font-medium">
                                                    {formatCurrency(formData.valor_transferencia)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-blue-500" />
                                            Origen de Fondos
                                        </Label>
                                        <Select
                                            value={formData.origen_transferencia}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, origen_transferencia: val }))}
                                        >
                                            <SelectTrigger className="h-11 border-slate-200 focus:ring-blue-500/20">
                                                <SelectValue placeholder="Seleccione origen (opcional)" />
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
                                </motion.div>
                            )}

                            {(step === 2 || transferencia) && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            Observaciones
                                        </Label>
                                        <Textarea
                                            value={formData.observaciones}
                                            onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                                            className="min-h-[120px] border-slate-200 focus:ring-blue-500/20 resize-none"
                                            placeholder="Ingrese detalles adicionales sobre la transferencia..."
                                        />
                                    </div>

                                    {/* Summary Card */}
                                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                        <h4 className="text-sm font-semibold text-slate-700">Resumen</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Proveedor:</span>
                                                <span className="font-medium text-slate-900">
                                                    {proveedores.find(p => p.id.toString() === formData.proveedor)?.nombre || '-'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Fecha:</span>
                                                <span className="font-medium text-slate-900">{formData.fecha_transferencia || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Valor:</span>
                                                <span className="font-bold text-emerald-600">
                                                    {formData.valor_transferencia ? formatCurrency(formData.valor_transferencia) : '-'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Origen:</span>
                                                <span className="font-medium text-slate-900">{formData.origen_transferencia || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer - Fixed at bottom */}
                    <DialogFooter className="p-6 pt-4 gap-2 border-t border-slate-100 shrink-0 bg-white">
                        {!transferencia && step === 2 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                className="border-slate-200"
                            >
                                Atrás
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleCancel}
                            className="text-slate-500 hover:text-slate-700"
                        >
                            Cancelar
                        </Button>
                        
                        {!transferencia && step === 1 ? (
                            <Button
                                type="button"
                                disabled={!isStepValid()}
                                onClick={handleNext}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                            >
                                Siguiente
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {transferencia ? "Guardar Cambios" : "Crear Transferencia"}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
