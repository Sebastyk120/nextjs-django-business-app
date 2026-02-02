"use client";

import { CompraNacional } from "@/types/nacionales";
import { Check, Clock, ShoppingCart, Store, FileOutput, FileCheck, Package, DollarSign, Calendar, Truck, TrendingUp, Scale, ArrowRightCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface NacionalesTimelineProps {
    data: CompraNacional;
}

export function NacionalesTimeline({ data }: NacionalesTimelineProps) {

    // Aggregate data from all ventas
    const ventas = data.ventas || [];
    const hasVentas = ventas.length > 0;

    // Check if ANY venta has a ReporteExp
    const anyReporteExp = ventas.some(v => v.reportecalidadexportador);
    const allReportesExp = hasVentas && ventas.every(v => v.reportecalidadexportador);

    // Check if ANY venta has a ReporteProv
    const anyReporteProv = ventas.some(v => v.reportecalidadexportador?.reportecalidadproveedor);
    const allReportesProv = hasVentas && ventas.every(v => v.reportecalidadexportador?.reportecalidadproveedor);
    const allReportesProvCompleted = hasVentas && ventas.every(v => v.reportecalidadexportador?.reportecalidadproveedor?.completado);

    // Aggregate summary info
    const totalPesoRecibido = ventas.reduce((sum, v) => sum + (Number(v.peso_neto_recibido) || 0), 0);
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

    // Calculate overall progress
    const calculateProgress = () => {
        if (allReportesProvCompleted) return 100;
        if (anyReporteProv) return 85;
        if (anyReporteExp) return 65;
        if (hasVentas) return 40;
        return 15;
    };

    const progress = calculateProgress();

    const steps = [
        {
            id: 'compra',
            label: 'Compra Nacional',
            shortLabel: 'Compra',
            icon: ShoppingCart,
            date: data.fecha_compra,
            status: 'completed' as const,
            color: 'emerald',
            gradient: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            textColor: 'text-emerald-700',
            lightColor: 'text-emerald-600',
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
            shortLabel: 'Venta',
            icon: Store,
            date: firstVenta?.fecha_llegada,
            status: hasVentas ? 'completed' as const : 'current' as const,
            color: 'blue',
            gradient: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-700',
            lightColor: 'text-blue-600',
            summary: hasVentas ? (ventas.length > 1 ? `${ventas.length} Ventas` : exportadorNames) : 'Pendiente',
            details: hasVentas ? {
                exportador: exportadorNames,
                pesoRecibido: totalPesoRecibido,
                llegada: firstVenta?.fecha_llegada,
                vencimiento: firstVenta?.fecha_vencimiento,
                diferenciaPeso: totalPesoRecibido - Number(data.peso_compra || 0)
            } : null
        },
        {
            id: 'reporte_exp',
            label: 'Reporte Exportador',
            shortLabel: 'Rpt. Exp.',
            icon: FileOutput,
            date: firstReporteExp?.fecha_reporte,
            status: allReportesExp
                ? 'completed' as const
                : (anyReporteExp ? 'current' as const : (hasVentas ? 'current' as const : 'pending' as const)),
            color: 'indigo',
            gradient: 'from-indigo-500 to-indigo-600',
            bgColor: 'bg-indigo-50',
            borderColor: 'border-indigo-200',
            textColor: 'text-indigo-700',
            lightColor: 'text-indigo-600',
            summary: allReportesExp
                ? `${ventas.length} Reportes`
                : (anyReporteExp ? 'Parcial' : 'Pendiente'),
            details: aggregatedReporteExp
        },
        {
            id: 'reporte_prov',
            label: 'Reporte Proveedor',
            shortLabel: 'Rpt. Prov.',
            icon: FileCheck,
            date: firstReporteProv?.p_fecha_reporte,
            status: allReportesProvCompleted
                ? 'completed' as const
                : (anyReporteProv
                    ? 'current' as const
                    : (anyReporteExp ? 'current' as const : 'pending' as const)),
            color: 'purple',
            gradient: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            textColor: 'text-purple-700',
            lightColor: 'text-purple-600',
            summary: allReportesProvCompleted
                ? 'Completado'
                : (anyReporteProv ? 'En Proceso' : 'Pendiente'),
            details: aggregatedReporteProv
        }
    ];

    return (
        <div className="w-full space-y-6">
            {/* Progress Overview */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Progreso del Proceso</h3>
                                <p className="text-sm text-slate-400">Guía: <span className="font-mono text-slate-200">{data.numero_guia}</span></p>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-sm font-bold px-4 py-2 border-2",
                                progress === 100 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" :
                                    progress >= 65 ? "bg-blue-500/20 text-blue-300 border-blue-500/50" :
                                        "bg-amber-500/20 text-amber-300 border-amber-500/50"
                            )}
                        >
                            {progress}% Completado
                        </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative">
                        <div className="h-3 w-full bg-slate-700/50 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-1000 ease-out relative",
                                    progress === 100 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                                        progress >= 65 ? "bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400" :
                                            "bg-gradient-to-r from-amber-400 to-orange-400"
                                )}
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </div>
                        </div>

                        {/* Step indicators on progress bar */}
                        <div className="flex justify-between mt-2">
                            {steps.map((step, index) => {
                                const position = (index / (steps.length - 1)) * 100;
                                const isCompleted = step.status === 'completed';
                                const isCurrent = step.status === 'current';

                                return (
                                    <div
                                        key={step.id}
                                        className="flex flex-col items-center"
                                        style={{ position: 'absolute', left: `${position}%`, transform: 'translateX(-50%)' }}
                                    >
                                        <div className={cn(
                                            "w-3 h-3 rounded-full border-2 transition-all duration-300",
                                            isCompleted ? "bg-emerald-400 border-emerald-400" :
                                                isCurrent ? "bg-blue-400 border-blue-400 animate-pulse" :
                                                    "bg-slate-700 border-slate-600"
                                        )} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {steps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isCompleted = step.status === 'completed';
                    const isCurrent = step.status === 'current';
                    const isPending = step.status === 'pending';

                    return (
                        <Card
                            key={step.id}
                            className={cn(
                                "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2",
                                isCompleted ? `${step.bgColor} ${step.borderColor}` :
                                    isCurrent ? "bg-white border-blue-300 shadow-lg shadow-blue-100/50" :
                                        "bg-slate-50 border-slate-200 opacity-75"
                            )}
                        >
                            {/* Status Indicator Strip */}
                            <div className={cn(
                                "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
                                isCompleted ? step.gradient :
                                    isCurrent ? "from-blue-400 to-blue-600" :
                                        "from-slate-300 to-slate-400"
                            )} />

                            {/* Step Number Badge */}
                            <div className="absolute top-3 right-3">
                                <span className={cn(
                                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                                    isCompleted ? `bg-gradient-to-br ${step.gradient} text-white` :
                                        isCurrent ? "bg-blue-100 text-blue-600 ring-2 ring-blue-300" :
                                            "bg-slate-200 text-slate-500"
                                )}>
                                    {isCompleted ? <Check className="h-3.5 w-3.5" /> : index + 1}
                                </span>
                            </div>

                            <CardContent className="p-5 pt-6">
                                {/* Icon and Title */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                                        isCompleted ? `bg-gradient-to-br ${step.gradient} text-white shadow-lg` :
                                            isCurrent ? "bg-blue-100 text-blue-600 ring-2 ring-blue-200" :
                                                "bg-slate-200 text-slate-400"
                                    )}>
                                        <StepIcon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className={cn(
                                            "font-semibold text-sm leading-tight",
                                            isCompleted ? step.textColor :
                                                isCurrent ? "text-blue-700" :
                                                    "text-slate-500"
                                        )}>
                                            {step.label}
                                        </h4>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {step.date || 'Sin fecha'}
                                        </p>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="mb-3">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-xs font-medium",
                                            isCompleted ? `${step.bgColor} ${step.lightColor} ${step.borderColor}` :
                                                isCurrent ? "bg-blue-50 text-blue-600 border-blue-200" :
                                                    "bg-slate-100 text-slate-500 border-slate-200"
                                        )}
                                    >
                                        {isCompleted ? 'Completado' : isCurrent ? 'En Proceso' : 'Pendiente'}
                                    </Badge>
                                </div>

                                {/* Summary */}
                                <p className={cn(
                                    "text-sm font-medium truncate",
                                    isCompleted ? "text-slate-800" :
                                        isCurrent ? "text-slate-700" :
                                            "text-slate-400"
                                )}>
                                    {step.summary}
                                </p>

                                {/* Expanded Details */}
                                <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-2">
                                    {step.id === 'compra' && (
                                        <>
                                            <DetailRow icon={<Package className="h-3 w-3" />} label="Fruta" value={data.fruta_nombre} />
                                            <DetailRow icon={<Scale className="h-3 w-3" />} label="Peso" value={`${data.peso_compra?.toLocaleString()} Kg`} />
                                            <DetailRow icon={<DollarSign className="h-3 w-3" />} label="Precio" value={`$${data.precio_compra_exp?.toLocaleString()}`} accent />
                                        </>
                                    )}

                                    {step.id === 'venta' && hasVentas && (
                                        <>
                                            <DetailRow icon={<Truck className="h-3 w-3" />} label="Recibido" value={`${totalPesoRecibido.toLocaleString()} Kg`} />
                                            <DetailRow icon={<Calendar className="h-3 w-3" />} label="Llegada" value={firstVenta?.fecha_llegada} />
                                            <DetailRow
                                                icon={<ArrowRightCircle className="h-3 w-3" />}
                                                label="Diferencia"
                                                value={`${(totalPesoRecibido - Number(data.peso_compra || 0)).toLocaleString()} Kg`}
                                                accent={(totalPesoRecibido - Number(data.peso_compra || 0)) < 0}
                                            />
                                        </>
                                    )}

                                    {step.id === 'reporte_exp' && aggregatedReporteExp && (
                                        <>
                                            <div className="grid grid-cols-3 gap-1 text-center mb-2">
                                                <div className="bg-emerald-100 rounded p-1">
                                                    <div className="text-[10px] text-emerald-600 font-bold">EXP</div>
                                                    <div className="text-xs font-bold text-emerald-700">{aggregatedReporteExp.porcExp}%</div>
                                                </div>
                                                <div className="bg-blue-100 rounded p-1">
                                                    <div className="text-[10px] text-blue-600 font-bold">NAL</div>
                                                    <div className="text-xs font-bold text-blue-700">{aggregatedReporteExp.porcNal}%</div>
                                                </div>
                                                <div className="bg-slate-100 rounded p-1">
                                                    <div className="text-[10px] text-slate-600 font-bold">MER</div>
                                                    <div className="text-xs font-bold text-slate-700">{aggregatedReporteExp.porcMerma}%</div>
                                                </div>
                                            </div>
                                            <DetailRow label="Total" value={`$${aggregatedReporteExp.total.toLocaleString()}`} accent />
                                        </>
                                    )}

                                    {step.id === 'reporte_prov' && aggregatedReporteProv && (
                                        <>
                                            <DetailRow label="A Pagar" value={`$${aggregatedReporteProv.totalPagar.toLocaleString()}`} />
                                            <DetailRow
                                                label="Utilidad"
                                                value={`$${aggregatedReporteProv.utilidad.toLocaleString()}`}
                                                accent={aggregatedReporteProv.utilidad >= 0}
                                            />
                                            {aggregatedReporteProv.completado && (
                                                <div className="mt-2 bg-emerald-100 text-emerald-700 text-xs font-bold text-center py-1.5 rounded">
                                                    ✓ PROCESO COMPLETADO
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {isPending && (
                                        <div className="text-center py-2 text-slate-400 text-xs italic">
                                            Esperando etapa anterior...
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <QuickStat
                    label="Total Ventas"
                    value={ventas.length.toString()}
                    sublabel="registradas"
                    color="blue"
                />
                <QuickStat
                    label="Reportes Exp."
                    value={`${ventas.filter(v => v.reportecalidadexportador).length}/${ventas.length}`}
                    sublabel="completados"
                    color="indigo"
                />
                <QuickStat
                    label="Reportes Prov."
                    value={`${ventas.filter(v => v.reportecalidadexportador?.reportecalidadproveedor).length}/${ventas.length}`}
                    sublabel="generados"
                    color="purple"
                />
                <QuickStat
                    label="Estado General"
                    value={allReportesProvCompleted ? 'Completo' : 'En Proceso'}
                    sublabel={allReportesProvCompleted ? 'Todo finalizado' : 'Pendientes por hacer'}
                    color={allReportesProvCompleted ? 'emerald' : 'amber'}
                />
            </div>
        </div>
    );
}

// Helper component for detail rows
function DetailRow({
    icon,
    label,
    value,
    accent
}: {
    icon?: React.ReactNode;
    label: string;
    value: string | undefined;
    accent?: boolean;
}) {
    return (
        <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
                {icon}
                {label}
            </span>
            <span className={cn(
                "font-medium truncate max-w-[100px]",
                accent === true ? "text-emerald-600" :
                    accent === false ? "text-red-600" :
                        "text-slate-700"
            )}>
                {value || '-'}
            </span>
        </div>
    );
}

// Quick stat component
function QuickStat({
    label,
    value,
    sublabel,
    color
}: {
    label: string;
    value: string;
    sublabel: string;
    color: 'emerald' | 'blue' | 'indigo' | 'purple' | 'amber';
}) {
    const colorClasses = {
        emerald: 'from-emerald-500 to-emerald-600',
        blue: 'from-blue-500 to-blue-600',
        indigo: 'from-indigo-500 to-indigo-600',
        purple: 'from-purple-500 to-purple-600',
        amber: 'from-amber-500 to-amber-600',
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg", colorClasses[color])}>
                {value.charAt(0)}
            </div>
            <div>
                <div className="text-lg font-bold text-slate-800">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
                <div className="text-[10px] text-slate-400">{sublabel}</div>
            </div>
        </div>
    );
}
