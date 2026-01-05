"use client";

import { useEffect, useState, useCallback } from "react";
import axiosClient from "@/lib/axios";
import { DashboardData, DashboardFilters } from "@/types/dashboard";
import { DashboardMetricCard } from "@/components/comercial/dashboard/DashboardMetricCard";
import { DashboardDateFilters } from "@/components/comercial/dashboard/DashboardDateFilters";
import { DashboardEntityFilters } from "@/components/comercial/dashboard/DashboardEntityFilters";
import { UtilityDistributionChart } from "@/components/comercial/dashboard/UtilityDistributionChart";
import { FruitKilosChart } from "@/components/comercial/dashboard/FruitKilosChart";
import { MonthlyEvolutionChart } from "@/components/comercial/dashboard/MonthlyEvolutionChart";
import { ClientsDetailTable } from "@/components/comercial/dashboard/ClientsDetailTable";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
    Scale,
    Package,
    FileText,
    DollarSign,
    RefreshCcw,
    FileWarning,
    XCircle
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DashboardComercialPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);

    // Calculate default dates
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const twoYearsAgo = new Date(today);
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const [filters, setFilters] = useState<DashboardFilters>({
        fecha_inicio: formatDate(oneYearAgo),
        fecha_fin: formatDate(today),
        fecha_inicio_anterior: formatDate(twoYearsAgo),
        fecha_fin_anterior: formatDate(oneYearAgo),
        cliente_id: "",
        intermediario_id: "",
        fruta_id: "",
        exportador_id: "",
    });

    const fetchData = useCallback(async (currentFilters?: DashboardFilters) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            const filtersToSend = currentFilters || filters;

            Object.entries(filtersToSend).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await axiosClient.get(`/comercial/api/dashboard/?${params.toString()}`);
            setData(response.data);

            // Sync filters ensuring they are strings for the Select components
            if (response.data.filters) {
                const f = response.data.filters;
                setFilters({
                    fecha_inicio: f.fecha_inicio || "",
                    fecha_fin: f.fecha_fin || "",
                    fecha_inicio_anterior: f.fecha_inicio_anterior || "",
                    fecha_fin_anterior: f.fecha_fin_anterior || "",
                    cliente_id: f.cliente_id?.toString() || "",
                    intermediario_id: f.intermediario_id?.toString() || "",
                    fruta_id: f.fruta_id?.toString() || "",
                    exportador_id: f.exportador_id?.toString() || "",
                });
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error("Error al cargar los datos del dashboard");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Initial load
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        // Auto-fetch for entity changes (optional but usually better UX)
        if (["cliente_id", "intermediario_id", "fruta_id", "exportador_id"].includes(key)) {
            fetchData(newFilters);
        }
    };

    const handleRefresh = () => {
        fetchData(filters);
    };

    const handleReset = () => {
        // Reset to default date ranges (1 year back for current, 2 years for comparative)
        const resetToday = new Date();
        const resetOneYearAgo = new Date(resetToday);
        resetOneYearAgo.setFullYear(resetOneYearAgo.getFullYear() - 1);
        const resetTwoYearsAgo = new Date(resetToday);
        resetTwoYearsAgo.setFullYear(resetTwoYearsAgo.getFullYear() - 2);

        const defaultFilters: DashboardFilters = {
            fecha_inicio: formatDate(resetOneYearAgo),
            fecha_fin: formatDate(resetToday),
            fecha_inicio_anterior: formatDate(resetTwoYearsAgo),
            fecha_fin_anterior: formatDate(resetOneYearAgo),
            cliente_id: "",
            intermediario_id: "",
            fruta_id: "",
            exportador_id: "",
        };
        setFilters(defaultFilters);
        fetchData(defaultFilters);
    };

    const handleExportExcel = async () => {
        try {
            toast.info("Generando reporte...");

            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await axiosClient.get(
                `/comercial/exportar-dashboard-comercial/?${params.toString()}`,
                {
                    responseType: 'blob',
                    timeout: 30000 // 30 seconds timeout for large reports
                }
            );

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const dateStr = format(new Date(), 'yyyy-MM-dd');
            link.setAttribute('download', `Dashboard_Comercial_${dateStr}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Reporte descargado correctamente");
        } catch (error) {
            console.error("Error exporting:", error);
            toast.error("Error al descargar el reporte. Intente nuevamente.");
        }
    };

    if (!data && loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
                    <p className="text-slate-500 font-medium">Cargando Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-8 font-outfit">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-plus-jakarta">
                        Dashboard Comercial
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Análisis detallado de rendimiento comercial y exportaciones.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="text-slate-500 hover:text-slate-900"
                    >
                        <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                        Actualizar
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportExcel}
                        className="bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 shadow-sm"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Excel
                    </Button>
                </div>
            </div>

            {/* Main Filters */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1">
                    <DashboardDateFilters
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onRefresh={handleRefresh}
                        onReset={handleReset}
                    />
                </div>
                <div className="xl:col-span-2">
                    <DashboardEntityFilters
                        filters={filters}
                        options={{
                            clientes: data?.clientes || [],
                            intermediarios: data?.intermediarios || [],
                            frutas: data?.frutas || [],
                            exportadores: data?.exportadores || []
                        }}
                        onFilterChange={(key, val) => {
                            handleFilterChange(key, val);
                        }}
                    />
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardMetricCard
                    title="Kilos Vendidos"
                    value={`${(data?.metrics.kilos.current || 0).toLocaleString()} kg`}
                    percentChange={data?.metrics.kilos.percent || 0}
                    icon={Scale}
                    color="emerald"
                />
                <DashboardMetricCard
                    title="Cajas Enviadas"
                    value={(data?.metrics.cajas.current || 0).toLocaleString()}
                    percentChange={data?.metrics.cajas.percent || 0}
                    icon={Package}
                    color="blue"
                />
                <DashboardMetricCard
                    title="Facturado USD"
                    value={`$${(data?.metrics.facturado.current || 0).toLocaleString()}`}
                    percentChange={data?.metrics.facturado.percent || 0}
                    icon={FileText}
                    color="indigo"
                />
                <DashboardMetricCard
                    title="Utilidad USD"
                    value={`$${(data?.metrics.utilidad.current || 0).toLocaleString()}`}
                    percentChange={data?.metrics.utilidad.percent || 0}
                    icon={DollarSign}
                    color="amber"
                />
                <DashboardMetricCard
                    title="Recuperaciones USD"
                    value={`$${(data?.metrics.recuperacion.current || 0).toLocaleString()}`}
                    percentChange={data?.metrics.recuperacion.percent || 0}
                    icon={RefreshCcw}
                    color="green"
                />
                <DashboardMetricCard
                    title="Notas Crédito USD"
                    value={`$${(data?.metrics.notas_credito.current || 0).toLocaleString()}`}
                    percentChange={data?.metrics.notas_credito.percent || 0}
                    icon={FileWarning}
                    color="rose"
                />
                <DashboardMetricCard
                    title="Pedidos Cancelados"
                    value={(data?.metrics.cancelados.current || 0).toLocaleString()}
                    percentChange={data?.metrics.cancelados.percent || 0}
                    icon={XCircle}
                    color="rose"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[550px]">
                <div className="lg:col-span-2">
                    <UtilityDistributionChart
                        data={{
                            cliente: data?.charts.utilidad_cliente || [],
                            cliente_prev: data?.charts.utilidad_cliente_prev || [],
                            fruta: data?.charts.utilidad_fruta || [],
                            fruta_prev: data?.charts.utilidad_fruta_prev || [],
                            exportador: data?.charts.utilidad_exportador || [],
                            exportador_prev: data?.charts.utilidad_exportador_prev || [],
                        }}
                        loading={loading}
                    />
                </div>
                <div className="lg:col-span-1">
                    <FruitKilosChart
                        data={data?.charts.kilos_fruta || []}
                        loading={loading}
                    />
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="min-h-[500px]">
                <MonthlyEvolutionChart
                    data={{
                        current: data?.charts.mensual || [],
                        prev: data?.charts.mensual_prev || []
                    }}
                    loading={loading}
                />
            </div>

            {/* Details Table */}
            <div className="pb-10">
                <ClientsDetailTable
                    data={data?.clients_data || []}
                    loading={loading}
                />
            </div>
        </div>
    );
}
