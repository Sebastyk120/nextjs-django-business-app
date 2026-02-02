"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axiosClient from "@/lib/axios";
import { ReporteCalidadProveedor, ReporteCalidadExportador, CompraNacional } from "@/types/nacionales";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
    Loader2,
    Info,
    AlertTriangle,
    Check,
    ChevronRight,
    ChevronLeft,
    Scale,
    DollarSign,
    FileCheck,
    TrendingUp,
    TrendingDown,
    Calculator,
    Receipt,
    Percent
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReporteProveedorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reporteExpData: ReporteCalidadExportador;
    compraData: CompraNacional;
    initialData?: ReporteCalidadProveedor | null;
    onSuccess: () => void;
}

export function ReporteProveedorModal({ open, onOpenChange, reporteExpData, compraData, initialData, onSuccess }: ReporteProveedorModalProps) {
    const [currentStep, setCurrentStep] = useState(1);

    // Default values from ReporteExportador
    const defaultKgTotales = reporteExpData.kg_totales;
    const defaultKgExp = reporteExpData.kg_exportacion;
    const defaultKgNal = reporteExpData.kg_nacional;

    // Prices come from CompraNacional (read-only)
    const precioKgExp = compraData.precio_compra_exp;
    const precioKgNal = compraData.precio_compra_nal || compraData.precio_compra_exp;

    // Provider tax settings
    const proveedorAsohofrucol = compraData.proveedor_asohofrucol || false;
    const proveedorRteFte = compraData.proveedor_rte_fte || false;
    const proveedorRteIca = compraData.proveedor_rte_ica || false;

    const formSchema = useMemo(() => z.object({
        p_kg_totales: z.string()
            .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Peso inválido"),
        p_kg_exportacion: z.string()
            .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Peso inválido"),
        p_kg_nacional: z.string()
            .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Peso inválido"),
        factura_prov: z.string().optional(),
        reporte_enviado: z.boolean(),
    }).refine((data) => {
        const total = Number(data.p_kg_totales) || 0;
        const exp = Number(data.p_kg_exportacion) || 0;
        const nal = Number(data.p_kg_nacional) || 0;
        return (exp + nal) <= total;
    }, {
        message: "La suma de Kg Exp + Kg Nal no puede superar el Kg Total",
        path: ["p_kg_nacional"]
    }).refine((data) => {
        const total = Number(data.p_kg_totales) || 0;
        const exp = Number(data.p_kg_exportacion) || 0;
        return exp <= total;
    }, {
        message: "Kg Exportación no puede superar el total",
        path: ["p_kg_exportacion"]
    }).refine((data) => {
        const total = Number(data.p_kg_totales) || 0;
        const nal = Number(data.p_kg_nacional) || 0;
        return nal <= total;
    }, {
        message: "Kg Nacional no puede superar el total",
        path: ["p_kg_nacional"]
    }), []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            p_kg_totales: "",
            p_kg_exportacion: "0",
            p_kg_nacional: "0",
            factura_prov: "",
            reporte_enviado: false,
        }
    });

    // Watch values for calculations
    const pKgTotales = form.watch("p_kg_totales");
    const pKgExp = form.watch("p_kg_exportacion");
    const pKgNal = form.watch("p_kg_nacional");
    const reporteEnviado = form.watch("reporte_enviado");
    const facturaProv = form.watch("factura_prov");

    // All calculations
    const calculations = useMemo(() => {
        const total = Number(pKgTotales) || 0;
        const exp = Number(pKgExp) || 0;
        const nal = Number(pKgNal) || 0;
        const sum = exp + nal;
        const merma = Math.max(0, total - exp - nal);
        const rawMerma = total - exp - nal;

        const porcExp = total > 0 ? (exp / total * 100) : 0;
        const porcNal = total > 0 ? (nal / total * 100) : 0;
        const porcMerma = total > 0 ? (merma / total * 100) : 0;

        const totalFacturar = (exp * precioKgExp) + (nal * precioKgNal);

        // Calculate tax deductions based on provider settings
        const asohofrucol = proveedorAsohofrucol ? totalFacturar * 0.01 : 0;
        const rteFte = proveedorRteFte ? totalFacturar * 0.015 : 0;
        const rteIca = proveedorRteIca ? totalFacturar * (4.14 / 1000) : 0;

        const totalDeductions = asohofrucol + rteFte + rteIca;
        const totalPagar = totalFacturar - totalDeductions;

        // Utilidad = ReporteExp.precio_total - totalFacturar
        const utilidad = (reporteExpData.precio_total || 0) - totalFacturar;

        return {
            merma,
            rawMerma,
            sum,
            porcExp: porcExp.toFixed(2),
            porcNal: porcNal.toFixed(2),
            porcMerma: porcMerma.toFixed(2),
            totalFacturar,
            asohofrucol,
            rteFte,
            rteIca,
            totalDeductions,
            totalPagar,
            utilidad,
            isNegativeMerma: rawMerma < 0,
        };
    }, [pKgTotales, pKgExp, pKgNal, precioKgExp, precioKgNal, proveedorAsohofrucol, proveedorRteFte, proveedorRteIca, reporteExpData.precio_total]);

    // Real-time validation errors
    const validationErrors = useMemo(() => {
        const errors: string[] = [];
        const total = Number(pKgTotales) || 0;
        const exp = Number(pKgExp) || 0;
        const nal = Number(pKgNal) || 0;
        const sum = exp + nal;

        if (total <= 0) {
            errors.push("Kg Totales debe ser mayor a 0");
        }
        if (exp > total && total > 0) {
            errors.push(`Kg Exportación (${exp.toLocaleString()}) excede los Kg Totales (${total.toLocaleString()} Kg)`);
        }
        if (nal > total && total > 0) {
            errors.push(`Kg Nacional (${nal.toLocaleString()}) excede los Kg Totales (${total.toLocaleString()} Kg)`);
        }
        if (sum > total && total > 0) {
            errors.push(`La suma de Kg Exp (${exp.toLocaleString()}) + Kg Nal (${nal.toLocaleString()}) = ${sum.toLocaleString()} Kg supera los ${total.toLocaleString()} Kg totales`);
        }
        return errors;
    }, [pKgTotales, pKgExp, pKgNal]);

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
                    p_kg_totales: initialData.p_kg_totales?.toString() || defaultKgTotales.toString(),
                    p_kg_exportacion: initialData.p_kg_exportacion?.toString() || "0",
                    p_kg_nacional: initialData.p_kg_nacional?.toString() || "0",
                    factura_prov: initialData.factura_prov || "",
                    reporte_enviado: initialData.reporte_enviado || false,
                });
            } else {
                form.reset({
                    p_kg_totales: defaultKgTotales.toString(),
                    p_kg_exportacion: defaultKgExp.toString(),
                    p_kg_nacional: defaultKgNal.toString(),
                    factura_prov: "",
                    reporte_enviado: false,
                });
            }
        }
    }, [open, initialData, form, defaultKgTotales, defaultKgExp, defaultKgNal]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const payload = {
                rep_cal_exp: reporteExpData.venta_nacional,
                p_kg_totales: Number(values.p_kg_totales),
                p_kg_exportacion: Number(values.p_kg_exportacion),
                p_kg_nacional: Number(values.p_kg_nacional),
                factura_prov: values.factura_prov || null,
                reporte_enviado: values.reporte_enviado,
            };

            if (initialData) {
                await axiosClient.patch(`/nacionales/api/reporte-prov/${reporteExpData.venta_nacional}/`, payload);
                toast.success("Reporte actualizado correctamente");
            } else {
                await axiosClient.post('/nacionales/api/reporte-prov/', payload);
                toast.success("Reporte creado correctamente");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error saving reporte prov:", error);
            const errorMsg = error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || "Error al guardar reporte";
            toast.error(errorMsg);
        }
    };

    const steps = [
        { id: 1, title: "Comparación", icon: Scale },
        { id: 2, title: "Ajustes", icon: Calculator },
        { id: 3, title: "Resumen", icon: Receipt },
    ];

    const canProceedStep1 = Number(pKgTotales) > 0;
    const canProceedStep2 = !calculations.isNegativeMerma && validationErrors.length === 0;
    const hasValidationErrors = validationErrors.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                            <FileCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl">{initialData ? "Editar Reporte Proveedor" : "Generar Reporte Proveedor"}</h2>
                            <p className="text-sm text-slate-500 font-normal">Guía: {compraData.numero_guia} • Proveedor: {compraData.proveedor_nombre}</p>
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
                                            isActive ? "bg-purple-100 text-purple-700" :
                                                isCompleted ? "text-emerald-600 hover:bg-emerald-50" :
                                                    "text-slate-400"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                                            isActive ? "bg-purple-600 text-white" :
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

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Step 1: Comparación Exportador vs Proveedor */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Comparison Header */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="bg-indigo-50 border-indigo-200">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2 text-indigo-700">
                                                <Scale className="h-4 w-4" />
                                                Reporte Exportador
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-600">Kg Totales</span>
                                                    <span className="font-mono font-bold text-indigo-700">{defaultKgTotales.toLocaleString()} Kg</span>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-600">Kg Exportación</span>
                                                    <span className="font-mono text-emerald-600">{Number(defaultKgExp).toLocaleString()} Kg</span>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-600">Kg Nacional</span>
                                                    <span className="font-mono text-blue-600">{Number(defaultKgNal).toLocaleString()} Kg</span>
                                                </div>

                                                <Separator />

                                                <div className="flex justify-between">
                                                    <span className="text-xs font-bold text-slate-700">Total Venta</span>
                                                    <span className="font-mono font-bold text-indigo-700">{formatCurrency(reporteExpData.precio_total || 0)}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-purple-50 border-purple-200">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
                                                <FileCheck className="h-4 w-4" />
                                                Reporte Proveedor (Actual)
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-600">Kg Totales</span>
                                                    <span className="font-mono font-bold text-purple-700">{Number(pKgTotales || 0).toLocaleString()} Kg</span>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-600">Kg Exportación</span>
                                                    <span className="font-mono text-emerald-600">{Number(pKgExp || 0).toLocaleString()} Kg</span>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-600">Kg Nacional</span>
                                                    <span className="font-mono text-blue-600">{Number(pKgNal || 0).toLocaleString()} Kg</span>
                                                </div>

                                                <Separator />

                                                <div className="flex justify-between">
                                                    <span className="text-xs font-bold text-slate-700">Total a Pagar</span>
                                                    <span className="font-mono font-bold text-purple-700">{formatCurrency(calculations.totalPagar)}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Kg Totales Input */}

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Scale className="h-5 w-5 text-purple-600" />
                                            Ajuste de Kilogramas
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="p_kg_totales"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        <Scale className="h-4 w-4 text-slate-400" />
                                                        Kg Totales Proveedor <span className="text-red-500">*</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className="h-12 text-xl font-bold"
                                                            {...field}
                                                        />
                                                    </FormControl>

                                                    <FormDescription>
                                                        Puede ajustar si difiere del reporte exportador ({defaultKgTotales.toLocaleString()} Kg)
                                                    </FormDescription>

                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Step 2: Ajustes de Distribución */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Calculator className="h-5 w-5 text-purple-600" />
                                            Distribución de Calidad Proveedor
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="space-y-6">
                                        {/* Visual Distribution Bar */}

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="text-emerald-600">Exportación: {calculations.porcExp}%</span>
                                                <span className="text-blue-600">Nacional: {calculations.porcNal}%</span>
                                                <span className="text-slate-500">Merma: {calculations.porcMerma}%</span>
                                            </div>


                                            <div className="h-8 w-full rounded-lg overflow-hidden flex">
                                                <div
                                                    className="bg-emerald-500 h-full transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
                                                    style={{ width: `${Number(calculations.porcExp)}%` }}
                                                >
                                                    {Number(calculations.porcExp) > 10 && `${Number(calculations.porcExp).toFixed(0)}%`}
                                                </div>


                                                <div
                                                    className="bg-blue-500 h-full transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
                                                    style={{ width: `${Number(calculations.porcNal)}%` }}
                                                >
                                                    {Number(calculations.porcNal) > 10 && `${Number(calculations.porcNal).toFixed(0)}%`}
                                                </div>


                                                <div
                                                    className="bg-slate-400 h-full transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
                                                    style={{ width: `${Number(calculations.porcMerma)}%` }}
                                                >
                                                    {Number(calculations.porcMerma) > 10 && `${Number(calculations.porcMerma).toFixed(0)}%`}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Input Fields */}

                                        <div className="grid grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="p_kg_exportacion"
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
                                                            {calculations.porcExp}% • {formatCurrency(precioKgExp)}/Kg
                                                        </div>

                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />


                                            <FormField
                                                control={form.control}
                                                name="p_kg_nacional"
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
                                                            {calculations.porcNal}% • {formatCurrency(precioKgNal)}/Kg
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
                                                    <div className="text-xl font-bold text-slate-700 font-mono">{calculations.merma.toFixed(2)} Kg</div>
                                                    <div className="text-xs text-slate-500">{calculations.porcMerma}%</div>
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

                                {/* Tax Info */}

                                <Card className="bg-amber-50 border-amber-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                                            <Percent className="h-4 w-4" />
                                            Retenciones del Proveedor
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="flex gap-6 text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-3 h-3 rounded-full",
                                                    proveedorAsohofrucol ? "bg-amber-500" : "bg-slate-300"
                                                )} />
                                                <span className={proveedorAsohofrucol ? "text-amber-700 font-medium" : "text-slate-400"}>
                                                    Asohofrucol {proveedorAsohofrucol ? "(1%)" : "(No aplica)"}
                                                </span>
                                            </div>


                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-3 h-3 rounded-full",
                                                    proveedorRteFte ? "bg-amber-500" : "bg-slate-300"
                                                )} />
                                                <span className={proveedorRteFte ? "text-amber-700 font-medium" : "text-slate-400"}>
                                                    Rete Fte {proveedorRteFte ? "(1.5%)" : "(No aplica)"}
                                                </span>
                                            </div>


                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-3 h-3 rounded-full",
                                                    proveedorRteIca ? "bg-amber-500" : "bg-slate-300"
                                                )} />
                                                <span className={proveedorRteIca ? "text-amber-700 font-medium" : "text-slate-400"}>
                                                    Rete ICA {proveedorRteIca ? "(4.14/1000)" : "(No aplica)"}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Step 3: Resumen y Facturación */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Financial Summary */}

                                    <Card className="col-span-2 lg:col-span-1">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <DollarSign className="h-5 w-5 text-purple-600" />
                                                Resumen Financiero
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                <span className="text-slate-600">Total a Facturar</span>
                                                <span className="font-mono font-medium">{formatCurrency(calculations.totalFacturar)}</span>
                                            </div>

                                            {calculations.totalDeductions > 0 && (
                                                <>
                                                    <div className="flex justify-between items-center py-2 text-sm">
                                                        <span className="text-slate-500">Asohofrucol (1%)</span>
                                                        <span className="font-mono text-red-500">- {formatCurrency(calculations.asohofrucol)}</span>
                                                    </div>


                                                    <div className="flex justify-between items-center py-2 text-sm">
                                                        <span className="text-slate-500">Rete Fte (1.5%)</span>
                                                        <span className="font-mono text-red-500">- {formatCurrency(calculations.rteFte)}</span>
                                                    </div>


                                                    <div className="flex justify-between items-center py-2 text-sm">
                                                        <span className="text-slate-500">Rete ICA (4.14/1000)</span>
                                                        <span className="font-mono text-red-500">- {formatCurrency(calculations.rteIca)}</span>
                                                    </div>


                                                    <div className="flex justify-between items-center py-2 border-t border-slate-200">
                                                        <span className="text-slate-600">Total Retenciones</span>
                                                        <span className="font-mono text-red-600 font-medium">- {formatCurrency(calculations.totalDeductions)}</span>
                                                    </div>
                                                </>
                                            )}


                                            <div className="flex justify-between items-center py-3 bg-purple-50 rounded-lg px-3">
                                                <span className="font-semibold text-purple-700">Total a Pagar</span>
                                                <span className="text-xl font-bold text-purple-700 font-mono">{formatCurrency(calculations.totalPagar)}</span>
                                            </div>


                                            <div className={cn(
                                                "flex justify-between items-center py-3 rounded-lg px-3",
                                                calculations.utilidad >= 0 ? "bg-emerald-50" : "bg-red-50"
                                            )}>
                                                <span className={cn(
                                                    "font-semibold",
                                                    calculations.utilidad >= 0 ? "text-emerald-700" : "text-red-700"
                                                )}>
                                                    Utilidad Estimada
                                                </span>

                                                <span className={cn(
                                                    "text-xl font-bold font-mono",
                                                    calculations.utilidad >= 0 ? "text-emerald-700" : "text-red-700"
                                                )}>
                                                    {formatCurrency(calculations.utilidad)}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Invoice Info */}

                                    <Card className="col-span-2 lg:col-span-1">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Receipt className="h-5 w-5 text-purple-600" />
                                                Información de Facturación
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="factura_prov"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Factura Proveedor</FormLabel>

                                                        <FormControl>
                                                            <Input placeholder="Ej: FP-001" className="h-11" {...field} />
                                                        </FormControl>

                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />


                                            <FormField
                                                control={form.control}
                                                name="reporte_enviado"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>

                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel>Reporte Enviado al Proveedor</FormLabel>

                                                            <FormDescription>
                                                                Marque cuando el reporte haya sido enviado al proveedor
                                                            </FormDescription>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Quality Summary */}

                                <Card className="bg-slate-50 border-slate-200">
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                            <Check className="h-5 w-5 text-emerald-600" />
                                            Resumen de Calidad
                                        </h3>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-center p-4 bg-emerald-100 rounded-xl">
                                                <div className="text-xs text-emerald-600 font-bold uppercase mb-1">Exportación</div>

                                                <div className="text-2xl font-bold text-emerald-700">{Number(pKgExp).toLocaleString()}</div>

                                                <div className="text-xs text-emerald-600">Kg • {calculations.porcExp}%</div>
                                            </div>


                                            <div className="text-center p-4 bg-blue-100 rounded-xl">
                                                <div className="text-xs text-blue-600 font-bold uppercase mb-1">Nacional</div>

                                                <div className="text-2xl font-bold text-blue-700">{Number(pKgNal).toLocaleString()}</div>

                                                <div className="text-xs text-blue-600">Kg • {calculations.porcNal}%</div>
                                            </div>


                                            <div className="text-center p-4 bg-slate-200 rounded-xl">
                                                <div className="text-xs text-slate-600 font-bold uppercase mb-1">Merma</div>

                                                <div className="text-2xl font-bold text-slate-700">{calculations.merma.toFixed(2)}</div>

                                                <div className="text-xs text-slate-500">Kg • {calculations.porcMerma}%</div>
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
                                        className="bg-purple-600 hover:bg-purple-700 gap-2"
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
    );
}
