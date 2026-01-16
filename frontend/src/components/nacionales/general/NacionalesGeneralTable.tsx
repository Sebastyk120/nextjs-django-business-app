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
import { FileText, ArrowRight } from "lucide-react";
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
        if (porcentaje >= 50) return "bg-yellow-500";
        return "bg-red-500";
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

    if (isLoading) {
        return (
            <div className="w-full h-64 flex items-center justify-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80 hover:bg-slate-50 border-slate-100">
                            <TableHead className="w-[120px] font-bold text-slate-700">No. Guía</TableHead>
                            <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider text-muted-foreground">Remisión Exp</TableHead>
                            <TableHead className="font-semibold text-slate-700">Fecha</TableHead>
                            <TableHead className="font-semibold text-slate-700">Fruta</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right">Peso (Kg)</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-center">Estado Exportador</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-center">Estado Proveedor</TableHead>
                            <TableHead className="w-[140px] font-semibold text-slate-700 text-center">Progreso</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center h-48 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="bg-slate-50 p-4 rounded-full">
                                            <FileText className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <div className="text-sm font-medium">No hay registros encontrados</div>
                                        <p className="text-xs text-slate-400">Intenta ajustar los filtros de búsqueda</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((compra) => (
                                <TableRow
                                    key={compra.id}
                                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer border-slate-100"
                                    onClick={() => router.push(`/nacionales-detallada?search=${encodeURIComponent(compra.numero_guia)}`)}
                                >
                                    <TableCell className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                        {compra.numero_guia}
                                    </TableCell>
                                    <TableCell className="text-slate-700 font-medium text-sm">
                                        {compra.proveedor_nombre}
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-xs font-mono">
                                        {compra.remision_exp || "—"}
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm whitespace-nowrap">
                                        {new Date(compra.fecha_compra).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                                            {compra.fruta_nombre}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-slate-700 text-sm">
                                        {compra.peso_compra?.toLocaleString('es-CO')}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant="outline"
                                            className={cn("px-2.5 py-0.5 text-[11px] font-medium min-w-[90px] justify-center", getEstadoExpBadgeClass(compra.estado_reporte_exp))}
                                        >
                                            {compra.estado_reporte_exp || "Pendiente"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant="outline"
                                            className={cn("px-2.5 py-0.5 text-[11px] font-medium min-w-[90px] justify-center", getEstadoProvBadgeClass(compra.estado_reporte_prov))}
                                        >
                                            {compra.estado_reporte_prov || "Pendiente"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5 px-2">
                                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                                                <span>{Math.round(compra.porcentaje_completitud)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(compra.porcentaje_completitud)}`}
                                                    style={{ width: `${compra.porcentaje_completitud}%` }}
                                                />
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
