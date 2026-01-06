
"use client";

import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Users, Filter } from "lucide-react";
import type { ExportadorListItem } from "@/services/nacionalesService";

interface ReportesVencidosFiltersProps {
    exportadores: ExportadorListItem[];
    selectedExportador: string;
    onExportadorChange: (value: string) => void;
    onFilter: () => void;
    loading?: boolean;
}

export function ReportesVencidosFilters({
    exportadores,
    selectedExportador,
    onExportadorChange,
    onFilter,
    loading = false
}: ReportesVencidosFiltersProps) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row items-end gap-4">
                <div className="w-full md:w-1/3">
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Exportador
                    </label>
                    <Select
                        value={selectedExportador}
                        onValueChange={onExportadorChange}
                    >
                        <SelectTrigger className="w-full h-11">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Users className="h-4 w-4" />
                                <SelectValue placeholder="Seleccione un exportador" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {exportadores.map((exp) => (
                                <SelectItem key={exp.id} value={exp.id.toString()}>
                                    {exp.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full md:w-auto">
                    <Button
                        onClick={onFilter}
                        disabled={!selectedExportador || loading}
                        className="w-full md:w-auto h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all"
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        {loading ? "Cargando..." : "Filtrar Resultados"}
                    </Button>
                </div>
            </div>

            <p className="text-xs text-slate-500 mt-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Se mostrarán los reportes con fecha de vencimiento anterior al día de hoy.
            </p>
        </div>
    );
}
