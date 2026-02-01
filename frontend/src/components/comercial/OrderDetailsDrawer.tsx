"use client";

import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    Trash2,
    Save,
    X,
    AlertCircle,
    Package,
    Plus,
    Pencil,
    Lock,
    ShieldCheck,
    Calculator
} from "lucide-react";
import { DetallePedido } from "@/types/detalle_pedido";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

// Auxiliary Types
interface AuxItem {
    id: number;
    nombre: string;
}

interface OrderDetailsDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: number | null;
    orderNumber?: string | null;
    userGroups?: any[];
}

export function OrderDetailsDrawer({
    open,
    onOpenChange,
    orderId,
    orderNumber,
    userGroups = []
}: OrderDetailsDrawerProps) {
    const [details, setDetails] = useState<DetallePedido[]>([]);
    const [loading, setLoading] = useState(false);

    // Aux Data
    const [frutas, setFrutas] = useState<AuxItem[]>([]);
    const [presentaciones, setPresentaciones] = useState<AuxItem[]>([]);
    const [tiposCaja, setTiposCaja] = useState<AuxItem[]>([]);
    const [referencias, setReferencias] = useState<AuxItem[]>([]);

    // Edit State
    const [editingId, setEditingId] = useState<number | "new" | null>(null);
    const [editForm, setEditForm] = useState<Partial<DetallePedido>>({});
    const [saving, setSaving] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [pedido, setPedido] = useState<any>(null);

    const isHeavens = userGroups.includes("Heavens");

    useEffect(() => {
        if (open) {
            fetchAuxData();
            if (orderId) {
                fetchDetails();
            }
        } else {
            setDetails([]);
            setEditingId(null);
        }
    }, [open, orderId]);

    const fetchDetails = async () => {
        if (!orderId) return;
        setLoading(true);
        try {
            const [detailsRes, pedidoRes] = await Promise.all([
                axiosClient.get(`/comercial/api/detalles-pedido/?pedido_id=${orderId}`),
                axiosClient.get(`/comercial/api/pedidos/${orderId}/`)
            ]);
            setDetails(detailsRes.data);
            setPedido(pedidoRes.data);
        } catch (error) {
            console.error("Error fetching details/order:", error);
            toast.error("Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    };

    // Fetch base aux data (tipos_caja don't change)
    const fetchAuxData = async () => {
        if (tiposCaja.length > 0) return; // Only fetch once
        try {
            const t = await axiosClient.get('/comercial/api/tipos-caja/');
            setTiposCaja(t.data);
        } catch (e) {
            console.error("Error loading aux data", e);
        }
    };

    // Cascading: Fetch Frutas filtered by pedido (cliente)
    const fetchFrutas = async () => {
        if (!orderId) return;
        try {
            const res = await axiosClient.get(`/comercial/api/frutas/?pedido_id=${orderId}`);
            setFrutas(res.data);
        } catch (e) {
            console.error("Error loading frutas", e);
        }
    };

    // Cascading: Fetch Presentaciones filtered by pedido + fruta
    const fetchPresentaciones = async (frutaId: number) => {
        if (!orderId || !frutaId) {
            setPresentaciones([]);
            return;
        }
        try {
            const res = await axiosClient.get(`/comercial/api/presentaciones/?pedido_id=${orderId}&fruta_id=${frutaId}`);
            setPresentaciones(res.data);
        } catch (e) {
            console.error("Error loading presentaciones", e);
        }
    };

    // Cascading: Fetch Referencias filtered by pedido + fruta + presentacion + tipo_caja
    const fetchReferencias = async (frutaId: number, presentacionId: number, tipoCajaId: number) => {
        if (!orderId || !frutaId || !presentacionId || !tipoCajaId) {
            setReferencias([]);
            return;
        }
        try {
            const res = await axiosClient.get(
                `/comercial/api/referencias/?pedido_id=${orderId}&fruta_id=${frutaId}&presentacion_id=${presentacionId}&tipo_caja_id=${tipoCajaId}`
            );
            setReferencias(res.data);
        } catch (e) {
            console.error("Error loading referencias", e);
        }
    };

    // Re-fetch cascades when editing starts or changes key fields
    useEffect(() => {
        if (editingId !== null && orderId) {
            fetchFrutas();
        }
    }, [editingId, orderId]);

    // When fruta changes, update presentaciones
    useEffect(() => {
        if (editForm.fruta) {
            fetchPresentaciones(editForm.fruta as number);
        }
    }, [editForm.fruta]);

    // When presentacion, tipo_caja, or fruta changes, update referencias
    useEffect(() => {
        if (editForm.fruta && editForm.presentacion && editForm.tipo_caja) {
            fetchReferencias(
                editForm.fruta as number,
                editForm.presentacion as number,
                editForm.tipo_caja as number
            );
        }
    }, [editForm.fruta, editForm.presentacion, editForm.tipo_caja]);

    // --- Actions ---

    const handleCreateNew = () => {
        setEditingId("new");
        setEditForm({
            pedido: orderId!,
            cajas_solicitadas: 0,
            lleva_contenedor: false,
            afecta_utilidad: false, // Default 'No'
            // Defaults for UX
        });
    };

    const handleEdit = (detail: DetallePedido) => {
        setEditingId(detail.id);
        setEditForm({ ...detail });

        // Trigger cascading fetches for existing item data
        if (detail.fruta) {
            fetchPresentaciones(detail.fruta as number);
        }
        if (detail.fruta && detail.presentacion && detail.tipo_caja) {
            fetchReferencias(
                detail.fruta as number,
                detail.presentacion as number,
                detail.tipo_caja as number
            );
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSave = async () => {
        const noCajasNc = editForm.no_cajas_nc;
        const cajasEnviadas = editForm.cajas_enviadas;

        // Helper function to check if a value is a valid positive number
        const isValidPositiveNumber = (val: unknown): boolean => {
            if (val === null || val === undefined) return false;
            const num = typeof val === 'string' ? parseFloat(val) : Number(val);
            return !isNaN(num) && num > 0;
        };

        // Helper function to get numeric value
        const toNumber = (val: unknown): number => {
            if (val === null || val === undefined) return 0;
            const num = typeof val === 'string' ? parseFloat(val) : Number(val);
            return isNaN(num) ? 0 : num;
        };

        // Validación: no se pueden establecer NC si no hay cajas enviadas
        if (isValidPositiveNumber(noCajasNc) && !isValidPositiveNumber(cajasEnviadas)) {
            toast.error("No puede establecer 'NC Cajas' si no hay cajas enviadas.");
            return;
        }

        // Validación: no_cajas_nc no puede ser mayor que cajas_enviadas
        if (isValidPositiveNumber(noCajasNc) && isValidPositiveNumber(cajasEnviadas)) {
            if (toNumber(noCajasNc) > toNumber(cajasEnviadas)) {
                toast.error("El número de cajas NC no puede ser mayor que las cajas enviadas.");
                return;
            }
        }

        // Validación: si afecta_utilidad es true, no_cajas_nc debe ser > 0
        if (editForm.afecta_utilidad === true) {
            if (!isValidPositiveNumber(noCajasNc)) {
                toast.error("Si 'Afecta Utilidad' es 'Sí', debe ingresar un valor mayor a 0 en 'NC Cajas'.");
                return;
            }
        }

        // Validación: valor_x_caja_usd es obligatorio cuando hay cajas enviadas
        const valorXCajaUsd = editForm.valor_x_caja_usd;
        if (isValidPositiveNumber(cajasEnviadas)) {
            if (!isValidPositiveNumber(valorXCajaUsd)) {
                toast.error("Debe ingresar el 'Costo por Caja' cuando hay cajas enviadas.");
                return;
            }
        }

        setSaving(true);
        try {
            if (editingId === "new") {
                const response = await axiosClient.post(`/comercial/api/detalles-pedido/`, editForm);
                toast.success("Producto agregado");
                setDetails(prev => [...prev, response.data]);
            } else if (typeof editingId === 'number') {
                const response = await axiosClient.patch(`/comercial/api/detalles-pedido/${editingId}/`, editForm);
                toast.success("Actualizado");
                setDetails(prev => prev.map(d => d.id === editingId ? response.data : d));
            }
            setEditingId(null);
            setEditForm({});
        } catch (error: any) {
            console.error("Error saving:", error);
            const backendErrors = error.response?.data;
            if (backendErrors) {
                // If it's a validation error (Object with field names)
                const messages = Object.values(backendErrors).flat().join(". ");
                toast.error(messages || "Error de validación en el servidor.");
            } else {
                toast.error("Error al guardar. Verifique los campos requeridos.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: number) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        setSaving(true);
        try {
            await axiosClient.delete(`/comercial/api/detalles-pedido/${deleteConfirmId}/`);
            toast.success("Item eliminado correctamente");
            setDetails(prev => prev.filter(d => d.id !== deleteConfirmId));
            setDeleteConfirmId(null);
        } catch (error) {
            console.error("Error deleting:", error);
            toast.error("No se pudo eliminar el item.");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof DetallePedido, value: any) => {
        setEditForm(prev => {
            const newForm = { ...prev, [field]: value };

            // Cascading reset: When fruta changes, clear presentacion and referencia
            if (field === 'fruta') {
                newForm.presentacion = undefined;
                newForm.referencia = undefined;
            }
            // When presentacion or tipo_caja changes, clear referencia
            if (field === 'presentacion' || field === 'tipo_caja') {
                newForm.referencia = undefined;
            }

            return newForm;
        });
    };

    // Función para calcular valores dinámicamente
    const calculatePreviewValues = (form: Partial<DetallePedido>) => {
        const cajasSolicitadas = parseFloat(form.cajas_solicitadas as any) || 0;
        const cajasEnviadas = parseFloat(form.cajas_enviadas as any) || 0;
        const presentacionPeso = parseFloat(form.presentacion_peso as any) || 0;
        const valorXCajaUsd = parseFloat(form.valor_x_caja_usd as any) || 0;
        const tarifaUtilidad = parseFloat(form.tarifa_utilidad as any) || 0;
        const tarifaRecuperacion = parseFloat(form.tarifa_recuperacion as any) || 0;
        const noCajasNc = parseFloat(form.no_cajas_nc as any) || 0;
        const afectaUtilidad = form.afecta_utilidad;
        const porcentajeAfectacion = parseFloat(form.porcentaje_afectacion_utilidad as any) || 0;
        const exportadorNombre = form.exportador_nombre;

        // Cálculos básicos
        const kilos = presentacionPeso * cajasSolicitadas;
        const kilosEnviados = presentacionPeso * cajasEnviadas;
        const diferencia = cajasSolicitadas - cajasEnviadas;
        const valorXProducto = valorXCajaUsd * cajasEnviadas;

        // Cálculos de utilidad y recuperación
        let valorTotalUtilidad = 0;
        let valorTotalRecuperacion = 0;
        let valorNotaCredito = 0;

        if (afectaUtilidad === true) {
            // Lógica especial para Juan_Matas
            const esJuanMatas = exportadorNombre === "Juan_Matas";
            if (esJuanMatas && noCajasNc > 0 && porcentajeAfectacion > 0) {
                const totalNc = noCajasNc * valorXCajaUsd;
                const utilidadBase = cajasEnviadas * tarifaUtilidad;
                const deduccion = totalNc * (porcentajeAfectacion / 100);

                if (deduccion >= utilidadBase) {
                    valorTotalUtilidad = 0;
                } else {
                    valorTotalUtilidad = utilidadBase - deduccion;
                }
                valorTotalRecuperacion = (cajasEnviadas - noCajasNc) * tarifaRecuperacion;
                valorNotaCredito = totalNc;
            } else {
                // Cálculo normal
                valorTotalUtilidad = (cajasEnviadas - noCajasNc) * tarifaUtilidad;
                valorTotalRecuperacion = (cajasEnviadas - noCajasNc) * tarifaRecuperacion;
                valorNotaCredito = noCajasNc * valorXCajaUsd;
            }
        } else if (afectaUtilidad === false) {
            valorTotalUtilidad = cajasEnviadas * tarifaUtilidad;
            valorTotalRecuperacion = cajasEnviadas * tarifaRecuperacion;
            valorNotaCredito = noCajasNc * valorXCajaUsd;
        } else {
            // Descuento (null)
            valorTotalRecuperacion = (cajasEnviadas - noCajasNc) * tarifaRecuperacion;
            valorTotalUtilidad = (cajasEnviadas - noCajasNc) * tarifaUtilidad;
            valorNotaCredito = 0;
        }

        return {
            kilos,
            kilosEnviados,
            diferencia,
            valorXProducto,
            valorTotalUtilidad,
            valorTotalRecuperacion,
            valorNotaCredito
        };
    };

    // Business Logic
    const isEditableGeneral = (detail: DetallePedido | Partial<DetallePedido>) => {
        if (!isHeavens) return false; // Basic protection

        // New items always editable
        if (editingId === "new") return true;

        // Existing items check logic
        const info = (detail as DetallePedido).pedido_info;

        // Priority check: Order cancellation status
        if (pedido && !['sin_solicitud', 'pendiente', 'no_autorizado'].includes(pedido.estado_cancelacion)) {
            return false;
        }

        if (!info) return true; // Fallback
        return !info.awb && !info.numero_factura;
    };

    const isEditableFinancial = (detail: DetallePedido | Partial<DetallePedido>) => {
        if (!isHeavens) return false; // Basic protection

        if (editingId === "new") return true;
        const info = (detail as DetallePedido).pedido_info;
        if (!info) return true;
        return info.estado_factura !== 'Pagada';
    };

    const formatMoney = (val: number | string | null | undefined) => {
        if (val === null || val === undefined || val === "") return "-";
        const num = typeof val === "string" ? parseFloat(val) : val;
        if (isNaN(num)) return "-";
        return `$${num.toFixed(2)}`;
    };

    const formatNumber = (val: number | string | null | undefined, decimals = 2) => {
        if (val === null || val === undefined || val === "") return "-";
        const num = typeof val === "string" ? parseFloat(val) : val;
        if (isNaN(num)) return "-";
        return num.toFixed(decimals);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="h-[95vh] p-0 flex flex-col bg-white"
                hideCloseButton
            >
                {/* Header */}
                <SheetHeader className="px-6 py-4 border-b flex flex-row justify-between items-center bg-slate-50">
                    <div className="space-y-1">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <Package className="h-5 w-5 text-blue-600" />
                            Detalles del Pedido #{orderNumber || orderId}
                        </SheetTitle>
                        <SheetDescription>
                            Gestión completa de items del pedido.
                        </SheetDescription>
                    </div>
                    <div className="flex gap-2">
                        {isHeavens && (
                            <Button
                                onClick={handleCreateNew}
                                disabled={
                                    !!editingId ||
                                    !pedido ||
                                    !['sin_solicitud', 'pendiente', 'no_autorizado'].includes(pedido.estado_cancelacion) ||
                                    (!!pedido.awb || !!pedido.numero_factura)
                                }
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar Producto
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cerrar
                        </Button>
                    </div>
                </SheetHeader>

                {/* Main Content - Table with sticky header */}
                <div className="flex-1 min-h-0 overflow-auto">
                    <Table disableWrapper>
                        <TableHeader className="sticky top-0 z-20 bg-slate-100 shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
                            <TableRow className="hover:bg-transparent [&>th]:align-middle border-b-2 border-slate-300 [&>th]:bg-slate-100">
                                <TableHead className="w-[35px] font-semibold text-slate-700 text-xs px-2 text-center">#</TableHead>
                                <TableHead className="w-[90px] font-semibold text-slate-700 text-xs text-center">Fruta</TableHead>
                                <TableHead className="w-[140px] font-semibold text-slate-700 text-xs text-center">Presentacion</TableHead>
                                <TableHead className="w-[55px] font-semibold text-slate-700 text-xs text-center">Cajas Sol.</TableHead>
                                <TableHead className="w-[55px] font-semibold text-slate-700 text-xs text-center">Peso Caja</TableHead>
                                <TableHead className="w-[60px] font-semibold text-slate-700 text-xs text-center">Kilos Netos</TableHead>
                                <TableHead className="w-[55px] font-semibold text-slate-700 text-xs text-center">Cajas Env.</TableHead>
                                <TableHead className="w-[60px] font-semibold text-slate-700 text-xs text-center">Kilos Env.</TableHead>
                                <TableHead className="w-[55px] font-semibold text-slate-700 text-xs text-center">Dif.</TableHead>
                                <TableHead className="w-[90px] font-semibold text-slate-700 text-xs text-center">Marca Caja</TableHead>
                                <TableHead className="w-[160px] font-semibold text-slate-700 text-xs text-center">Referencia</TableHead>
                                <TableHead className="w-[120px] font-semibold text-slate-700 text-xs text-center">Contenedor</TableHead>
                                <TableHead className="w-[70px] font-semibold text-slate-700 text-xs text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={13} className="h-32 text-center">
                                        <div className="flex justify-center items-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {details.map((detail, index) => (
                                        <DataRow
                                            key={detail.id}
                                            detail={detail}
                                            index={index}
                                            editingId={editingId}
                                            editForm={editForm}
                                            frutas={frutas}
                                            presentaciones={presentaciones}
                                            tiposCaja={tiposCaja}
                                            referencias={referencias}
                                            onEdit={() => handleEdit(detail)}
                                            onDelete={() => handleDelete(detail.id)}
                                            onSave={handleSave}
                                            onCancel={handleCancelEdit}
                                            onChange={handleChange}
                                            canEditGeneral={isEditableGeneral(detail)}
                                            canEditFinancial={isEditableFinancial(detail)}
                                            saving={saving}
                                            formatMoney={formatMoney}
                                            formatNumber={formatNumber}
                                            calculatePreview={calculatePreviewValues}
                                        />
                                    ))}
                                    {/* New Row Creation */}
                                    {editingId === 'new' && (
                                        <DataRow
                                            key="new"
                                            detail={{} as DetallePedido} // Dummy
                                            index={details.length}
                                            editingId="new"
                                            editForm={editForm}
                                            frutas={frutas}
                                            presentaciones={presentaciones}
                                            tiposCaja={tiposCaja}
                                            referencias={referencias}
                                            onEdit={() => { }}
                                            onDelete={() => onCancelNew()}
                                            onSave={handleSave}
                                            onCancel={onCancelNew}
                                            onChange={handleChange}
                                            canEditGeneral={true}
                                            canEditFinancial={true}
                                            saving={saving}
                                            formatMoney={formatMoney}
                                            formatNumber={formatNumber}
                                            isNew
                                            calculatePreview={calculatePreviewValues}
                                        />
                                    )}
                                </>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </SheetContent>

            {/* Confirm Delete Dialog */}
            <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <DialogContent className="sm:max-w-[400px] border-none shadow-2xl">
                    <DialogHeader className="flex flex-col items-center pt-4">
                        <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-2">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-slate-900">¿Eliminar Producto?</DialogTitle>
                        <DialogDescription className="text-center text-slate-500 pt-2 text-balance leading-relaxed">
                            Esta acción no se puede deshacer. ¿Estás seguro que deseas eliminar <span className="font-bold text-slate-800 underline decoration-red-200 decoration-2 underline-offset-2">{details.find(d => d.id === deleteConfirmId)?.fruta_nombre || "este producto"}</span> de este pedido?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-row gap-3 sm:justify-center p-2 pt-4">
                        <Button
                            variant="outline"
                            className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            onClick={() => setDeleteConfirmId(null)}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
                            onClick={confirmDelete}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Sheet>
    );

    function onCancelNew() {
        setEditingId(null);
        setEditForm({});
    }
}

// Fixed InputCell and SelectCell moved OUTSIDE to prevent focus loss during re-renders
const InputCell = ({ isEditing, data, field, onChange, type = "text", disabled = false, width = "w-full", formatMoney, formatNumber, align = "left" }: any) => (
    isEditing ? (
        <Input
            type={type === 'number' ? 'text' : type}
            value={data[field] ?? ''}
            onChange={(e) => {
                const val = e.target.value;
                if (type === 'number') {
                    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                        onChange(field, val);
                    }
                } else {
                    onChange(field, val);
                }
            }}
            className={cn(
                "h-6 px-1.5 text-xs rounded-sm transition-all duration-200",
                width,
                align === "center" && "text-center",
                disabled
                    ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-blue-50 border-blue-300 text-slate-800 shadow-sm shadow-blue-100 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-0 hover:border-blue-400 animate-in fade-in-50 duration-300"
            )}
            disabled={disabled}
        />
    ) : (
        <span className={cn("truncate block text-xs", width, align === "center" && "text-center")} title={data[field]?.toString()}>
            {type === 'number'
                ? (field.includes('valor') || field.includes('tarifa') || field.includes('precio')
                    ? formatMoney(data[field])
                    : formatNumber(data[field]))
                : (data[field] ?? '-')}
        </span>
    )
);

const SelectCell = ({ isEditing, data, field, onChange, options, disabled = false, labelField = "nombre", renderLabel, width = "min-w-[120px]", renderReadOnly, align = "left" }: any) => {
    if (isEditing) {
        return (
            <div className={cn(width, !disabled && "animate-in fade-in-50 duration-300")}>
                <Select
                    disabled={disabled}
                    value={data[field]?.toString()}
                    onValueChange={(val) => onChange(field, parseInt(val))}
                >
                    <SelectTrigger className={cn(
                        "h-6 text-xs px-2 rounded-sm transition-all duration-200",
                        align === "center" && "text-center",
                        disabled
                            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-blue-50 border-blue-300 text-slate-800 shadow-sm shadow-blue-100 focus:ring-2 focus:ring-blue-400 hover:border-blue-400"
                    )}>
                        <SelectValue placeholder="Sel." className="line-clamp-1" />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((opt: any) => (
                            <SelectItem key={opt.id} value={opt.id.toString()}>
                                {renderLabel ? renderLabel(opt) : opt[labelField]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        );
    }
    const displayValue = renderReadOnly ? renderReadOnly(data) : data[field + '_nombre'];
    return <span className={cn("truncate block text-xs", width, align === "center" && "text-center")} title={displayValue}>{displayValue || '-'}</span>;
};

// Row Component - Two rows per product
function DataRow({
    detail, index, editingId, editForm,
    frutas, presentaciones, tiposCaja, referencias,
    onEdit, onDelete, onSave, onCancel, onChange,
    canEditGeneral, canEditFinancial,
    saving, formatMoney, formatNumber, isNew, calculatePreview
}: any) {
    const isEditing = editingId === (isNew ? 'new' : detail.id);
    const data = isEditing ? editForm : detail;
    const cellProps = { isEditing, data, onChange, formatMoney, formatNumber };

    // Calcular valores de preview cuando está editando
    const previewValues = isEditing && calculatePreview ? calculatePreview(data) : null;

    return (
        <>
            {/* Row 1: Product Info */}
            <TableRow className={cn(
                "hover:bg-slate-50 border-b border-slate-100",
                isEditing && "bg-blue-50/30",
                "border-l-4",
                isEditing ? "border-l-blue-400" : "border-l-slate-200"
            )}>
                <TableCell className="w-[35px] text-center text-xs font-medium text-slate-600 align-top py-2">{index + 1}</TableCell>

                <TableCell className="w-[90px] align-top py-2">
                    <SelectCell {...cellProps} field="fruta" options={frutas} disabled={!canEditGeneral} width="w-full" align="center" />
                </TableCell>
                <TableCell className="w-[140px] align-top py-2">
                    {isEditing ? (
                        <SelectCell
                            {...cellProps}
                            field="presentacion"
                            options={presentaciones}
                            disabled={!canEditGeneral}
                            renderLabel={(opt: any) => `${opt.nombre} ${parseFloat(opt.kilos).toFixed(2)} kg`}
                            renderReadOnly={(d: any) => d.presentacion_nombre ? `${d.presentacion_nombre} ${parseFloat(d.presentacion_kilos || 0).toFixed(2)} kg` : '-'}
                            width="w-full"
                            align="center"
                        />
                    ) : (
                        <span className="text-xs text-center block leading-tight">
                            {data.presentacion_nombre ? `${data.presentacion_nombre} ${parseFloat(data.presentacion_kilos || 0).toFixed(2)} kg` : '-'}
                        </span>
                    )}
                </TableCell>

                <TableCell className="w-[55px] align-top py-2">
                    <InputCell {...cellProps} field="cajas_solicitadas" type="number" disabled={!canEditGeneral} width="w-full" align="center" />
                </TableCell>
                <TableCell className="w-[55px] align-top py-2">
                    <span className="text-slate-500 text-xs block text-center">{formatNumber(data.presentacion_peso) || '-'}</span>
                </TableCell>
                <TableCell className="w-[60px] align-top py-2">
                    <span className={cn(
                        "text-xs block text-center",
                        isEditing && previewValues ? "text-blue-600 font-medium" : "text-slate-500"
                    )}>
                        {isEditing && previewValues
                            ? formatNumber(previewValues.kilos)
                            : formatNumber(data.kilos)}
                    </span>
                </TableCell>
                <TableCell className="w-[55px] align-top py-2">
                    <InputCell {...cellProps} field="cajas_enviadas" type="number" disabled={!canEditGeneral} width="w-full" align="center" />
                </TableCell>
                <TableCell className="w-[60px] align-top py-2">
                    <span className={cn(
                        "text-xs block text-center",
                        isEditing && previewValues ? "text-blue-600 font-medium" : "text-slate-500"
                    )}>
                        {isEditing && previewValues
                            ? formatNumber(previewValues.kilosEnviados)
                            : formatNumber(data.kilos_enviados)}
                    </span>
                </TableCell>
                <TableCell className="w-[55px] align-top py-2">
                    <span className={cn(
                        "text-xs block text-center",
                        isEditing && previewValues ? "text-blue-600 font-medium" : "text-slate-500"
                    )}>
                        {isEditing && previewValues
                            ? formatNumber(previewValues.diferencia)
                            : formatNumber(data.diferencia)}
                    </span>
                </TableCell>

                <TableCell className="w-[90px] align-top py-2">
                    <SelectCell {...cellProps} field="tipo_caja" options={tiposCaja} disabled={!canEditGeneral} width="w-full" align="center" />
                </TableCell>
                <TableCell className="w-[160px] align-top py-2">
                    {isEditing ? (
                        <SelectCell {...cellProps} field="referencia" options={referencias} disabled={!canEditGeneral} width="w-full" align="center" />
                    ) : (
                        <span className="text-xs text-center block leading-tight">
                            {data.referencia_nombre || '-'}
                        </span>
                    )}
                </TableCell>
                <TableCell className="w-[120px] align-top py-2">
                    {isEditing ? (
                        <div className="flex items-center justify-center">
                            <Select
                                disabled={!canEditGeneral}
                                value={data.lleva_contenedor ? "true" : "false"}
                                onValueChange={(v) => onChange("lleva_contenedor", v === "true")}
                            >
                                <SelectTrigger className={cn(
                                    "h-6 w-[70px] text-xs rounded-sm transition-all duration-200",
                                    !canEditGeneral
                                        ? "bg-slate-50 border-slate-200 text-slate-400"
                                        : "bg-blue-50 border-blue-300 shadow-sm shadow-blue-100 focus:ring-2 focus:ring-blue-400 animate-in fade-in-50 duration-300"
                                )}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Si</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-xs leading-tight">
                            <span className="font-medium">{data.lleva_contenedor ? "Si" : "No"}</span>
                            {data.referencia_contenedor && (
                                <span className="text-slate-500 text-[10px] text-center leading-tight">
                                    {data.referencia_contenedor}
                                </span>
                            )}
                            {data.cantidad_contenedores && (
                                <span className="text-slate-400 text-[10px]">#{data.cantidad_contenedores}</span>
                            )}
                        </div>
                    )}
                </TableCell>

                <TableCell className="w-[70px] sticky right-0 bg-white/95 border-l shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)] text-center p-2 align-top">
                    <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                            <>
                                <Button size="icon" className="h-7 w-7 bg-emerald-600 hover:bg-emerald-700" onClick={onSave} disabled={saving}>
                                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={onCancel}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </>
                        ) : (
                            <>
                                {!canEditGeneral && !canEditFinancial ? (
                                    <div className="h-7 w-7 flex items-center justify-center text-slate-300" title="Registro bloqueado">
                                        <Lock className="h-3.5 w-3.5" />
                                    </div>
                                ) : (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={cn(
                                            "h-7 w-7 transition-colors disabled:opacity-30",
                                            canEditGeneral ? "text-blue-500 hover:bg-blue-50 hover:text-blue-600" : "text-amber-500 hover:bg-amber-50"
                                        )}
                                        onClick={onEdit}
                                        title={canEditGeneral ? "Editar producto" : "Editar ajustes financieros"}
                                    >
                                        {canEditGeneral ? (
                                            <Pencil className="h-3.5 w-3.5" />
                                        ) : (
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                )}

                                {canEditGeneral && (
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={onDelete}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </TableCell>
            </TableRow>

            {/* Row 2: Financial Info - Colspan with inline labels */}
            <TableRow className={cn(
                "hover:bg-slate-50/50 border-b-2 border-slate-300",
                isEditing && "bg-amber-50/20",
                "border-l-4",
                isEditing ? "border-l-blue-400" : "border-l-slate-200"
            )}>
                <TableCell colSpan={13} className="py-2 px-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-medium">Stickers:</span>
                            <span className="text-slate-600">{data.stickers || '-'}</span>
                        </div>
                        <div className="h-4 w-px bg-slate-200" />

                        <div className="flex items-center gap-1">
                            <span className="text-emerald-600 font-medium">Utilidad:</span>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    value={data.tarifa_utilidad ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) onChange('tarifa_utilidad', val);
                                    }}
                                    className={cn(
                                        "h-6 w-16 px-1.5 text-xs rounded-sm transition-all duration-200",
                                        !canEditGeneral
                                            ? "bg-slate-50 border-slate-200 text-slate-400"
                                            : "bg-emerald-50 border-emerald-300 shadow-sm shadow-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-400 animate-in fade-in-50 duration-300"
                                    )}
                                    disabled={!canEditGeneral}
                                />
                            ) : (
                                <span className="text-emerald-700">{formatMoney(data.tarifa_utilidad)}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="text-blue-600 font-medium">Recup:</span>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    value={data.tarifa_recuperacion ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) onChange('tarifa_recuperacion', val);
                                    }}
                                    className={cn(
                                        "h-6 w-16 px-1.5 text-xs rounded-sm transition-all duration-200",
                                        !canEditGeneral
                                            ? "bg-slate-50 border-slate-200 text-slate-400"
                                            : "bg-blue-50 border-blue-300 shadow-sm shadow-blue-100 focus-visible:ring-2 focus-visible:ring-blue-400 animate-in fade-in-50 duration-300"
                                    )}
                                    disabled={!canEditGeneral}
                                />
                            ) : (
                                <span className="text-blue-700">{formatMoney(data.tarifa_recuperacion)}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-medium">Costo:</span>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    value={data.valor_x_caja_usd ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) onChange('valor_x_caja_usd', val);
                                    }}
                                    className={cn(
                                        "h-6 w-16 px-1.5 text-xs rounded-sm transition-all duration-200",
                                        !canEditGeneral
                                            ? "bg-slate-50 border-slate-200 text-slate-400"
                                            : "bg-blue-50 border-blue-300 shadow-sm shadow-blue-100 focus-visible:ring-2 focus-visible:ring-blue-400 animate-in fade-in-50 duration-300"
                                    )}
                                    disabled={!canEditGeneral}
                                />
                            ) : (
                                <span className="text-slate-600">{formatMoney(data.valor_x_caja_usd)}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-medium">Valor Prod:</span>
                            <span className={cn(
                                "font-medium",
                                isEditing && previewValues ? "text-blue-600" : "text-slate-600"
                            )}>
                                {isEditing && previewValues
                                    ? formatMoney(previewValues.valorXProducto)
                                    : formatMoney(data.valor_x_producto)}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-medium">Precio Prof:</span>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    value={data.precio_proforma ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) onChange('precio_proforma', val);
                                    }}
                                    className={cn(
                                        "h-6 w-16 px-1.5 text-xs rounded-sm transition-all duration-200",
                                        !canEditGeneral
                                            ? "bg-slate-50 border-slate-200 text-slate-400"
                                            : "bg-blue-50 border-blue-300 shadow-sm shadow-blue-100 focus-visible:ring-2 focus-visible:ring-blue-400 animate-in fade-in-50 duration-300"
                                    )}
                                    disabled={!canEditGeneral}
                                />
                            ) : (
                                <span className="text-slate-600">{formatMoney(data.precio_proforma)}</span>
                            )}
                        </div>

                        <div className="h-4 w-px bg-slate-200" />

                        <div className="flex items-center gap-1">
                            <span className="text-orange-600 font-medium">NC Cajas:</span>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    value={data.no_cajas_nc ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) onChange('no_cajas_nc', val);
                                    }}
                                    className={cn(
                                        "h-6 w-14 px-1.5 text-xs rounded-sm transition-all duration-200",
                                        !canEditFinancial
                                            ? "bg-slate-50 border-slate-200 text-slate-400"
                                            : "bg-orange-50 border-orange-300 shadow-sm shadow-orange-100 focus-visible:ring-2 focus-visible:ring-orange-400 animate-in fade-in-50 duration-300"
                                    )}
                                    disabled={!canEditFinancial}
                                />
                            ) : (
                                <span className="text-orange-700">{data.no_cajas_nc ?? '-'}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="text-orange-600 font-medium">Valor NC:</span>
                            <span className={cn(
                                "font-medium",
                                isEditing && previewValues ? "text-blue-600" : "text-orange-700"
                            )}>
                                {isEditing && previewValues
                                    ? formatMoney(previewValues.valorNotaCredito)
                                    : formatMoney(data.valor_nota_credito_usd)}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="text-orange-600 font-medium">Afecta Util?:</span>
                            {isEditing ? (
                                <Select
                                    disabled={!canEditFinancial}
                                    value={data.afecta_utilidad === true ? "true" : data.afecta_utilidad === false ? "false" : "null"}
                                    onValueChange={(v) => onChange("afecta_utilidad", v === "true" ? true : v === "false" ? false : null)}
                                >
                                    <SelectTrigger className={cn(
                                        "h-6 w-16 text-xs rounded-sm transition-all duration-200",
                                        !canEditFinancial
                                            ? "bg-slate-50 border-slate-200 text-slate-400"
                                            : "bg-orange-50 border-orange-300 shadow-sm shadow-orange-100 focus:ring-2 focus:ring-orange-400 animate-in fade-in-50 duration-300"
                                    )}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Si</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
                                        <SelectItem value="null">Desc.</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <span className="text-orange-700">
                                    {data.afecta_utilidad === true ? "Si" : data.afecta_utilidad === false ? "No" : "Desc."}
                                </span>
                            )}
                        </div>

                        {/* Campo % Afectación Utilidad - Solo para Juan Matas cuando afecta_utilidad=true y no_cajas_nc>0 */}
                        {(data.exportador_nombre === "Juan_Matas" && data.afecta_utilidad === true && (data.no_cajas_nc || 0) > 0) && (
                            <div className="flex items-center gap-1">
                                <span className="text-purple-600 font-medium">% Afect. Util:</span>
                                {isEditing ? (
                                    <Input
                                        type="text"
                                        value={data.porcentaje_afectacion_utilidad ?? ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                                                const num = parseFloat(val);
                                                if (val === '' || (num >= 0 && num <= 100)) {
                                                    onChange('porcentaje_afectacion_utilidad', val);
                                                }
                                            }
                                        }}
                                        className={cn(
                                            "h-6 w-14 px-1.5 text-xs rounded-sm transition-all duration-200",
                                            !canEditFinancial
                                                ? "bg-slate-50 border-slate-200 text-slate-400"
                                                : "bg-purple-50 border-purple-300 shadow-sm shadow-purple-100 focus-visible:ring-2 focus-visible:ring-purple-400 animate-in fade-in-50 duration-300"
                                        )}
                                        disabled={!canEditFinancial}
                                        placeholder="0-100"
                                    />
                                ) : (
                                    <span className="text-purple-700">{data.porcentaje_afectacion_utilidad ?? '0'}%</span>
                                )}
                            </div>
                        )}

                        <div className="h-4 w-px bg-slate-200" />

                        <div className="flex items-center gap-1">
                            <span className="text-emerald-600 font-medium">Total Util:</span>
                            <span className={cn(
                                "font-semibold",
                                isEditing && previewValues ? "text-blue-600" : "text-emerald-700"
                            )}>
                                {isEditing && previewValues
                                    ? formatMoney(previewValues.valorTotalUtilidad)
                                    : formatMoney(data.valor_total_utilidad_x_producto)}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="text-blue-600 font-medium">Total Recup:</span>
                            <span className={cn(
                                "font-semibold",
                                isEditing && previewValues ? "text-blue-600" : "text-blue-700"
                            )}>
                                {isEditing && previewValues
                                    ? formatMoney(previewValues.valorTotalRecuperacion)
                                    : formatMoney(data.valor_total_recuperacion_x_producto)}
                            </span>
                        </div>

                        {/* Indicador de Preview */}
                        {isEditing && previewValues && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 rounded-full">
                                <Calculator className="h-3 w-3 text-blue-600" />
                                <span className="text-[10px] font-medium text-blue-600">Preview</span>
                            </div>
                        )}

                        <div className="h-4 w-px bg-slate-200" />

                        <div className="flex items-center gap-1 flex-1 min-w-[150px]">
                            <span className="text-slate-400 font-medium">Obs:</span>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    value={data.observaciones ?? ''}
                                    onChange={(e) => onChange('observaciones', e.target.value)}
                                    className={cn(
                                        "h-6 flex-1 px-1.5 text-xs rounded-sm transition-all duration-200",
                                        !canEditGeneral
                                            ? "bg-slate-50 border-slate-200 text-slate-400"
                                            : "bg-blue-50 border-blue-300 shadow-sm shadow-blue-100 focus-visible:ring-2 focus-visible:ring-blue-400 animate-in fade-in-50 duration-300"
                                    )}
                                    disabled={!canEditGeneral}
                                />
                            ) : (
                                <span className="text-slate-600 truncate" title={data.observaciones}>{data.observaciones || '-'}</span>
                            )}
                        </div>
                    </div>
                </TableCell>
            </TableRow>
        </>
    );
}
