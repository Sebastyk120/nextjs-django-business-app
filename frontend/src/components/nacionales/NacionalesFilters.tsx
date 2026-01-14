"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, RotateCcw, User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NacionalesFilterState {
    search: string;
    proveedorSearch: string;
    remisionSearch: string;
    estadoReporteExp: string | null;
    estadoFacturacionExp: string | null;
    estadoReporteProv: string | null;
}

interface NacionalesFiltersProps {
    filters: NacionalesFilterState;
    onFiltersChange: (filters: NacionalesFilterState) => void;
    onClear: () => void;
}

// Estados de VentaNacional.estado_venta
const estadosVentaExp = [
    { value: "Pendiente", label: "Pendiente" },
    { value: "Vencido", label: "Vencido" },
    { value: "Completado", label: "Completado" },
];

// Estados de ReporteCalidadExportador.estado_reporte_exp (o null si no existe)
const estadosReporteExp = [
    { value: "Sin reporte Exportador", label: "Sin reporte Exportador" },
    { value: "Pendiente", label: "Pendiente" },
    { value: "Facturado", label: "Facturado" },
];

// Estados de ReporteCalidadProveedor.estado_reporte_prov
const estadosReporteProv = [
    { value: "En Proceso", label: "En Proceso" },
    { value: "Reporte Enviado", label: "Reporte Enviado" },
    { value: "Facturado", label: "Facturado" },
    { value: "Pagado", label: "Pagado" },
    { value: "Completado", label: "Completado" },
];

export function NacionalesFilters({ filters, onFiltersChange, onClear }: NacionalesFiltersProps) {

    const updateFilter = (key: keyof NacionalesFilterState, value: string | null) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const hasActiveFilters =
        filters.proveedorSearch ||
        filters.remisionSearch ||
        filters.estadoReporteExp ||
        filters.estadoFacturacionExp ||
        filters.estadoReporteProv;

    return (
        <div className="space-y-4">
            {/* Text Search Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        Buscar por Proveedor:
                    </Label>
                    <Input
                        placeholder="Escriba para filtrar por proveedor..."
                        className="h-9"
                        value={filters.proveedorSearch}
                        onChange={(e) => updateFilter("proveedorSearch", e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Buscar por Remisión/Reporte:
                    </Label>
                    <Input
                        placeholder="Escriba para filtrar por remisión/reporte..."
                        className="h-9"
                        value={filters.remisionSearch}
                        onChange={(e) => updateFilter("remisionSearch", e.target.value)}
                    />
                </div>
            </div>

            {/* Toggle Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Estado Venta (Exportador) - VentaNacional.estado_venta */}
                <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-500">Estado Venta (Exportador):</Label>
                    <div className="flex flex-wrap gap-1.5">
                        {estadosVentaExp.map((estado) => (
                            <button
                                key={estado.value}
                                onClick={() => updateFilter("estadoReporteExp", filters.estadoReporteExp === estado.value ? null : estado.value)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md border transition-all",
                                    filters.estadoReporteExp === estado.value
                                        ? "bg-slate-800 text-white border-slate-800"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                )}
                            >
                                {estado.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Estado Reporte (Exportador) - ReporteCalidadExportador.estado_reporte_exp */}
                <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-500">Estado Reporte (Exportador):</Label>
                    <div className="flex flex-wrap gap-1.5">
                        {estadosReporteExp.map((estado) => (
                            <button
                                key={estado.value}
                                onClick={() => updateFilter("estadoFacturacionExp", filters.estadoFacturacionExp === estado.value ? null : estado.value)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md border transition-all",
                                    filters.estadoFacturacionExp === estado.value
                                        ? "bg-slate-800 text-white border-slate-800"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                )}
                            >
                                {estado.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Estado Reporte (Proveedor) */}
                <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-500">Estado Reporte (Proveedor):</Label>
                    <div className="flex flex-wrap gap-1.5">
                        {estadosReporteProv.map((estado) => (
                            <button
                                key={estado.value}
                                onClick={() => updateFilter("estadoReporteProv", filters.estadoReporteProv === estado.value ? null : estado.value)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md border transition-all",
                                    filters.estadoReporteProv === estado.value
                                        ? "bg-slate-800 text-white border-slate-800"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                )}
                            >
                                {estado.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="outline"
                        onClick={onClear}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restablecer Filtros
                    </Button>
                </div>
            )}
        </div>
    );
}
