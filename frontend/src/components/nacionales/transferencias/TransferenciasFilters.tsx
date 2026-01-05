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
import { X } from "lucide-react";
import axiosClient from "@/lib/axios";

interface TransferenciasFiltersProps {
    filters: any;
    onFilterChange: (filters: any) => void;
}

export function TransferenciasFilters({ filters, onFilterChange }: TransferenciasFiltersProps) {
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);

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

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</Label>
                    <Select
                        value={filters.proveedor || "all"}
                        onValueChange={(val) => handleChange("proveedor", val)}
                    >
                        <SelectTrigger className="h-9 border-slate-200 bg-slate-50/50">
                            <SelectValue placeholder="Todos los proveedores" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {proveedores.map((prov) => (
                                <SelectItem key={prov.id} value={prov.id.toString()}>
                                    {prov.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5 w-full md:w-[150px]">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Origen</Label>
                    <Select
                        value={filters.origen || "all"}
                        onValueChange={(val) => handleChange("origen", val)}
                    >
                        <SelectTrigger className="h-9 border-slate-200 bg-slate-50/50">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {ORIGEN_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5 w-full md:w-[150px]">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Desde</Label>
                    <Input
                        type="date"
                        value={filters.fecha_inicio}
                        onChange={(e) => handleChange("fecha_inicio", e.target.value)}
                        className="h-9 border-slate-200 bg-slate-50/50"
                    />
                </div>

                <div className="space-y-1.5 w-full md:w-[150px]">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hasta</Label>
                    <Input
                        type="date"
                        value={filters.fecha_fin}
                        onChange={(e) => handleChange("fecha_fin", e.target.value)}
                        className="h-9 border-slate-200 bg-slate-50/50"
                    />
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        onClick={handleClear}
                        className="h-9 text-slate-500 hover:text-red-600 hover:bg-red-50"
                        title="Limpiar filtros"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Limpiar
                    </Button>
                </div>
            </div>
        </div>
    );
}
