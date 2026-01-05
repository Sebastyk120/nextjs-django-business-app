"use client";

import { useMemo } from "react";
import { CompraNacional } from "@/types/nacionales";
import { NacionalesFilterState } from "./NacionalesFilters";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface IncompletePurchasesTableProps {
    data: CompraNacional[];
    filters: NacionalesFilterState;
    onSelect: (compra: CompraNacional) => void;
}

export function IncompletePurchasesTable({ data, filters, onSelect }: IncompletePurchasesTableProps) {

    // Apply filters
    const filteredData = useMemo(() => {
        return data.filter((compra) => {
            // Provider search
            if (filters.proveedorSearch &&
                !compra.proveedor_nombre?.toLowerCase().includes(filters.proveedorSearch.toLowerCase())) {
                return false;
            }

            // Remision/Reporte search
            if (filters.remisionSearch) {
                const remision = compra.ventanacional?.reportecalidadexportador?.remision_exp || "";
                if (!remision.toLowerCase().includes(filters.remisionSearch.toLowerCase())) {
                    return false;
                }
            }

            // Estado Reporte Exportador
            if (filters.estadoReporteExp && compra.estado_reporte_exp !== filters.estadoReporteExp) {
                return false;
            }

            // Estado Facturación Exportador
            if (filters.estadoFacturacionExp && compra.estado_facturacion_exp !== filters.estadoFacturacionExp) {
                return false;
            }

            // Estado Reporte Proveedor
            if (filters.estadoReporteProv && compra.estado_reporte_prov !== filters.estadoReporteProv) {
                return false;
            }

            return true;
        });
    }, [data, filters]);

    const getProgressColor = (porcentaje: number) => {
        if (porcentaje === 100) return "bg-emerald-500";
        if (porcentaje >= 75) return "bg-blue-500";
        if (porcentaje >= 50) return "bg-yellow-500";
        return "bg-red-500";
    };

    const getEstadoExpBadgeClass = (estado: string | null | undefined) => {
        if (!estado) return "bg-slate-100 text-slate-500";
        switch (estado) {
            case "Completado": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "Vencido": return "bg-red-100 text-red-700 border-red-200";
            case "Pendiente": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            default: return "bg-slate-100 text-slate-600";
        }
    };

    const getEstadoFacturacionBadgeClass = (estado: string | null | undefined) => {
        if (!estado) return "bg-slate-100 text-slate-500";
        switch (estado) {
            case "Facturado": return "bg-blue-100 text-blue-700 border-blue-200";
            case "Pendiente": return "bg-amber-100 text-amber-700 border-amber-200";
            default: return "bg-slate-100 text-slate-600";
        }
    };

    const getEstadoProvBadgeClass = (estado: string | null | undefined) => {
        if (!estado) return "bg-slate-100 text-slate-500";
        switch (estado) {
            case "Pagado": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "Facturado": return "bg-blue-100 text-blue-700 border-blue-200";
            case "Reporte Enviado": return "bg-purple-100 text-purple-700 border-purple-200";
            case "En Proceso": return "bg-orange-100 text-orange-700 border-orange-200";
            default: return "bg-slate-100 text-slate-600";
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Procesos Incompletos
                </h3>
                <Badge variant="secondary" className="bg-white">
                    {filteredData.length} de {data.length} registros
                </Badge>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="w-[110px] font-semibold text-slate-700">Número Guía</TableHead>
                            <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                            <TableHead className="font-semibold text-slate-700">Remision/Reporte</TableHead>
                            <TableHead className="font-semibold text-slate-700">Fecha Compra</TableHead>
                            <TableHead className="font-semibold text-slate-700">Fruta</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right">Peso Bruto Guia/Compra</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-center">Estado Reporte (Exportador)</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-center italic">Estado Facturación Reporte (Exportador)</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-center">Estado Reporte (Proveedor)</TableHead>
                            <TableHead className="w-[130px] font-semibold text-slate-700 text-center">Progreso</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center h-32 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <FileText className="h-8 w-8 text-slate-300" />
                                        <p>No hay registros que coincidan con los filtros.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((compra) => (
                                <TableRow
                                    key={compra.id}
                                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                                    onClick={() => onSelect(compra)}
                                >
                                    <TableCell className="font-medium text-blue-600 hover:underline">
                                        {compra.numero_guia}
                                    </TableCell>
                                    <TableCell className="text-slate-700">{compra.proveedor_nombre}</TableCell>
                                    <TableCell className="text-slate-600 text-sm">
                                        {compra.ventanacional?.reportecalidadexportador?.remision_exp ||
                                            (compra.ventanacional ? "Pendiente" : "Sin Remision")}
                                    </TableCell>
                                    <TableCell className="text-slate-600">{compra.fecha_compra}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-normal bg-lime-50 text-lime-700 border-lime-200">
                                            {compra.fruta_nombre}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-slate-700">
                                        {compra.peso_compra?.toLocaleString() ?? 0}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant="outline"
                                            className={cn("text-xs", getEstadoExpBadgeClass(compra.estado_reporte_exp))}
                                        >
                                            {compra.estado_reporte_exp || "Sin Reporte"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant="outline"
                                            className={cn("text-xs italic", getEstadoFacturacionBadgeClass(compra.estado_facturacion_exp))}
                                        >
                                            {compra.estado_facturacion_exp || "Pendiente"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant="outline"
                                            className={cn("text-xs", getEstadoProvBadgeClass(compra.estado_reporte_prov))}
                                        >
                                            {compra.estado_reporte_prov || "Sin reporte Proveedor"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(compra.porcentaje_completitud)}`}
                                                    style={{ width: `${compra.porcentaje_completitud}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-slate-600 w-10 text-right">
                                                {Math.round(compra.porcentaje_completitud)}%
                                            </span>
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
