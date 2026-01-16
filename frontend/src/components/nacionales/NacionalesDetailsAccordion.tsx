import { useState } from "react";
import { CompraNacional } from "@/types/nacionales";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Plus, ChevronDown, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NacionalesDetailsAccordionProps {
    data: CompraNacional;
    onEditCompra: () => void;
    onEditVenta: () => void;
    onCreateVenta: () => void;
    onEditReporteExp: () => void;
    onCreateReporteExp: () => void;
    onEditReporteProv: () => void;
    onCreateReporteProv: () => void;
}

export function NacionalesDetailsAccordion({
    data,
    onEditCompra, onEditVenta, onCreateVenta,
    onEditReporteExp, onCreateReporteExp,
    onEditReporteProv, onCreateReporteProv
}: NacionalesDetailsAccordionProps) {

    // Custom Accordion State
    const [openItems, setOpenItems] = useState<string[]>(["item-compra", "item-venta", "item-reporte-exp", "item-reporte-prov"]);

    const toggleItem = (value: string) => {
        if (openItems.includes(value)) {
            setOpenItems(openItems.filter(item => item !== value));
        } else {
            setOpenItems([...openItems, value]);
        }
    };

    // Locking logic based on Django template rules
    // Compra, Venta, ReporteExp get locked when ReporteExp has vencimiento_factura (factura ya emitida)
    const isLockedByFactura = !!data.ventanacional?.reportecalidadexportador?.vencimiento_factura;

    // ReporteProv gets locked when completado is true
    const isReporteProvLocked = !!data.ventanacional?.reportecalidadexportador?.reportecalidadproveedor?.completado;

    return (
        <div className="w-full space-y-4">

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
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={onEditCompra}
                                                    disabled={isLockedByFactura}
                                                    className={cn(
                                                        "h-8 border-blue-200",
                                                        isLockedByFactura ? "opacity-50 cursor-not-allowed" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    )}
                                                >
                                                    {isLockedByFactura ? <Lock className="w-3.5 h-3.5 mr-2" /> : <Edit2 className="w-3.5 h-3.5 mr-2" />}
                                                    Editar Compra
                                                </Button>
                                            </span>
                                        </TooltipTrigger>
                                        {isLockedByFactura && (
                                            <TooltipContent>
                                                <p>Bloqueado: La factura ya fue emitida</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Step 2: Venta */}
            <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                <button
                    onClick={() => toggleItem("item-venta")}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                >
                    <div className="flex items-center gap-3">
                        <span className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shadow-sm",
                            data.ventanacional ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                        )}>2</span>
                        <span className="font-semibold text-slate-800">Detalles de Venta</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {data.ventanacional ? (
                            <Badge variant="outline" className={cn(
                                "font-medium border",
                                data.estado_venta === 'Vencido' ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-600 border-blue-200"
                            )}>{data.estado_venta}</Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500">Pendiente</Badge>
                        )}
                        {openItems.includes("item-venta") ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>
                </button>

                {openItems.includes("item-venta") && (
                    <div className="px-4 pb-4 pt-2">
                        {data.ventanacional ? (
                            <div className="pt-2 border-t border-slate-100">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 mb-4">
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Exportador</label>
                                        <p className="font-medium text-slate-900">{data.ventanacional.exportador_nombre}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fechas</label>
                                        <div className="flex flex-col text-xs">
                                            <span className="text-slate-700">Llegada: {data.ventanacional.fecha_llegada}</span>
                                            <span className={cn(
                                                "font-medium",
                                                data.estado_venta === 'Vencido' ? "text-red-600" : "text-slate-500"
                                            )}>Vence: {data.ventanacional.fecha_vencimiento}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Peso Recibido</label>
                                        <div className="flex flex-col">
                                            <span className="font-mono text-slate-700 text-xs">Bruto: {data.ventanacional.peso_bruto_recibido.toLocaleString()} Kg</span>
                                            <span className="font-mono font-medium text-slate-900">Neto: {data.ventanacional.peso_neto_recibido.toLocaleString()} Kg</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Diferencias</label>
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "font-mono font-medium text-sm",
                                                (data.ventanacional.diferencia_peso || 0) < 0 ? "text-red-600" : "text-emerald-600"
                                            )}>
                                                Peso: {(data.ventanacional.diferencia_peso || 0).toLocaleString()} Kg
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                Empaque: {data.ventanacional.diferencia_empaque || 0}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Empaque Recibido</label>
                                        <p className="text-slate-700 font-mono">{data.ventanacional.cantidad_empaque_recibida} uds</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estado Venta</label>
                                        <Badge variant="outline" className={cn(
                                            "font-normal text-xs px-1 py-0 h-5",
                                            data.ventanacional.estado_venta === 'Vencido' ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-600 border-blue-200"
                                        )}>{data.ventanacional.estado_venta}</Badge>
                                    </div>
                                </div>
                                {data.ventanacional.observaciones && (
                                    <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Observaciones</label>
                                        <p className="text-sm text-slate-600 italic">{data.ventanacional.observaciones}</p>
                                    </div>
                                )}
                                <div className="flex justify-end items-center mt-2 pt-2 border-t border-dashed border-slate-200">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={onEditVenta}
                                                        disabled={isLockedByFactura}
                                                        className={cn(
                                                            "h-8 border-blue-200",
                                                            isLockedByFactura ? "opacity-50 cursor-not-allowed" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        )}
                                                    >
                                                        {isLockedByFactura ? <Lock className="w-3.5 h-3.5 mr-2" /> : <Edit2 className="w-3.5 h-3.5 mr-2" />}
                                                        Editar Venta
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            {isLockedByFactura && (
                                                <TooltipContent>
                                                    <p>Bloqueado: La factura ya fue emitida</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                                <p className="text-slate-500 mb-4 text-sm">No se ha registrado la venta nacional.</p>
                                <Button onClick={onCreateVenta} className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Registrar Venta
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Step 3: Reporte Calidad Exportador */}
            <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                <button
                    onClick={() => toggleItem("item-reporte-exp")}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                >
                    <div className="flex items-center gap-3">
                        <span className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shadow-sm",
                            data.estado_reporte_exp !== 'Pendiente' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                        )}>3</span>
                        <span className="font-semibold text-slate-800">Reporte Calidad Exportador</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {data.ventanacional?.reportecalidadexportador ? (
                            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">{data.ventanacional.reportecalidadexportador.estado_reporte_exp}</Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500">Pendiente</Badge>
                        )}
                        {openItems.includes("item-reporte-exp") ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>
                </button>

                {openItems.includes("item-reporte-exp") && (
                    <div className="px-4 pb-4 pt-2">
                        {data.ventanacional?.reportecalidadexportador ? (
                            <div className="pt-2 border-t border-slate-100">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 mb-4">
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fecha Reporte</label>
                                        <p className="font-medium text-slate-900">{data.ventanacional.reportecalidadexportador.fecha_reporte}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Remisión</label>
                                        <p className="font-medium text-slate-900">{data.ventanacional.reportecalidadexportador.remision_exp || 'Sin Remisión'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kg Totales</label>
                                        <p className="font-mono font-medium text-slate-900">{parseFloat(data.ventanacional.reportecalidadexportador.kg_totales.toString()).toLocaleString()} Kg</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Factura Heavens</label>
                                        <p className="text-slate-700">{data.ventanacional.reportecalidadexportador.factura || 'Pendiente'}</p>
                                    </div>
                                </div>

                                {/* Desglose Calidad */}
                                <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-center">
                                        <span className="block text-[10px] uppercase font-bold text-emerald-600">Exportación</span>
                                        <div className="text-sm font-semibold text-slate-800">{data.ventanacional.reportecalidadexportador.porcentaje_exportacion}%</div>
                                        <div className="text-xs text-slate-500">{parseFloat(data.ventanacional.reportecalidadexportador.kg_exportacion.toString()).toLocaleString()} Kg</div>
                                        <div className="text-xs font-mono text-emerald-600 mt-1">${parseFloat(data.ventanacional.reportecalidadexportador.precio_venta_kg_exp.toString()).toLocaleString()}</div>
                                    </div>
                                    <div className="text-center border-l border-r border-slate-200">
                                        <span className="block text-[10px] uppercase font-bold text-blue-600">Nacional</span>
                                        <div className="text-sm font-semibold text-slate-800">{data.ventanacional.reportecalidadexportador.porcentaje_nacional}%</div>
                                        <div className="text-xs text-slate-500">{parseFloat(data.ventanacional.reportecalidadexportador.kg_nacional.toString()).toLocaleString()} Kg</div>
                                        <div className="text-xs font-mono text-blue-600 mt-1">${parseFloat(data.ventanacional.reportecalidadexportador.precio_venta_kg_nal.toString()).toLocaleString()}</div>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-[10px] uppercase font-bold text-slate-500">Merma</span>
                                        <div className="text-sm font-semibold text-slate-800">{data.ventanacional.reportecalidadexportador.porcentaje_merma}%</div>
                                        <div className="text-xs text-slate-500">{parseFloat(data.ventanacional.reportecalidadexportador.kg_merma.toString()).toLocaleString()} Kg</div>
                                        <div className="text-xs font-mono text-slate-400 mt-1">-</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center px-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Valor Total Factura</span>
                                        <span className="text-lg font-bold text-slate-900 font-mono">${parseFloat(data.ventanacional.reportecalidadexportador.precio_total.toString()).toLocaleString()}</span>
                                    </div>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={onEditReporteExp}
                                                        disabled={isLockedByFactura}
                                                        className={cn(
                                                            "h-8 border-blue-200",
                                                            isLockedByFactura ? "opacity-50 cursor-not-allowed" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        )}
                                                    >
                                                        {isLockedByFactura ? <Lock className="w-3.5 h-3.5 mr-2" /> : <Edit2 className="w-3.5 h-3.5 mr-2" />}
                                                        Editar Reporte
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            {isLockedByFactura && (
                                                <TooltipContent>
                                                    <p>Bloqueado: La factura ya fue emitida</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                                <p className="text-slate-500 mb-4 text-sm">No se ha registrado el reporte de exportador.</p>
                                <Button
                                    onClick={onCreateReporteExp}
                                    disabled={!data.ventanacional}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Crear Reporte
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Step 4: Reporte Calidad Proveedor */}
            <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                <button
                    onClick={() => toggleItem("item-reporte-prov")}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                >
                    <div className="flex items-center gap-3">
                        <span className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shadow-sm",
                            data.ventanacional?.reportecalidadexportador?.reportecalidadproveedor?.completado ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                        )}>4</span>
                        <span className="font-semibold text-slate-800">Reporte Calidad Proveedor</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {data.ventanacional?.reportecalidadexportador?.reportecalidadproveedor ? (
                            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">{data.ventanacional.reportecalidadexportador.reportecalidadproveedor.estado_reporte_prov}</Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500">Pendiente</Badge>
                        )}
                        {openItems.includes("item-reporte-prov") ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>
                </button>

                {openItems.includes("item-reporte-prov") && (
                    <div className="px-4 pb-4 pt-2">
                        {data.ventanacional?.reportecalidadexportador?.reportecalidadproveedor ? (
                            <div className="pt-2 border-t border-slate-100">
                                {/* Fila 1: Info General */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 mb-4">
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fecha Reporte</label>
                                        <p className="font-medium text-slate-900">{data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_fecha_reporte}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estado Reporte</label>
                                        <Badge variant="outline" className="text-xs px-2 h-5">{data.ventanacional.reportecalidadexportador.reportecalidadproveedor.estado_reporte_prov}</Badge>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No. Factura Prov</label>
                                        <p className="font-medium text-slate-900">{data.ventanacional.reportecalidadexportador.reportecalidadproveedor.factura_prov || <span className="text-slate-400">Pendiente</span>}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kg Totales</label>
                                        <p className="font-mono font-medium text-slate-900">{parseFloat((data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_kg_totales ?? 0).toString()).toLocaleString()} Kg</p>
                                    </div>
                                </div>

                                {/* Desglose Calidad - Kilos y Porcentajes */}
                                <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-center">
                                        <span className="block text-[10px] uppercase font-bold text-emerald-600">Exportación</span>
                                        <div className="text-sm font-semibold text-slate-800">{data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_porcentaje_exportacion}%</div>
                                        <div className="text-xs text-slate-500">{parseFloat((data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_kg_exportacion ?? 0).toString()).toLocaleString()} Kg</div>
                                        <div className="text-xs font-mono text-emerald-600 mt-1">${parseFloat(data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_precio_kg_exp.toString()).toLocaleString()}/Kg</div>
                                    </div>
                                    <div className="text-center border-l border-r border-slate-200">
                                        <span className="block text-[10px] uppercase font-bold text-blue-600">Nacional</span>
                                        <div className="text-sm font-semibold text-slate-800">{data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_porcentaje_nacional}%</div>
                                        <div className="text-xs text-slate-500">{parseFloat((data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_kg_nacional ?? 0).toString()).toLocaleString()} Kg</div>
                                        <div className="text-xs font-mono text-blue-600 mt-1">${parseFloat(data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_precio_kg_nal.toString()).toLocaleString()}/Kg</div>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-[10px] uppercase font-bold text-slate-500">Merma</span>
                                        <div className="text-sm font-semibold text-slate-800">{data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_porcentaje_merma}%</div>
                                        <div className="text-xs text-slate-500">{parseFloat(data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_kg_merma.toString()).toLocaleString()} Kg</div>
                                        <div className="text-xs font-mono text-slate-400 mt-1">-</div>
                                    </div>
                                </div>

                                {/* Desglose Financiero Completo */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {/* Columna Izq: Costos y Retenciones */}
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                                        <h5 className="text-[10px] font-bold uppercase text-slate-500 border-b pb-1">Costos y Retenciones</h5>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-600">Total Facturar:</span>
                                            <span className="font-mono font-medium">${parseFloat(data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_total_facturar.toString()).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-600">Asohofrucol (1%):</span>
                                            <span className="font-mono text-red-500">- ${parseFloat(data.ventanacional.reportecalidadexportador.reportecalidadproveedor.asohofrucol.toString()).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-600">Rte Fte (1.5%):</span>
                                            <span className="font-mono text-red-500">- ${parseFloat(data.ventanacional.reportecalidadexportador.reportecalidadproveedor.rte_fte.toString()).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-600">Rte Ica (4.14/1000):</span>
                                            <span className="font-mono text-red-500">- ${parseFloat(data.ventanacional.reportecalidadexportador.reportecalidadproveedor.rte_ica.toString()).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold border-t pt-2">
                                            <span className="text-slate-700">Total a Pagar:</span>
                                            <span className="font-mono text-blue-700">${parseFloat(data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_total_pagar.toString()).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs pt-1">
                                            <span className="text-slate-500">Monto Pendiente:</span>
                                            <span className={`font-mono font-medium ${data.ventanacional.reportecalidadexportador.reportecalidadproveedor.monto_pendiente > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                ${parseFloat(data.ventanacional.reportecalidadexportador.reportecalidadproveedor.monto_pendiente.toString()).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Columna Der: Utilidades */}
                                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 space-y-2">
                                        <h5 className="text-[10px] font-bold uppercase text-emerald-600 border-b border-emerald-200 pb-1">Análisis de Utilidad</h5>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-600">Total Venta Exp:</span>
                                            <span className="font-mono font-medium">${parseFloat(data.ventanacional.reportecalidadexportador.precio_total.toString()).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-600">Utilidad Real:</span>
                                            <span className={`font-mono font-medium ${data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_utilidad >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                                ${parseFloat(data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_utilidad.toString()).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-600">% Utilidad:</span>
                                            <span className="font-mono font-medium text-emerald-700">{Number(data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_porcentaje_utilidad ?? 0).toFixed(2)}%</span>
                                        </div>
                                        <div className="flex justify-between text-xs border-t border-emerald-200 pt-2">
                                            <span className="text-slate-500">Utilidad Sin Ajuste:</span>
                                            <span className="font-mono text-slate-600">${parseFloat((data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_utilidad_sin_ajuste ?? 0).toString()).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Diferencia Utilidades:</span>
                                            <span className={`font-mono ${(data.ventanacional.reportecalidadexportador.reportecalidadproveedor.diferencia_utilidad ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                ${parseFloat((data.ventanacional.reportecalidadexportador.reportecalidadproveedor.diferencia_utilidad ?? 0).toString()).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Estado del Proceso */}
                                <div className="grid grid-cols-4 gap-4 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-center">
                                        <label className="block text-[10px] text-slate-400 font-bold uppercase">Reporte Enviado</label>
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm ${data.ventanacional.reportecalidadexportador.reportecalidadproveedor.reporte_enviado ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                                            {data.ventanacional.reportecalidadexportador.reportecalidadproveedor.reporte_enviado ? '✓' : '✗'}
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <label className="block text-[10px] text-slate-400 font-bold uppercase">Reporte Pago</label>
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm ${data.ventanacional.reportecalidadexportador.reportecalidadproveedor.reporte_pago ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                                            {data.ventanacional.reportecalidadexportador.reportecalidadproveedor.reporte_pago ? '✓' : '✗'}
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <label className="block text-[10px] text-slate-400 font-bold uppercase">Completado</label>
                                        <Badge variant={data.ventanacional.reportecalidadexportador.reportecalidadproveedor.completado ? "default" : "secondary"}
                                            className={data.ventanacional.reportecalidadexportador.reportecalidadproveedor.completado ? "bg-emerald-600" : ""}>
                                            {data.ventanacional.reportecalidadexportador.reportecalidadproveedor.completado ? 'Sí' : 'No'}
                                        </Badge>
                                    </div>
                                    <div className="text-center">
                                        <label className="block text-[10px] text-slate-400 font-bold uppercase">Estado Final</label>
                                        <Badge variant="outline" className={
                                            data.ventanacional.reportecalidadexportador.reportecalidadproveedor.estado_reporte_prov === 'Completado' ? 'border-emerald-500 text-emerald-600' :
                                                data.ventanacional.reportecalidadexportador.reportecalidadproveedor.estado_reporte_prov === 'Pagado' ? 'border-blue-500 text-blue-600' :
                                                    'border-amber-500 text-amber-600'
                                        }>
                                            {data.ventanacional.reportecalidadexportador.reportecalidadproveedor.estado_reporte_prov}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex justify-end items-center mt-2 pt-2 border-t border-dashed border-slate-200">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={onEditReporteProv}
                                                        disabled={isReporteProvLocked}
                                                        className={cn(
                                                            "h-8 border-blue-200",
                                                            isReporteProvLocked ? "opacity-50 cursor-not-allowed" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        )}
                                                    >
                                                        {isReporteProvLocked ? <Lock className="w-3.5 h-3.5 mr-2" /> : <Edit2 className="w-3.5 h-3.5 mr-2" />}
                                                        Editar Reporte
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            {isReporteProvLocked && (
                                                <TooltipContent>
                                                    <p>Bloqueado: El proceso está completado</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                                <p className="text-slate-500 mb-4 text-sm">No se ha generado el reporte para el proveedor.</p>
                                <Button
                                    onClick={onCreateReporteProv}
                                    disabled={!data.ventanacional?.reportecalidadexportador}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Generar Reporte Prov
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
