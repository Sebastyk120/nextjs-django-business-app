"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { QualityFiltersState } from "@/types/quality-dashboard";

interface FilterOption {
    id: number;
    nombre: string;
}

interface QualityFiltersProps {
    onFilterChange: (filters: QualityFiltersState) => void;
    proveedores: FilterOption[];
    exportadores: FilterOption[];
    frutas: FilterOption[];
}

export function QualityFilters({ onFilterChange, proveedores, exportadores, frutas }: QualityFiltersProps) {
    const [filters, setFilters] = useState<QualityFiltersState>({});
    const [date, setDate] = useState<Date>();

    const handleFilterChange = (key: keyof QualityFiltersState, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        setFilters({});
        setDate(undefined);
        onFilterChange({});
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-medium">
                    <Filter className="h-5 w-5" />
                    <span>Filtros Globales</span>
                </div>
                {(Object.keys(filters).length > 0 || date) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4 mr-1" />
                        Limpiar
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Proveedor */}
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Proveedor</Label>
                    <Select
                        value={filters.proveedor}
                        onValueChange={(val) => handleFilterChange("proveedor", val)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {proveedores.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                    {p.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Exportador */}
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Exportador</Label>
                    <Select
                        value={filters.exportador}
                        onValueChange={(val) => handleFilterChange("exportador", val)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {exportadores.map((e) => (
                                <SelectItem key={e.id} value={e.id.toString()}>
                                    {e.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Fruta */}
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Fruta</Label>
                    <Select
                        value={filters.fruta}
                        onValueChange={(val) => handleFilterChange("fruta", val)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {frutas.map((f) => (
                                <SelectItem key={f.id} value={f.id.toString()}>
                                    {f.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Fechas */}
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Rango de Fechas</Label>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !filters.fecha_inicio && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filters.fecha_inicio ? format(filters.fecha_inicio, "dd/MM/yy") : "Inicio"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={filters.fecha_inicio}
                                    onSelect={(date) => handleFilterChange("fecha_inicio", date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !filters.fecha_fin && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filters.fecha_fin ? format(filters.fecha_fin, "dd/MM/yy") : "Fin"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={filters.fecha_fin}
                                    onSelect={(date) => handleFilterChange("fecha_fin", date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
        </div>
    );
}
