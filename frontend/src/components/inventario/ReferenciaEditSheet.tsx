"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axiosClient from "@/lib/axios";
import { Referencia, Contenedor } from "@/types/comercial";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Lock, Save, Box } from "lucide-react";
import { Bodega } from "@/types/inventario";

// Schema validation
const formSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    referencia_nueva: z.string().optional().nullable(),
    contenedor: z.string().optional().nullable(), // We'll store ID as string in form
    cant_contenedor: z.coerce.number().min(0).optional().nullable(),
    precio: z.coerce.number().min(0).optional().nullable(),
    exportador: z.string().min(1, "Exportador es requerido"), // ID as string
    cantidad_pallet_con_contenedor: z.coerce.number().min(0).optional().nullable(),
    cantidad_pallet_sin_contenedor: z.coerce.number().min(1, "Cajas Pallet Sin Contenedor es obligatorio (mínimo 1)"),
    porcentaje_peso_bruto: z.coerce.number().min(0).max(100).optional(),
});

interface ReferenciaEditSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: Referencia | null;
    onItemUpdated: () => void;
    userGroups: string[];
}

export function ReferenciaEditSheet({
    open,
    onOpenChange,
    item,
    onItemUpdated,
    userGroups
}: ReferenciaEditSheetProps) {
    const [loading, setLoading] = useState(false);
    const [contenedores, setContenedores] = useState<Contenedor[]>([]);
    const [bodegas, setBodegas] = useState<Bodega[]>([]); // Using Bodega type for exportador (it has similar structure id, nombre, etc. or create generic) -> Actually exportador is simpler.
    // We need exportadores list for Heavens to select.
    const [exportadores, setExportadores] = useState<{ id: number, nombre: string }[]>([]);

    const isHeavens = userGroups.includes("Heavens") || userGroups.includes("Superuser") || userGroups.includes("Autorizadores");
    const isCreating = !item;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombre: "",
            referencia_nueva: "",
            contenedor: undefined,
            cant_contenedor: 0,
            precio: 0,
            exportador: "",
            cantidad_pallet_con_contenedor: 0,
            cantidad_pallet_sin_contenedor: 0,
            porcentaje_peso_bruto: 0,
        },
    });

    // Reset form when item changes
    useEffect(() => {
        if (open) {
            fetchDependencies();
            if (item) {
                form.reset({
                    nombre: item.nombre || "",
                    referencia_nueva: item.referencia_nueva || "",
                    contenedor: item.contenedor?.toString() || "",
                    cant_contenedor: item.cant_contenedor ?? 0,
                    precio: Number(item.precio ?? 0),
                    exportador: item.exportador?.toString() || "",
                    cantidad_pallet_con_contenedor: item.cantidad_pallet_con_contenedor ?? 0,
                    cantidad_pallet_sin_contenedor: item.cantidad_pallet_sin_contenedor ?? 0,
                    porcentaje_peso_bruto: Number(item.porcentaje_peso_bruto ?? 0),
                });
            } else {
                form.reset({
                    nombre: "",
                    referencia_nueva: "",
                    contenedor: "",
                    cant_contenedor: 0,
                    precio: 0,
                    exportador: "",
                    cantidad_pallet_con_contenedor: 0,
                    cantidad_pallet_sin_contenedor: 0,
                    porcentaje_peso_bruto: 0,
                });
            }
        }
    }, [open, item, form]);

    const fetchDependencies = async () => {
        try {
            const [contRes, expRes] = await Promise.all([
                axiosClient.get("/inventarios/api/contenedores/"),
                axiosClient.get("/inventarios/api/bodegas/")
            ]);

            setContenedores(Array.isArray(contRes.data) ? contRes.data : []);

            // Extract unique exporters from bodegas response
            const uniqueExporters = new Map();
            if (expRes.data && Array.isArray(expRes.data)) {
                expRes.data.forEach((b: any) => {
                    if (b.exportador && !uniqueExporters.has(b.exportador)) {
                        uniqueExporters.set(b.exportador, { id: b.exportador, nombre: b.exportador_nombre });
                    }
                });
            }
            setExportadores(Array.from(uniqueExporters.values()));

        } catch (error) {
            console.error("Error loading dependencies", error);
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        try {
            // Transform string IDs back to numbers
            const payload = {
                ...values,
                contenedor: values.contenedor ? parseInt(values.contenedor) : null,
                exportador: parseInt(values.exportador),
            };

            if (item) {
                await axiosClient.put(`/inventarios/api/referencias/${item.id}/`, payload);
                toast.success("Referencia actualizada correctament");
            } else {
                await axiosClient.post("/inventarios/api/referencias/", payload);
                toast.success("Referencia creada correctamente");
            }
            onItemUpdated();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error saving referencia:", error);
            const detail = error.response?.data?.detail || "Error al guardar el registro";
            toast.error(detail);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[500px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{isCreating ? "Crear Nueva Referencia" : "Editar Referencia"}</SheetTitle>
                    <SheetDescription>
                        {isCreating
                            ? "Complete los datos para registrar una nueva referencia."
                            : "Modifique los detalles de la referencia existente."}
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">

                        {/* Nombre & Exportador - READONLY for Non-Heavens on EDIT */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nombre"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre Ref.</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    {...field}
                                                    disabled={(!isCreating && !isHeavens)}
                                                    className={(!isCreating && !isHeavens) ? "bg-slate-50 pr-8" : ""}
                                                />
                                                {(!isCreating && !isHeavens) && <Lock className="h-4 w-4 text-slate-400 absolute right-2.5 top-2.5" />}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="exportador"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Exportador</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={!isCreating} // Nobody changes it on edit
                                        >
                                            <FormControl>
                                                <SelectTrigger className={!isCreating ? "bg-slate-50" : ""}>
                                                    <SelectValue placeholder="Seleccione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {exportadores.map((exp) => (
                                                    <SelectItem key={exp.id} value={exp.id.toString()}>
                                                        {exp.nombre}
                                                    </SelectItem>
                                                ))}
                                                {/* Fallback for existing items if list is filtered or empty */}
                                                {!isCreating && item && !exportadores.find(e => e.id === item.exportador) && (
                                                    <SelectItem key="fallback-exp" value={item.exportador.toString()}>
                                                        {item.exportador_nombre}
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="referencia_nueva"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Referencia Nueva (Alias)</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} placeholder="Código o nombre nuevo..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="precio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="porcentaje_peso_bruto"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>% Peso Bruto</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
                            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Box className="h-4 w-4" /> Configuración Logística
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="contenedor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Tipo Contenedor</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Seleccione..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {contenedores.map((c) => (
                                                        <SelectItem key={c.id} value={c.id.toString()}>
                                                            {c.nombre}
                                                        </SelectItem>
                                                    ))}
                                                    {!isCreating && item && item.contenedor && !contenedores.find(c => c.id === item.contenedor) && (
                                                        <SelectItem key="fallback-cont" value={item.contenedor.toString()}>
                                                            {item.contenedor_nombre || "Contenedor Actual"}
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="cant_contenedor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Cajas/Contenedor</FormLabel>
                                            <FormControl>
                                                <Input type="number" className="h-9" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="cantidad_pallet_con_contenedor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Pallet (Con Cont.)</FormLabel>
                                            <FormControl>
                                                <Input type="number" className="h-9" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="cantidad_pallet_sin_contenedor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Pallet (Sin Cont.)</FormLabel>
                                            <FormControl>
                                                <Input type="number" className="h-9" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <SheetFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Guardar
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
