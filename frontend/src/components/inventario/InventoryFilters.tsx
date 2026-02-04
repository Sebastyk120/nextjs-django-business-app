"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter, Building2, Package, AlertCircle, Layers } from "lucide-react";
import { InventarioFilters } from "@/types/inventario";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface InventoryFiltersProps {
    filters: InventarioFilters;
    onFiltersChange: (filters: InventarioFilters) => void;
    onClearFilters: () => void;
    userGroups?: string[];
}

const exporterColors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    Etnico: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", gradient: "from-emerald-500 to-teal-600" },
    Fieldex: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", gradient: "from-blue-500 to-indigo-600" },
    Juan_Matas: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", gradient: "from-amber-500 to-orange-600" },
    CI_Dorado: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", gradient: "from-purple-500 to-violet-600" },
};

export function InventoryFilters({
    filters,
    onFiltersChange,
    onClearFilters,
    userGroups = [],
}: InventoryFiltersProps) {
    const [searchValue, setSearchValue] = useState(filters.search || "");
    const [isExpanded, setIsExpanded] = useState(false);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchValue !== filters.search) {
                onFiltersChange({ ...filters, search: searchValue });
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchValue, filters, onFiltersChange]);

    // Update local state if filters change externally (e.g. clear)
    useEffect(() => {
        if (filters.search !== searchValue) {
            setSearchValue(filters.search || "");
        }
    }, [filters.search]);

    const handleExportadorChange = (value: string) => {
        onFiltersChange({ ...filters, exportador: value === "all" ? undefined : value });
    };

    // Determine available exporters based on groups
    const availableExporters = [
        { id: "Etnico", label: "Etnico", icon: Package },
        { id: "Fieldex", label: "Fieldex", icon: Building2 },
        { id: "Juan_Matas", label: "Juan Matas", icon: Layers },
        { id: "CI_Dorado", label: "CI Dorado", icon: Building2 },
    ];

    const canSeeAll = userGroups.includes("Heavens") || userGroups.includes("Autorizadores");

    // Filter exporters based on user access if not admin/heavens
    const visibleExporters = canSeeAll
        ? availableExporters
        : availableExporters.filter(exp => userGroups.includes(exp.id));

    const activeFiltersCount = (filters.search ? 1 : 0) + (filters.exportador ? 1 : 0);

    return (
        <div className="bg-white border-b border-slate-200/60">
            {/* Main Filter Bar */}
            <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <Input
                        placeholder="Buscar referencia..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                    />
                    {searchValue && (
                        <button
                            onClick={() => setSearchValue("")}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Quick Filter Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-slate-500 mr-1">Exportador:</span>
                    <button
                        onClick={() => handleExportadorChange("all")}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
                            !filters.exportador
                                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                    >
                        Todos
                    </button>
                    {visibleExporters.map((exp) => {
                        const colors = exporterColors[exp.id] || exporterColors.Etnico;
                        const isActive = filters.exportador === exp.id;
                        const Icon = exp.icon;

                        return (
                            <motion.button
                                key={exp.id}
                                onClick={() => handleExportadorChange(exp.id)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border flex items-center gap-1.5",
                                    isActive
                                        ? `${colors.bg} ${colors.text} ${colors.border} shadow-sm`
                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                <Icon className="h-3 w-3" />
                                {exp.label}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-auto">
                    <AnimatePresence>
                        {activeFiltersCount > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-2"
                            >
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                                    {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClearFilters}
                                    className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 h-9"
                                >
                                    <X className="mr-1.5 h-3.5 w-3.5" />
                                    Limpiar
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Stock Status Quick Filters */}
            <div className="px-4 pb-4 flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Estado:
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onFiltersChange({ ...filters, stockStatus: filters.stockStatus === "low" ? undefined : "low" })}
                        className={cn(
                            "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border",
                            filters.stockStatus === "low"
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-white text-slate-500 border-slate-200 hover:border-amber-200 hover:text-amber-700"
                        )}
                    >
                        Stock Bajo
                    </button>
                    <button
                        onClick={() => onFiltersChange({ ...filters, stockStatus: filters.stockStatus === "out" ? undefined : "out" })}
                        className={cn(
                            "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border",
                            filters.stockStatus === "out"
                                ? "bg-rose-100 text-rose-800 border-rose-200"
                                : "bg-white text-slate-500 border-slate-200 hover:border-rose-200 hover:text-rose-700"
                        )}
                    >
                        Sin Stock
                    </button>
                </div>
            </div>
        </div>
    );
}
