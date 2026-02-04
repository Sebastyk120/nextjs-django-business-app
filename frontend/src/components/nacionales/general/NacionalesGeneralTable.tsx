"use client";

import { useMemo } from "react";
import { CompraNacional } from "@/types/nacionales";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    FileText,
    ArrowRight,
    Package,
    Calendar,
    User,
    Scale,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    ExternalLink
} from "lucide-react";
import { useRouter } from "next/navigation";

interface NacionalesGeneralTableProps {
    data: CompraNacional[];
    isLoading?: boolean;
}

export function NacionalesGeneralTable({ data, isLoading }: NacionalesGeneralTableProps) {
    const router = useRouter();

    const getProgressColor = (porcentaje: number) => {
        if (porcentaje === 100) return "bg-emerald-500";
        if (porcentaje >= 75) return "bg-blue-500";
        if (porcentaje >= 50) return "bg-amber-500";
        return "bg-red-500";
    };

    const getProgressBgColor = (porcentaje: number) => {
        if (porcentaje === 100) return "bg-emerald-100";
        if (porcentaje >= 75) return "bg-blue-100";
        if (porcentaje >= 50) return "bg-amber-100";
        return "bg-red-100";
    };

    const getProgressTextColor = (porcentaje: number) => {
        if (porcentaje === 100) return "text-emerald-700";
        if (porcentaje >= 75) return "text-blue-700";
        if (porcentaje >= 50) return "text-amber-700";
        return "text-red-700";
    };

    const getEstadoExpBadgeClass = (estado: string | null | undefined) => {
        if (!estado) return "bg-slate-100 text-slate-500 border-slate-200";
        switch (estado) {
            case "Completado": return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "Vencido": return "bg-red-50 text-red-700 border-red-200";
            case "Pendiente": return "bg-amber-50 text-amber-700 border-amber-200";
            case "Facturado": return "bg-blue-50 text-blue-700 border-blue-200";
            default: return "bg-slate-50 text-slate-600 border-slate-200";
        }
    };

    const getEstadoProvBadgeClass = (estado: string | null | undefined) => {
        if (!estado) return "bg-slate-100 text-slate-500 border-slate-200";
        switch (estado) {
            case "Pagado": return "bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm";
            case "Facturado": return "bg-blue-50 text-blue-700 border-blue-200";
            case "Reporte Enviado": return "bg-purple-50 text-purple-700 border-purple-200";
            case "En Proceso": return "bg-orange-50 text-orange-700 border-orange-200";
            default: return "bg-slate-50 text-slate-600 border-slate-200";
        }
    };

    const getEstadoIcon = (estado: string | null | undefined) => {
        if (!estado) return null;
        switch (estado) {
            case "Completado": return <CheckCircle2 className="h-3 w-3 mr-1" />;
            case "Vencido": return <AlertCircle className="h-3 w-3 mr-1" />;
            case "Pendiente": return <Clock className="h-3 w-3 mr-1" />;
            default: return null;
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8">
                    <div className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-blue-500" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-slate-300" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">Cargando procesos...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table Header Info */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                            <Package className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-900">Procesos Incompletos</h3>
                            <p className="text-xs text-slate-500">{data.length} {data.length === 1 ? 'registro encontrado' : 'registros encontrados'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80 hover:bg-slate-50 border-slate-100">
                            <TableHead className="w-[130px] font-semibold text-slate-700 py-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-slate-400" />
                                    No. Guía
                                </div>
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700 py-4">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-400" />
                                    Proveedor
                                </div>
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700 py-4 text-xs uppercase tracking-wider text-muted-foreground">
                                Remisión Exp
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700 py-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    Fecha
                                </div>
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700 py-4">Fruta</TableHead>
                            <TableHead className="font-semibold text-slate-700 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Scale className="h-4 w-4 text-slate-400" />
                                    Peso (Kg)
                                </div>
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700 py-4 text-center">Estado Exportador</TableHead>
                            <TableHead className="font-semibold text-slate-700 py-4 text-center">Estado Proveedor</TableHead>
                            <TableHead className="w-[160px] font-semibold text-slate-700 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-slate-400" />
                                    Progreso
                                </div>
                            </TableHead>
                            <TableHead className="w-[60px] py-4"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center h-80">
                                    <div className="flex flex-col items-center justify-center gap-4">
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <Package className="h-12 w-12 text-slate-300" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-base font-semibold text-slate-700">No hay registros encontrados</div>
                                            <p className="text-sm text-slate-400 max-w-xs">
                                                Intenta ajustar los filtros de búsqueda o verifica que existan procesos en el sistema
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((compra, index) => (
                                <TableRow
                                    key={compra.id}
                                    className={cn(
                                        "hover:bg-slate-50/80 transition-all duration-200 group cursor-pointer border-slate-100",
                                        index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                                    )}
                                    onClick={() => router.push(`/nacionales-detallada?search=${encodeURIComponent(compra.numero_guia)}`)}
                                >
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors bg-slate-100 group-hover:bg-blue-50 px-2.5 py-1 rounded-lg text-sm">
                                                {compra.numero_guia}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-800 font-medium text-sm">{compra.proveedor_nombre}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <span className="text-slate-500 text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                                            {compra.remision_exp || "—"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                            <span className="text-slate-600 text-sm whitespace-nowrap">
                                                {new Date(compra.fecha_compra).toLocaleDateString('es-CO', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 text-xs font-semibold border border-slate-200">
                                            {compra.fruta_nombre}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4 text-right">
                                        <span className="font-mono text-slate-700 text-sm font-medium">
                                            {compra.peso_compra?.toLocaleString('es-CO')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4 text-center">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "px-3 py-1 text-[11px] font-medium min-w-[100px] justify-center rounded-lg",
                                                getEstadoExpBadgeClass(compra.estado_reporte_exp)
                                            )}
                                        >
                                            <span className="flex items-center">
                                                {getEstadoIcon(compra.estado_reporte_exp)}
                                                {compra.estado_reporte_exp || "Pendiente"}
                                            </span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4 text-center">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "px-3 py-1 text-[11px] font-medium min-w-[100px] justify-center rounded-lg",
                                                getEstadoProvBadgeClass(compra.estado_reporte_prov)
                                            )}
                                        >
                                            {compra.estado_reporte_prov || "Pendiente"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col gap-2 px-2">
                                            <div className="flex justify-between items-center">
                                                <span className={cn(
                                                    "text-xs font-bold",
                                                    getProgressTextColor(compra.porcentaje_completitud)
                                                )}>
                                                    {Math.round(compra.porcentaje_completitud)}%
                                                </span>
                                                {compra.porcentaje_completitud === 100 && (
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                )}
                                            </div>
                                            <div className={cn(
                                                "h-2 w-full rounded-full overflow-hidden",
                                                getProgressBgColor(compra.porcentaje_completitud)
                                            )}>
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-700 ease-out",
                                                        getProgressColor(compra.porcentaje_completitud)
                                                    )}
                                                    style={{ width: `${compra.porcentaje_completitud}%` }}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex items-center justify-center">
                                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-200">
                                                <ExternalLink className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
