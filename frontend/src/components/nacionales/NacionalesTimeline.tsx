"use client";

import { CompraNacional } from "@/types/nacionales";
import { Check, Clock, ShoppingCart, Store, FileOutput, FileCheck, ChevronRight, Package, DollarSign, Calendar, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NacionalesTimelineProps {
    data: CompraNacional;
}

export function NacionalesTimeline({ data }: NacionalesTimelineProps) {

    // Aggregate data from all ventas
    const ventas = data.ventas || [];
    const hasVentas = ventas.length > 0;
    const allVentasComplete = hasVentas; // At least one sale means venta step is "complete"

    // Check if ANY venta has a ReporteExp
    const anyReporteExp = ventas.some(v => v.reportecalidadexportador);
    const allReportesExp = hasVentas && ventas.every(v => v.reportecalidadexportador);

    // Check if ANY venta has a ReporteProv
    const anyReporteProv = ventas.some(v => v.reportecalidadexportador?.reportecalidadproveedor);
    const allReportesProv = hasVentas && ventas.every(v => v.reportecalidadexportador?.reportecalidadproveedor);
    const allReportesProvCompleted = hasVentas && ventas.every(v => v.reportecalidadexportador?.reportecalidadproveedor?.completado);

    // Aggregate summary info
    const totalPesoRecibido = ventas.reduce((sum, v) => sum + (v.peso_neto_recibido || 0), 0);
    const exportadorNames = [...new Set(ventas.map(v => v.exportador_nombre))].join(', ');

    // Get first venta for date/detail display (representative)
    const firstVenta = ventas[0];
    const firstReporteExp = firstVenta?.reportecalidadexportador;
    const firstReporteProv = firstReporteExp?.reportecalidadproveedor;

    // Aggregate reporte_exp data across all ventas
    const aggregatedReporteExp = (() => {
        const reportes = ventas
            .map(v => v.reportecalidadexportador)
            .filter(Boolean);

        if (reportes.length === 0) return null;

        const totalKg = reportes.reduce((sum, r) => sum + (Number(r?.kg_totales) || 0), 0);
        const totalKgExp = reportes.reduce((sum, r) => sum + (Number(r?.kg_exportacion) || 0), 0);
        const totalKgNal = reportes.reduce((sum, r) => sum + (Number(r?.kg_nacional) || 0), 0);
        const totalKgMerma = reportes.reduce((sum, r) => sum + (Number(r?.kg_merma) || 0), 0);
        const totalPrecio = reportes.reduce((sum, r) => sum + (Number(r?.precio_total) || 0), 0);

        return {
            remision: reportes.length === 1 ? reportes[0]?.remision_exp : `${reportes.length} remisiones`,
            porcExp: totalKg > 0 ? (totalKgExp / totalKg * 100).toFixed(2) : '0',
            porcNal: totalKg > 0 ? (totalKgNal / totalKg * 100).toFixed(2) : '0',
            porcMerma: totalKg > 0 ? (totalKgMerma / totalKg * 100).toFixed(2) : '0',
            total: totalPrecio,
            estado: allReportesExp ? 'Completado' : 'Parcial',
            count: reportes.length
        };
    })();

    // Aggregate reporte_prov data across all ventas
    const aggregatedReporteProv = (() => {
        const reportes = ventas
            .map(v => v.reportecalidadexportador?.reportecalidadproveedor)
            .filter(Boolean);

        if (reportes.length === 0) return null;

        const totalPagar = reportes.reduce((sum, r) => sum + (Number(r?.p_total_pagar) || 0), 0);
        const totalUtilidad = reportes.reduce((sum, r) => sum + (Number(r?.p_utilidad) || 0), 0);

        return {
            estado: allReportesProvCompleted ? 'Completado' : 'En Proceso',
            factura: reportes.length === 1 ? reportes[0]?.factura_prov : `${reportes.filter(r => r?.factura_prov).length}/${reportes.length} facturas`,
            totalPagar: totalPagar,
            utilidad: totalUtilidad,
            completado: allReportesProvCompleted,
            count: reportes.length
        };
    })();

    const steps = [
        {
            id: 'compra',
            label: 'Compra Nacional',
            icon: ShoppingCart,
            date: data.fecha_compra,
            status: 'completed' as const,
            color: 'emerald',
            summary: `${data.proveedor_nombre}`,
            details: {
                guia: data.numero_guia,
                proveedor: data.proveedor_nombre,
                fruta: data.fruta_nombre,
                peso: data.peso_compra,
                precio: data.precio_compra_exp
            }
        },
        {
            id: 'venta',
            label: 'Venta Nacional',
            icon: Store,
            date: firstVenta?.fecha_llegada,
            status: hasVentas ? 'completed' as const : 'current' as const,
            color: 'blue',
            summary: hasVentas ? (ventas.length > 1 ? `${ventas.length} Ventas` : exportadorNames) : 'Pendiente',
            details: hasVentas ? {
                exportador: exportadorNames,
                pesoRecibido: totalPesoRecibido,
                llegada: firstVenta?.fecha_llegada,
                vencimiento: firstVenta?.fecha_vencimiento,
                diferenciaPeso: totalPesoRecibido - data.peso_compra
            } : null
        },
        {
            id: 'reporte_exp',
            label: 'Reporte Exportador',
            icon: FileOutput,
            date: firstReporteExp?.fecha_reporte,
            status: allReportesExp
                ? 'completed' as const
                : (anyReporteExp ? 'current' as const : (hasVentas ? 'current' as const : 'pending' as const)),
            color: 'indigo',
            summary: allReportesExp
                ? `${ventas.length} Reportes`
                : (anyReporteExp ? 'Parcial' : 'Pendiente'),
            // Use aggregated data instead of first reporte
            details: aggregatedReporteExp
        },
        {
            id: 'reporte_prov',
            label: 'Reporte Proveedor',
            icon: FileCheck,
            date: firstReporteProv?.p_fecha_reporte,
            status: allReportesProvCompleted
                ? 'completed' as const
                : (anyReporteProv
                    ? 'current' as const
                    : (anyReporteExp ? 'current' as const : 'pending' as const)),
            color: 'purple',
            summary: allReportesProvCompleted
                ? 'Completado'
                : (anyReporteProv ? 'En Proceso' : 'Pendiente'),
            // Use aggregated data instead of first reporte
            details: aggregatedReporteProv
        }
    ];

    const getStatusStyles = (status: 'completed' | 'current' | 'pending', color: string) => {
        if (status === 'completed') {
            return {
                circle: `bg-gradient-to-br from-${color}-400 to-${color}-600 text-white shadow-lg shadow-${color}-200/50`,
                label: `text-${color}-700`,
                connector: `bg-gradient-to-r from-${color}-400 to-${color}-500`
            };
        }
        if (status === 'current') {
            return {
                circle: `bg-white border-2 border-${color}-500 text-${color}-600 ring-4 ring-${color}-100 animate-pulse`,
                label: `text-${color}-600 font-bold`,
                connector: 'bg-slate-200'
            };
        }
        return {
            circle: 'bg-slate-100 border-2 border-slate-200 text-slate-400',
            label: 'text-slate-400',
            connector: 'bg-slate-200'
        };
    };

    // Calculate overall progress
    const calculateProgress = () => {
        if (allReportesProvCompleted) return 100;
        if (anyReporteProv) return 85;
        if (anyReporteExp) return 65;
        if (hasVentas) return 40;
        return 15;
    };

    return (
        <div className="w-full">
            {/* Progress Overview Bar */}
            <div className="mb-6 px-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500">Progreso del Proceso</span>
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-xs font-bold",
                            calculateProgress() === 100 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                calculateProgress() >= 65 ? "bg-blue-50 text-blue-700 border-blue-200" :
                                    "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                    >
                        {calculateProgress()}% Completado
                    </Badge>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-700 ease-out",
                            calculateProgress() === 100 ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
                                calculateProgress() >= 65 ? "bg-gradient-to-r from-blue-400 to-indigo-500" :
                                    "bg-gradient-to-r from-amber-400 to-orange-500"
                        )}
                        style={{ width: `${calculateProgress()}%` }}
                    />
                </div>
            </div>

            {/* Timeline Steps */}
            <div className="relative px-4">
                {/* Connector Line */}
                <div className="absolute top-8 left-[12%] right-[12%] h-1 bg-slate-100 rounded-full z-0" />
                <div
                    className="absolute top-8 left-[12%] h-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-500 rounded-full z-0 transition-all duration-700"
                    style={{
                        width: calculateProgress() >= 85 ? '76%' :
                            calculateProgress() >= 65 ? '50%' :
                                calculateProgress() >= 40 ? '25%' : '0%'
                    }}
                />

                <div className="flex justify-between items-start relative z-10">
                    {steps.map((step, index) => {
                        const StepIcon = step.icon;
                        const isCompleted = step.status === 'completed';
                        const isCurrent = step.status === 'current';
                        const isPending = step.status === 'pending';

                        return (
                            <div key={step.id} className="flex flex-col items-center flex-1 group">
                                {/* Step Circle */}
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 cursor-pointer relative",
                                    isCompleted && "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-200/60 hover:shadow-emerald-300/80 hover:scale-105",
                                    isCurrent && "bg-white border-2 border-blue-500 text-blue-600 shadow-lg shadow-blue-100/80 ring-4 ring-blue-50",
                                    isPending && "bg-slate-100 border-2 border-slate-200 text-slate-400 hover:border-slate-300"
                                )}>
                                    {isCompleted ? (
                                        <Check className="h-7 w-7" strokeWidth={2.5} />
                                    ) : isCurrent ? (
                                        <div className="relative">
                                            <StepIcon className="h-6 w-6" />
                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                                        </div>
                                    ) : (
                                        <StepIcon className="h-6 w-6" />
                                    )}
                                </div>

                                {/* Step Label */}
                                <h4 className={cn(
                                    "text-sm font-semibold text-center mb-1 transition-colors",
                                    isCompleted && "text-emerald-700",
                                    isCurrent && "text-blue-700",
                                    isPending && "text-slate-400"
                                )}>
                                    {step.label}
                                </h4>

                                {/* Date Badge */}
                                <div className={cn(
                                    "text-xs font-mono px-2 py-0.5 rounded-md mb-2",
                                    isCompleted && "bg-emerald-50 text-emerald-600 border border-emerald-100",
                                    isCurrent && "bg-blue-50 text-blue-600 border border-blue-100",
                                    isPending && "bg-slate-50 text-slate-400 border border-slate-100"
                                )}>
                                    {step.date || '--/--/----'}
                                </div>

                                {/* Summary Badge */}
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-xs font-normal max-w-[120px] truncate",
                                        isCompleted && "bg-white text-emerald-600 border-emerald-200",
                                        isCurrent && "bg-white text-blue-600 border-blue-200",
                                        isPending && "bg-white text-slate-400 border-slate-200"
                                    )}
                                >
                                    {step.summary}
                                </Badge>

                                {/* Hover Card */}
                                <div className="absolute top-full mt-4 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform translate-y-2 group-hover:translate-y-0 text-left">
                                    {/* Arrow */}
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-slate-200 transform rotate-45" />

                                    <div className={cn(
                                        "flex items-center gap-2 pb-3 mb-3 border-b",
                                        isCompleted && "border-emerald-100",
                                        isCurrent && "border-blue-100",
                                        isPending && "border-slate-100"
                                    )}>
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center",
                                            isCompleted && "bg-emerald-100 text-emerald-600",
                                            isCurrent && "bg-blue-100 text-blue-600",
                                            isPending && "bg-slate-100 text-slate-400"
                                        )}>
                                            <StepIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-sm text-slate-800">{step.label}</h5>
                                            <span className={cn(
                                                "text-xs",
                                                isCompleted && "text-emerald-600",
                                                isCurrent && "text-blue-600",
                                                isPending && "text-slate-400"
                                            )}>
                                                {isCompleted ? '✓ Completado' : isCurrent ? '◉ En Proceso' : '○ Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {step.id === 'compra' && (
                                            <>
                                                <InfoRow icon={<Package className="h-3.5 w-3.5" />} label="Guía" value={data.numero_guia} />
                                                <InfoRow icon={<Truck className="h-3.5 w-3.5" />} label="Proveedor" value={data.proveedor_nombre} />
                                                <InfoRow label="Fruta" value={data.fruta_nombre} highlight />
                                                <InfoRow label="Peso" value={`${data.peso_compra?.toLocaleString()} Kg`} mono />
                                                <InfoRow icon={<DollarSign className="h-3.5 w-3.5" />} label="Precio/Kg" value={`$${data.precio_compra_exp?.toLocaleString()}`} mono accent />
                                            </>
                                        )}

                                        {step.id === 'venta' && hasVentas && (
                                            <>
                                                <InfoRow label="Exportador" value={exportadorNames} />
                                                <InfoRow label="Peso Recibido" value={`${totalPesoRecibido.toLocaleString()} Kg`} mono />
                                                <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Llegada" value={firstVenta?.fecha_llegada} />
                                                <InfoRow label="Vencimiento" value={firstVenta?.fecha_vencimiento} />
                                                {(totalPesoRecibido - data.peso_compra) !== 0 && (
                                                    <InfoRow
                                                        label="Diferencia Peso"
                                                        value={`${(totalPesoRecibido - data.peso_compra).toLocaleString()} Kg`}
                                                        mono
                                                        accent={(totalPesoRecibido - data.peso_compra) < 0}
                                                    />
                                                )}
                                            </>
                                        )}

                                        {step.id === 'reporte_exp' && aggregatedReporteExp && (
                                            <>
                                                <InfoRow label="Remisión" value={aggregatedReporteExp.remision || 'Sin remisión'} />
                                                <div className="flex gap-2 my-2">
                                                    <div className="flex-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-center">
                                                        <div className="text-lg font-bold">{aggregatedReporteExp.porcExp}%</div>
                                                        <div className="text-[10px] uppercase font-medium">Exportación</div>
                                                    </div>
                                                    <div className="flex-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-center">
                                                        <div className="text-lg font-bold">{aggregatedReporteExp.porcNal}%</div>
                                                        <div className="text-[10px] uppercase font-medium">Nacional</div>
                                                    </div>
                                                    <div className="flex-1 bg-slate-50 text-slate-600 px-2 py-1 rounded-lg text-center">
                                                        <div className="text-lg font-bold">{aggregatedReporteExp.porcMerma}%</div>
                                                        <div className="text-[10px] uppercase font-medium">Merma</div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
                                                    <span className="text-xs font-bold text-slate-600">Total Factura:</span>
                                                    <span className="text-sm font-bold text-emerald-600 font-mono">${aggregatedReporteExp.total.toLocaleString()}</span>
                                                </div>
                                            </>
                                        )}

                                        {step.id === 'reporte_prov' && aggregatedReporteProv && (
                                            <>
                                                <InfoRow label="Estado" value={aggregatedReporteProv.estado} highlight />
                                                <InfoRow label="Factura Prov" value={aggregatedReporteProv.factura || 'Pendiente'} />
                                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed border-slate-200">
                                                    <span className="text-xs font-bold text-slate-600">Total a Pagar:</span>
                                                    <span className="text-sm font-bold text-blue-600 font-mono">${aggregatedReporteProv.totalPagar.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-600">Utilidad:</span>
                                                    <span className={cn(
                                                        "text-sm font-bold font-mono",
                                                        aggregatedReporteProv.utilidad >= 0 ? "text-emerald-600" : "text-red-600"
                                                    )}>
                                                        ${aggregatedReporteProv.utilidad.toLocaleString()}
                                                    </span>
                                                </div>
                                                {aggregatedReporteProv.completado && (
                                                    <div className="mt-2 bg-emerald-50 text-emerald-700 text-center py-1.5 rounded-lg text-xs font-bold">
                                                        ✓ PROCESO COMPLETADO
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {!step.details && (
                                            <div className="text-center py-4 text-slate-400 text-sm italic">
                                                Pendiente de registro
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Helper component for info rows in hover cards
function InfoRow({
    icon,
    label,
    value,
    mono,
    highlight,
    accent
}: {
    icon?: React.ReactNode;
    label: string;
    value: string | undefined;
    mono?: boolean;
    highlight?: boolean;
    accent?: boolean;
}) {
    return (
        <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
                {icon}
                {label}:
            </span>
            <span className={cn(
                "font-medium truncate max-w-[140px]",
                mono && "font-mono",
                highlight && "text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded",
                accent && "text-emerald-600"
            )}>
                {value || '-'}
            </span>
        </div>
    );
}
