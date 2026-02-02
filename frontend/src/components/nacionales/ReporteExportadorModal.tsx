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
import { Loader2, AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

    // Calculated values (display-only)
    const kgMerma = useMemo(() => {
        return Math.max(0, kgTotales - (Number(kgExp) || 0) - (Number(kgNal) || 0));
    }, [kgTotales, kgExp, kgNal]);

    const porcentajeExp = useMemo(() => {
        if (kgTotales <= 0) return 0;
        return ((Number(kgExp) || 0) / kgTotales * 100).toFixed(2);
    }, [kgTotales, kgExp]);

    const porcentajeNal = useMemo(() => {
        if (kgTotales <= 0) return 0;
        return ((Number(kgNal) || 0) / kgTotales * 100).toFixed(2);
    }, [kgTotales, kgNal]);

    const porcentajeMerma = useMemo(() => {
        if (kgTotales <= 0) return 0;
        return (kgMerma / kgTotales * 100).toFixed(2);
    }, [kgTotales, kgMerma]);

    const precioTotal = useMemo(() => {
        const exp = (Number(kgExp) || 0) * (Number(precioExp) || 0);
        const nal = (Number(kgNal) || 0) * (Number(precioNal) || 0);
        return exp + nal;
    }, [kgExp, kgNal, precioExp, precioNal]);

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
                    precio_venta_kg_exp: compraData.precio_compra_exp.toString(), // Default to purchase price
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

        // Check if sale price is lower than purchase price
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
                // Backend calculates: kg_totales, kg_merma, percentages, precio_total
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

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{initialData ? "Editar Reporte Exportador" : "Registrar Reporte Exportador"}</DialogTitle>
                    </DialogHeader>

                    {/* Reference Info */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                        <div className="flex items-center gap-2 mb-2 text-slate-700 font-medium">
                            <Info className="h-4 w-4" />
                            Datos de Referencia
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div><span className="text-slate-500">Guía:</span> <span className="font-mono">{compraData.numero_guia}</span></div>
                            <div><span className="text-slate-500">Peso Neto:</span> <span className="font-mono font-bold text-emerald-600">{kgTotales.toLocaleString()} Kg</span></div>
                            <div><span className="text-slate-500">Precio Compra:</span> <span className="font-mono">{formatCurrency(compraData.precio_compra_exp)}</span></div>
                        </div>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmitWithWarning)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="fecha_reporte"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fecha Reporte <span className="text-red-500">*</span></FormLabel>
                                            <FormControl><Input type="date" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="remision_exp"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Remisión Exportador</FormLabel>
                                            <FormControl><Input placeholder="Ej: REM-001" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Kg Totales - READ ONLY */}
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-medium text-slate-500">Kg Totales Procesados (= Peso Neto Recibido)</label>
                                    <div className="h-10 flex items-center px-3 border rounded-md bg-slate-100 text-sm font-mono font-bold">
                                        {kgTotales.toLocaleString()} Kg
                                    </div>
                                </div>
                            </div>

                            {/* Exportación Section */}
                            <div className="grid grid-cols-3 gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                <h4 className="col-span-3 text-sm font-semibold text-emerald-700 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Exportación
                                </h4>
                                <FormField
                                    control={form.control}
                                    name="kg_exportacion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Kg Exportación</FormLabel>
                                            <FormControl><Input type="number" step="0.01" className="h-9" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">Porcentaje</label>
                                    <div className="h-9 flex items-center px-3 border rounded-md bg-white text-sm font-bold text-emerald-600">
                                        {porcentajeExp}%
                                    </div>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="precio_venta_kg_exp"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Precio Venta ($/Kg) <span className="text-red-500">*</span></FormLabel>
                                            <FormControl><Input type="number" className="h-9" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Nacional Section */}
                            <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="col-span-3 text-sm font-semibold text-blue-700 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Nacional
                                </h4>
                                <FormField
                                    control={form.control}
                                    name="kg_nacional"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Kg Nacional</FormLabel>
                                            <FormControl><Input type="number" step="0.01" className="h-9" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">Porcentaje</label>
                                    <div className="h-9 flex items-center px-3 border rounded-md bg-white text-sm font-bold text-blue-600">
                                        {porcentajeNal}%
                                    </div>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="precio_venta_kg_nal"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Precio Venta ($/Kg)</FormLabel>
                                            <FormControl><Input type="number" className="h-9" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Merma Section - READ ONLY */}
                            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-100 rounded-lg border border-slate-200">
                                <h4 className="col-span-3 text-sm font-semibold text-slate-600 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                    Merma (Calculada)
                                </h4>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">Kg Merma</label>
                                    <div className="h-9 flex items-center px-3 border rounded-md bg-white text-sm font-mono">
                                        {kgMerma.toFixed(2)} Kg
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">Porcentaje</label>
                                    <div className="h-9 flex items-center px-3 border rounded-md bg-white text-sm font-bold text-slate-500">
                                        {porcentajeMerma}%
                                    </div>
                                </div>
                            </div>

                            {/* Warning if merma is negative */}
                            {kgMerma < 0 && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        La suma de Kg Exportación + Kg Nacional supera el peso neto. Ajuste los valores.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Factura Section */}
                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <FormField
                                    control={form.control}
                                    name="factura"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Factura Heavens</FormLabel>
                                            <FormControl><Input placeholder="Ej: FV-001" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="fecha_factura"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fecha Factura</FormLabel>
                                            <FormControl><Input type="date" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Totals Summary */}
                            <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg text-white">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-300">Total Factura (calculado)</span>
                                    <span className="text-2xl font-bold font-mono">{formatCurrency(precioTotal)}</span>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                                <Button type="submit" disabled={form.formState.isSubmitting || kgMerma < 0}>
                                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Reporte
                                </Button>
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
