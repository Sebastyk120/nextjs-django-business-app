"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Loader2, Package, Calendar, FileText, Building2, User, Box, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";

interface NewItemModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onItemCreated: () => void;
    userGroups?: string[];
}

const steps = [
    { id: 1, label: "Exportador", icon: Building2 },
    { id: 2, label: "Referencia", icon: Package },
    { id: 3, label: "Detalles", icon: FileText },
];

export function NewItemModal({ open, onOpenChange, onItemCreated, userGroups = [] }: NewItemModalProps) {
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    // Form State
    const [referenciaId, setReferenciaId] = useState<number | null>(null);
    const [bodegaId, setBodegaId] = useState<string>("");
    const [propiedadId, setPropiedadId] = useState<string>("");
    const [cantidad, setCantidad] = useState("");
    const [tipoDocumento, setTipoDocumento] = useState("Remisión");
    const [documento, setDocumento] = useState("");
    const [proveedorId, setProveedorId] = useState<string>("");
    const [fechaMovimiento, setFechaMovimiento] = useState(new Date().toISOString().split('T')[0]);
    const [observaciones, setObservaciones] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Data Options
    const [referencias, setReferencias] = useState<{ id: number, nombre: string, exportador: number }[]>([]);
    const [bodegas, setBodegas] = useState<{ id: number, nombre: string, exportador: number }[]>([]);
    const [proveedores, setProveedores] = useState<{ id: number, nombre: string }[]>([]);
    const [exportadores, setExportadores] = useState<{ id: number, nombre: string }[]>([]);

    // Permission Checks
    const isHeavens = userGroups.includes("Heavens") || userGroups.includes("Autorizadores") || userGroups.includes("Superuser");
    const exporterGroupNames = ["Etnico", "Fieldex", "Juan Matas", "Juan_Matas", "CI Dorado", "CI_Dorado"];
    const userExporterGroup = userGroups.find(g => exporterGroupNames.includes(g)) || null;

    useEffect(() => {
        if (open) {
            fetchOptions();
            setCurrentStep(1);
            resetForm();
        }
    }, [open]);

    useEffect(() => {
        if (!isHeavens && userExporterGroup && exportadores.length > 0) {
            const matchedExporter = exportadores.find(e =>
                e.nombre.toLowerCase() === userExporterGroup.toLowerCase()
            );
            if (matchedExporter) {
                setPropiedadId(matchedExporter.id.toString());
                setCurrentStep(2);
            }
        }
    }, [exportadores, isHeavens, userExporterGroup]);

    useEffect(() => {
        setReferenciaId(null);
        setBodegaId("");
    }, [propiedadId]);

    const fetchOptions = async () => {
        setLoadingData(true);
        try {
            const [refRes, bodRes, provRes, expRes] = await Promise.all([
                axiosClient.get('/inventarios/api/referencias/?page_size=9999'),
                axiosClient.get('/inventarios/api/bodegas/'),
                axiosClient.get('/inventarios/api/proveedores/'),
                axiosClient.get('/comercial/api/exportadores/'),
            ]);

            setReferencias(Array.isArray(refRes.data) ? refRes.data : refRes.data.results || []);
            setBodegas(Array.isArray(bodRes.data) ? bodRes.data : bodRes.data.results || []);
            setProveedores(Array.isArray(provRes.data) ? provRes.data : provRes.data.results || []);
            setExportadores(Array.isArray(expRes.data) ? expRes.data : expRes.data.results || []);
        } catch (error) {
            console.error("Error fetching options:", error);
            toast.error("Error al cargar opciones");
        } finally {
            setLoadingData(false);
        }
    };

    const filteredReferencias = propiedadId
        ? referencias.filter(r => r.exportador === parseInt(propiedadId))
        : referencias;

    const filteredBodegas = propiedadId
        ? bodegas.filter(b => b.exportador === parseInt(propiedadId))
        : bodegas;

    const validateStep = (step: number) => {
        const newErrors: Record<string, string> = {};

        if (step === 1) {
            if (!propiedadId) newErrors.propiedad = "Selecciona un exportador";
        }
        if (step === 2) {
            if (!referenciaId) newErrors.referencia = "Selecciona una referencia";
            if (!bodegaId) newErrors.bodega = "Selecciona una bodega";
        }
        if (step === 3) {
            if (!cantidad || parseInt(cantidad) <= 0) newErrors.cantidad = "Ingresa una cantidad valida";
            if (!proveedorId) newErrors.proveedor = "Selecciona un proveedor";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 3));
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep(3)) return;

        const payload = {
            numero_item: referenciaId,
            bodega: parseInt(bodegaId),
            propiedad: parseInt(propiedadId),
            cantidad_cajas: parseInt(cantidad),
            tipo_documento: tipoDocumento,
            documento: documento || "S/D",
            proveedor: parseInt(proveedorId),
            fecha_movimiento: fechaMovimiento,
            observaciones: observaciones
        };

        setLoading(true);
        try {
            await axiosClient.post('/inventarios/api/items/', payload);
            toast.success("Movimiento creado exitosamente");
            onItemCreated();
            onOpenChange(false);
            resetForm();
        } catch (error: any) {
            console.error("Error creating item:", error);
            if (error.response) {
                toast.error(`Error: ${JSON.stringify(error.response.data)}`);
            } else {
                toast.error("Error al guardar el movimiento");
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setReferenciaId(null);
        setBodegaId("");
        setPropiedadId("");
        setCantidad("");
        setDocumento("");
        setObservaciones("");
        setProveedorId("");
        setErrors({});
        setCurrentStep(1);
    };

    const selectedExportador = exportadores.find(e => e.id.toString() === propiedadId);
    const selectedReferencia = referencias.find(r => r.id === referenciaId);
    const selectedBodega = bodegas.find(b => b.id.toString() === bodegaId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Box className="h-5 w-5" />
                            Registrar Nuevo Movimiento
                        </DialogTitle>
                        <DialogDescription className="text-indigo-100">
                            Completa los datos para registrar una entrada o salida de inventario.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-2 mt-6">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;

                            return (
                                <div key={step.id} className="flex items-center">
                                    <motion.div
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                                            isActive && "bg-white text-blue-600",
                                            isCompleted && "bg-blue-400/30 text-white",
                                            !isActive && !isCompleted && "text-blue-200"
                                        )}
                                        animate={{ scale: isActive ? 1.05 : 1 }}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                                            isActive && "bg-blue-600 text-white",
                                            isCompleted && "bg-emerald-400 text-emerald-900",
                                            !isActive && !isCompleted && "bg-blue-400/30"
                                        )}>
                                            {isCompleted ? <Check className="h-3 w-3" /> : step.id}
                                        </div>
                                        <span className="hidden sm:inline">{step.label}</span>
                                    </motion.div>
                                    {index < steps.length - 1 && (
                                        <ArrowRight className="h-4 w-4 text-indigo-300 mx-1" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-slate-400" />
                                        Exportador (Propiedad) *
                                    </Label>
                                    <Select
                                        value={propiedadId}
                                        onValueChange={(val) => {
                                            setPropiedadId(val);
                                            setErrors(prev => ({ ...prev, propiedad: "" }));
                                        }}
                                        disabled={!isHeavens || loadingData}
                                    >
                                        <SelectTrigger className={cn(
                                            "h-11",
                                            errors.propiedad && "border-rose-500 focus:ring-rose-500",
                                            !isHeavens && "bg-slate-50"
                                        )}>
                                            <SelectValue placeholder="Seleccionar exportador..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {exportadores.map(exp => (
                                                <SelectItem key={exp.id} value={exp.id.toString()}>
                                                    {exp.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.propiedad && (
                                        <p className="text-xs text-rose-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.propiedad}
                                        </p>
                                    )}
                                    {!isHeavens && selectedExportador && (
                                        <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                                            Exportador preseleccionado segun tu grupo de usuario
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                                    <p className="text-xs text-blue-700 font-medium">
                                        Exportador: {selectedExportador?.nombre}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-slate-400" />
                                        Referencia *
                                    </Label>
                                    <ReferenciaCombo
                                        options={filteredReferencias}
                                        value={referenciaId}
                                        onChange={(val) => {
                                            setReferenciaId(val);
                                            setErrors(prev => ({ ...prev, referencia: "" }));
                                        }}
                                        disabled={loadingData}
                                        error={errors.referencia}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Box className="h-4 w-4 text-slate-400" />
                                        Tipo Movimiento (Bodega) *
                                    </Label>
                                    <Select
                                        value={bodegaId}
                                        onValueChange={(val) => {
                                            setBodegaId(val);
                                            setErrors(prev => ({ ...prev, bodega: "" }));
                                        }}
                                    >
                                        <SelectTrigger className={cn(
                                            "h-11",
                                            errors.bodega && "border-rose-500 focus:ring-rose-500"
                                        )}>
                                            <SelectValue placeholder="Seleccionar bodega..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredBodegas.map(bod => (
                                                <SelectItem key={bod.id} value={bod.id.toString()}>
                                                    {bod.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.bodega && (
                                        <p className="text-xs text-rose-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.bodega}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 space-y-1">
                                    <p className="text-xs text-slate-600">
                                        <span className="font-medium">Exportador:</span> {selectedExportador?.nombre}
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        <span className="font-medium">Referencia:</span> {selectedReferencia?.nombre}
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        <span className="font-medium">Bodega:</span> {selectedBodega?.nombre}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Cantidad Cajas *</Label>
                                        <Input
                                            type="number"
                                            value={cantidad}
                                            onChange={(e) => {
                                                setCantidad(e.target.value);
                                                setErrors(prev => ({ ...prev, cantidad: "" }));
                                            }}
                                            placeholder="0"
                                            className={cn(
                                                "h-11",
                                                errors.cantidad && "border-rose-500 focus:ring-rose-500"
                                            )}
                                        />
                                        {errors.cantidad && (
                                            <p className="text-xs text-rose-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.cantidad}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            Fecha *
                                        </Label>
                                        <Input
                                            type="date"
                                            value={fechaMovimiento}
                                            onChange={e => setFechaMovimiento(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tipo Documento *</Label>
                                        <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                                            <SelectTrigger className="h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Factura">Factura</SelectItem>
                                                <SelectItem value="Remisión">Remision</SelectItem>
                                                <SelectItem value="Acta De Destrucción">Acta De Destruccion</SelectItem>
                                                <SelectItem value="Saldo Inicial">Saldo Inicial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-slate-400" />
                                            Proveedor / Tercero *
                                        </Label>
                                        <Select
                                            value={proveedorId}
                                            onValueChange={(val) => {
                                                setProveedorId(val);
                                                setErrors(prev => ({ ...prev, proveedor: "" }));
                                            }}
                                        >
                                            <SelectTrigger className={cn(
                                                "h-11",
                                                errors.proveedor && "border-rose-500 focus:ring-rose-500"
                                            )}>
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {proveedores.map(p => (
                                                    <SelectItem key={p.id} value={p.id.toString()}>
                                                        {p.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.proveedor && (
                                            <p className="text-xs text-rose-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.proveedor}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-slate-400" />
                                        Documento Ref.
                                    </Label>
                                    <Input
                                        value={documento}
                                        onChange={e => setDocumento(e.target.value)}
                                        placeholder="Ej: REM-123"
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Observaciones</Label>
                                    <Textarea
                                        value={observaciones}
                                        onChange={e => setObservaciones(e.target.value)}
                                        placeholder="Detalles adicionales..."
                                        className="min-h-[80px] resize-none"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer */}
                    <DialogFooter className="mt-6 pt-4 border-t border-slate-100">
                        <div className="flex justify-between w-full">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={currentStep === 1 ? () => onOpenChange(false) : handleBack}
                                disabled={loading}
                            >
                                {currentStep === 1 ? "Cancelar" : "Atras"}
                            </Button>
                            <div className="flex gap-2">
                                {currentStep < 3 ? (
                                    <Button type="button" onClick={handleNext}>
                                        Siguiente
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Guardar Movimiento
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Combobox for searchable references
function ReferenciaCombo({ options, value, onChange, disabled, error }: {
    options: { id: number, nombre: string }[],
    value: number | null,
    onChange: (val: number | null) => void,
    disabled?: boolean,
    error?: string
}) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between h-11",
                        error && "border-rose-500 focus:ring-rose-500",
                        !value && "text-slate-400"
                    )}
                    disabled={disabled}
                >
                    {value
                        ? options.find((opt) => opt.id === value)?.nombre
                        : "Buscar referencia..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
                <Command>
                    <CommandInput placeholder="Escribe para buscar..." />
                    <CommandList>
                        <CommandEmpty>No se encontro referencia.</CommandEmpty>
                        <CommandGroup>
                            {options.map((opt) => (
                                <CommandItem
                                    key={opt.id}
                                    value={opt.nombre}
                                    onSelect={() => {
                                        onChange(opt.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === opt.id ? "opacity-100 text-indigo-600" : "opacity-0"
                                        )}
                                    />
                                    {opt.nombre}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
