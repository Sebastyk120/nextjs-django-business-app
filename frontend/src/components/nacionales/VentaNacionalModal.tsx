"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axiosClient from "@/lib/axios";
import { VentaNacional, CompraNacional } from "@/types/nacionales";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
    Loader2, 
    AlertTriangle, 
    Info, 
    Package, 
    Truck, 
    Calendar, 
    Scale, 
    Store,
    ChevronRight,
    ChevronLeft,
    Check,
    TrendingDown,
    TrendingUp,
    Box
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface VentaNacionalModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    compraData: CompraNacional;
    initialData?: VentaNacional | null;
    onSuccess: () => void;
}

export function VentaNacionalModal({ open, onOpenChange, compraData, initialData, onSuccess }: VentaNacionalModalProps) {
    const [exportadores, setExportadores] = useState<any[]>([]);
    const [currentStep, setCurrentStep] = useState(1);

    // Calculate stats regarding usage of purchase quantity AND peso
    const stats = useMemo(() => {
        let usedEmpaque = 0;
        let usedPesoBruto = 0;
        if (compraData.ventas) {
            compraData.ventas.forEach(v => {
                if (initialData && v.id === initialData.id) return;
                usedEmpaque += Number(v.cantidad_empaque_recibida) || 0;
                usedPesoBruto += Number(v.peso_bruto_recibido) || 0;
            });
        }
        const totalEmpaque = Number(compraData.cantidad_empaque) || 0;
        const totalPeso = Number(compraData.peso_compra) || 0;
        return {
            used: usedEmpaque,
            usedPeso: usedPesoBruto,
            total: totalEmpaque,
            totalPeso: totalPeso,
            remaining: totalEmpaque - usedEmpaque,
            remainingPeso: totalPeso - usedPesoBruto
        };
    }, [compraData, initialData]);

    const formSchema = useMemo(() => {
        return z.object({
            exportador: z.string().min(1, "Seleccione un exportador"),
            tipo: z.enum(["Mango Europa", "Otros Destinos"] as const),
            lote: z.string().optional(),
            fecha_llegada: z.string().min(1, "Ingrese fecha llegada"),
            peso_bruto_recibido: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Peso inválido"),
            cantidad_empaque_recibida: z.string()
                .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Cantidad inválida"),
            observaciones: z.string().optional(),
        });
    }, [compraData.cantidad_empaque, compraData.ventas, initialData]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            exportador: "",
            tipo: "Mango Europa",
            lote: "",
            fecha_llegada: new Date().toISOString().split('T')[0],
            peso_bruto_recibido: "",
            cantidad_empaque_recibida: "",
            observaciones: "",
        }
    });

    // Watch values for real-time calculations
    const pesoBruto = form.watch("peso_bruto_recibido");
    const cantidadEmpaque = form.watch("cantidad_empaque_recibida");
    const fechaLlegada = form.watch("fecha_llegada");
    const tipo = form.watch("tipo");
    const exportador = form.watch("exportador");

    // Calculate peso_neto_recibido (display only)
    const pesoNetoCalculado = useMemo(() => {
        const bruto = Number(pesoBruto) || 0;
        const cant = Number(cantidadEmpaque) || 0;
        const pesoEmpaque = compraData.tipo_empaque_peso || 0;
        return Math.max(0, bruto - (cant * pesoEmpaque));
    }, [pesoBruto, cantidadEmpaque, compraData.tipo_empaque_peso]);

    // Calculate fecha_vencimiento (display only) - 3 business days excluding Sundays
    const fechaVencimientoCalculada = useMemo(() => {
        if (!fechaLlegada) return null;
        const date = new Date(fechaLlegada + 'T00:00:00');
        let daysAdded = 0;
        while (daysAdded < 3) {
            date.setDate(date.getDate() + 1);
            if (date.getDay() !== 0) {
                daysAdded++;
            }
        }
        return date.toISOString().split('T')[0];
    }, [fechaLlegada]);

    // Calculate differences (GLOBAL - includes all sales)
    const diferenciaPeso = useMemo(() => {
        const bruto = Number(pesoBruto) || 0;
        return (stats.usedPeso + bruto) - stats.totalPeso;
    }, [pesoBruto, stats]);

    const diferenciaEmpaque = useMemo(() => {
        const cant = Number(cantidadEmpaque) || 0;
        return (stats.used + cant) - stats.total;
    }, [cantidadEmpaque, stats]);

    useEffect(() => {
        if (open) {
            axiosClient.get('/comercial/api/exportadores/').then(res => {
                setExportadores(res.data.results || res.data);
            });

            if (initialData) {
                form.reset({
                    exportador: initialData.exportador.toString(),
                    tipo: (initialData.tipo as any) || "Mango Europa",
                    lote: initialData.lote || "",
                    fecha_llegada: initialData.fecha_llegada,
                    peso_bruto_recibido: initialData.peso_bruto_recibido.toString(),
                    cantidad_empaque_recibida: initialData.cantidad_empaque_recibida?.toString() || "0",
                    observaciones: initialData.observaciones || "",
                });
                setCurrentStep(1);
            } else {
                form.reset({
                    exportador: "",
                    tipo: "Mango Europa",
                    lote: "",
                    fecha_llegada: new Date().toISOString().split('T')[0],
                    peso_bruto_recibido: "",
                    cantidad_empaque_recibida: "",
                    observaciones: "",
                });
                setCurrentStep(1);
            }
        }
    }, [open, initialData, form, compraData]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const payload = {
                ...values,
                compra_nacional: compraData.id,
                peso_bruto_recibido: Number(values.peso_bruto_recibido),
                cantidad_empaque_recibida: Number(values.cantidad_empaque_recibida),
            };

            if (initialData) {
                await axiosClient.patch(`/nacionales/api/venta/${initialData.id}/`, payload);
                toast.success("Venta actualizada correctamente");
            } else {
                await axiosClient.post('/nacionales/api/venta/', payload);
                toast.success("Venta registrada correctamente");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving venta:", error);
            toast.error("Error al guardar la venta");
        }
    };

    // Calculate LIVE totals including current form input
    const currentEmpaque = Number(cantidadEmpaque) || 0;
    const currentPeso = Number(pesoBruto) || 0;
    const liveUsedEmpaque = stats.used + currentEmpaque;
    const liveUsedPeso = stats.usedPeso + currentPeso;
    const liveRemainingEmpaque = stats.total - liveUsedEmpaque;
    const liveRemainingPeso = stats.totalPeso - liveUsedPeso;

    const steps = [
        { id: 1, title: "Información General", icon: Store },
        { id: 2, title: "Cantidades", icon: Scale },
        { id: 3, title: "Confirmación", icon: Check },
    ];

    const canProceedStep1 = exportador && tipo && fechaLlegada;
    const canProceedStep2 = pesoBruto && Number(pesoBruto) > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                            <Store className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl">{initialData ? "Editar Venta Nacional" : "Registrar Venta Nacional"}</h2>
                            <p className="text-sm text-slate-500 font-normal">Guía: {compraData.numero_guia} • {compraData.fruta_nombre}</p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        {steps.map((step, index) => {
                            const StepIcon = step.icon;
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;
                            
                            return (
                                <div key={step.id} className="flex items-center">
                                    <button
                                        onClick={() => {
                                            if (isCompleted || (step.id === 2 && canProceedStep1) || (step.id === 3 && canProceedStep2)) {
                                                setCurrentStep(step.id);
                                            }
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                                            isActive ? "bg-blue-100 text-blue-700" :
                                            isCompleted ? "text-emerald-600 hover:bg-emerald-50" :
                                            "text-slate-400"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                                            isActive ? "bg-blue-600 text-white" :
                                            isCompleted ? "bg-emerald-500 text-white" :
                                            "bg-slate-200 text-slate-500"
                                        )}>
                                            {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                                        </div>
                                        <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
                                    </button>
                                    {index < steps.length - 1 && (
                                        <ChevronRight className="h-4 w-4 text-slate-300 mx-1" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <Progress value={(currentStep / 3) * 100} className="h-2" />
                </div>

                {/* Reference Info Card */}
                <Card className="mb-6 border-slate-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3 text-slate-700 font-medium">
                            <Info className="h-4 w-4 text-blue-600" />
                            Balance de Compra
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Box className="h-4 w-4 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-500 uppercase">Empaque</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-2xl font-bold text-slate-800">{liveUsedEmpaque}</div>
                                        <div className="text-xs text-slate-500">de {stats.total} unidades</div>
                                    </div>
                                    <Badge variant={liveRemainingEmpaque < 0 ? "destructive" : "outline"}>
                                        {liveRemainingEmpaque >= 0 ? `${liveRemainingEmpaque} disp.` : `${Math.abs(liveRemainingEmpaque)} exced.`}
                                    </Badge>
                                </div>
                                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-300",
                                            liveUsedEmpaque > stats.total ? "bg-red-500" : "bg-emerald-500"
                                        )}
                                        style={{ width: `${Math.min(100, (liveUsedEmpaque / stats.total) * 100)}%` }}
                                    />
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Scale className="h-4 w-4 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-500 uppercase">Peso Bruto</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-2xl font-bold text-slate-800">{liveUsedPeso.toLocaleString()}</div>
                                        <div className="text-xs text-slate-500">de {stats.totalPeso.toLocaleString()} Kg</div>
                                    </div>
                                    <Badge variant={liveRemainingPeso < 0 ? "destructive" : "outline"}>
                                        {liveRemainingPeso >= 0 ? `${liveRemainingPeso.toLocaleString()} disp.` : `${Math.abs(liveRemainingPeso).toLocaleString()} exced.`}
                                    </Badge>
                                </div>
                                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-300",
                                            liveUsedPeso > stats.totalPeso ? "bg-red-500" : "bg-blue-500"
                                        )}
                                        style={{ width: `${Math.min(100, (liveUsedPeso / stats.totalPeso) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        
                        {/* Step 1: Información General */}
                        {currentStep === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="exportador"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Store className="h-4 w-4 text-slate-400" />
                                                    Exportador <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11">
                                                            <SelectValue placeholder="Seleccione un exportador" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {exportadores.map(e => (
                                                            <SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="tipo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-slate-400" />
                                                    Tipo de Venta <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11">
                                                            <SelectValue placeholder="Seleccione tipo" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Mango Europa">🥭 Mango Europa</SelectItem>
                                                        <SelectItem value="Otros Destinos">🌎 Otros Destinos</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="lote"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Box className="h-4 w-4 text-slate-400" />
                                                    Lote
                                                </FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="Ej: L-001" 
                                                        className="h-11"
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-xs">
                                                    Identificador opcional del lote
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="fecha_llegada"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-slate-400" />
                                                    Fecha Llegada <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="date" className="h-11" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-xs">
                                                    Se calculará vencimiento: 3 días hábiles
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {fechaVencimientoCalculada && (
                                    <Alert className="bg-blue-50 border-blue-200">
                                        <Calendar className="h-4 w-4 text-blue-600" />
                                        <AlertDescription className="text-blue-700">
                                            Fecha de vencimiento calculada: <strong>{fechaVencimientoCalculada}</strong>
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        )}

                        {/* Step 2: Cantidades */}
                        {currentStep === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="peso_bruto_recibido"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Scale className="h-4 w-4 text-slate-400" />
                                                    Peso Bruto Recibido (Kg) <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="number" 
                                                        step="0.01" 
                                                        placeholder="Ej: 1500"
                                                        className="h-11 text-lg"
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-xs">
                                                    Peso total recibido incluyendo empaques
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="cantidad_empaque_recibida"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Box className="h-4 w-4 text-slate-400" />
                                                    Cantidad Empaque Recibida
                                                </FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="number" 
                                                        placeholder="Ej: 100"
                                                        className="h-11 text-lg"
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-xs">
                                                    Unidades de {compraData.tipo_empaque_nombre} ({compraData.tipo_empaque_peso} Kg c/u)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Calculated Net Weight Card */}
                                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                                                    <Scale className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <div className="text-sm text-emerald-700 font-medium">Peso Neto Calculado</div>
                                                    <div className="text-xs text-emerald-600">= Bruto - (Empaque × {compraData.tipo_empaque_peso} Kg)</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-bold text-emerald-700 font-mono">
                                                    {pesoNetoCalculado.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <div className="text-sm text-emerald-600">Kilogramos</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Warning if exceeds remaining */}
                                {Number(cantidadEmpaque) > stats.remaining && (
                                    <Alert variant="warning" className="bg-amber-50 border-amber-200">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        <AlertDescription className="text-amber-700">
                                            La cantidad ingresada ({cantidadEmpaque}) excede el saldo disponible ({stats.remaining}). 
                                            El balance será negativo.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <FormField
                                    control={form.control}
                                    name="observaciones"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Info className="h-4 w-4 text-slate-400" />
                                                Observaciones
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Notas adicionales sobre esta venta..."
                                                    className="min-h-[100px]"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* Step 3: Confirmación */}
                        {currentStep === 3 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-4">
                                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <Check className="h-5 w-5 text-emerald-600" />
                                        Resumen de la Venta
                                    </h3>
                                    
                                    <Separator />
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase font-bold">Exportador</div>
                                            <div className="text-sm font-medium text-slate-800">
                                                {exportadores.find(e => e.id.toString() === exportador)?.nombre || exportador}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase font-bold">Tipo</div>
                                            <div className="text-sm font-medium text-slate-800">{tipo}</div>
                                        </div>
                                        
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase font-bold">Fecha Llegada</div>
                                            <div className="text-sm font-medium text-slate-800">{fechaLlegada}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase font-bold">Fecha Vencimiento</div>
                                            <div className="text-sm font-medium text-slate-800">{fechaVencimientoCalculada}</div>
                                        </div>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-3 bg-white rounded-lg border">
                                            <div className="text-xs text-slate-500 uppercase font-bold">Peso Bruto</div>
                                            <div className="text-xl font-bold text-slate-800 font-mono">{Number(pesoBruto).toLocaleString()}</div>
                                            <div className="text-xs text-slate-400">Kg</div>
                                        </div>
                                        
                                        <div className="text-center p-3 bg-white rounded-lg border">
                                            <div className="text-xs text-slate-500 uppercase font-bold">Empaque</div>
                                            <div className="text-xl font-bold text-slate-800 font-mono">{Number(cantidadEmpaque).toLocaleString()}</div>
                                            <div className="text-xs text-slate-400">unidades</div>
                                        </div>
                                        
                                        <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                            <div className="text-xs text-emerald-600 uppercase font-bold">Peso Neto</div>
                                            <div className="text-xl font-bold text-emerald-700 font-mono">{pesoNetoCalculado.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                            <div className="text-xs text-emerald-500">Kg</div>
                                        </div>
                                    </div>
                                    
                                    {/* Differences */}
                                    {(diferenciaPeso !== 0 || diferenciaEmpaque !== 0) && (
                                        <>
                                            <Separator />
                                            <div className="space-y-2">
                                                <div className="text-xs text-slate-500 uppercase font-bold">Diferencias con Compra Original</div>
                                                <div className="flex gap-4">
                                                    <div className={cn(
                                                        "flex-1 p-3 rounded-lg border flex items-center justify-between",
                                                        diferenciaPeso < 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
                                                    )}>
                                                        <span className="text-sm font-medium">Diferencia Peso</span>
                                                        <span className={cn(
                                                            "font-bold font-mono",
                                                            diferenciaPeso < 0 ? "text-red-600" : "text-emerald-600"
                                                        )}>
                                                            {diferenciaPeso > 0 ? '+' : ''}{diferenciaPeso.toLocaleString()} Kg
                                                        </span>
                                                    </div>
                                                    
                                                    <div className={cn(
                                                        "flex-1 p-3 rounded-lg border flex items-center justify-between",
                                                        diferenciaEmpaque < 0 ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
                                                    )}>
                                                        <span className="text-sm font-medium">Diferencia Empaque</span>
                                                        <span className={cn(
                                                            "font-bold font-mono",
                                                            diferenciaEmpaque < 0 ? "text-red-600" : "text-blue-600"
                                                        )}>
                                                            {diferenciaEmpaque > 0 ? '+' : ''}{diferenciaEmpaque}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <DialogFooter className="flex justify-between items-center">
                            <div>
                                {currentStep > 1 && (
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setCurrentStep(currentStep - 1)}
                                        className="gap-2"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Anterior
                                    </Button>
                                )}
                            </div>
                            
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancelar
                                </Button>
                                
                                {currentStep < 3 ? (
                                    <Button 
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentStep(currentStep + 1);
                                        }}
                                        disabled={currentStep === 1 ? !canProceedStep1 : !canProceedStep2}
                                        className="gap-2"
                                    >
                                        Siguiente
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button 
                                        type="submit" 
                                        disabled={form.formState.isSubmitting}
                                        className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                                    >
                                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Check className="h-4 w-4" />
                                        {initialData ? "Guardar Cambios" : "Registrar Venta"}
                                    </Button>
                                )}
                            </div>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
