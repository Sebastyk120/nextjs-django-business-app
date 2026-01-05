import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, RefreshCw, FilterX } from "lucide-react";
import { parseISO, format, isValid, subYears } from "date-fns";
import { cn } from "@/lib/utils";

interface DashboardDateFiltersProps {
    filters: {
        fecha_inicio: string;
        fecha_fin: string;
        fecha_inicio_anterior: string;
        fecha_fin_anterior: string;
    };
    onFilterChange: (key: string, value: string) => void;
    onRefresh: () => void;
    onReset: () => void;
}

export function DashboardDateFilters({
    filters,
    onFilterChange,
    onRefresh,
    onReset
}: DashboardDateFiltersProps) {

    // Local state to allow free typing without triggering recalculations on every keystroke
    const [localValues, setLocalValues] = useState({
        fecha_inicio: filters.fecha_inicio,
        fecha_fin: filters.fecha_fin,
        fecha_inicio_anterior: filters.fecha_inicio_anterior,
        fecha_fin_anterior: filters.fecha_fin_anterior
    });

    // Sync local state when filters prop changes (e.g., from reset)
    const syncFromProps = useCallback(() => {
        setLocalValues({
            fecha_inicio: filters.fecha_inicio,
            fecha_fin: filters.fecha_fin,
            fecha_inicio_anterior: filters.fecha_inicio_anterior,
            fecha_fin_anterior: filters.fecha_fin_anterior
        });
    }, [filters]);

    // Handle local change (user typing)
    const handleLocalChange = (key: keyof typeof localValues, value: string) => {
        setLocalValues(prev => ({ ...prev, [key]: value }));
    };

    // Commit the value and auto-calculate comparative period on blur
    const handleBlur = (key: "fecha_inicio" | "fecha_fin") => {
        const value = localValues[key];
        onFilterChange(key, value);

        // Auto-calculate the comparative field (previous year) only if valid
        const date = parseISO(value);
        if (isValid(date)) {
            const prevYearDate = subYears(date, 1);
            const prevYearStr = format(prevYearDate, 'yyyy-MM-dd');
            const targetKey = key === "fecha_inicio" ? "fecha_inicio_anterior" : "fecha_fin_anterior";
            onFilterChange(targetKey, prevYearStr);
            setLocalValues(prev => ({ ...prev, [targetKey]: prevYearStr }));
        }
    };

    // For comparative period, just commit directly
    const handleComparativeBlur = (key: "fecha_inicio_anterior" | "fecha_fin_anterior") => {
        onFilterChange(key, localValues[key]);
    };

    // Handle reset - sync local state
    const handleReset = () => {
        onReset();
        // After reset, the filters prop will change; we need to sync
        // However, the prop change will happen asynchronously
        // So we use a small timeout to ensure we get the updated values
        setTimeout(syncFromProps, 50);
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-slate-500" />
                    Periodos de Análisis
                </h3>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="h-8 text-xs text-slate-500 hover:text-slate-800"
                    >
                        <FilterX className="h-3 w-3 mr-1" />
                        Limpiar
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        className="h-8 text-xs bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Actualizar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Period */}
                <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2">
                        Periodo Actual
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="fecha_inicio" className="text-xs text-slate-500">Desde</Label>
                            <Input
                                id="fecha_inicio"
                                type="date"
                                value={localValues.fecha_inicio}
                                onChange={(e) => handleLocalChange("fecha_inicio", e.target.value)}
                                onBlur={() => handleBlur("fecha_inicio")}
                                className="h-9 text-sm bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="fecha_fin" className="text-xs text-slate-500">Hasta</Label>
                            <Input
                                id="fecha_fin"
                                type="date"
                                value={localValues.fecha_fin}
                                onChange={(e) => handleLocalChange("fecha_fin", e.target.value)}
                                onBlur={() => handleBlur("fecha_fin")}
                                className="h-9 text-sm bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Comparative Period */}
                <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                        <span>Periodo Comparativo</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="fecha_inicio_anterior" className="text-xs text-slate-500">Desde</Label>
                            <Input
                                id="fecha_inicio_anterior"
                                type="date"
                                value={localValues.fecha_inicio_anterior}
                                onChange={(e) => handleLocalChange("fecha_inicio_anterior", e.target.value)}
                                onBlur={() => handleComparativeBlur("fecha_inicio_anterior")}
                                className="h-9 text-sm bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="fecha_fin_anterior" className="text-xs text-slate-500">Hasta</Label>
                            <Input
                                id="fecha_fin_anterior"
                                type="date"
                                value={localValues.fecha_fin_anterior}
                                onChange={(e) => handleLocalChange("fecha_fin_anterior", e.target.value)}
                                onBlur={() => handleComparativeBlur("fecha_fin_anterior")}
                                className="h-9 text-sm bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
