"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderSchemas } from "@/components/comercial/metrics/orderSchemas";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axiosClient from "@/lib/axios";
import { Pedido } from "@/types/pedido";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { MOTIVO_NOTA_CHOICES, ESTATUS_RESERVA_CHOICES, ESTADO_DOCUMENTOS_CHOICES } from "@/lib/choices";
import { DateTimePicker } from "@/components/comercial/DateTimePicker";

interface AuxItem {
    id: number;
    nombre: string;
}

interface OrderEditSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: number | null;
    mode: 'base' | 'cartera' | 'utilidades' | 'seguimiento' | null; // Determines which form to show
    onOrderUpdated: () => void;
    userGroups?: string[];
    activeExportadora?: string;
}

export function OrderEditSheet({
    open,
    onOpenChange,
    orderId,
    mode,
    onOrderUpdated,
    userGroups = [],
    activeExportadora
}: OrderEditSheetProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [orderData, setOrderData] = useState<Pedido | null>(null);

    const isHeavens = userGroups.includes("Heavens");

    // Aux Data
    const [agencias, setAgencias] = useState<AuxItem[]>([]);
    const [clientes, setClientes] = useState<AuxItem[]>([]);
    const [intermediarios, setIntermediarios] = useState<AuxItem[]>([]);
    const [exportadores, setExportadores] = useState<AuxItem[]>([]);
    const [subexportadoras, setSubexportadoras] = useState<AuxItem[]>([]);
    const [destinos, setDestinos] = useState<AuxItem[]>([]);

    // Determine target view:
    // Non-Heavens users ALWAYS use Exportador view.
    // Heavens users use Exportador view ONLY if explicitly filtering by an exportadora.
    const showExportadorView = !isHeavens || (isHeavens && !!activeExportadora);

    // Select the schema based on mode
    const getSchema = () => {
        if (showExportadorView) {
            return orderSchemas.exportador;
        }
        if (mode && mode !== 'base') {
            return orderSchemas[mode];
        }
        return orderSchemas.base;
    };
    const schema = getSchema();

    // Use any to allow dynamic field names across different schemas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const form = useForm<any>({
        resolver: zodResolver(schema),
        defaultValues: {},
    });

    useEffect(() => {
        if (open && orderId) {
            fetchOrder();
            if (isHeavens) {
                if (mode === 'seguimiento') {
                    fetchAgencias();
                    fetchExportadores();
                }
                if (!mode || mode === 'base') {
                    fetchAllAuxData();
                }
            }
        } else {
            form.reset({});
            setOrderData(null);
        }
    }, [open, orderId, mode, isHeavens]);

    const fetchAllAuxData = async () => {
        try {
            const [c, i, e, s, d] = await Promise.all([
                axiosClient.get('/comercial/api/clientes/'),
                axiosClient.get('/comercial/api/intermediarios/'),
                axiosClient.get('/comercial/api/exportadores/'),
                axiosClient.get('/comercial/api/subexportadoras/'),
                axiosClient.get('/comercial/api/destinos/')
            ]);
            setClientes(c.data);
            setIntermediarios(i.data);
            setExportadores(e.data);
            setSubexportadoras(s.data);
            setDestinos(d.data);
        } catch (error) {
            console.error("Error fetching aux data", error);
        }
    };

    const fetchOrder = async () => {
        setIsLoading(true);
        try {
            const response = await axiosClient.get(`/comercial/api/pedidos/${orderId}/`);
            setOrderData(response.data);
            form.reset(response.data); // Populate form
        } catch (error) {
            console.error("Error loading order:", error);
            toast.error("Error al cargar el pedido");
            onOpenChange(false);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAgencias = async () => {
        try {
            const res = await axiosClient.get('/comercial/api/agencias-carga/'); // Adjust endpoint if needed
            setAgencias(res.data);
        } catch (e) {
            console.error("Error loading aux data", e);
        }
    }

    const fetchExportadores = async () => {
        try {
            const res = await axiosClient.get('/comercial/api/exportadores/');
            setExportadores(res.data);
        } catch (e) {
            console.error("Error loading exportadores", e);
        }
    }

    const onSubmit = async (values: any) => {
        if (!orderId) return;
        setIsSaving(true);
        try {
            // Clean up: Some fields might be string empty but need to be null for backend
            const cleanValues = Object.entries(values).reduce((acc: any, [key, val]) => {
                if (val === "" && key !== 'observaciones') acc[key] = null; // Observations is usually safe as string
                else acc[key] = val;
                return acc;
            }, {});

            await axiosClient.patch(`/comercial/api/pedidos/${orderId}/`, cleanValues);
            toast.success("Pedido actualizado correctamente");
            onOrderUpdated();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error updating order:", error);
            toast.error("Error al actualizar el pedido");
        } finally {
            setIsSaving(false);
        }
    };

    const renderExportadorFields = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="valor_pagado_cliente_usd" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Valor Pagado Cliente (USD)</FormLabel>
                        <FormControl>
                            <Input type="number" step="any" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="utilidad_bancaria_usd" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Utilidad Bancaria (USD)</FormLabel>
                        <FormControl>
                            <Input type="number" step="any" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="fecha_pago" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Fecha Pago</FormLabel>
                        <FormControl>
                            <DateTimePicker
                                value={field.value}
                                onChange={field.onChange}
                                showTime={false}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="fecha_monetizacion" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Fecha Monetización</FormLabel>
                        <FormControl>
                            <DateTimePicker
                                value={field.value}
                                onChange={field.onChange}
                                showTime={false}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="trm_monetizacion" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>TRM Monetización</FormLabel>
                        <FormControl>
                            <Input type="number" step="any" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="trm_cotizacion" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>TRM Cotización</FormLabel>
                        <FormControl>
                            <Input type="number" step="any" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
        </div>
    );

    const renderBaseFields = () => {
        const hasLogistics = !!(orderData?.awb || orderData?.numero_factura);
        const formsAwb = form.watch('awb');
        const formsFactura = form.watch('numero_factura');
        const isCurrentlyAddingLogistics = !hasLogistics && (!!formsAwb || !!formsFactura);

        return (
            <div className="space-y-4">
                {hasLogistics && (
                    <Alert className="bg-amber-50 border-amber-200 text-amber-900">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-sm font-bold">Edición restringida</AlertTitle>
                        <AlertDescription className="text-xs">
                            Este pedido ya cuenta con AWB o Factura. Los campos de cliente y logística base están bloqueados para mantener la integridad de los documentos.
                        </AlertDescription>
                    </Alert>
                )}

                {isCurrentlyAddingLogistics && (
                    <Alert className="bg-blue-50 border-blue-200 text-blue-900">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-sm font-bold">Aviso de bloqueo</AlertTitle>
                        <AlertDescription className="text-xs">
                            Al asignar un AWB o Número de Factura, los datos del cliente y exportadora quedarán bloqueados para futuras ediciones.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="cliente" render={({ field }: { field: any }) => (
                        <FormItem>
                            <FormLabel>Cliente</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value?.toString() || ''} disabled={hasLogistics}>
                                <FormControl>
                                    <SelectTrigger className={cn(hasLogistics && "bg-slate-100")}>
                                        <SelectValue placeholder="Seleccione..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {clientes.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="intermediario" render={({ field }: { field: any }) => (
                        <FormItem>
                            <FormLabel>Intermediario</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value?.toString() || ''} disabled={hasLogistics}>
                                <FormControl>
                                    <SelectTrigger className={cn(hasLogistics && "bg-slate-100")}>
                                        <SelectValue placeholder="Seleccione..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {intermediarios.map(i => (
                                        <SelectItem key={i.id} value={i.id.toString()}>{i.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="exportadora" render={({ field }: { field: any }) => (
                        <FormItem>
                            <FormLabel>Exportadora</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value?.toString() || ''} disabled={hasLogistics}>
                                <FormControl>
                                    <SelectTrigger className={cn(hasLogistics && "bg-slate-100")}>
                                        <SelectValue placeholder="Seleccione..." />
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
                    )} />
                    <FormField control={form.control} name="subexportadora" render={({ field }: { field: any }) => (
                        <FormItem>
                            <FormLabel>Sub-Exportadora</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value?.toString() || ''} disabled={hasLogistics}>
                                <FormControl>
                                    <SelectTrigger className={cn(hasLogistics && "bg-slate-100")}>
                                        <SelectValue placeholder="Seleccione..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {subexportadoras.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="destino" render={({ field }: { field: any }) => (
                        <FormItem>
                            <FormLabel>Destino</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value?.toString() || ''} disabled={hasLogistics}>
                                <FormControl>
                                    <SelectTrigger className={cn(hasLogistics && "bg-slate-100")}>
                                        <SelectValue placeholder="Seleccione..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {destinos.map((d: any) => (
                                        <SelectItem key={d.id} value={d.id.toString()}>
                                            {d.codigo} - {d.ciudad || d.nombre || ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="fecha_entrega" render={({ field }: { field: any }) => (
                        <FormItem>
                            <FormLabel>Fecha Entrega</FormLabel>
                            <FormControl>
                                <DateTimePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    showTime={false}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="h-px bg-slate-100 my-4" />

                <FormField control={form.control} name="awb" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel className="font-bold text-slate-700">Guía AWB</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="123-12345678" className="border-blue-200 focus:border-blue-500" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="numero_factura" render={({ field }: { field: any }) => (
                        <FormItem>
                            <FormLabel className="font-bold text-slate-700">N° Factura</FormLabel>
                            <FormControl>
                                <Input {...field} value={field.value || ''} className="border-blue-200 focus:border-blue-500" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="descuento" render={({ field }: { field: any }) => (
                        <FormItem>
                            <FormLabel>Descuento ($)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="observaciones" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Observaciones</FormLabel>
                        <FormControl>
                            <Textarea {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
        );
    };

    const renderCarteraFields = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Input value={orderData?.cliente_nombre || ''} disabled className="bg-slate-100" />
                </FormItem>
                <FormItem>
                    <FormLabel>N° Factura</FormLabel>
                    <Input value={orderData?.numero_factura || ''} disabled className="bg-slate-100" />
                </FormItem>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="nota_credito_no" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Nota Crédito No.</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="motivo_nota_credito" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Motivo NC</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {MOTIVO_NOTA_CHOICES.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
            <FormField control={form.control} name="observaciones" render={({ field }: { field: any }) => (
                <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                        <Textarea {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </div>
    );

    const renderUtilidadesFields = () => (
        <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded mb-4 text-xs space-y-2 border">
                <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Nota Crédito:</span>
                    <span>{orderData?.nota_credito_no || '-'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Motivo:</span>
                    <span>{orderData?.motivo_nota_credito || '-'}</span>
                </div>
            </div>

            <FormField control={form.control} name="documento_cobro_utilidad" render={({ field }: { field: any }) => (
                <FormItem>
                    <FormLabel>Documento Cobro Utilidad</FormLabel>
                    <FormControl>
                        <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="fecha_pago_utilidad" render={({ field }: { field: any }) => (
                <FormItem>
                    <FormLabel>Fecha Pago Utilidad</FormLabel>
                    <FormControl>
                        <DateTimePicker
                            value={field.value}
                            onChange={field.onChange}
                            showTime={false}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="observaciones" render={({ field }: { field: any }) => (
                <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                        <Textarea {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </div>
    );

    const renderSeguimientoFields = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="fecha_llegada" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Llegada Estimada (Día)</FormLabel>
                        <FormControl>
                            <DateTimePicker
                                value={field.value}
                                onChange={field.onChange}
                                showTime={false}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="agencia_carga" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Agencia Carga</FormLabel>
                        <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString() || ''}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {agencias.map(a => (
                                    <SelectItem key={a.id} value={a.id.toString()}>{a.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="etd" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Salida (ETD)</FormLabel>
                        <FormControl>
                            <DateTimePicker
                                value={field.value}
                                onChange={field.onChange}
                                showTime={true}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="eta" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Llegada (ETA)</FormLabel>
                        <FormControl>
                            <DateTimePicker
                                value={field.value}
                                onChange={field.onChange}
                                showTime={true}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="eta_real" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Llegada Real</FormLabel>
                        <FormControl>
                            <DateTimePicker
                                value={field.value}
                                onChange={field.onChange}
                                showTime={true}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="responsable_reserva" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Responsable Reserva</FormLabel>
                        <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString() || ''}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {exportadores.map(exp => (
                                    <SelectItem key={exp.id} value={exp.id.toString()}>{exp.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="estatus_reserva" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Estatus Reserva</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {ESTATUS_RESERVA_CHOICES.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="peso_awb" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Peso AWB (Kg)</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="termo" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Termógrafo</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="estado_documentos" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Estado Documentos</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {ESTADO_DOCUMENTOS_CHOICES.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <FormField control={form.control} name="observaciones_tracking" render={({ field }: { field: any }) => (
                <FormItem>
                    <FormLabel>Observaciones Tracking</FormLabel>
                    <FormControl>
                        <Textarea {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </div>
    );

    const getTitle = () => {
        if (!isHeavens) return "Edición Limitada";
        switch (mode) {
            case 'cartera': return "Gestión de Cartera";
            case 'utilidades': return "Gestión de Utilidades";
            case 'seguimiento': return "Seguimiento de Exportación";
            default: return "Edición General de Pedido";
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[650px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{getTitle()}</SheetTitle>
                    <SheetDescription>
                        {orderId ? `Editando pedido #${orderId}` : ''}
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                            {showExportadorView ? renderExportadorFields() : (
                                <>
                                    {mode === 'cartera' && renderCarteraFields()}
                                    {mode === 'utilidades' && renderUtilidadesFields()}
                                    {mode === 'seguimiento' && renderSeguimientoFields()}
                                    {(!mode || mode === 'base') && renderBaseFields()}
                                </>
                            )}

                            <SheetFooter>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Cambios
                                </Button>
                            </SheetFooter>
                        </form>
                    </Form>
                )}
            </SheetContent>
        </Sheet>
    );
}
