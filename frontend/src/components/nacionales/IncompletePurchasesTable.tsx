"use client";

import { useMemo, useState } from "react";
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
import { 
    ArrowRight, 
    AlertCircle, 
    FileText, 
    Package, 
    User, 
    Calendar, 
    TrendingUp,
    Filter,
    Eye,
    ChevronRight,
    Scale,
    Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface IncompletePurchasesTableProps {
    data: CompraNacional[];
    filters: NacionalesFilterState;
    onSelect: (compra: CompraNacional) => void;
}

// Extended color palette for better visual distinction
const STATUS_COLORS = {
    // Estado Venta
    completado: { bg: "bg-emerald-500", text: "text-emerald-700", light: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-500" },
    vencido: { bg: "bg-red-500", text: "text-red-700", light: "bg-red-50", border: "border-red-200", icon: "text-red-500" },
    pendiente: { bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-50", border: "border-amber-200", icon: "text-amber-500" },
    
    // Estado Reporte Exportador
    facturado: { bg: "bg-blue-500", text: "text-blue-700", light: "bg-blue-50", border: "border-blue-200", icon: "text-blue-500" },
    "sin reporte": { bg: "bg-slate-400", text: "text-slate-600", light: "bg-slate-100", border: "border-slate-200", icon: "text-slate-400" },
    
    // Estado Reporte Proveedor
    pagado: { bg: "bg-teal-500", text: "text-teal-700", light: "bg-teal-50", border: "border-teal-200", icon: "text-teal-500" },
    "reporte enviado": { bg: "bg-purple-500", text: "text-purple-700", light: "bg-purple-50", border: "border-purple-200", icon: "text-purple-500" },
    "en proceso": { bg: "bg-orange-500", text: "text-orange-700", light: "bg-orange-50", border: "border-orange-200", icon: "text-orange-500" },
    
    // Default
    default: { bg: "bg-slate-400", text: "text-slate-600", light: "bg-slate-100", border: "border-slate-200", icon: "text-slate-400" }
};

export function IncompletePurchasesTable({ data, filters, onSelect }: IncompletePurchasesTableProps) {
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<"table" | "cards">("table");

    // Apply filters
    const filteredData = useMemo(() => {
        return data.filter((compra) => {
            // Guide search
            if (filters.search &&
                !compra.numero_guia.toLowerCase().includes(filters.search.toLowerCase())) {
                return false;
            }

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

            // Estado Venta (Exportador)
            if (filters.estadoReporteExp && compra.estado_venta !== filters.estadoReporteExp) {
                return false;
            }

            // Estado Reporte (Exportador)
            if (filters.estadoFacturacionExp) {
                if (filters.estadoFacturacionExp === "Sin reporte Exportador") {
                    if (compra.estado_reporte_exp) {
                        return false;
                    }
                } else {
                    if (compra.estado_reporte_exp !== filters.estadoFacturacionExp) {
                        return false;
                    }
                }
            }

            // Estado Reporte Proveedor
            if (filters.estadoReporteProv && compra.estado_reporte_prov !== filters.estadoReporteProv) {
                return false;
            }

            return true;
        });
    }, [data, filters]);

    const getProgressColor = (porcentaje: number) => {
        if (porcentaje === 100) return "from-emerald-400 to-emerald-600";
        if (porcentaje >= 75) return "from-blue-400 to-blue-600";
        if (porcentaje >= 50) return "from-amber-400 to-amber-600";
        return "from-red-400 to-red-600";
    };

    const getProgressBgColor = (porcentaje: number) => {
        if (porcentaje === 100) return "bg-emerald-100";
        if (porcentaje >= 75) return "bg-blue-100";
        if (porcentaje >= 50) return "bg-amber-100";
        return "bg-red-100";
    };

    const getStatusColors = (estado: string | null | undefined, type: 'bg' | 'text' | 'light' | 'border' | 'icon' = 'bg') => {
        if (!estado) return STATUS_COLORS.default[type];
        const key = estado.toLowerCase();
        return (STATUS_COLORS[key] || STATUS_COLORS.default)[type];
    };

    // Get initials for avatar
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Get avatar color based on name
    const getAvatarColor = (name: string) => {
        const colors = [
            "bg-blue-500", "bg-emerald-500", "bg-purple-500", 
            "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-indigo-500"
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const isSearching = !!filters.search;

    return (
        <div className="space-y-4">
            {/* Header Card */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden"
            >
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                            isSearching ? "bg-blue-100" : "bg-amber-100"
                        )}>
                            {isSearching ? (
                                <Filter className="h-5 w-5 text-blue-600" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800 text-lg">
                                {isSearching ? "Resultados de Búsqueda" : "Procesos Incompletos"}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {isSearching 
                                    ? `Mostrando ${filteredData.length} resultados para "${filters.search}"`
                                    : `${filteredData.length} registros pendientes de completar`
                                }
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge 
                            variant="secondary" 
                            className="bg-slate-100 text-slate-700 px-3 py-1.5 font-medium"
                        >
                            <span className="text-slate-900 font-bold mr-1">{filteredData.length}</span>
                            de {data.length}
                        </Badge>
                    </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
                                <TableHead className="w-[120px] font-semibold text-slate-700 py-4">
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4 text-slate-400" />
                                        Guía
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-slate-400" />
                                        Proveedor
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-slate-400" />
                                        Remisión
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        Fecha
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">Fruta</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-right py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <Scale className="h-4 w-4 text-slate-400" />
                                        Peso
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700 text-center py-4">Estados</TableHead>
                                <TableHead className="w-[140px] font-semibold text-slate-700 text-center py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-slate-400" />
                                        Progreso
                                    </div>
                                </TableHead>
                                <TableHead className="w-[80px] py-4"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="wait">
                                {filteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center h-48">
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex flex-col items-center justify-center gap-3"
                                            >
                                                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <FileText className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <div>
                                                    <p className="text-slate-600 font-medium">No hay registros disponibles</p>
                                                    <p className="text-sm text-slate-400">Intenta ajustar los filtros de búsqueda</p>
                                                </div>
                                            </motion.div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData.map((compra, index) => (
                                        <motion.tr
                                            key={compra.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className={cn(
                                                "group border-b border-slate-100 transition-all duration-200 cursor-pointer",
                                                hoveredRow === compra.id ? "bg-slate-50/80" : "hover:bg-slate-50/50"
                                            )}
                                            onMouseEnter={() => setHoveredRow(compra.id)}
                                            onMouseLeave={() => setHoveredRow(null)}
                                            onClick={() => onSelect(compra)}
                                        >
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg text-sm border border-blue-100">
                                                        {compra.numero_guia}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm",
                                                        getAvatarColor(compra.proveedor_nombre)
                                                    )}>
                                                        {getInitials(compra.proveedor_nombre)}
                                                    </div>
                                                    <span className="text-slate-700 font-medium truncate max-w-[150px]">
                                                        {compra.proveedor_nombre}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {compra.ventanacional?.reportecalidadexportador?.remision_exp ? (
                                                    <span className="text-slate-600 text-sm font-medium">
                                                        {compra.ventanacional.reportecalidadexportador.remision_exp}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-sm italic">
                                                        {compra.ventanacional ? "Pendiente" : "Sin remisión"}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <span className="text-slate-600 text-sm">
                                                    {new Date(compra.fecha_compra).toLocaleDateString('es-CO', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge 
                                                    variant="outline" 
                                                    className="font-medium bg-gradient-to-r from-lime-50 to-emerald-50 text-emerald-700 border-emerald-200/60 px-2.5 py-1"
                                                >
                                                    <Package className="h-3 w-3 mr-1.5" />
                                                    {compra.fruta_nombre}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                <span className="font-mono font-semibold text-slate-700">
                                                    {(compra.peso_compra || 0).toLocaleString()}
                                                </span>
                                                <span className="text-slate-400 text-xs ml-1">kg</span>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex flex-col gap-1.5 items-center">
                                                    {/* Estado Venta */}
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-[10px] px-2 py-0.5 font-semibold border",
                                                            getStatusColors(compra.estado_venta, 'light'),
                                                            getStatusColors(compra.estado_venta, 'text'),
                                                            getStatusColors(compra.estado_venta, 'border')
                                                        )}
                                                    >
                                                        {compra.estado_venta || "Sin Venta"}
                                                    </Badge>
                                                    {/* Estado Reporte Exp */}
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-[10px] px-2 py-0.5 font-semibold border",
                                                            getStatusColors(compra.estado_reporte_exp, 'light'),
                                                            getStatusColors(compra.estado_reporte_exp, 'text'),
                                                            getStatusColors(compra.estado_reporte_exp, 'border')
                                                        )}
                                                    >
                                                        {compra.estado_reporte_exp || "Sin Reporte Exp"}
                                                    </Badge>
                                                    {/* Estado Reporte Prov */}
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-[10px] px-2 py-0.5 font-semibold border",
                                                            getStatusColors(compra.estado_reporte_prov, 'light'),
                                                            getStatusColors(compra.estado_reporte_prov, 'text'),
                                                            getStatusColors(compra.estado_reporte_prov, 'border')
                                                        )}
                                                    >
                                                        {compra.estado_reporte_prov || "Sin Reporte Prov"}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "h-2.5 flex-1 rounded-full overflow-hidden",
                                                            getProgressBgColor(compra.porcentaje_completitud)
                                                        )}>
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${compra.porcentaje_completitud}%` }}
                                                                transition={{ duration: 0.8, delay: index * 0.05 }}
                                                                className={cn(
                                                                    "h-full rounded-full bg-gradient-to-r",
                                                                    getProgressColor(compra.porcentaje_completitud)
                                                                )}
                                                            />
                                                        </div>
                                                        <span className={cn(
                                                            "text-xs font-bold w-10 text-right",
                                                            compra.porcentaje_completitud === 100 ? "text-emerald-600" : "text-slate-600"
                                                        )}>
                                                            {Math.round(compra.porcentaje_completitud)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                                >
                                                    <ChevronRight className="h-4 w-4 text-slate-400" />
                                                </Button>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                {filteredData.length > 0 && (
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <span className="text-sm text-slate-500">
                            Mostrando <span className="font-semibold text-slate-700">{filteredData.length}</span> registros
                        </span>
                        <span className="text-xs text-slate-400">
                            Haz clic en cualquier fila para ver detalles
                        </span>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
