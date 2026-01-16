"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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

interface NewItemModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onItemCreated: () => void;
    userGroups?: string[];
}

export function NewItemModal({ open, onOpenChange, onItemCreated, userGroups = [] }: NewItemModalProps) {
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    // Form State
    const [referenciaId, setReferenciaId] = useState<number | null>(null);
    const [bodegaId, setBodegaId] = useState<string>("");
    const [propiedadId, setPropiedadId] = useState<string>(""); // Actually exportador ID
    const [cantidad, setCantidad] = useState("");
    const [tipoDocumento, setTipoDocumento] = useState("Remisión");
    const [documento, setDocumento] = useState("");
    const [proveedorId, setProveedorId] = useState<string>("");
    const [fechaMovimiento, setFechaMovimiento] = useState(new Date().toISOString().split('T')[0]);
    const [observaciones, setObservaciones] = useState("");

    // Data Options
    const [referencias, setReferencias] = useState<{ id: number, nombre: string, exportador: number }[]>([]);
    const [bodegas, setBodegas] = useState<{ id: number, nombre: string, exportador: number }[]>([]);
    const [proveedores, setProveedores] = useState<{ id: number, nombre: string }[]>([]);
    const [exportadores, setExportadores] = useState<{ id: number, nombre: string }[]>([]);

    // Permission Checks
    const isHeavens = userGroups.includes("Heavens") || userGroups.includes("Autorizadores") || userGroups.includes("Superuser");

    // Detect user's exporter group
    const exporterGroupNames = ["Etnico", "Fieldex", "Juan Matas", "Juan_Matas", "CI Dorado", "CI_Dorado"];
    const userExporterGroup = userGroups.find(g => exporterGroupNames.includes(g)) || null;

    useEffect(() => {
        if (open) {
            fetchOptions();
        }
    }, [open]);

    // Auto-select exporter for non-Heavens users
    useEffect(() => {
        if (!isHeavens && userExporterGroup && exportadores.length > 0) {
            const matchedExporter = exportadores.find(e =>
                e.nombre.toLowerCase() === userExporterGroup.toLowerCase()
            );
            if (matchedExporter) {
                setPropiedadId(matchedExporter.id.toString());
            }
        }
    }, [exportadores, isHeavens, userExporterGroup]);

    // Reset dependent fields when exporter changes
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

            // Handle pagination or straight list results
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

    // Filtered options based on selected exporter
    const filteredReferencias = propiedadId
        ? referencias.filter(r => r.exportador === parseInt(propiedadId))
        : referencias;

    const filteredBodegas = propiedadId
        ? bodegas.filter(b => b.exportador === parseInt(propiedadId))
        : bodegas;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!referenciaId || !bodegaId || !cantidad || !fechaMovimiento || !propiedadId || !proveedorId) {
            toast.error("Por favor completa todos los campos requeridos (*)");
            return;
        }

        const payload = {
            numero_item: referenciaId,
            bodega: parseInt(bodegaId),
            propiedad: parseInt(propiedadId), // This maps to Exportador in Item model
            cantidad_cajas: parseInt(cantidad),
            tipo_documento: tipoDocumento,
            documento: documento || "S/D",
            proveedor: parseInt(proveedorId), // Required field - cannot be null
            fecha_movimiento: fechaMovimiento,
            observaciones: observaciones
        };

        console.log("--- CREATING ITEM ---");
        console.log("Payload:", payload);

        setLoading(true);
        try {
            const response = await axiosClient.post('/inventarios/api/items/', payload);
            console.log("Success Response:", response.data);

            toast.success("Movimiento creado exitosamente");
            onItemCreated();
            onOpenChange(false);
            resetForm();
        } catch (error: any) {
            console.error("Error creating item:", error);
            if (error.response) {
                console.error("Server Error Data:", error.response.data);
                console.error("Server Error Status:", error.response.status);
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
        setCantidad("");
        setDocumento("");
        setObservaciones("");
    };

    // Filter logic for chained dropdowns could be added here (e.g. filter bodegas by selected property)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Registrar Nuevo Movimiento</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Row 1: Property (Exportador) & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Propiedad (Exportador) *</Label>
                            <Select
                                value={propiedadId}
                                onValueChange={setPropiedadId}
                                disabled={!isHeavens}
                            >
                                <SelectTrigger className={!isHeavens ? "bg-slate-50" : ""}>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {exportadores.map(exp => (
                                        <SelectItem key={exp.id} value={exp.id.toString()}>
                                            {exp.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {!isHeavens && (
                                <p className="text-xs text-slate-500">Bloqueado para tu grupo de exportador</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha Movimiento *</Label>
                            <Input
                                type="date"
                                value={fechaMovimiento}
                                onChange={e => setFechaMovimiento(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Row 2: Reference Search */}
                    <div className="space-y-2 flex flex-col">
                        <Label>Referencia * {!propiedadId && <span className="text-amber-600 text-xs">(Selecciona exportador primero)</span>}</Label>
                        <ReferenciaCombo
                            options={filteredReferencias}
                            value={referenciaId}
                            onChange={setReferenciaId}
                            disabled={loadingData || !propiedadId}
                        />
                    </div>

                    {/* Row 3: Bodega & Quantity */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo Movimiento (Bodega) *</Label>
                            <Select
                                value={bodegaId}
                                onValueChange={setBodegaId}
                                disabled={!propiedadId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredBodegas.map(bod => (
                                        <SelectItem key={bod.id} value={bod.id.toString()}>
                                            {bod.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Cantidad Cajas *</Label>
                            <Input
                                type="number"
                                value={cantidad}
                                onChange={e => setCantidad(e.target.value)}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Row 4: Tipo Documento & Doc Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo Documento *</Label>
                            <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Factura">Factura</SelectItem>
                                    <SelectItem value="Remisión">Remisión</SelectItem>
                                    <SelectItem value="Acta De Destrucción">Acta De Destrucción</SelectItem>
                                    <SelectItem value="Saldo Inicial">Saldo Inicial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Proveedor / Tercero *</Label>
                            <Select value={proveedorId} onValueChange={setProveedorId}>
                                <SelectTrigger>
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
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Documento Ref.</Label>
                            <Input
                                value={documento}
                                onChange={e => setDocumento(e.target.value)}
                                placeholder="Ej: REM-123"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Observaciones</Label>
                        <Textarea
                            value={observaciones}
                            onChange={e => setObservaciones(e.target.value)}
                            placeholder="Detalles adicionales..."
                        />
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Movimiento
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Combobox for searchable references
function ReferenciaCombo({ options, value, onChange, disabled }: {
    options: { id: number, nombre: string }[],
    value: number | null,
    onChange: (val: number | null) => void,
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
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
                    <CommandInput placeholder="Buscar por nombre..." />
                    <CommandList>
                        <CommandEmpty>No se encontró referencia.</CommandEmpty>
                        <CommandGroup>
                            {options.map((opt) => (
                                <CommandItem
                                    key={opt.id}
                                    value={opt.nombre}
                                    onSelect={() => {
                                        onChange(opt.id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === opt.id ? "opacity-100" : "opacity-0"
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
    )
}
