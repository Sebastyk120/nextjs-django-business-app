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
import { Calendar as CalendarIcon, RefreshCw, FilterX, FileText, SlidersHorizontal, Search } from "lucide-react";
import Link from "next/link";
import { FilterOption, DashboardNacionalesFilters } from "@/types/nacionales-dashboard";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
    const hasActiveFilters = filters.proveedor_id || filters.fruta_id;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-soft-md"
        >
            {/* Decorative top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />

            <div className="p-5 md:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200">
                            <SlidersHorizontal className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">
                                Filtros de Análisis
                            </h3>
                            <p className="text-xs text-slate-500">
                                Personaliza los datos mostrados
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {hasActiveFilters && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onReset}
                                    className="h-9 px-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                    <FilterX className="h-3.5 w-3.5 mr-1.5" />
                                    Limpiar filtros
                                </Button>
                            </motion.div>
                        )}

                        {filters.proveedor_id && (
                            <Link href={`/nacionales/resumen-reportes/${filters.proveedor_id}`}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-3 text-xs border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all"
                                >
                                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                                    Ver Resumen
                                </Button>
                            </Link>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRefresh}
                            disabled={loading}
                            className="h-9 px-3 text-xs bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all"
                        >
                            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
                            Actualizar
                        </Button>
                    </div>
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Date Range - Start */}
                    <div className="space-y-2">
                        <Label htmlFor="fecha_inicio" className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                            <CalendarIcon className="h-3 w-3 text-slate-400" />
                            Fecha Inicio
                        </Label>
                        <div className="relative">
                            <Input
                                id="fecha_inicio"
                                type="date"
                                value={filters.fecha_inicio || ""}
                                onChange={(e) => onFilterChange("fecha_inicio", e.target.value)}
                                className="h-11 text-sm bg-slate-50/50 border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Date Range - End */}
                    <div className="space-y-2">
                        <Label htmlFor="fecha_fin" className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                            <CalendarIcon className="h-3 w-3 text-slate-400" />
                            Fecha Fin
                        </Label>
                        <div className="relative">
                            <Input
                                id="fecha_fin"
                                type="date"
                                value={filters.fecha_fin || ""}
                                onChange={(e) => onFilterChange("fecha_fin", e.target.value)}
                                className="h-11 text-sm bg-slate-50/50 border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Provider Select */}
                    <div className="space-y-2">
                        <Label htmlFor="proveedor" className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                            <Search className="h-3 w-3 text-slate-400" />
                            Proveedor
                        </Label>
                        <Select
                            value={filters.proveedor_id || "all"}
                            onValueChange={(value) => onFilterChange("proveedor_id", value === "all" ? "" : value)}
                        >
                            <SelectTrigger className={cn(
                                "h-11 text-sm rounded-xl border-slate-200 transition-all",
                                filters.proveedor_id && filters.proveedor_id !== "all"
                                    ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                                    : "bg-slate-50/50"
                            )}>
                                <SelectValue placeholder="Todos los proveedores" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200">
                                <SelectItem value="all" className="rounded-lg">
                                    <span className="text-slate-500">Todos los proveedores</span>
                                </SelectItem>
                                <div className="h-px bg-slate-100 my-1" />
                                {proveedores.map((p) => (
                                    <SelectItem
                                        key={p.id}
                                        value={p.id.toString()}
                                        className="rounded-lg cursor-pointer"
                                    >
                                        {p.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Fruit Select */}
                    <div className="space-y-2">
                        <Label htmlFor="fruta" className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                            <Search className="h-3 w-3 text-slate-400" />
                            Fruta
                        </Label>
                        <Select
                            value={filters.fruta_id || "all"}
                            onValueChange={(value) => onFilterChange("fruta_id", value === "all" ? "" : value)}
                        >
                            <SelectTrigger className={cn(
                                "h-11 text-sm rounded-xl border-slate-200 transition-all",
                                filters.fruta_id && filters.fruta_id !== "all"
                                    ? "bg-amber-50/50 border-amber-200 text-amber-900"
                                    : "bg-slate-50/50"
                            )}>
                                <SelectValue placeholder="Todas las frutas" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200">
                                <SelectItem value="all" className="rounded-lg">
                                    <span className="text-slate-500">Todas las frutas</span>
                                </SelectItem>
                                <div className="h-px bg-slate-100 my-1" />
                                {frutas.map((f) => (
                                    <SelectItem
                                        key={f.id}
                                        value={f.id.toString()}
                                        className="rounded-lg cursor-pointer"
                                    >
                                        {f.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Active Filters Summary */}
                <AnimatePresence>
                    {hasActiveFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-5 pt-4 border-t border-slate-100"
                        >
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium text-slate-500">Filtros activos:</span>
                                {filters.proveedor_id && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                        Proveedor: {proveedores.find(p => p.id.toString() === filters.proveedor_id)?.nombre}
                                        <button
                                            onClick={() => onFilterChange("proveedor_id", "")}
                                            className="ml-1 hover:text-emerald-900"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {filters.fruta_id && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                        Fruta: {frutas.find(f => f.id.toString() === filters.fruta_id)?.nombre}
                                        <button
                                            onClick={() => onFilterChange("fruta_id", "")}
                                            className="ml-1 hover:text-amber-900"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
