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
import { Loader2, Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReporteProveedorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reporteExpData: ReporteCalidadExportador;
    compraData: CompraNacional;
    initialData?: ReporteCalidadProveedor | null;
    onSuccess: () => void;
}

export function ReporteProveedorModal({ open, onOpenChange, reporteExpData, compraData, initialData, onSuccess }: ReporteProveedorModalProps) {

    // Default values from ReporteExportador
    const defaultKgTotales = reporteExpData.kg_totales;
    const defaultKgExp = reporteExpData.kg_exportacion;
    const defaultKgNal = reporteExpData.kg_nacional;

    // Prices come from CompraNacional (read-only)
    const precioKgExp = compraData.precio_compra_exp;
    const precioKgNal = compraData.precio_compra_nal || compraData.precio_compra_exp; // Fallback if null

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
        const merma = Math.max(0, total - exp - nal);

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
            isNegativeMerma: merma < 0,
        };
    }, [pKgTotales, pKgExp, pKgNal, precioKgExp, precioKgNal, proveedorAsohofrucol, proveedorRteFte, proveedorRteIca, reporteExpData.precio_total]);

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
            if (initialData) {
                form.reset({
                    p_kg_totales: initialData.p_kg_totales?.toString() || defaultKgTotales.toString(),
                    p_kg_exportacion: initialData.p_kg_exportacion?.toString() || "0",
                    p_kg_nacional: initialData.p_kg_nacional?.toString() || "0",
                    factura_prov: initialData.factura_prov || "",
                    reporte_enviado: initialData.reporte_enviado || false,
                });
            } else {
                // Default to values from ReporteExportador
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
                // Backend calculates: p_kg_merma, percentages, prices, totals, taxes, estado, completado
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Reporte Proveedor" : "Generar Reporte Proveedor"}</DialogTitle>
                </DialogHeader>

                {/* Reference Info */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                    <div className="flex items-center gap-2 mb-2 text-slate-700 font-medium">
                        <Info className="h-4 w-4" />
                        Datos de Referencia (Reporte Exportador)
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                        <div><span className="text-slate-500">Kg Total:</span> <span className="font-mono">{defaultKgTotales.toLocaleString()}</span></div>
                        <div><span className="text-slate-500">Kg Exp:</span> <span className="font-mono text-emerald-600">{Number(defaultKgExp).toLocaleString()}</span></div>
                        <div><span className="text-slate-500">Kg Nal:</span> <span className="font-mono text-blue-600">{Number(defaultKgNal).toLocaleString()}</span></div>
                        <div><span className="text-slate-500">Total Venta:</span> <span className="font-mono font-bold">{formatCurrency(reporteExpData.precio_total || 0)}</span></div>
                    </div>
                </div>

                {/* Provider Tax Info */}
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs">
                    <div className="flex items-center gap-2 text-amber-700 font-medium mb-1">
                        <Info className="h-3 w-3" />
                        Retenciones del Proveedor: {compraData.proveedor_nombre}
                    </div>
                    <div className="flex gap-4 text-amber-600">
                        <span>Asohofrucol: <strong>{proveedorAsohofrucol ? "Sí (1%)" : "No"}</strong></span>
                        <span>Rete Fte: <strong>{proveedorRteFte ? "Sí (1.5%)" : "No"}</strong></span>
                        <span>Rete Ica: <strong>{proveedorRteIca ? "Sí (4.14/1000)" : "No"}</strong></span>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Kg Inputs */}
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="p_kg_totales"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kg Totales <span className="text-red-500">*</span></FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        <FormDescription className="text-xs">Puede ajustar si difiere del reporte exp</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="p_kg_exportacion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kg Exportación</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="p_kg_nacional"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kg Nacional</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Warning for negative merma */}
                        {calculations.isNegativeMerma && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    La suma de Kg Exp + Kg Nal supera el total. Ajuste los valores.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Quality Breakdown - READ ONLY */}
                        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border">
                            <div className="text-center">
                                <span className="block text-[10px] uppercase font-bold text-emerald-600">Exportación</span>
                                <div className="text-lg font-bold text-slate-800">{calculations.porcExp}%</div>
                                <div className="text-xs text-slate-500">{Number(pKgExp).toLocaleString()} Kg</div>
                                <div className="text-xs font-mono text-emerald-600">{formatCurrency(precioKgExp)}/Kg</div>
                            </div>
                            <div className="text-center border-l border-r border-slate-200">
                                <span className="block text-[10px] uppercase font-bold text-blue-600">Nacional</span>
                                <div className="text-lg font-bold text-slate-800">{calculations.porcNal}%</div>
                                <div className="text-xs text-slate-500">{Number(pKgNal).toLocaleString()} Kg</div>
                                <div className="text-xs font-mono text-blue-600">{formatCurrency(precioKgNal)}/Kg</div>
                            </div>
                            <div className="text-center">
                                <span className="block text-[10px] uppercase font-bold text-slate-500">Merma</span>
                                <div className="text-lg font-bold text-slate-800">{calculations.porcMerma}%</div>
                                <div className="text-xs text-slate-500">{calculations.merma.toFixed(2)} Kg</div>
                            </div>
                        </div>

                        {/* Invoice & Status */}
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <FormField
                                control={form.control}
                                name="factura_prov"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Factura Proveedor</FormLabel>
                                        <FormControl><Input placeholder="Ej: FP-001" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="reporte_enviado"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-6">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="font-normal">Reporte Enviado al Proveedor</FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Financial Summary */}
                        <div className="p-4 bg-slate-100 rounded-lg space-y-2 border">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Total Facturar:</span>
                                <span className="font-mono">{formatCurrency(calculations.totalFacturar)}</span>
                            </div>
                            {calculations.totalDeductions > 0 && (
                                <div className="flex justify-between text-xs text-red-500">
                                    <span>Retenciones:</span>
                                    <span>- {formatCurrency(calculations.totalDeductions)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-bold border-t pt-2">
                                <span className="text-slate-700">Total a Pagar:</span>
                                <span className="text-blue-700 font-mono">{formatCurrency(calculations.totalPagar)}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-2">
                                <span className="text-slate-600">Utilidad Estimada:</span>
                                <span className={`font-bold font-mono ${calculations.utilidad >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatCurrency(calculations.utilidad)}
                                </span>
                            </div>
                        </div>

                        {/* Estado Info */}
                        <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded text-center">
                            <strong>Estado:</strong> El estado del reporte (En Proceso, Facturado, Pagado, Completado) se calcula automáticamente según factura, reporte enviado y pagos registrados.
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting || calculations.isNegativeMerma}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Reporte Proveedor
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
