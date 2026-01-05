"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { InventarioFilters } from "@/types/inventario";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";

interface InventoryFiltersProps {
    filters: InventarioFilters;
    onFiltersChange: (filters: InventarioFilters) => void;
    onClearFilters: () => void;
    userGroups?: string[];
}

export function InventoryFilters({
    filters,
    onFiltersChange,
    onClearFilters,
    userGroups = [],
}: InventoryFiltersProps) {
    const [searchValue, setSearchValue] = useState(filters.search || "");

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchValue !== filters.search) {
                onFiltersChange({ ...filters, search: searchValue });
            }
        }, 500);

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
        { id: "Etnico", label: "Etnico" },
        { id: "Fieldex", label: "Fieldex" },
        { id: "Juan_Matas", label: "Juan Matas" },
        { id: "CI_Dorado", label: "CI Dorado" },
    ];

    const canSeeAll = userGroups.includes("Heavens") || userGroups.includes("Autorizadores");

    // Filter exporters based on user access if not admin/heavens
    const visibleExporters = canSeeAll
        ? availableExporters
        : availableExporters.filter(exp => userGroups.includes(exp.id));

    return (
        <div className="p-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Buscar referencia..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select
                    value={filters.exportador || "all"}
                    onValueChange={handleExportadorChange}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Exportador" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {visibleExporters.map((exp) => (
                            <SelectItem key={exp.id} value={exp.id}>
                                {exp.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                {(filters.search || filters.exportador) && (
                    <Button
                        variant="ghost"
                        onClick={onClearFilters}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Limpiar filtros
                    </Button>
                )}
            </div>
        </div>
    );
}
