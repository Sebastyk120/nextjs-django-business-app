"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
    Search, 
    RotateCcw, 
    User, 
    FileText, 
    Filter,
    X,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Clock,
    AlertTriangle,
    CreditCard,
    Send,
    Settings,
    Package,
    Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
    { 
        value: "Pendiente", 
        label: "Pendiente",
        icon: Clock,
        color: "amber",
        description: "Venta pendiente de procesar"
    },
    { 
        value: "Vencido", 
        label: "Vencido",
        icon: AlertTriangle,
        color: "red",
        description: "Venta vencida"
    },
    { 
        value: "Completado", 
        label: "Completado",
        icon: CheckCircle2,
        color: "emerald",
        description: "Venta completada"
    },
];

// Estados de ReporteCalidadExportador.estado_reporte_exp
const estadosReporteExp = [
    { 
        value: "Sin reporte Exportador", 
        label: "Sin Reporte",
        icon: Package,
        color: "slate",
        description: "Aún no se ha generado reporte"
    },
    { 
        value: "Pendiente", 
        label: "Pendiente",
        icon: Clock,
        color: "amber",
        description: "Reporte pendiente de facturar"
    },
    { 
        value: "Facturado", 
        label: "Facturado",
        icon: CreditCard,
        color: "blue",
        description: "Reporte facturado"
    },
];

// Estados de ReporteCalidadProveedor.estado_reporte_prov
const estadosReporteProv = [
    { 
        value: "En Proceso", 
        label: "En Proceso",
        icon: Settings,
        color: "orange",
        description: "Reporte en proceso"
    },
    { 
        value: "Reporte Enviado", 
        label: "Enviado",
        icon: Send,
        color: "purple",
        description: "Reporte enviado al proveedor"
    },
    { 
        value: "Facturado", 
        label: "Facturado",
        icon: CreditCard,
        color: "blue",
        description: "Reporte facturado"
    },
    { 
        value: "Pagado", 
        label: "Pagado",
        icon: CheckCircle2,
        color: "teal",
        description: "Reporte pagado"
    },
    { 
        value: "Completado", 
        label: "Completado",
        icon: CheckCircle2,
        color: "emerald",
        description: "Proceso completado"
    },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; light: string; ring: string }> = {
    emerald: { 
        bg: "bg-emerald-500", 
        text: "text-emerald-700", 
        border: "border-emerald-200", 
        light: "bg-emerald-50",
        ring: "ring-emerald-200"
    },
    red: { 
        bg: "bg-red-500", 
        text: "text-red-700", 
        border: "border-red-200", 
        light: "bg-red-50",
        ring: "ring-red-200"
    },
    amber: { 
        bg: "bg-amber-500", 
        text: "text-amber-700", 
        border: "border-amber-200", 
        light: "bg-amber-50",
        ring: "ring-amber-200"
    },
    blue: { 
        bg: "bg-blue-500", 
        text: "text-blue-700", 
        border: "border-blue-200", 
        light: "bg-blue-50",
        ring: "ring-blue-200"
    },
    slate: { 
        bg: "bg-slate-400", 
        text: "text-slate-600", 
        border: "border-slate-200", 
        light: "bg-slate-100",
        ring: "ring-slate-200"
    },
    teal: { 
        bg: "bg-teal-500", 
        text: "text-teal-700", 
        border: "border-teal-200", 
        light: "bg-teal-50",
        ring: "ring-teal-200"
    },
    purple: { 
        bg: "bg-purple-500", 
        text: "text-purple-700", 
        border: "border-purple-200", 
        light: "bg-purple-50",
        ring: "ring-purple-200"
    },
    orange: { 
        bg: "bg-orange-500", 
        text: "text-orange-700", 
        border: "border-orange-200", 
        light: "bg-orange-50",
        ring: "ring-orange-200"
    },
};

export function NacionalesFilters({ filters, onFiltersChange, onClear }: NacionalesFiltersProps) {
    const [isFiltersVisible, setIsFiltersVisible] = useState(true);

    const updateFilter = (key: keyof NacionalesFilterState, value: string | null) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const activeFiltersCount = [
        filters.search,
        filters.proveedorSearch,
        filters.remisionSearch,
        filters.estadoReporteExp,
        filters.estadoFacturacionExp,
        filters.estadoReporteProv
    ].filter(Boolean).length;

    const hasActiveFilters = activeFiltersCount > 0;

    const FilterChip = ({ 
        label, 
        isActive, 
        onClick, 
        color = "slate",
        icon: Icon
    }: { 
        label: string; 
        isActive: boolean; 
        onClick: () => void;
        color?: string;
        icon?: React.ComponentType<{ className?: string }>;
    }) => {
        const colors = colorClasses[color] || colorClasses.slate;
        return (
            <button
                onClick={onClick}
                className={cn(
                    "relative px-2.5 py-1.5 text-[11px] font-medium rounded-md border transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap",
                    isActive
                        ? `${colors.light} ${colors.text} ${colors.border} shadow-sm ring-1 ${colors.ring}`
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
            >
                {Icon && <Icon className={cn("h-3 w-3", isActive ? colors.text : "text-slate-400")} />}
                {label}
                {isActive && (
                    <motion.div
                        layoutId="activeIndicator"
                        className={cn("absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full flex items-center justify-center", colors.bg)}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                    >
                        <CheckCircle2 className="h-2 w-2 text-white" />
                    </motion.div>
                )}
            </button>
        );
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-slate-200/60 bg-white shadow-sm overflow-hidden"
        >
            {/* Header */}
            <div 
                className="p-4 bg-gradient-to-r from-slate-50/80 to-white border-b border-slate-100 flex items-center justify-between cursor-pointer"
                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
            >
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm shadow-blue-200">
                        <Filter className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-800">Filtros Avanzados</h4>
                            {hasActiveFilters && (
                                <Badge 
                                    variant="secondary" 
                                    className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5"
                                >
                                    {activeFiltersCount} activo{activeFiltersCount !== 1 ? 's' : ''}
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-slate-500">Refina los resultados por guía, proveedor, remisión o estado</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                        >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Limpiar
                        </Button>
                    )}
                    {isFiltersVisible ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isFiltersVisible && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 space-y-5">
                            {/* Búsqueda Unificada - Guía, Proveedor, Remisión */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Search className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-semibold text-slate-700">Búsqueda Rápida</span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Búsqueda por Guía */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                            <Tag className="h-3 w-3" />
                                            Número de Guía
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                placeholder="Buscar guía..."
                                                className="h-9 pl-8 text-sm bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                                                value={filters.search}
                                                onChange={(e) => updateFilter("search", e.target.value)}
                                            />
                                            <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                            {filters.search && (
                                                <button
                                                    onClick={() => updateFilter("search", "")}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                                >
                                                    <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Búsqueda por Proveedor */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                            <User className="h-3 w-3" />
                                            Proveedor
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                placeholder="Nombre del proveedor..."
                                                className="h-9 pl-8 text-sm bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                                                value={filters.proveedorSearch}
                                                onChange={(e) => updateFilter("proveedorSearch", e.target.value)}
                                            />
                                            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                            {filters.proveedorSearch && (
                                                <button
                                                    onClick={() => updateFilter("proveedorSearch", "")}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                                >
                                                    <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Búsqueda por Remisión */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                            <FileText className="h-3 w-3" />
                                            Remisión/Reporte
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                placeholder="Número de remisión..."
                                                className="h-9 pl-8 text-sm bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                                                value={filters.remisionSearch}
                                                onChange={(e) => updateFilter("remisionSearch", e.target.value)}
                                            />
                                            <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                            {filters.remisionSearch && (
                                                <button
                                                    onClick={() => updateFilter("remisionSearch", "")}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                                >
                                                    <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100" />

                            {/* Status Filters - Horizontal Layout */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Settings className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-semibold text-slate-700">Filtrar por Estados</span>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    {/* Estado Venta */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                                            Venta (Exportador)
                                        </Label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {estadosVentaExp.map((estado) => (
                                                <FilterChip
                                                    key={estado.value}
                                                    label={estado.label}
                                                    icon={estado.icon}
                                                    color={estado.color}
                                                    isActive={filters.estadoReporteExp === estado.value}
                                                    onClick={() => updateFilter(
                                                        "estadoReporteExp", 
                                                        filters.estadoReporteExp === estado.value ? null : estado.value
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Estado Reporte Exportador */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                                            Reporte (Exportador)
                                        </Label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {estadosReporteExp.map((estado) => (
                                                <FilterChip
                                                    key={estado.value}
                                                    label={estado.label}
                                                    icon={estado.icon}
                                                    color={estado.color}
                                                    isActive={filters.estadoFacturacionExp === estado.value}
                                                    onClick={() => updateFilter(
                                                        "estadoFacturacionExp", 
                                                        filters.estadoFacturacionExp === estado.value ? null : estado.value
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Estado Reporte Proveedor */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
                                            Reporte (Proveedor)
                                        </Label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {estadosReporteProv.map((estado) => (
                                                <FilterChip
                                                    key={estado.value}
                                                    label={estado.label}
                                                    icon={estado.icon}
                                                    color={estado.color}
                                                    isActive={filters.estadoReporteProv === estado.value}
                                                    onClick={() => updateFilter(
                                                        "estadoReporteProv", 
                                                        filters.estadoReporteProv === estado.value ? null : estado.value
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Active Filters Summary */}
                            <AnimatePresence>
                                {hasActiveFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="pt-4 border-t border-slate-100"
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs text-slate-500 mr-2">Filtros activos:</span>
                                            
                                            {filters.search && (
                                                <Badge 
                                                    variant="secondary" 
                                                    className="bg-slate-100 text-slate-700 text-xs cursor-pointer hover:bg-slate-200"
                                                    onClick={() => updateFilter("search", "")}
                                                >
                                                    Guía: {filters.search}
                                                    <X className="h-3 w-3 ml-1" />
                                                </Badge>
                                            )}
                                            
                                            {filters.proveedorSearch && (
                                                <Badge 
                                                    variant="secondary" 
                                                    className="bg-slate-100 text-slate-700 text-xs cursor-pointer hover:bg-slate-200"
                                                    onClick={() => updateFilter("proveedorSearch", "")}
                                                >
                                                    Proveedor: {filters.proveedorSearch}
                                                    <X className="h-3 w-3 ml-1" />
                                                </Badge>
                                            )}
                                            
                                            {filters.remisionSearch && (
                                                <Badge 
                                                    variant="secondary" 
                                                    className="bg-slate-100 text-slate-700 text-xs cursor-pointer hover:bg-slate-200"
                                                    onClick={() => updateFilter("remisionSearch", "")}
                                                >
                                                    Remisión: {filters.remisionSearch}
                                                    <X className="h-3 w-3 ml-1" />
                                                </Badge>
                                            )}
                                            
                                            {filters.estadoReporteExp && (
                                                <Badge 
                                                    variant="secondary" 
                                                    className="bg-amber-100 text-amber-700 text-xs cursor-pointer hover:bg-amber-200"
                                                    onClick={() => updateFilter("estadoReporteExp", null)}
                                                >
                                                    Venta: {filters.estadoReporteExp}
                                                    <X className="h-3 w-3 ml-1" />
                                                </Badge>
                                            )}
                                            
                                            {filters.estadoFacturacionExp && (
                                                <Badge 
                                                    variant="secondary" 
                                                    className="bg-blue-100 text-blue-700 text-xs cursor-pointer hover:bg-blue-200"
                                                    onClick={() => updateFilter("estadoFacturacionExp", null)}
                                                >
                                                    Reporte Exp: {filters.estadoFacturacionExp}
                                                    <X className="h-3 w-3 ml-1" />
                                                </Badge>
                                            )}
                                            
                                            {filters.estadoReporteProv && (
                                                <Badge 
                                                    variant="secondary" 
                                                    className="bg-purple-100 text-purple-700 text-xs cursor-pointer hover:bg-purple-200"
                                                    onClick={() => updateFilter("estadoReporteProv", null)}
                                                >
                                                    Reporte Prov: {filters.estadoReporteProv}
                                                    <X className="h-3 w-3 ml-1" />
                                                </Badge>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
