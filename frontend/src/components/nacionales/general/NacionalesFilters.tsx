"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, RotateCcw, Filter, X, CheckCircle2, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function NacionalesFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [showCompleted, setShowCompleted] = useState(searchParams.get("completed") === "true");
    const [isFocused, setIsFocused] = useState(false);

    // Debounce effect for automatic search
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentSearch = searchParams.get("search") || "";
            if (searchTerm !== currentSearch) {
                updateFilters(searchTerm, showCompleted);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Update URL function
    const updateFilters = (term: string, completed: boolean) => {
        const params = new URLSearchParams();
        if (term) params.set("search", term);
        if (completed) params.set("completed", "true");

        router.push(`?${params.toString()}`);
    };

    // Handle Search Input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Handle Toggle
    const handleToggle = (checked: boolean) => {
        setShowCompleted(checked);
        updateFilters(searchTerm, checked);
    };

    // Handle Clear
    const handleClear = () => {
        setSearchTerm("");
        setShowCompleted(false);
        router.push("?");
    };

    const activeFiltersCount = (searchTerm ? 1 : 0) + (showCompleted ? 1 : 0);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header Section */}
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Filter className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Filtros de Búsqueda</h3>
                            <p className="text-xs text-slate-500">Refina los resultados de procesos incompletos</p>
                        </div>
                    </div>
                    {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-medium">
                            {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Filters Content */}
            <div className="p-5">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                    {/* Search Input - Enhanced */}
                    <div className="relative w-full lg:w-[400px] group">
                        <div className={cn(
                            "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200",
                            isFocused ? "text-blue-500" : "text-slate-400"
                        )}>
                            <Search className="h-4 w-4" />
                        </div>
                        <Input
                            placeholder="Buscar por número de guía, proveedor, remisión..."
                            className={cn(
                                "pl-10 pr-10 h-11 bg-slate-50 border-slate-200 rounded-xl transition-all duration-200",
                                "focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10",
                                "placeholder:text-slate-400 text-sm"
                            )}
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="hidden lg:block w-px h-8 bg-slate-200" />

                    {/* Filter Options */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {/* Status Toggle - Enhanced */}
                        <button
                            onClick={() => handleToggle(!showCompleted)}
                            className={cn(
                                "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-200",
                                showCompleted
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            )}
                        >
                            <div className={cn(
                                "h-5 w-5 rounded-md flex items-center justify-center transition-colors duration-200",
                                showCompleted
                                    ? "bg-emerald-500 text-white"
                                    : "bg-slate-100 border border-slate-300"
                            )}>
                                {showCompleted && <CheckCircle2 className="h-3.5 w-3.5" />}
                            </div>
                            <span className="text-sm font-medium">Solo Completados</span>
                        </button>

                        {/* Quick Filter: In Progress */}
                        <button
                            onClick={() => {
                                if (showCompleted) {
                                    handleToggle(false);
                                }
                            }}
                            className={cn(
                                "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-200",
                                !showCompleted
                                    ? "bg-amber-50 border-amber-200 text-amber-700"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            )}
                        >
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">En Proceso</span>
                        </button>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Clear Button */}
                    {(searchTerm || showCompleted) && (
                        <Button
                            variant="ghost"
                            onClick={handleClear}
                            className="text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-11 px-4"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">Limpiar filtros</span>
                        </Button>
                    )}
                </div>

                {/* Active Filters Tags */}
                {activeFiltersCount > 0 && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                        <span className="text-xs text-slate-500 font-medium">Filtros activos:</span>
                        <div className="flex flex-wrap gap-2">
                            {searchTerm && (
                                <Badge
                                    variant="secondary"
                                    className="bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer rounded-lg px-2.5 py-1"
                                    onClick={() => setSearchTerm("")}
                                >
                                    <span className="text-xs">Búsqueda: "{searchTerm}"</span>
                                    <X className="h-3 w-3 ml-1.5" />
                                </Badge>
                            )}
                            {showCompleted && (
                                <Badge
                                    variant="secondary"
                                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer rounded-lg px-2.5 py-1"
                                    onClick={() => handleToggle(false)}
                                >
                                    <span className="text-xs">Solo Completados</span>
                                    <X className="h-3 w-3 ml-1.5" />
                                </Badge>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
