"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axiosClient from "@/lib/axios";
import { ReporteCalidadExportador, VentaNacional, CompraNacional } from "@/types/nacionales";
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
} from "@/components/ui/form";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Loader2,
    AlertTriangle,
    Info,
    FileOutput,
    TrendingUp,
    Package,
    DollarSign,
    Check,
    ChevronRight,
    ChevronLeft,
    Scale,
    Percent
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReporteExportadorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ventaData: VentaNacional;
    compraData: CompraNacional;
    initialData?: ReporteCalidadExportador | null;
    onSuccess: () => void;
}

export function ReporteExportadorModal({ open, onOpenChange, ventaData, compraData, initialData, onSuccess }: ReporteExportadorModalProps) {
    const [showPriceWarning, setShowPriceWarning] = useState(false);
    const [pendingSubmit, setPendingSubmit] = useState<z.infer<typeof formSchema> | null>(null);
    const [currentStep, setCurrentStep] = useState(1);

    // kg_totales is fixed = peso_neto_recibido (read-only)
    const kgTotales = ventaData.peso_neto_recibido;

    const formSchema = useMemo(() => z.object({
        fecha_reporte: z.string().min(1, "Ingrese fecha"),
        remision_exp: z.string().optional(),
        kg_exportacion: z.string()
            .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Peso inválido")
            .refine((val) => Number(val) <= kgTotales, `No puede superar ${kgTotales} Kg`),
        precio_venta_kg_exp: z.string()
            .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Precio inválido"),
        kg_nacional: z.string()
            .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Peso inválido")
            .refine((val) => Number(val) <= kgTotales, `No puede superar ${kgTotales} Kg`),
        precio_venta_kg_nal: z.string()
            .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Precio inválido"),
        factura: z.string().optional(),
        fecha_factura: z.string().optional(),
    }).refine((data) => {
        const exp = Number(data.kg_exportacion) || 0;
        const nal = Number(data.kg_nacional) || 0;
        return (exp + nal) <= kgTotales;
    }, {
        message: `La suma de Kg Exp + Kg Nal no puede superar ${kgTotales} Kg`,
        path: ["kg_nacional"]
    }), [kgTotales]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            fecha_reporte: new Date().toISOString().split('T')[0],
            remision_exp: "",
            kg_exportacion: "0",
            precio_venta_kg_exp: "",
            kg_nacional: "0",
            precio_venta_kg_nal: "",
            factura: "",
            fecha_factura: "",
        }
    });

    // Watch values for calculations
    const kgExp = form.watch("kg_exportacion");
    const kgNal = form.watch("kg_nacional");
    const precioExp = form.watch("precio_venta_kg_exp");
    const precioNal = form.watch("precio_venta_kg_nal");
    const fechaReporte = form.watch("fecha_reporte");
    const remisionExp = form.watch("remision_exp");
    const factura = form.watch("factura");

    // Calculated values (display-only)
    const kgMerma = useMemo(() => {
        return Math.max(0, kgTotales - (Number(kgExp) || 0) - (Number(kgNal) || 0));
    }, [kgTotales, kgExp, kgNal]);

    const porcentajeExp = useMemo(() => {
        if (kgTotales <= 0) return 0;
        return ((Number(kgExp) || 0) / kgTotales * 100);
    }, [kgTotales, kgExp]);

    const porcentajeNal = useMemo(() => {
        if (kgTotales <= 0) return 0;
        return ((Number(kgNal) || 0) / kgTotales * 100);
    }, [kgTotales, kgNal]);

    const porcentajeMerma = useMemo(() => {
        if (kgTotales <= 0) return 0;
        return (kgMerma / kgTotales * 100);
    }, [kgTotales, kgMerma]);

    const precioTotal = useMemo(() => {
        const exp = (Number(kgExp) || 0) * (Number(precioExp) || 0);
        const nal = (Number(kgNal) || 0) * (Number(precioNal) || 0);
        return exp + nal;
    }, [kgExp, kgNal, precioExp, precioNal]);

    // Real-time validation errors
    const validationErrors = useMemo(() => {
        const errors: string[] = [];
        const exp = Number(kgExp) || 0;
        const nal = Number(kgNal) || 0;
        const sum = exp + nal;

        if (exp > kgTotales) {
            errors.push(`Kg Exportación (${exp.toLocaleString()}) excede el peso neto disponible (${kgTotales.toLocaleString()} Kg)`);
        }
        if (nal > kgTotales) {
            errors.push(`Kg Nacional (${nal.toLocaleString()}) excede el peso neto disponible (${kgTotales.toLocaleString()} Kg)`);
        }
        if (sum > kgTotales) {
            errors.push(`La suma de Kg Exp (${exp.toLocaleString()}) + Kg Nal (${nal.toLocaleString()}) = ${sum.toLocaleString()} Kg supera los ${kgTotales.toLocaleString()} Kg disponibles`);
        }
        return errors;
    }, [kgExp, kgNal, kgTotales]);

    // Currency formatter
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    useEffect(() => {
        if (open) {
            setCurrentStep(1);
            if (initialData) {
                form.reset({
                    fecha_reporte: initialData.fecha_reporte,
                    remision_exp: initialData.remision_exp || "",
                    kg_exportacion: initialData.kg_exportacion.toString(),
                    precio_venta_kg_exp: initialData.precio_venta_kg_exp.toString(),
                    kg_nacional: initialData.kg_nacional.toString(),
                    precio_venta_kg_nal: initialData.precio_venta_kg_nal.toString(),
                    factura: initialData.factura || "",
                    fecha_factura: initialData.fecha_factura || "",
                });
            } else {
                form.reset({
                    fecha_reporte: new Date().toISOString().split('T')[0],
                    remision_exp: "",
                    kg_exportacion: "0",
                    precio_venta_kg_exp: compraData.precio_compra_exp.toString(),
                    kg_nacional: "0",
                    precio_venta_kg_nal: "0",
                    factura: "",
                    fecha_factura: "",
                });
            }
        }
    }, [open, initialData, form, compraData]);

    const handleSubmitWithWarning = async (values: z.infer<typeof formSchema>) => {
        const precioVentaExp = Number(values.precio_venta_kg_exp);
        const precioCompraExp = compraData.precio_compra_exp;

        if (precioVentaExp < precioCompraExp) {
            setPendingSubmit(values);
            setShowPriceWarning(true);
            return;
        }

        await submitForm(values);
    };

    const submitForm = async (values: z.infer<typeof formSchema>) => {
        try {
            const payload = {
                venta_nacional: ventaData.id,
                fecha_reporte: values.fecha_reporte,
                remision_exp: values.remision_exp,
                kg_exportacion: Number(values.kg_exportacion),
                precio_venta_kg_exp: Number(values.precio_venta_kg_exp),
                kg_nacional: Number(values.kg_nacional),
                precio_venta_kg_nal: Number(values.precio_venta_kg_nal),
                factura: values.factura || null,
                fecha_factura: values.fecha_factura || null,
            };

            if (initialData) {
                await axiosClient.patch(`/nacionales/api/reporte-exp/${initialData?.venta_nacional}/`, payload);
                toast.success("Reporte actualizado correctamente");
            } else {
                await axiosClient.post('/nacionales/api/reporte-exp/', payload);
                toast.success("Reporte creado correctamente");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving reporte exp:", error);
            toast.error("Error al guardar reporte");
        }
    };

    const confirmPriceWarning = () => {
        setShowPriceWarning(false);
        if (pendingSubmit) {
            submitForm(pendingSubmit);
            setPendingSubmit(null);
        }
    };

    const steps = [
        { id: 1, title: "Distribución", icon: Scale },
        { id: 2, title: "Precios", icon: DollarSign },
        { id: 3, title: "Facturación", icon: FileOutput },
    ];

    const canProceedStep1 = Number(kgExp) >= 0 && Number(kgNal) >= 0 && (Number(kgExp) + Number(kgNal)) <= kgTotales && validationErrors.length === 0;
    const canProceedStep2 = Number(precioExp) > 0;
    const hasValidationErrors = validationErrors.length > 0;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white">
                                <FileOutput className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl">{initialData ? "Editar Reporte Exportador" : "Registrar Reporte Exportador"}</h2>
                                <p className="text-sm text-slate-500 font-normal">Guía: {compraData.numero_guia} • Exportador: {ventaData.exportador_nombre}</p>
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
                                                isActive ? "bg-indigo-100 text-indigo-700" :
                                                    isCompleted ? "text-emerald-600 hover:bg-emerald-50" :
                                                        "text-slate-400"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                                                isActive ? "bg-indigo-600 text-white" :
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
                                <Info className="h-4 w-4 text-indigo-600" />
                                Datos de Referencia
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-center">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Peso Neto Recibido</div>
                                    <div className="text-2xl font-bold text-indigo-700 font-mono">{kgTotales.toLocaleString()}</div>
                                    <div className="text-xs text-slate-400">Kg (fijo)</div>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-center">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Precio Compra</div>
                                    <div className="text-2xl font-bold text-slate-700 font-mono">{formatCurrency(compraData.precio_compra_exp)}</div>
                                    <div className="text-xs text-slate-400">por Kg</div>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-center">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Fecha Llegada</div>
                                    <div className="text-lg font-bold text-slate-700">{ventaData.fecha_llegada}</div>
                                    <div className="text-xs text-slate-400">Vence: {ventaData.fecha_vencimiento}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmitWithWarning)} className="space-y-6">

                            {/* Step 1: Distribución de Calidad */}
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="fecha_reporte"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        <Scale className="h-4 w-4 text-slate-400" />
                                                        Fecha Reporte <span className="text-red-500">*</span>
                                                    </FormLabel>
                                                    <FormControl><Input type="date" className="h-11" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="remision_exp"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        <FileOutput className="h-4 w-4 text-slate-400" />
                                                        Remisión Exportador
                                                    </FormLabel>
                                                    <FormControl><Input placeholder="Ej: REM-001" className="h-11" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Visual Quality Distribution */}
                                    <Card className="border-indigo-200">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Scale className="h-5 w-5 text-indigo-600" />
                                                Distribución de Calidad
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent className="space-y-6">
                                            {/* Total Kg Display */}
                                            <div className="bg-slate-100 rounded-xl p-4 text-center">
                                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Kg Totales a Distribuir</div>
                                                <div className="text-3xl font-bold text-slate-800 font-mono">{kgTotales.toLocaleString()} Kg</div>
                                            </div>

                                            {/* Visual Bar */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="text-emerald-600">Exportación: {porcentajeExp.toFixed(1)}%</span>
                                                    <span className="text-blue-600">Nacional: {porcentajeNal.toFixed(1)}%</span>
                                                    <span className="text-slate-500">Merma: {porcentajeMerma.toFixed(1)}%</span>
                                                </div>

                                                <div className="h-8 w-full rounded-lg overflow-hidden flex">
                                                    <div
                                                        className="bg-emerald-500 h-full transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
                                                        style={{ width: `${porcentajeExp}%` }}
                                                    >
                                                        {porcentajeExp > 10 && `${porcentajeExp.toFixed(0)}%`}
                                                    </div>

                                                    <div
                                                        className="bg-blue-500 h-full transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
                                                        style={{ width: `${porcentajeNal}%` }}
                                                    >
                                                        {porcentajeNal > 10 && `${porcentajeNal.toFixed(0)}%`}
                                                    </div>

                                                    <div
                                                        className="bg-slate-400 h-full transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
                                                        style={{ width: `${porcentajeMerma}%` }}
                                                    >
                                                        {porcentajeMerma > 10 && `${porcentajeMerma.toFixed(0)}%`}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Input Fields */}
                                            <div className="grid grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="kg_exportacion"
                                                    render={({ field }) => (
                                                        <FormItem className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                                                            <FormLabel className="flex items-center gap-2 text-emerald-700">
                                                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                                                Kg Exportación
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className="h-12 text-xl font-bold text-emerald-700 bg-white"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <div className="text-xs text-emerald-600 mt-1">
                                                                {porcentajeExp.toFixed(2)}% del total
                                                            </div>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="kg_nacional"
                                                    render={({ field }) => (
                                                        <FormItem className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                                            <FormLabel className="flex items-center gap-2 text-blue-700">
                                                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                                                Kg Nacional
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className="h-12 text-xl font-bold text-blue-700 bg-white"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <div className="text-xs text-blue-600 mt-1">
                                                                {porcentajeNal.toFixed(2)}% del total
                                                            </div>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Merma Display */}
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-slate-400" />
                                                        <span className="font-medium text-slate-700">Kg Merma (Calculado)</span>
                                                    </div>

                                                    <div className="text-right">
                                                        <div className="text-xl font-bold text-slate-700 font-mono">{kgMerma.toFixed(2)} Kg</div>
                                                        <div className="text-xs text-slate-500">{porcentajeMerma.toFixed(2)}%</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Real-time validation errors */}
                                            {validationErrors.length > 0 && (
                                                <Alert variant="destructive" className="border-red-300 bg-red-50">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    <AlertDescription>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {validationErrors.map((error, index) => (
                                                                <li key={index} className="text-sm">{error}</li>
                                                            ))}
                                                        </ul>
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Step 2: Precios */}
                            {currentStep === 2 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <Card className="border-indigo-200">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <DollarSign className="h-5 w-5 text-indigo-600" />
                                                Precios de Venta
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent className="space-y-6">
                                            {/* Exportación Price */}
                                            <FormField
                                                control={form.control}
                                                name="precio_venta_kg_exp"
                                                render={({ field }) => (
                                                    <FormItem className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <FormLabel className="flex items-center gap-2 text-emerald-700 m-0">
                                                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                                                Precio Venta Exportación ($/Kg)
                                                            </FormLabel>

                                                            <Badge variant="outline" className="bg-white">
                                                                {Number(kgExp).toLocaleString()} Kg
                                                            </Badge>
                                                        </div>

                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                className="h-12 text-xl font-bold text-emerald-700 bg-white"
                                                                placeholder="0"
                                                                {...field}
                                                            />
                                                        </FormControl>

                                                        <div className="flex justify-between text-xs mt-1">
                                                            <span className="text-slate-500">Precio compra: {formatCurrency(compraData.precio_compra_exp)}</span>
                                                            <span className="text-emerald-600 font-medium">
                                                                Subtotal: {formatCurrency((Number(kgExp) || 0) * (Number(precioExp) || 0))}
                                                            </span>
                                                        </div>

                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Nacional Price */}

                                            <FormField
                                                control={form.control}
                                                name="precio_venta_kg_nal"
                                                render={({ field }) => (
                                                    <FormItem className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <FormLabel className="flex items-center gap-2 text-blue-700 m-0">
                                                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                                                Precio Venta Nacional ($/Kg)
                                                            </FormLabel>

                                                            <Badge variant="outline" className="bg-white">
                                                                {Number(kgNal).toLocaleString()} Kg
                                                            </Badge>
                                                        </div>

                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                className="h-12 text-xl font-bold text-blue-700 bg-white"
                                                                placeholder="0"
                                                                {...field}
                                                            />
                                                        </FormControl>

                                                        <div className="text-xs text-blue-600 mt-1 text-right">
                                                            Subtotal: {formatCurrency((Number(kgNal) || 0) * (Number(precioNal) || 0))}
                                                        </div>

                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>

                                    {/* Total Summary */}

                                    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                                        <TrendingUp className="h-6 w-6 text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-slate-400">Total Factura (Calculado)</div>
                                                        <div className="text-xs text-slate-500">Exportación + Nacional</div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-3xl font-bold font-mono text-emerald-400">{formatCurrency(precioTotal)}</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Step 3: Facturación */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <Card className="border-indigo-200">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <FileOutput className="h-5 w-5 text-indigo-600" />
                                                Información de Facturación
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="factura"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="flex items-center gap-2">
                                                                <FileOutput className="h-4 w-4 text-slate-400" />
                                                                Factura Heavens
                                                            </FormLabel>
                                                            <FormControl><Input placeholder="Ej: FV-001" className="h-11" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />


                                                <FormField
                                                    control={form.control}
                                                    name="fecha_factura"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="flex items-center gap-2">
                                                                <Scale className="h-4 w-4 text-slate-400" />
                                                                Fecha Factura
                                                            </FormLabel>
                                                            <FormControl><Input type="date" className="h-11" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Summary */}

                                    <Card className="bg-slate-50 border-slate-200">
                                        <CardContent className="p-6">
                                            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                <Check className="h-5 w-5 text-emerald-600" />
                                                Resumen del Reporte
                                            </h3>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                                    <span className="text-slate-600">Fecha Reporte</span>
                                                    <span className="font-medium">{fechaReporte}</span>
                                                </div>

                                                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                                    <span className="text-slate-600">Remisión</span>
                                                    <span className="font-medium">{remisionExp || 'Sin remisión'}</span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 py-2">
                                                    <div className="text-center p-2 bg-emerald-100 rounded">
                                                        <div className="text-xs text-emerald-600 font-bold">Exportación</div>
                                                        <div className="text-sm font-bold text-emerald-700">{Number(kgExp).toLocaleString()} Kg</div>
                                                        <div className="text-xs text-emerald-600">{formatCurrency(Number(precioExp))}/Kg</div>
                                                    </div>


                                                    <div className="text-center p-2 bg-blue-100 rounded">
                                                        <div className="text-xs text-blue-600 font-bold">Nacional</div>
                                                        <div className="text-sm font-bold text-blue-700">{Number(kgNal).toLocaleString()} Kg</div>
                                                        <div className="text-xs text-blue-600">{formatCurrency(Number(precioNal))}/Kg</div>
                                                    </div>


                                                    <div className="text-center p-2 bg-slate-200 rounded">
                                                        <div className="text-xs text-slate-600 font-bold">Merma</div>
                                                        <div className="text-sm font-bold text-slate-700">{kgMerma.toFixed(2)} Kg</div>
                                                        <div className="text-xs text-slate-500">{porcentajeMerma.toFixed(1)}%</div>
                                                    </div>
                                                </div>


                                                <div className="flex justify-between items-center py-3 bg-emerald-50 rounded-lg px-4">
                                                    <span className="font-semibold text-slate-700">Total Factura</span>
                                                    <span className="text-xl font-bold text-emerald-700 font-mono">{formatCurrency(precioTotal)}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
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
                                            disabled={form.formState.isSubmitting || hasValidationErrors}
                                            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                                        >
                                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <Check className="h-4 w-4" />
                                            {initialData ? "Guardar Cambios" : "Guardar Reporte"}
                                        </Button>
                                    )}
                                </div>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Price Warning Dialog */}

            <AlertDialog open={showPriceWarning} onOpenChange={setShowPriceWarning}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            Atención: Precio de Venta Inferior
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-600">
                            El <strong>precio de venta Kg Exportación</strong> ({formatCurrency(Number(pendingSubmit?.precio_venta_kg_exp || 0))})
                            es <strong className="text-red-600">menor</strong> que el precio de compra ({formatCurrency(compraData.precio_compra_exp)}).
                            <br /><br />
                            ¿Está seguro que desea continuar con este precio?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingSubmit(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmPriceWarning} className="bg-amber-600 hover:bg-amber-700">
                            Sí, Guardar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
