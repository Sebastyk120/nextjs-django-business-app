import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axiosClient from "@/lib/axios";
import { CompraNacional } from "@/types/nacionales";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    proveedor: z.string().min(1, "Seleccione un proveedor"),
    origen_compra: z.string().min(1, "Seleccione un origen"),
    fruta: z.string().min(1, "Seleccione una fruta"),
    fecha_compra: z.string().min(1, "Ingrese la fecha"),
    numero_guia: z.string().min(1, "Ingrese número de guía"),
    remision: z.string().optional(),
    precio_compra_exp: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Precio inválido"),
    tipo_empaque: z.string().min(1, "Seleccione tipo de empaque"),
    cantidad_empaque: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Cantidad inválida"),
    peso_compra: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Peso inválido"),
    observaciones: z.string().optional(),
});

interface CompraNacionalModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: CompraNacional | null;
    onSuccess: (data: CompraNacional) => void;
}

export function CompraNacionalModal({ open, onOpenChange, initialData, onSuccess }: CompraNacionalModalProps) {
    const [proveedores, setProveedores] = useState<any[]>([]);
    const [frutas, setFrutas] = useState<any[]>([]);
    const [empaques, setEmpaques] = useState<any[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Currency formatter
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            proveedor: "",
            origen_compra: "",
            fruta: "",
            fecha_compra: new Date().toISOString().split('T')[0],
            numero_guia: "",
            remision: "",
            precio_compra_exp: "",
            tipo_empaque: "",
            cantidad_empaque: "",
            peso_compra: "",
            observaciones: "",
        }
    });

    // Watch values for calculated total
    const pesoCompra = form.watch("peso_compra");
    const precioCompraExp = form.watch("precio_compra_exp");

    const valorTotalEstimado = Number(pesoCompra || 0) * Number(precioCompraExp || 0);

    useEffect(() => {
        if (open) {
            setLoadingOptions(true);
            Promise.all([
                axiosClient.get('/nacionales/api/proveedores/'),
                axiosClient.get('/comercial/api/frutas/'),
                axiosClient.get('/nacionales/api/empaques/')
            ]).then(([provRes, frutaRes, empaqueRes]) => {
                setProveedores(provRes.data.results || provRes.data);
                setFrutas(frutaRes.data.results || frutaRes.data);
                setEmpaques(empaqueRes.data.results || empaqueRes.data);
            }).catch(err => console.error("Error loading options:", err))
                .finally(() => setLoadingOptions(false));

            if (initialData) {
                form.reset({
                    proveedor: initialData.proveedor.toString(),
                    origen_compra: initialData.origen_compra,
                    fruta: initialData.fruta.toString(),
                    fecha_compra: initialData.fecha_compra,
                    numero_guia: initialData.numero_guia,
                    remision: initialData.remision || "",
                    precio_compra_exp: initialData.precio_compra_exp.toString(),
                    tipo_empaque: initialData.tipo_empaque.toString(),
                    cantidad_empaque: initialData.cantidad_empaque.toString(),
                    peso_compra: initialData.peso_compra.toString(),
                    observaciones: initialData.observaciones || "",
                });
            } else {
                form.reset({
                    proveedor: "", origen_compra: "", fruta: "",
                    fecha_compra: new Date().toISOString().split('T')[0],
                    numero_guia: "", remision: "", precio_compra_exp: "",
                    tipo_empaque: "", cantidad_empaque: "", peso_compra: "",
                    observaciones: ""
                });
            }
        }
    }, [open, initialData, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const payload = {
                ...values,
                precio_compra_exp: Number(values.precio_compra_exp),
                cantidad_empaque: Number(values.cantidad_empaque),
                peso_compra: Number(values.peso_compra),
            };

            let response;
            if (initialData) {
                response = await axiosClient.patch(`/nacionales/api/compra/${initialData.id}/`, payload);
                toast.success("Compra actualizada correctamente");
            } else {
                response = await axiosClient.post('/nacionales/api/compra/', payload);
                toast.success("Compra creada correctamente");
            }
            onSuccess(response.data);
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error saving compra:", error);
            const msg = error.response?.data?.numero_guia ? "El número de guía ya existe" : "Error al guardar la compra";
            toast.error(msg);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Compra Nacional" : "Registrar Compra Nacional"}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="numero_guia"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Guía <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: 12345" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="proveedor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Proveedor <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione proveedor" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {proveedores.map(p => (
                                                    <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fecha_compra"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha Compra <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fruta"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fruta <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione fruta" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {frutas.map(f => (
                                                    <SelectItem key={f.id} value={f.id.toString()}>{f.nombre}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="origen_compra"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Origen <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione origen" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Abastos">Abastos</SelectItem>
                                                <SelectItem value="Exportadora">Exportadora</SelectItem>
                                                <SelectItem value="Proveedor">Proveedor</SelectItem>
                                                <SelectItem value="Otro">Otro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="peso_compra"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Peso (Kg) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="Ej: 1500" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="precio_compra_exp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio Compra Exp ($/Kg) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ej: 3500" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="tipo_empaque"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo Empaque <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione empaque" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {empaques.map(e => (
                                                    <SelectItem key={e.id} value={e.id.toString()}>{e.nombre} ({e.peso}kg)</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cantidad_empaque"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cantidad Empaque <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ej: 50" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="remision"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Remisión</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Opcional" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Estimated Total Display */}
                        {valorTotalEstimado > 0 && (
                            <div className="p-3 bg-slate-50 rounded-lg border flex justify-between items-center">
                                <span className="text-sm text-slate-600">Valor Total Estimado:</span>
                                <span className="text-lg font-bold text-slate-800 font-mono">{formatCurrency(valorTotalEstimado)}</span>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="observaciones"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observaciones</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Notas adicionales..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Compra
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
