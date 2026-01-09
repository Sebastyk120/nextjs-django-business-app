"use client";

import { Pedido } from "@/types/pedido";
import {
    Pencil,
    FileText,
    Receipt,
    Package,
    XCircle,
    CheckCircle,
    Ban,
    Hourglass,
    Briefcase,
    TrendingUp,
    Plane,
    Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import axiosClient from "@/lib/axios";

interface ExtendedColumnConfig {
    key: keyof Pedido;
    label: string;
    group?: string;
    format?: (value: any, row: Pedido) => React.ReactNode;
}

interface OrdersTableProps {
    data: Pedido[];
    visibleColumns: (keyof Pedido)[];
    columnsConfig: ExtendedColumnConfig[];
    onEdit?: (order: Pedido) => void;
    onViewDetails?: (order: Pedido) => void;
    onCancel?: (order: Pedido) => void;
    activePreset?: string | null;
    userGroups?: string[];
}

const GROUP_STYLES: Record<string, { header: string, cell: string }> = {
    "General": { header: "bg-slate-100 border-t-2 border-t-slate-400", cell: "bg-slate-50/30" },
    "Logística": { header: "bg-blue-100/80 border-t-2 border-t-blue-500", cell: "bg-blue-50/20" },
    "Fechas": { header: "bg-indigo-100/80 border-t-2 border-t-indigo-500", cell: "bg-indigo-50/20" },
    "Cantidades": { header: "bg-orange-100/80 border-t-2 border-t-orange-500", cell: "bg-orange-50/20" },
    "Facturación": { header: "bg-emerald-100/80 border-t-2 border-t-emerald-500", cell: "bg-emerald-50/20" },
    "Financiero": { header: "bg-amber-100/80 border-t-2 border-t-amber-500", cell: "bg-amber-50/20" },
    "Tracking": { header: "bg-cyan-100/80 border-t-2 border-t-cyan-500", cell: "bg-cyan-50/20" },
};

export function OrdersTable({ data, visibleColumns, columnsConfig, onEdit, onViewDetails, onCancel, activePreset, userGroups = [] }: OrdersTableProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-white h-[400px]">
                <div className="rounded-full bg-slate-100 p-3 mb-4">
                    <FileText className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No hay pedidos encontrados</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Intenta ajustar los filtros o tu búsqueda.
                </p>
            </div>
        );
    }

    const isHeavens = userGroups.includes("Heavens");

    return (
        <div className="relative w-full overflow-auto border rounded-md bg-white shadow-sm">
            <table className="w-full caption-bottom text-sm text-left">
                <thead className="sticky top-0 z-10">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-10 px-4 text-left align-middle font-medium text-slate-500 min-w-[100px] border-r border-slate-100 bg-slate-50 border-t-2 border-t-slate-200">
                            Acciones
                        </th>
                        {columnsConfig.filter(col => visibleColumns.includes(col.key)).map((col, index) => {
                            const styles = col.group ? GROUP_STYLES[col.group] : GROUP_STYLES["General"];
                            const isFirstColumn = index === 0;
                            return (
                                <th
                                    key={col.key}
                                    className={cn(
                                        "h-12 px-2 py-1 text-left align-middle font-semibold text-slate-600 text-[11px] tracking-tight border-r border-slate-100 leading-[1.1] min-w-[70px] max-w-[100px] whitespace-normal break-words",
                                        styles?.header || "bg-slate-50",
                                        isFirstColumn && "sticky left-[140px] z-10 shadow-[4px_0_5px_-3px_rgba(0,0,0,0.1)]"
                                    )}
                                >
                                    {col.label}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0 text-slate-700">
                    {data.map((pedido) => {
                        // Row Styling Logic from Django:
                        let rowClass = "hover:bg-slate-50/80 transition-colors bg-white";
                        if (pedido.estado_cancelacion === 'autorizado') {
                            rowClass = "bg-red-50 hover:bg-red-100/50 text-red-900";
                        } else if (pedido.estado_pedido === 'Finalizado') {
                            rowClass = "bg-emerald-50 hover:bg-emerald-100/50 text-emerald-900";
                        } else if (pedido.estado_cancelacion === 'pendiente') {
                            rowClass = "bg-yellow-50 hover:bg-yellow-100/50 text-yellow-900";
                        }

                        return (
                            <tr
                                key={pedido.id}
                                className={cn("border-b border-slate-100", rowClass)}
                            >
                                <td className="p-2 align-middle sticky left-0 bg-inherit shadow-[4px_0_5px_-3px_subgrid] z-20 flex gap-1 items-center min-w-[140px] border-r border-slate-100/50">
                                    <div className="flex items-center gap-1">
                                        {/* Dynamic Edit Button Logic */}
                                        {(() => {
                                            // Base check: activePreset dictates context, but user role dictates logic type

                                            let isEditAllowed = false;

                                            if (isHeavens) {
                                                // Full Logic for Heavens
                                                const isCancellationAllowed = ['sin_solicitud', 'pendiente', 'no_autorizado'].includes(pedido.estado_cancelacion);

                                                if (isCancellationAllowed) {
                                                    if (activePreset === 'cartera') {
                                                        isEditAllowed = pedido.estado_factura !== 'Pagada';
                                                    } else if (activePreset === 'utilidades') {
                                                        isEditAllowed = pedido.estado_utilidad !== 'Pagada';
                                                    } else if (activePreset === 'seguimiento') {
                                                        isEditAllowed = true;
                                                    } else {
                                                        // Base view
                                                        isEditAllowed = !pedido.awb && !pedido.numero_factura;
                                                    }
                                                }
                                            } else {
                                                // Restricted User Logic (Exporters, etc) - Single condition for ALL views
                                                isEditAllowed = pedido.estado_pedido !== 'Finalizado';
                                            }

                                            return isEditAllowed ? (
                                                <button
                                                    onClick={() => onEdit?.(pedido)}
                                                    className={cn(
                                                        "h-7 w-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 text-slate-500",
                                                        activePreset === 'cartera' ? "hover:bg-amber-100 hover:text-amber-700" :
                                                            activePreset === 'utilidades' ? "hover:bg-emerald-100 hover:text-emerald-700" :
                                                                activePreset === 'seguimiento' ? "hover:bg-blue-100 hover:text-blue-700" :
                                                                    "hover:bg-blue-100 hover:text-blue-700"
                                                    )}
                                                    title={
                                                        activePreset === 'cartera' ? "Editar Cartera" :
                                                            activePreset === 'utilidades' ? "Editar Utilidades" :
                                                                activePreset === 'seguimiento' ? "Editar Seguimiento" :
                                                                    "Editar Pedido"
                                                    }
                                                >
                                                    {activePreset === 'cartera' ? <Briefcase className="h-3.5 w-3.5" /> :
                                                        activePreset === 'utilidades' ? <TrendingUp className="h-3.5 w-3.5" /> :
                                                            activePreset === 'seguimiento' ? <Plane className="h-3.5 w-3.5" /> :
                                                                <Pencil className="h-3.5 w-3.5" />}
                                                </button>
                                            ) : (
                                                <div className="h-7 w-7 flex items-center justify-center text-slate-300 cursor-not-allowed" title="Edición restringida">
                                                    <Lock className="h-3.5 w-3.5" />
                                                </div>
                                            );
                                        })()}

                                        {/* Dynamic Details Button Logic from detalle_pedido_button.html */}
                                        {['sin_solicitud', 'pendiente', 'no_autorizado'].includes(pedido.estado_cancelacion) && (
                                            <button
                                                onClick={() => onViewDetails?.(pedido)}
                                                className="h-7 w-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-emerald-100 hover:text-emerald-700 focus-visible:outline-none disabled:opacity-50 text-slate-500"
                                                title="Ver Detalles"
                                            >
                                                <Package className="h-3.5 w-3.5" />
                                            </button>
                                        )}

                                        {/* Removed Receipt (AWB/Factura) Button as per request */}

                                        <button
                                            onClick={async () => {
                                                try {
                                                    const response = await axiosClient.get(`/comercial/pedido_resumen_pdf/${pedido.id}`, {
                                                        responseType: 'blob'
                                                    });
                                                    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                                                    window.open(url, '_blank');
                                                } catch (error) {
                                                    console.error("Error fetching PDF:", error);
                                                }
                                            }}
                                            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-orange-100 hover:text-orange-700 focus-visible:outline-none disabled:opacity-50 text-slate-500"
                                            title="Ver PDF"
                                        >
                                            <FileText className="h-3.5 w-3.5" />
                                        </button>
                                        {(() => {
                                            const isAutorizador = userGroups.includes("Heavens") || userGroups.includes("Autorizadores");
                                            const estado = pedido.estado_cancelacion || 'sin_solicitud';

                                            // 1. Authorizer can Approve/Reject if Pending
                                            if (isAutorizador && estado === 'pendiente') {
                                                return (
                                                    <button
                                                        onClick={() => onCancel && onCancel(pedido)}
                                                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-green-100 hover:text-green-700 focus-visible:outline-none text-green-600"
                                                        title="Gestionar Cancelación"
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                    </button>
                                                );
                                            }

                                            // 2. Normal user can Request if not started or rejected
                                            if (!isAutorizador && (estado === 'sin_solicitud' || estado === 'no_autorizado')) {
                                                return (
                                                    <button
                                                        onClick={() => onCancel && onCancel(pedido)}
                                                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-red-100 hover:text-red-700 focus-visible:outline-none text-red-500"
                                                        title="Solicitar Cancelación"
                                                    >
                                                        <Ban className="h-3.5 w-3.5" />
                                                    </button>
                                                );
                                            }

                                            // 3. User can see status if it's already pending
                                            if (!isAutorizador && estado === 'pendiente') {
                                                return (
                                                    <button
                                                        onClick={() => onCancel && onCancel(pedido)}
                                                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 focus-visible:outline-none text-slate-400"
                                                        title="Cancelación Pendiente"
                                                    >
                                                        <Hourglass className="h-3.5 w-3.5" />
                                                    </button>
                                                );
                                            }

                                            // 4. Default X icon (if state is authorized or something else)
                                            if (estado !== 'autorizado') {
                                                return (
                                                    <button
                                                        onClick={() => onCancel && onCancel(pedido)}
                                                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-red-100 hover:text-red-700 focus-visible:outline-none text-slate-500"
                                                        title="Estado Cancelación"
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" />
                                                    </button>
                                                );
                                            }

                                            return null;
                                        })()}
                                    </div>
                                </td>
                                {columnsConfig.filter(col => visibleColumns.includes(col.key)).map((col, index) => {
                                    const styles = col.group ? GROUP_STYLES[col.group] : GROUP_STYLES["General"];
                                    const isFirstColumn = index === 0;
                                    return (
                                        <td
                                            key={col.key}
                                            className={cn(
                                                "p-2 align-middle whitespace-nowrap border-r border-slate-100/50 text-xs",
                                                styles?.cell,
                                                isFirstColumn && "sticky left-[140px] bg-inherit z-10 shadow-[4px_0_5px_-3px_rgba(0,0,0,0.1)]"
                                            )}
                                        >
                                            {col.format ? col.format(pedido[col.key], pedido) : pedido[col.key] as React.ReactNode}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
