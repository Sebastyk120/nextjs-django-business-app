import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, RefreshCw, FilterX, Clock, History } from "lucide-react";
import { parseISO, format, isValid, subYears } from "date-fns";
import { cn } from "@/lib/utils";
import { es } from "date-fns/locale";

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

    const [localValues, setLocalValues] = useState({
        fecha_inicio: filters.fecha_inicio,
        fecha_fin: filters.fecha_fin,
        fecha_inicio_anterior: filters.fecha_inicio_anterior,
        fecha_fin_anterior: filters.fecha_fin_anterior
    });

    const syncFromProps = useCallback(() => {
        setLocalValues({
            fecha_inicio: filters.fecha_inicio,
            fecha_fin: filters.fecha_fin,
            fecha_inicio_anterior: filters.fecha_inicio_anterior,
            fecha_fin_anterior: filters.fecha_fin_anterior
        });
    }, [filters]);

    const handleLocalChange = (key: keyof typeof localValues, value: string) => {
        setLocalValues(prev => ({ ...prev, [key]: value }));
    };

    const handleBlur = (key: "fecha_inicio" | "fecha_fin") => {
        const value = localValues[key];
        onFilterChange(key, value);

        const date = parseISO(value);
        if (isValid(date)) {
            const prevYearDate = subYears(date, 1);
            const prevYearStr = format(prevYearDate, 'yyyy-MM-dd');
            const targetKey = key === "fecha_inicio" ? "fecha_inicio_anterior" : "fecha_fin_anterior";
            onFilterChange(targetKey, prevYearStr);
            setLocalValues(prev => ({ ...prev, [targetKey]: prevYearStr }));
        }
    };

    const handleComparativeBlur = (key: "fecha_inicio_anterior" | "fecha_fin_anterior") => {
        onFilterChange(key, localValues[key]);
    };

    const handleReset = () => {
        onReset();
        setTimeout(syncFromProps, 50);
    };

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = parseISO(dateStr);
        if (!isValid(date)) return dateStr;
        return format(date, "dd MMM yyyy", { locale: es });
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 px-5 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <CalendarIcon className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">
                                Periodos de Análisis
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                Selecciona el rango de fechas para comparar
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="h-9 px-3 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        >
                            <FilterX className="h-3.5 w-3.5 mr-1.5" />
                            Limpiar
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={onRefresh}
                            className="h-9 px-3 text-xs font-medium bg-slate-900 hover:bg-slate-800"
                        >
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                            Actualizar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
                {/* Current Period */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Clock className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                            Periodo Actual
                        </span>
                        <span className="text-[10px] text-slate-400 ml-auto">
                            {formatDisplayDate(localValues.fecha_inicio)} - {formatDisplayDate(localValues.fecha_fin)}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="fecha_inicio" className="text-[11px] font-semibold text-slate-600">
                                Fecha Inicio
                            </Label>
                            <div className="relative">
                                <Input
                                    id="fecha_inicio"
                                    type="date"
                                    value={localValues.fecha_inicio}
                                    onChange={(e) => handleLocalChange("fecha_inicio", e.target.value)}
                                    onBlur={() => handleBlur("fecha_inicio")}
                                    className="h-10 text-sm bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="fecha_fin" className="text-[11px] font-semibold text-slate-600">
                                Fecha Fin
                            </Label>
                            <div className="relative">
                                <Input
                                    id="fecha_fin"
                                    type="date"
                                    value={localValues.fecha_fin}
                                    onChange={(e) => handleLocalChange("fecha_fin", e.target.value)}
                                    onBlur={() => handleBlur("fecha_fin")}
                                    className="h-10 text-sm bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-3 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            Comparar con
                        </span>
                    </div>
                </div>

                {/* Comparative Period */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                            <History className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Periodo Anterior
                        </span>
                        <span className="text-[10px] text-slate-400 ml-auto">
                            {formatDisplayDate(localValues.fecha_inicio_anterior)} - {formatDisplayDate(localValues.fecha_fin_anterior)}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="fecha_inicio_anterior" className="text-[11px] font-semibold text-slate-600">
                                Fecha Inicio
                            </Label>
                            <Input
                                id="fecha_inicio_anterior"
                                type="date"
                                value={localValues.fecha_inicio_anterior}
                                onChange={(e) => handleLocalChange("fecha_inicio_anterior", e.target.value)}
                                onBlur={() => handleComparativeBlur("fecha_inicio_anterior")}
                                className="h-10 text-sm bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:border-slate-400 focus:ring-slate-400/20 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="fecha_fin_anterior" className="text-[11px] font-semibold text-slate-600">
                                Fecha Fin
                            </Label>
                            <Input
                                id="fecha_fin_anterior"
                                type="date"
                                value={localValues.fecha_fin_anterior}
                                onChange={(e) => handleLocalChange("fecha_fin_anterior", e.target.value)}
                                onBlur={() => handleComparativeBlur("fecha_fin_anterior")}
                                className="h-10 text-sm bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:border-slate-400 focus:ring-slate-400/20 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
