import { Button } from "@/components/ui/button";
import { ProyeccionFilters } from "@/types/proyeccion";
import { RefreshCcw, Calendar as CalendarIcon, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/comercial/DateTimePicker";

interface ProyeccionFiltersProps {
    filters: ProyeccionFilters;
    onFilterChange: (key: keyof ProyeccionFilters, value: any) => void;
    onRefresh: () => void;
    onReset: () => void;
    options: {
        clientes: { id: number; nombre: string }[];
        frutas: { id: number; nombre: string }[];
        exportadores: { id: number; nombre: string }[];
    };
    loading?: boolean;
}

export function ProyeccionFiltersPanel({
    filters,
    onFilterChange,
    onRefresh,
    onReset,
    options,
    loading
}: ProyeccionFiltersProps) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-emerald-600" />
                    Filtros de Proyección
                </h3>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        className="text-slate-500 hover:text-slate-900 h-8"
                    >
                        Limpiar
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={onRefresh}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 h-8 text-white"
                    >
                        <RefreshCcw className={cn("w-3 h-3 mr-2", loading && "animate-spin")} />
                        Generar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Controls - Simple Native Inputs for reliability in this version */}
                <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Fecha Inicio</Label>
                    <DateTimePicker
                        value={filters.fecha_inicio}
                        onChange={(val) => onFilterChange("fecha_inicio", val)}
                        showTime={false}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Fecha Fin (Base)</Label>
                    <DateTimePicker
                        value={filters.fecha_fin}
                        onChange={(val) => onFilterChange("fecha_fin", val)}
                        showTime={false}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Meses a Proyectar</Label>
                    <Select
                        value={filters.forecast_months.toString()}
                        onValueChange={(val) => onFilterChange("forecast_months", parseInt(val))}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Seleccionar meses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1 Mes</SelectItem>
                            <SelectItem value="3">3 Meses</SelectItem>
                            <SelectItem value="6">6 Meses</SelectItem>
                            <SelectItem value="12">12 Meses (1 Año)</SelectItem>
                            <SelectItem value="24">24 Meses (2 Años)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Cliente</Label>
                    <Select
                        value={filters.cliente_id || "all"}
                        onValueChange={(val) => onFilterChange("cliente_id", val === "all" ? "" : val)}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Todos los clientes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los clientes</SelectItem>
                            {options.clientes.map((c) => (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                    {c.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Fruta</Label>
                    <Select
                        value={filters.fruta_id || "all"}
                        onValueChange={(val) => onFilterChange("fruta_id", val === "all" ? "" : val)}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Todas las frutas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las frutas</SelectItem>
                            {options.frutas.map((f) => (
                                <SelectItem key={f.id} value={f.id.toString()}>
                                    {f.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Exportador</Label>
                    <Select
                        value={filters.exportador_id || "all"}
                        onValueChange={(val) => onFilterChange("exportador_id", val === "all" ? "" : val)}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Todos los exportadores" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los exportadores</SelectItem>
                            {options.exportadores.map((e) => (
                                <SelectItem key={e.id} value={e.id.toString()}>
                                    {e.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
