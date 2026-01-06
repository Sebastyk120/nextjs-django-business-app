"use client";

import { useState, useEffect } from "react";
import { QualityFilters } from "./QualityFilters";
import { QualityCharts } from "./QualityCharts";
import nacionalesService from "@/services/nacionalesService";
import { QualityFiltersState, QualityChartData, QualityKPIs } from "@/types/quality-dashboard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download } from "lucide-react";

export function QualityDashboard() {
    // State
    const [filters, setFilters] = useState<QualityFiltersState>({});
    const [chartData, setChartData] = useState<QualityChartData[]>([]);
    const [kpis, setKpis] = useState<QualityKPIs>({
        total_kg_recibidos: 0,
        total_kg_exportacion: 0,
        promedio_calidad: 0,
        promedio_precio: 0,
        porcentaje_merma_global: 0
    });
    const [loading, setLoading] = useState(true);

    // Options State
    const [options, setOptions] = useState<{
        proveedores: { id: number, nombre: string }[];
        exportadores: { id: number, nombre: string }[];
        frutas: { id: number, nombre: string }[];
    }>({ proveedores: [], exportadores: [], frutas: [] });

    // Load Options
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const data = await nacionalesService.getQualityOptions();
                setOptions(data);
            } catch (error) {
                console.error("Failed to load options", error);
                toast.error("Error al cargar las opciones de filtro");
            }
        };
        loadOptions();
    }, []);

    // Load Data
    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const data = await nacionalesService.getQualityDashboardData(filters);
            setChartData(data.chart_data);
            setKpis(data.kpis);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
            toast.error("Error al cargar los datos del tablero");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [filters]);

    // Handle Export
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        try {
            setExporting(true);
            const blob = await nacionalesService.exportQualityExcel(filters);

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            link.setAttribute('download', `analisis_calidad_${timestamp}.xlsx`);

            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Excel exportado correctamente");
        } catch (error) {
            console.error("Failed to export Excel", error);
            toast.error("Error al exportar el archivo Excel");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={loadDashboardData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
                <Button variant="default" size="sm" onClick={handleExport} disabled={exporting || loading} className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px]">
                    {exporting ? (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Exportando...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4 mr-2" />
                            Exportar Excel
                        </>
                    )}
                </Button>
            </div>

            {/* Filters */}
            <QualityFilters
                onFilterChange={setFilters}
                proveedores={options.proveedores}
                exportadores={options.exportadores}
                frutas={options.frutas}
            />

            {/* Charts & KPIs */}
            <QualityCharts
                data={chartData}
                kpis={kpis}
                loading={loading}
            />
        </div>
    );
}
