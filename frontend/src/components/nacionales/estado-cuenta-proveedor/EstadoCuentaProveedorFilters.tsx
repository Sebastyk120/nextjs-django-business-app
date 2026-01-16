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
import { Calendar as CalendarIcon, RefreshCw, FilterX } from "lucide-react";
import { ProveedorNacional, EstadoCuentaProveedorFilters as FiltersType } from "@/types/nacionales";
import { DateTimePicker } from "@/components/comercial/DateTimePicker";

interface EstadoCuentaProveedorFiltersProps {
    filters: FiltersType;
    proveedores: ProveedorNacional[];
    currentProveedorId: number;
    onFilterChange: (key: string, value: string) => void;
    onProveedorChange: (proveedorId: number) => void;
    onRefresh: () => void;
    onReset: () => void;
    loading?: boolean;
}

export function EstadoCuentaProveedorFilters({
    filters,
    proveedores,
    currentProveedorId,
    onFilterChange,
    onProveedorChange,
    onRefresh,
    onReset,
    loading
}: EstadoCuentaProveedorFiltersProps) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-slate-500" />
                    Filtros de Estado de Cuenta
                </h3>
                <div className="flex gap-2">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="proveedor" className="text-xs text-slate-500">Proveedor</Label>
                    <Select
                        value={currentProveedorId.toString()}
                        onValueChange={(value) => onProveedorChange(parseInt(value))}
                    >
                        <SelectTrigger className="h-9 text-sm bg-white border-slate-200">
                            <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                            {proveedores.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                    {p.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="fecha_inicio" className="text-xs text-slate-500">Fecha Inicio</Label>
                    <DateTimePicker
                        value={filters.fecha_inicio || ""}
                        onChange={(val) => onFilterChange("fecha_inicio", val)}
                        showTime={false}
                    />
                </div>

                <div className="space-y-1">
                    <Label htmlFor="fecha_fin" className="text-xs text-slate-500">Fecha Fin</Label>
                    <DateTimePicker
                        value={filters.fecha_fin || ""}
                        onChange={(val) => onFilterChange("fecha_fin", val)}
                        showTime={false}
                    />
                </div>
            </div>
        </div>
    );
}
