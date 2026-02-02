import { useState } from "react";
import { CompraNacional, VentaNacional, ReporteCalidadExportador, ReporteCalidadProveedor } from "@/types/nacionales";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Plus, ChevronDown, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NacionalesDetailsAccordionProps {
    data: CompraNacional;
    onEditCompra: () => void;
    onEditVenta: (venta: VentaNacional) => void;
    onCreateVenta: () => void;
    onEditReporteExp: (venta: VentaNacional) => void;
    onCreateReporteExp: (venta: VentaNacional) => void;
    onEditReporteProv: (venta: VentaNacional) => void;
    onCreateReporteProv: (venta: VentaNacional) => void;
}

export function NacionalesDetailsAccordion({
    data,
    onEditCompra, onEditVenta, onCreateVenta,
    onEditReporteExp, onCreateReporteExp,
    onEditReporteProv, onCreateReporteProv
}: NacionalesDetailsAccordionProps) {

    const [openItems, setOpenItems] = useState<string[]>(["item-compra"]);

    const toggleItem = (value: string) => {
        if (openItems.includes(value)) {
            setOpenItems(openItems.filter(item => item !== value));
        } else {
            setOpenItems([...openItems, value]);
        }
    };

    // Calculate GLOBAL stats for all ventas
    const globalStats = {
        totalPesoBruto: data.ventas?.reduce((sum, v) => sum + (Number(v.peso_bruto_recibido) || 0), 0) || 0,
        totalEmpaque: data.ventas?.reduce((sum, v) => sum + (Number(v.cantidad_empaque_recibida) || 0), 0) || 0,
        compraPeso: Number(data.peso_compra) || 0,
        compraEmpaque: Number(data.cantidad_empaque) || 0,
        get diferenciaPeso() { return this.totalPesoBruto - this.compraPeso; },
        get diferenciaEmpaque() { return this.totalEmpaque - this.compraEmpaque; }
    };

    // Determine lock state for Compra
    const isCompraLocked = data.ventas?.some(v => v.reportecalidadexportador?.vencimiento_factura);

    return (
        <div className="w-full space-y-6">

            {/* Step 1: Compra */}
            <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                <button
                    onClick={() => toggleItem("item-compra")}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                >
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold shadow-sm">1</span>
                        <span className="font-semibold text-slate-800">Detalles de Compra</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-slate-500 font-normal bg-slate-50">{data.fecha_compra}</Badge>
                        {openItems.includes("item-compra") ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>
                </button>

                {openItems.includes("item-compra") && (
                    <div className="px-4 pb-4 pt-2">
                        <div className="pt-2 border-t border-slate-100">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 mb-4">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Proveedor</label>
                                    <p className="font-medium text-slate-900">{data.proveedor_nombre}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fecha Compra</label>
                                    <p className="font-medium text-slate-900">{data.fecha_compra}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Número Guía</label>
                                    <p className="font-medium text-slate-900">{data.numero_guia}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Remisión</label>
                                    <p className="text-slate-700">{data.remision || 'Sin remisión'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fruta</label>
                                    <p className="font-medium text-slate-900">{data.fruta_nombre}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Origen</label>
                                    <p className="font-medium text-slate-900">{data.origen_compra}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Empaque</label>
                                    <p className="text-slate-700">{data.tipo_empaque_nombre} x {data.cantidad_empaque}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Peso Compra</label>
                                    <p className="font-medium text-emerald-700 font-mono text-base">{data.peso_compra.toLocaleString()} Kg</p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Precio Compra Exp</label>
                                    <p className="font-medium text-slate-900 font-mono">${Math.round(data.precio_compra_exp).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Valor Total (Estimado)</label>
                                    <p className="font-medium text-slate-900 font-mono">${(data.peso_compra * data.precio_compra_exp).toLocaleString()}</p>
                                </div>
                            </div>
                            {data.observaciones && (
                                <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Observaciones</label>
                                    <p className="text-sm text-slate-600 italic">{data.observaciones}</p>
                                </div>
                            )}
                            <div className="flex justify-end items-center mt-2 pt-2 border-t border-dashed border-slate-200">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={onEditCompra}
                                    disabled={!!isCompraLocked}
                                    className="h-8 border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                    <Edit2 className="w-3.5 h-3.5 mr-2" />
                                    Editar Compra
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Ventas Section - Tabs */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold shadow-sm">2</span>
                        Ventas y Reportes
                    </h2>
                    <Button onClick={onCreateVenta} className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Venta
                    </Button>
                </div>

                {!data.ventas || data.ventas.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-500 mb-4">No hay ventas registradas para esta compra.</p>
                    </div>
                ) : (
                    <Tabs defaultValue={data.ventas[0].id.toString()} className="w-full">
                        <TabsList className="mb-4 flex flex-wrap h-auto bg-slate-100 p-1 w-full justify-start gap-1 items-center">
                            {data.ventas.map(venta => (
                                <TabsTrigger
                                    key={venta.id}
                                    value={venta.id.toString()}
                                    className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700"
                                >
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span className="font-semibold">{venta.tipo || `Venta #${venta.id}`}</span>
                                        {venta.lote && <span className="text-[10px] text-slate-500">Lote: {venta.lote}</span>}
                                    </div>
                                </TabsTrigger>
                            ))}

                            {/* Sales Summary Visualization in Tab Space */}
                            <div className="ml-auto px-4 py-1 flex items-center gap-2 text-xs border-l border-slate-200 pl-4 my-1">
                                {(() => {
                                    const totalVentas = data.ventas?.reduce((acc, v) => acc + (v.cantidad_empaque_recibida || 0), 0) || 0;
                                    const remaining = data.cantidad_empaque - totalVentas;
                                    return (
                                        <div className="flex flex-col items-end">
                                            <span className="text-slate-500">
                                                Vendido: <strong className="text-slate-800">{totalVentas}</strong> / {data.cantidad_empaque}
                                            </span>
                                            <span className={remaining < 0 ? "text-red-600 font-bold" : "text-emerald-600 font-medium"}>
                                                {remaining < 0 ? `Excedente: ${Math.abs(remaining)}` : `Disponible: ${remaining}`}
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </TabsList>

                        {data.ventas.map(venta => {
                            const isLockedByFactura = !!venta.reportecalidadexportador?.vencimiento_factura;
                            const isReporteProvLocked = !!venta.reportecalidadexportador?.reportecalidadproveedor?.completado;

                            return (
                                <TabsContent key={venta.id} value={venta.id.toString()} className="space-y-6 animate-in fade-in duration-300">
                                    {/* Venta Details */}
                                    <VentaCard
                                        venta={venta}
                                        locked={isLockedByFactura}
                                        onEdit={() => onEditVenta(venta)}
                                        globalDiferenciaPeso={globalStats.diferenciaPeso}
                                        globalDiferenciaEmpaque={globalStats.diferenciaEmpaque}
                                    />

                                    {/* Reporte Exportador */}
                                    <ReporteExpCard
                                        venta={venta}
                                        locked={isLockedByFactura}
                                        onCreate={() => onCreateReporteExp(venta)}
                                        onEdit={() => onEditReporteExp(venta)}
                                    />

                                    {/* Reporte Proveedor */}
                                    <ReporteProvCard
                                        venta={venta}
                                        locked={isReporteProvLocked}
                                        onCreate={() => onCreateReporteProv(venta)}
                                        onEdit={() => onEditReporteProv(venta)}
                                    />
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                )}
            </div>
        </div>
    );
}

function VentaCard({ venta, locked, onEdit, globalDiferenciaPeso, globalDiferenciaEmpaque }: {
    venta: VentaNacional;
    locked: boolean;
    onEdit: () => void;
    globalDiferenciaPeso: number;
    globalDiferenciaEmpaque: number;
}) {
    return (
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 p-3 border-b border-slate-100 flex justify-between items-center">
                <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Información de Venta</h4>
                <Badge variant="outline" className={cn(
                    "font-medium border",
                    venta.estado_venta === 'Vencido' ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-600 border-blue-200"
                )}>{venta.estado_venta}</Badge>
            </div>
            <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 mb-4">
                    <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Exportador</label>
                        <p className="font-medium text-slate-900">{venta.exportador_nombre}</p>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fechas</label>
                        <div className="flex flex-col text-xs">
                            <span className="text-slate-700">Llegada: {venta.fecha_llegada}</span>
                            <span className={cn(
                                "font-medium",
                                venta.estado_venta === 'Vencido' ? "text-red-600" : "text-slate-500"
                            )}>Vence: {venta.fecha_vencimiento}</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Peso Recibido</label>
                        <div className="flex flex-col">
                            <span className="font-mono text-slate-700 text-xs">Bruto: {venta.peso_bruto_recibido.toLocaleString()} Kg</span>
                            <span className="font-mono font-medium text-slate-900">Neto: {venta.peso_neto_recibido.toLocaleString()} Kg</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Diferencias (Global)</label>
                        <div className="flex flex-col">
                            <span className={cn(
                                "font-mono font-medium text-sm",
                                globalDiferenciaPeso < 0 ? "text-red-600" : "text-emerald-600"
                            )}>
                                Peso: {globalDiferenciaPeso.toLocaleString()} Kg
                            </span>
                            <span className={cn(
                                "text-xs font-medium",
                                globalDiferenciaEmpaque < 0 ? "text-red-500" : globalDiferenciaEmpaque > 0 ? "text-emerald-500" : "text-slate-500"
                            )}>
                                Empaque: {globalDiferenciaEmpaque > 0 ? `+${globalDiferenciaEmpaque}` : globalDiferenciaEmpaque}
                            </span>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tipo / Lote</label>
                        <p className="text-slate-700">{venta.tipo || '-'} / {venta.lote || '-'}</p>
                    </div>
                </div>
                {venta.observaciones && (
                    <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Observaciones</label>
                        <p className="text-sm text-slate-600 italic">{venta.observaciones}</p>
                    </div>
                )}
                <div className="flex justify-end pt-2 border-t border-dashed border-slate-100">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onEdit}
                        disabled={locked}
                        className={cn(
                            "h-8 border-blue-200",
                            locked ? "opacity-50 cursor-not-allowed" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        )}
                    >
                        {locked ? <Lock className="w-3.5 h-3.5 mr-2" /> : <Edit2 className="w-3.5 h-3.5 mr-2" />}
                        Editar Venta
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ReporteExpCard({ venta, locked, onCreate, onEdit }: { venta: VentaNacional, locked: boolean, onCreate: () => void, onEdit: () => void }) {
    const reporte = venta.reportecalidadexportador;

    return (
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 p-3 border-b border-slate-100 flex justify-between items-center">
                <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Reporte Calidad Exportador</h4>
                {reporte ? (
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">{reporte.estado_reporte_exp}</Badge>
                ) : (
                    <Badge variant="secondary">Pendiente</Badge>
                )}
            </div>

            <div className="p-4">
                {reporte ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 mb-4">
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fecha Reporte</label>
                                <p className="font-medium text-slate-900">{reporte.fecha_reporte}</p>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Remisión</label>
                                <p className="font-medium text-slate-900">{reporte.remision_exp || 'Sin Remisión'}</p>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kg Totales</label>
                                <p className="font-mono font-medium text-slate-900">{parseFloat(reporte.kg_totales.toString()).toLocaleString()} Kg</p>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Factura Heavens</label>
                                <p className="text-slate-700">{reporte.factura || 'Pendiente'}</p>
                            </div>
                        </div>

                        {/* Desglose Calidad */}
                        <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            {/* ... Using abbreviated rendering for brevity, keeping original logic ... */}
                            <div className="text-center">
                                <span className="block text-[10px] uppercase font-bold text-emerald-600">Exportación</span>
                                <div className="text-sm font-semibold text-slate-800">{reporte.porcentaje_exportacion}%</div>
                                <div className="text-xs text-slate-500">{parseFloat(reporte.kg_exportacion.toString()).toLocaleString()} Kg</div>
                            </div>
                            <div className="text-center border-l border-r border-slate-200">
                                <span className="block text-[10px] uppercase font-bold text-blue-600">Nacional</span>
                                <div className="text-sm font-semibold text-slate-800">{reporte.porcentaje_nacional}%</div>
                                <div className="text-xs text-slate-500">{parseFloat(reporte.kg_nacional.toString()).toLocaleString()} Kg</div>
                            </div>
                            <div className="text-center">
                                <span className="block text-[10px] uppercase font-bold text-slate-500">Merma</span>
                                <div className="text-sm font-semibold text-slate-800">{reporte.porcentaje_merma || 0}%</div>
                                <div className="text-xs text-slate-500">{parseFloat((reporte.kg_merma || 0).toString()).toLocaleString()} Kg</div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center px-2 pt-2 border-t border-dashed border-slate-200">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Valor Total Factura</span>
                                <span className="text-lg font-bold text-slate-900 font-mono">${parseFloat(reporte.precio_total.toString()).toLocaleString()}</span>
                            </div>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onEdit}
                                disabled={locked}
                                className={cn(
                                    "h-8 border-blue-200",
                                    locked ? "opacity-50 cursor-not-allowed" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                )}
                            >
                                {locked ? <Lock className="w-3.5 h-3.5 mr-2" /> : <Edit2 className="w-3.5 h-3.5 mr-2" />}
                                Editar Reporte
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="py-6 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                        <Button onClick={onCreate} className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Crear Reporte
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

function ReporteProvCard({ venta, locked, onCreate, onEdit }: { venta: VentaNacional, locked: boolean, onCreate: () => void, onEdit: () => void }) {
    const reporteExp = venta.reportecalidadexportador;
    const reporteProv = reporteExp?.reportecalidadproveedor;

    if (!reporteExp) return null; // Cannot have provider report without exp report

    const formatCurrency = (val: number | undefined | null) => {
        if (val === undefined || val === null) return '$0';
        return '$' + parseFloat(val.toString()).toLocaleString();
    };

    return (
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 p-3 border-b border-slate-100 flex justify-between items-center">
                <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Reporte Calidad Proveedor</h4>
                {reporteProv ? (
                    <Badge variant="outline" className="text-xs px-2 h-5">{reporteProv.estado_reporte_prov}</Badge>
                ) : (
                    <Badge variant="secondary">Pendiente</Badge>
                )}
            </div>

            <div className="p-4">
                {reporteProv ? (
                    <>
                        {/* Header Info Row */}
                        <div className="grid grid-cols-4 gap-4 mb-4 pb-4 border-b border-slate-100">
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fecha Reporte</label>
                                <p className="font-medium text-slate-900">{reporteProv.p_fecha_reporte || '-'}</p>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estado Reporte</label>
                                <p className="font-medium text-slate-900">{reporteProv.estado_reporte_prov}</p>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No. Factura Prov</label>
                                <p className="font-medium text-slate-900">{reporteProv.factura_prov || '-'}</p>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kg Totales</label>
                                <p className="font-medium text-slate-900 font-mono">{Number(reporteProv.p_kg_totales || 0).toLocaleString()} Kg</p>
                            </div>
                        </div>

                        {/* Quality Breakdown - Exp / Nal / Merma */}
                        <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="text-center">
                                <span className="block text-[10px] uppercase font-bold text-emerald-600">Exportación</span>
                                <div className="text-sm font-semibold text-slate-800">{Number(reporteProv.p_porcentaje_exportacion || 0).toFixed(2)}%</div>
                                <div className="text-xs text-slate-500">{Number(reporteProv.p_kg_exportacion || 0).toLocaleString()} Kg</div>
                                <div className="text-xs text-emerald-600 font-mono">{formatCurrency(reporteProv.p_precio_kg_exp)}/Kg</div>
                            </div>
                            <div className="text-center border-l border-r border-slate-200">
                                <span className="block text-[10px] uppercase font-bold text-blue-600">Nacional</span>
                                <div className="text-sm font-semibold text-slate-800">{Number(reporteProv.p_porcentaje_nacional || 0).toFixed(2)}%</div>
                                <div className="text-xs text-slate-500">{Number(reporteProv.p_kg_nacional || 0).toLocaleString()} Kg</div>
                                <div className="text-xs text-blue-600 font-mono">{formatCurrency(reporteProv.p_precio_kg_nal)}/Kg</div>
                            </div>
                            <div className="text-center">
                                <span className="block text-[10px] uppercase font-bold text-slate-500">Merma</span>
                                <div className="text-sm font-semibold text-slate-800">{Number(reporteProv.p_porcentaje_merma || 0).toFixed(2)}%</div>
                                <div className="text-xs text-slate-500">{Number(reporteProv.p_kg_merma || 0).toLocaleString()} Kg</div>
                            </div>
                        </div>

                        {/* Two columns: Costos y Retenciones | Análisis de Utilidad */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {/* Costos y Retenciones */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                                <h5 className="text-[10px] font-bold uppercase text-slate-500 border-b pb-1">Costos y Retenciones</h5>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-600">Total Facturar:</span>
                                    <span className="font-mono font-medium">{formatCurrency(reporteProv.p_total_facturar)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-600">Asohofrucol (1%):</span>
                                    <span className="font-mono text-red-500">- {formatCurrency(reporteProv.asohofrucol)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-600">Rte Fte (1.5%):</span>
                                    <span className="font-mono text-red-500">- {formatCurrency(reporteProv.rte_fte)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-600">Rte Ica (4.14/1000):</span>
                                    <span className="font-mono text-red-500">- {formatCurrency(reporteProv.rte_ica)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold border-t pt-2">
                                    <span className="text-slate-700">Total a Pagar:</span>
                                    <span className="font-mono text-blue-700">{formatCurrency(reporteProv.p_total_pagar)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Monto Pendiente:</span>
                                    <span className="font-mono text-amber-600">{formatCurrency(reporteProv.monto_pendiente)}</span>
                                </div>
                            </div>

                            {/* Análisis de Utilidad */}
                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 space-y-2">
                                <h5 className="text-[10px] font-bold uppercase text-emerald-600 border-b border-emerald-200 pb-1">Análisis de Utilidad</h5>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-600">Total Venta Exp:</span>
                                    <span className="font-mono font-medium">{formatCurrency(reporteExp.precio_total)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-600">Utilidad Real:</span>
                                    <span className={`font-mono font-medium ${(reporteProv.p_utilidad || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                        {formatCurrency(reporteProv.p_utilidad)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-600">% Utilidad:</span>
                                    <span className={`font-mono font-medium ${(reporteProv.p_porcentaje_utilidad || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                        {Number(reporteProv.p_porcentaje_utilidad || 0).toFixed(2)}%
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs border-t border-emerald-200 pt-2">
                                    <span className="text-slate-600">Utilidad Sin Ajuste:</span>
                                    <span className="font-mono">{formatCurrency(reporteProv.p_utilidad_sin_ajuste)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-600">Diferencia Utilidades:</span>
                                    <span className={`font-mono font-bold ${(reporteProv.diferencia_utilidad || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                        {formatCurrency(reporteProv.diferencia_utilidad)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status Row */}
                        <div className="grid grid-cols-4 gap-4 py-3 px-2 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                            <div className="text-center">
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Reporte Enviado</label>
                                {reporteProv.reporte_enviado ? (
                                    <span className="text-emerald-500 text-lg">✓</span>
                                ) : (
                                    <span className="text-red-400 text-lg">✗</span>
                                )}
                            </div>
                            <div className="text-center">
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Reporte Pago</label>
                                {reporteProv.reporte_pago ? (
                                    <span className="text-emerald-500 text-lg">✓</span>
                                ) : (
                                    <span className="text-red-400 text-lg">✗</span>
                                )}
                            </div>
                            <div className="text-center">
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Completado</label>
                                <span className="text-slate-600">{reporteProv.completado ? 'Sí' : 'No'}</span>
                            </div>
                            <div className="text-center">
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Estado Final</label>
                                <Badge variant="outline" className="text-xs">{reporteProv.estado_reporte_prov}</Badge>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-dashed border-slate-200">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onEdit}
                                disabled={locked}
                                className={cn(
                                    "h-8 border-blue-200",
                                    locked ? "opacity-50 cursor-not-allowed" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                )}
                            >
                                {locked ? <Lock className="w-3.5 h-3.5 mr-2" /> : <Edit2 className="w-3.5 h-3.5 mr-2" />}
                                Editar Reporte
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="py-6 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                        <Button onClick={onCreate} className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Generar Reporte Prov
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
