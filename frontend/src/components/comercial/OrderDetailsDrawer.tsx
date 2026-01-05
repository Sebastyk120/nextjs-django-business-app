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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
    ShieldCheck
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

                {/* Main Content - Table */}
                <div className="flex-1 overflow-hidden relative">
                    <ScrollArea className="h-full w-full">
                        <div className="min-w-[max-content]"> {/* Ensures horizontal scroll triggers */}
                            <Table>
                                <TableHeader className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                                    <TableRow className="hover:bg-transparent [&>th]:align-bottom [&>th]:pb-3">
                                        <TableHead className="w-[40px] font-semibold text-slate-700 text-xs px-2">#</TableHead>
                                        <TableHead className="min-w-[120px] font-semibold text-slate-700 text-xs text-center flex flex-col justify-end items-center"><span className="block mb-1">Fruta</span></TableHead>
                                        <TableHead className="min-w-[120px] font-semibold text-slate-700 text-xs text-center"><span className="block leading-tight">Presentación</span></TableHead>
                                        <TableHead className="min-w-[70px] font-semibold text-slate-700 text-xs text-center"><span className="block leading-tight">Cajas<br />Sol.</span></TableHead>
                                        <TableHead className="min-w-[70px] font-semibold text-slate-700 text-xs text-center"><span className="block leading-tight">Peso<br />Caja</span></TableHead>
                                        <TableHead className="min-w-[70px] font-semibold text-slate-700 text-xs text-center"><span className="block leading-tight">Kilos<br />Netos</span></TableHead>
                                        <TableHead className="min-w-[70px] font-semibold text-slate-700 text-xs text-center"><span className="block leading-tight">Cajas<br />Env.</span></TableHead>
                                        <TableHead className="min-w-[70px] font-semibold text-slate-700 text-xs text-center"><span className="block leading-tight">Kilos<br />Env.</span></TableHead>
                                        <TableHead className="min-w-[70px] font-semibold text-slate-700 text-xs text-center"><span className="block leading-tight">Dife-<br />rencia</span></TableHead>
                                        <TableHead className="min-w-[110px] font-semibold text-slate-700 text-xs text-center"><span className="block leading-tight">Marca Caja</span></TableHead>
                                        <TableHead className="min-w-[110px] font-semibold text-slate-700 text-xs text-center"><span className="block leading-tight">Referencia</span></TableHead>
                                        <TableHead className="min-w-[110px] font-semibold text-slate-700 text-xs text-center"><span className="block leading-tight">Stickers</span></TableHead>
                                        <TableHead className="min-w-[80px] font-semibold text-slate-700 text-xs text-center"><span className="block leading-tight">Contenedor</span></TableHead>
                                        <TableHead className="min-w-[70px] font-semibold text-slate-700 text-xs text-center"><span className="block leading-tight">No.<br />Cont.</span></TableHead>
                                        <TableHead className="min-w-[80px] font-semibold text-slate-700 text-xs text-center text-emerald-600"><span className="block leading-tight">Utilidad<br />($)</span></TableHead>
                                        <TableHead className="min-w-[80px] font-semibold text-slate-700 text-xs text-center text-blue-600"><span className="block leading-tight">Recup.<br />($)</span></TableHead>
                                        <TableHead className="min-w-[80px] font-semibold text-slate-700 text-xs text-center"><span className="block leading-tight">Costo<br />($)</span></TableHead>
                                        <TableHead className="min-w-[80px] font-semibold text-slate-700 text-xs text-center"><span className="block leading-tight">Valor<br />Prod.</span></TableHead>
                                        <TableHead className="min-w-[80px] font-semibold text-slate-700 text-xs text-center"><span className="block leading-tight">Precio<br />Prof.</span></TableHead>
                                        <TableHead className="min-w-[70px] font-semibold text-slate-700 text-xs text-center text-orange-600"><span className="block leading-tight">NC<br />Cajas</span></TableHead>
                                        <TableHead className="min-w-[80px] font-semibold text-slate-700 text-xs text-center text-orange-600"><span className="block leading-tight">Valor<br />NC</span></TableHead>
                                        <TableHead className="min-w-[80px] font-semibold text-slate-700 text-xs text-center text-orange-600"><span className="block leading-tight">Afecta<br />Util?</span></TableHead>
                                        <TableHead className="min-w-[80px] font-semibold text-slate-700 text-xs text-center text-emerald-600"><span className="block leading-tight">Total<br />Util.</span></TableHead>
                                        <TableHead className="min-w-[80px] font-semibold text-slate-700 text-xs text-center text-blue-600"><span className="block leading-tight">Total<br />Recup.</span></TableHead>
                                        <TableHead className="min-w-[150px] font-semibold text-slate-700 text-xs text-center"><span className="block leading-tight">Observaciones</span></TableHead>
                                        <TableHead className="w-[80px] sticky right-0 bg-slate-100 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)] z-20 font-semibold text-slate-700 text-xs text-center align-middle">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={17} className="h-32 text-center">
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
                                                />
                                            )}
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
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
const InputCell = ({ isEditing, data, field, onChange, type = "text", disabled = false, width = "w-full", formatMoney, formatNumber }: any) => (
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
                "h-6 px-1.5 text-xs bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500 rounded-sm hover:border-slate-300 transition-colors",
                width
            )}
            disabled={disabled}
        />
    ) : (
        <span className={cn("truncate block text-xs", width)} title={data[field]?.toString()}>
            {type === 'number'
                ? (field.includes('valor') || field.includes('tarifa') || field.includes('precio')
                    ? formatMoney(data[field])
                    : formatNumber(data[field]))
                : (data[field] ?? '-')}
        </span>
    )
);

const SelectCell = ({ isEditing, data, field, onChange, options, disabled = false, labelField = "nombre", renderLabel, width = "min-w-[120px]", renderReadOnly }: any) => {
    if (isEditing) {
        return (
            <div className={width}>
                <Select
                    disabled={disabled}
                    value={data[field]?.toString()}
                    onValueChange={(val) => onChange(field, parseInt(val))}
                >
                    <SelectTrigger className="h-6 text-xs px-2 border-slate-200 hover:border-slate-300 focus:ring-1 focus:ring-blue-500 rounded-sm">
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
    return <span className={cn("truncate block text-xs", width)} title={displayValue}>{displayValue || '-'}</span>;
};

// Row Component
function DataRow({
    detail, index, editingId, editForm,
    frutas, presentaciones, tiposCaja, referencias,
    onEdit, onDelete, onSave, onCancel, onChange,
    canEditGeneral, canEditFinancial,
    saving, formatMoney, formatNumber, isNew
}: any) {
    const isEditing = editingId === (isNew ? 'new' : detail.id);
    const data = isEditing ? editForm : detail;
    const cellProps = { isEditing, data, onChange, formatMoney, formatNumber };

    return (
        <TableRow className={cn("hover:bg-slate-50 border-b border-slate-100", isEditing && "bg-blue-50/30")}>
            <TableCell className="text-center text-xs text-slate-400">{index + 1}</TableCell>

            <TableCell>
                <SelectCell {...cellProps} field="fruta" options={frutas} disabled={!canEditGeneral} width="min-w-[100px] w-[100px]" />
            </TableCell>
            <TableCell>
                <SelectCell
                    {...cellProps}
                    field="presentacion"
                    options={presentaciones}
                    disabled={!canEditGeneral}
                    renderLabel={(opt: any) => `${opt.nombre} ${parseFloat(opt.kilos).toFixed(2)} kg`}
                    renderReadOnly={(d: any) => d.presentacion_nombre ? `${d.presentacion_nombre} ${parseFloat(d.presentacion_kilos || 0).toFixed(2)} kg` : '-'}
                    width="min-w-[130px] w-[130px]"
                />
            </TableCell>

            <TableCell>
                <InputCell {...cellProps} field="cajas_solicitadas" type="number" disabled={!canEditGeneral} width="w-[70px]" />
            </TableCell>
            <TableCell>
                <span className="text-slate-500 text-xs block w-[60px]" title="Calculado">{formatNumber(data.presentacion_peso) || '-'}</span>
            </TableCell>
            <TableCell>
                <span className="text-slate-500 text-xs block w-[70px]" title="Calculado">{formatNumber(data.kilos) || '-'}</span>
            </TableCell>
            <TableCell>
                <InputCell {...cellProps} field="cajas_enviadas" type="number" disabled={!canEditGeneral} width="w-[70px]" />
            </TableCell>
            <TableCell>
                <span className="text-slate-500 text-xs block w-[60px]" title="Calculado">{formatNumber(data.kilos_enviados) || '-'}</span>
            </TableCell>
            <TableCell>
                <span className="text-slate-500 text-xs block w-[60px]" title="Calculado">{formatNumber(data.diferencia) || '-'}</span>
            </TableCell>

            <TableCell>
                <SelectCell {...cellProps} field="tipo_caja" options={tiposCaja} disabled={!canEditGeneral} width="min-w-[110px] w-[110px]" />
            </TableCell>
            <TableCell>
                <SelectCell {...cellProps} field="referencia" options={referencias} disabled={!canEditGeneral} width="min-w-[150px] w-[150px]" />
            </TableCell>
            <TableCell>
                <span className="text-slate-400 text-xs truncate block max-w-[110px]" title={data.stickers}>{data.stickers || '-'}</span>
            </TableCell>
            <TableCell className="min-w-[80px]">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <Select
                            disabled={!canEditGeneral}
                            value={data.lleva_contenedor ? "true" : "false"}
                            onValueChange={(v) => onChange("lleva_contenedor", v === "true")}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Sí</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <div className="flex flex-col text-xs max-w-[80px]">
                        <span>{data.lleva_contenedor ? "Sí" : "No"}</span>
                        {data.referencia_contenedor && (
                            <span className="text-slate-400 truncate block w-full text-[10px]" title={data.referencia_contenedor}>
                                {data.referencia_contenedor}
                            </span>
                        )}
                    </div>
                )}
            </TableCell>
            <TableCell>
                <span className="text-slate-500 text-xs" title="Calculado">{data.cantidad_contenedores || '-'}</span>
            </TableCell>

            <TableCell>
                <InputCell {...cellProps} field="tarifa_utilidad" type="number" disabled={!canEditGeneral} width="w-[70px]" />
            </TableCell>
            <TableCell>
                <InputCell {...cellProps} field="tarifa_recuperacion" type="number" disabled={!canEditGeneral} width="w-[70px]" />
            </TableCell>
            <TableCell>
                <InputCell {...cellProps} field="valor_x_caja_usd" type="number" disabled={!canEditGeneral} width="w-[70px]" />
            </TableCell>
            <TableCell>
                <span className="text-slate-500 text-xs block w-[80px]" title="Calculado">{formatMoney(data.valor_x_producto)}</span>
            </TableCell>
            <TableCell>
                <InputCell {...cellProps} field="precio_proforma" type="number" disabled={!canEditGeneral} width="w-[70px]" />
            </TableCell>

            <TableCell>
                <InputCell {...cellProps} field="no_cajas_nc" type="number" disabled={!canEditFinancial} width="w-[70px]" />
            </TableCell>
            <TableCell>
                <span className="text-slate-500 text-xs block w-[80px]" title="Calculado">{formatMoney(data.valor_nota_credito_usd)}</span>
            </TableCell>
            <TableCell>
                {isEditing ? (
                    <Select
                        disabled={!canEditFinancial}
                        value={data.afecta_utilidad === true ? "true" : data.afecta_utilidad === false ? "false" : "null"}
                        onValueChange={(v) => onChange("afecta_utilidad", v === "true" ? true : v === "false" ? false : null)}
                    >
                        <SelectTrigger className="h-6 w-[70px] text-xs border-slate-200 hover:border-slate-300 focus:ring-1 focus:ring-blue-500 rounded-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">Sí</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                            <SelectItem value="null">Desc.</SelectItem>
                        </SelectContent>
                    </Select>
                ) : (
                    <span className="text-xs block w-[70px]">
                        {data.afecta_utilidad === true ? "Sí" : data.afecta_utilidad === false ? "No" : "Desc."}
                    </span>
                )}
            </TableCell>
            <TableCell>
                <span className="text-slate-500 text-xs text-emerald-700 font-medium block w-[90px]" title="Calculado">{formatMoney(data.valor_total_utilidad_x_producto)}</span>
            </TableCell>
            <TableCell>
                <span className="text-slate-500 text-xs text-blue-700 font-medium block w-[90px]" title="Calculado">{formatMoney(data.valor_total_recuperacion_x_producto)}</span>
            </TableCell>

            <TableCell>
                <InputCell {...cellProps} field="observaciones" type="text" disabled={!canEditGeneral} width="min-w-[150px] w-full" />
            </TableCell>

            <TableCell className="sticky right-0 bg-white/95 border-l shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)] text-center p-2">
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
    );
}
