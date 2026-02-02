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
import { Loader2, AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VentaNacionalModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    compraData: CompraNacional;
    initialData?: VentaNacional | null;
    onSuccess: () => void;
}

export function VentaNacionalModal({ open, onOpenChange, compraData, initialData, onSuccess }: VentaNacionalModalProps) {
    const [exportadores, setExportadores] = useState<any[]>([]);

    // Calculate stats regarding usage of purchase quantity AND peso
    const stats = useMemo(() => {
        let usedEmpaque = 0;
        let usedPesoBruto = 0;
        if (compraData.ventas) {
            compraData.ventas.forEach(v => {
                // If editing, exclude current sale from existing count
                if (initialData && v.id === initialData.id) return;
                // IMPORTANT: Convert to Number to avoid string concatenation from API responses
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

    // Dynamic schema with compraData validation
    const formSchema = useMemo(() => {
        // Stats are now calculated above

        const remainingQuantity = stats.remaining;

        return z.object({
            exportador: z.string().min(1, "Seleccione un exportador"),
            tipo: z.enum(["Mango Europa", "Otros Destinos"] as const),
            lote: z.string().optional(),
            fecha_llegada: z.string().min(1, "Ingrese fecha llegada"),
            peso_bruto_recibido: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Peso inválido"),
            cantidad_empaque_recibida: z.string()
                .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Cantidad inválida"),
            // Removed checks against remainingQuantity as per user request
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
            if (date.getDay() !== 0) { // Skip Sundays (0)
                daysAdded++;
            }
        }
        return date.toISOString().split('T')[0];
    }, [fechaLlegada]);

    // Calculate differences (GLOBAL - includes all sales)
    const diferenciaPeso = useMemo(() => {
        const bruto = Number(pesoBruto) || 0;
        // Global difference: (Previously Sold Peso + Current Input Peso) - Total Purchase Peso
        return (stats.usedPeso + bruto) - stats.totalPeso;
    }, [pesoBruto, stats]);

    const diferenciaEmpaque = useMemo(() => {
        const cant = Number(cantidadEmpaque) || 0;
        // Global difference: (Previously Sold + Current Input) - Total Purchase
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
            } else {
                form.reset({
                    exportador: "",
                    tipo: "Mango Europa",
                    lote: "",
                    fecha_llegada: new Date().toISOString().split('T')[0],
                    peso_bruto_recibido: "",
                    cantidad_empaque_recibida: "", // Removed default full amount, user should input
                    observaciones: "",
                });
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
                // Backend calculates: peso_neto_recibido, fecha_vencimiento, diferencias, estado
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Venta Nacional" : "Registrar Venta Nacional"}</DialogTitle>
                </DialogHeader>

                {/* Info Card - Compra Reference - DYNAMIC with form values */}
                {(() => {
                    // Calculate LIVE totals including current form input
                    const currentEmpaque = Number(cantidadEmpaque) || 0;
                    const currentPeso = Number(pesoBruto) || 0;
                    const liveUsedEmpaque = stats.used + currentEmpaque;
                    const liveUsedPeso = stats.usedPeso + currentPeso;
                    const liveRemainingEmpaque = stats.total - liveUsedEmpaque;
                    const liveRemainingPeso = stats.totalPeso - liveUsedPeso;

                    return (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                    <Info className="h-4 w-4" />
                                    Balance de Compra
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant={liveRemainingEmpaque < 0 ? "destructive" : "outline"} className="bg-white">
                                        Empaque: {liveRemainingEmpaque >= 0 ? liveRemainingEmpaque : `+${Math.abs(liveRemainingEmpaque)}`} uds
                                    </Badge>
                                    <Badge variant={liveRemainingPeso < 0 ? "destructive" : "outline"} className="bg-white">
                                        Peso: {liveRemainingPeso >= 0 ? liveRemainingPeso.toLocaleString() : `+${Math.abs(liveRemainingPeso).toLocaleString()}`} Kg
                                    </Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs mb-2">
                                {/* Empaque Stats */}
                                <div className="bg-white p-2 rounded border border-slate-100">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Empaque</span>
                                    <div className="flex justify-between">
                                        <span>Total: <strong className="font-mono">{stats.total}</strong></span>
                                        <span>Vendido: <strong className="font-mono">{liveUsedEmpaque}</strong></span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                                        <div
                                            className={liveUsedEmpaque > stats.total ? "bg-red-400 h-full transition-all" : "bg-emerald-400 h-full transition-all"}
                                            style={{ width: `${Math.min(100, (liveUsedEmpaque / stats.total) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                                {/* Peso Stats */}
                                <div className="bg-white p-2 rounded border border-slate-100">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Peso Bruto (Kg)</span>
                                    <div className="flex justify-between">
                                        <span>Total: <strong className="font-mono">{stats.totalPeso.toLocaleString()}</strong></span>
                                        <span>Vendido: <strong className="font-mono">{liveUsedPeso.toLocaleString()}</strong></span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                                        <div
                                            className={liveUsedPeso > stats.totalPeso ? "bg-red-400 h-full transition-all" : "bg-emerald-400 h-full transition-all"}
                                            style={{ width: `${Math.min(100, (liveUsedPeso / stats.totalPeso) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-slate-400 text-center">
                                Guía: <span className="font-mono text-slate-600">{compraData.numero_guia}</span>
                            </div>
                        </div>
                    );
                })()}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="exportador"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Exportador <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione exportador" />
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
                                        <FormLabel>Tipo de Venta <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione Tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Mango Europa">Mango Europa</SelectItem>
                                                <SelectItem value="Otros Destinos">Otros Destinos</SelectItem>
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
                                        <FormLabel>Lote</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: L-001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="fecha_llegada"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha Llegada <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Display-only: Fecha Vencimiento */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Fecha Vencimiento (calculada)</label>
                                <div className="h-10 flex items-center px-3 border rounded-md bg-slate-100 text-sm font-mono text-slate-600">
                                    {fechaVencimientoCalculada || '--/--/----'}
                                </div>
                                <p className="text-xs text-slate-400">3 días hábiles desde llegada</p>
                            </div>

                            <FormField
                                control={form.control}
                                name="peso_bruto_recibido"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Peso Bruto Recibido (Kg) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="Ej: 1500" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="cantidad_empaque_recibida"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cantidad Empaque Recibida</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            Máximo permitido: {compraData.cantidad_empaque} (de la compra)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Warning if exceeds remaining */}
                            {Number(cantidadEmpaque) > stats.remaining && (
                                <div className="col-span-1 md:col-span-2">
                                    <Alert className="bg-amber-50 border-amber-200 py-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        <AlertDescription className="text-amber-700 text-xs ml-2">
                                            Advertencia: La cantidad ({cantidadEmpaque}) excede el saldo disponible ({stats.remaining}). El balance será negativo ({stats.remaining - Number(cantidadEmpaque)}).
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}

                            {/* Display-only: Peso Neto Calculado */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Peso Neto Recibido (calculado)</label>
                                <div className="h-10 flex items-center px-3 border rounded-md bg-emerald-50 text-sm font-mono font-bold text-emerald-700">
                                    {pesoNetoCalculado.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kg
                                </div>
                                <p className="text-xs text-slate-400">= Bruto - (Empaque × {compraData.tipo_empaque_peso || 0} Kg)</p>
                            </div>
                        </div>

                        {/* Differences Alert */}
                        {(diferenciaPeso !== 0 || diferenciaEmpaque !== 0) && (
                            <Alert variant={diferenciaPeso < 0 ? "destructive" : "default"} className="bg-slate-50">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="flex gap-4 text-xs">
                                    <span>Diferencia Peso: <strong className={diferenciaPeso < 0 ? "text-red-600" : "text-emerald-600"}>{diferenciaPeso.toFixed(2)} Kg</strong></span>
                                    <span>Diferencia Empaque: <strong className={diferenciaEmpaque < 0 ? "text-red-600" : "text-blue-600"}>{diferenciaEmpaque}</strong></span>
                                </AlertDescription>
                            </Alert>
                        )}

                        <FormField
                            control={form.control}
                            name="observaciones"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observaciones</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Venta
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
