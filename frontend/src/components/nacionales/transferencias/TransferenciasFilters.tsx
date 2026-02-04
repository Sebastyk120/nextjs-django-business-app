"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Proveedor, ORIGEN_OPTIONS } from "./types";
import { X, Filter, Search, Calendar, Building2, Wallet } from "lucide-react";
import axiosClient from "@/lib/axios";
import { DateTimePicker } from "@/components/comercial/DateTimePicker";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface TransferenciasFiltersProps {
    filters: any;
    onFilterChange: (filters: any) => void;
}

export function TransferenciasFilters({ filters, onFilterChange }: TransferenciasFiltersProps) {
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        axiosClient.get("/nacionales/api/proveedores/").then((res) => setProveedores(res.data));
    }, []);

    const handleChange = (key: string, value: string) => {
        onFilterChange({ ...filters, [key]: value === "all" ? "" : value });
    };

    const handleClear = () => {
        onFilterChange({
            proveedor: "",
            fecha_inicio: "",
            fecha_fin: "",
            origen: ""
        });
    };

    const activeFiltersCount = [
        filters.proveedor,
        filters.origen,
        filters.fecha_inicio,
        filters.fecha_fin
    ].filter(Boolean).length;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Filter className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">Filtros de Búsqueda</h3>
                        <p className="text-xs text-slate-500">Refine los resultados por proveedor, fecha u origen</p>
                    </div>
                    {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                            {activeFiltersCount} activo{activeFiltersCount !== 1 ? 's' : ''}
                        </Badge>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-slate-600"
                >
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </motion.div>
                </Button>
            </div>

            {/* Filters Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-4 pt-0 border-t border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4">
                                {/* Proveedor */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5" />
                                        Proveedor
                                    </Label>
                                    <Select
                                        value={filters.proveedor || "all"}
                                        onValueChange={(val) => handleChange("proveedor", val)}
                                    >
                                        <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50 hover:bg-white transition-colors">
                                            <SelectValue placeholder="Todos los proveedores" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            <SelectItem value="all">Todos los proveedores</SelectItem>
                                            {proveedores.map((prov) => (
                                                <SelectItem key={prov.id} value={prov.id.toString()}>
                                                    {prov.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Origen */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Wallet className="h-3.5 w-3.5" />
                                        Origen de Fondos
                                    </Label>
                                    <Select
                                        value={filters.origen || "all"}
                                        onValueChange={(val) => handleChange("origen", val)}
                                    >
                                        <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50 hover:bg-white transition-colors">
                                            <SelectValue placeholder="Todos los orígenes" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los orígenes</SelectItem>
                                            {ORIGEN_OPTIONS.map((opt) => (
                                                <SelectItem key={opt} value={opt}>
                                                    {opt}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Fecha Desde */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Fecha Desde
                                    </Label>
                                    <DateTimePicker
                                        value={filters.fecha_inicio}
                                        onChange={(val) => handleChange("fecha_inicio", val)}
                                        showTime={false}
                                    />
                                </div>

                                {/* Fecha Hasta */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Fecha Hasta
                                    </Label>
                                    <DateTimePicker
                                        value={filters.fecha_fin}
                                        onChange={(val) => handleChange("fecha_fin", val)}
                                        showTime={false}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="space-y-2 flex items-end">
                                    <Button
                                        variant="outline"
                                        onClick={handleClear}
                                        disabled={activeFiltersCount === 0}
                                        className="h-10 w-full border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Limpiar Filtros
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
