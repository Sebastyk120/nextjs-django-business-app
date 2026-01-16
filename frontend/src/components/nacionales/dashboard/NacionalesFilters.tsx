"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, RefreshCw, FilterX, FileText } from "lucide-react";
import Link from "next/link";
import { FilterOption, DashboardNacionalesFilters } from "@/types/nacionales-dashboard";

interface NacionalesFiltersProps {
    filters: DashboardNacionalesFilters;
    proveedores: FilterOption[];
    frutas: FilterOption[];
    onFilterChange: (key: string, value: string) => void;
    onRefresh: () => void;
    onReset: () => void;
    loading?: boolean;
}

export function NacionalesFilters({
    filters,
    proveedores,
    frutas,
    onFilterChange,
    onRefresh,
    onReset,
    loading
}: NacionalesFiltersProps) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-slate-500" />
                    Filtros de Análisis
                </h3>
                <div className="flex gap-2">
                    {filters.proveedor_id && (
                        <Link href={`/nacionales/resumen-reportes/${filters.proveedor_id}`}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                            >
                                <FileText className="h-3 w-3 mr-1" />
                                Ver Resumen Reportes
                            </Button>
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        className="h-8 text-xs text-slate-500 hover:text-slate-800"
                    >
                        <FilterX className="h-3 w-3 mr-1" />
                        Limpiar
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={loading}
                        className="h-8 text-xs bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    >
                        <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="fecha_inicio" className="text-xs text-slate-500">Fecha Inicio</Label>
                    <Input
                        id="fecha_inicio"
                        type="date"
                        value={filters.fecha_inicio || ""}
                        onChange={(e) => onFilterChange("fecha_inicio", e.target.value)}
                        className="h-9 text-sm bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                </div>

                <div className="space-y-1">
                    <Label htmlFor="fecha_fin" className="text-xs text-slate-500">Fecha Fin</Label>
                    <Input
                        id="fecha_fin"
                        type="date"
                        value={filters.fecha_fin || ""}
                        onChange={(e) => onFilterChange("fecha_fin", e.target.value)}
                        className="h-9 text-sm bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                </div>

                <div className="space-y-1">
                    <Label htmlFor="proveedor" className="text-xs text-slate-500">Proveedor</Label>
                    <Select
                        value={filters.proveedor_id || "all"}
                        onValueChange={(value) => onFilterChange("proveedor_id", value === "all" ? "" : value)}
                    >
                        <SelectTrigger className="h-9 text-sm bg-white border-slate-200">
                            <SelectValue placeholder="Todos los proveedores" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los proveedores</SelectItem>
                            {proveedores.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                    {p.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="fruta" className="text-xs text-slate-500">Fruta</Label>
                    <Select
                        value={filters.fruta_id || "all"}
                        onValueChange={(value) => onFilterChange("fruta_id", value === "all" ? "" : value)}
                    >
                        <SelectTrigger className="h-9 text-sm bg-white border-slate-200">
                            <SelectValue placeholder="Todas las frutas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las frutas</SelectItem>
                            {frutas.map((f) => (
                                <SelectItem key={f.id} value={f.id.toString()}>
                                    {f.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
