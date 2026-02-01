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
import { Download, RefreshCcw, BarChart3, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Scale,
    Package,
    FileText,
    DollarSign,
    RefreshCcw as RefreshIcon,
    FileWarning,
    XCircle,
    TrendingUp,
    Percent,
    Calendar,
    Wallet
} from "lucide-react";

export default function DashboardComercialPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);

    // Calculate default dates
    const today = new Date();
    const startOfPrevYear = new Date(today.getFullYear() - 1, 0, 1);
    const startOfTwoYearsAgo = new Date(today.getFullYear() - 2, 0, 1);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const [filters, setFilters] = useState<DashboardFilters>({
        fecha_inicio: formatDate(startOfPrevYear),
        fecha_fin: formatDate(today),
        fecha_inicio_anterior: formatDate(startOfTwoYearsAgo),
        fecha_fin_anterior: formatDate(startOfPrevYear),
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
        // Auto-fetch for entity changes
        if (["cliente_id", "intermediario_id", "fruta_id", "exportador_id"].includes(key)) {
            fetchData(newFilters);
        }
    };

    const handleRefresh = () => {
        fetchData(filters);
    };

    const handleReset = () => {
        const resetToday = new Date();
        const resetStartOfPrevYear = new Date(resetToday.getFullYear() - 1, 0, 1);
        const resetStartOfTwoYearsAgo = new Date(resetToday.getFullYear() - 2, 0, 1);

        const defaultFilters: DashboardFilters = {
            fecha_inicio: formatDate(resetStartOfPrevYear),
            fecha_fin: formatDate(resetToday),
            fecha_inicio_anterior: formatDate(resetStartOfTwoYearsAgo),
            fecha_fin_anterior: formatDate(resetStartOfPrevYear),
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
                    timeout: 30000
                }
            );

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
                    <div className="relative">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-slate-500 font-medium">Cargando Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            Dashboard Comercial
                        </h1>
                        <p className="text-sm text-slate-500">
                            Análisis detallado de rendimiento comercial y exportaciones
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="h-10 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl"
                    >
                        <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                        Actualizar
                    </Button>
                    
                    <Button
                        onClick={handleExportExcel}
                        className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/25"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Excel
                    </Button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-4">
                    <DashboardDateFilters
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onRefresh={handleRefresh}
                        onReset={handleReset}
                    />
                </div>
                <div className="xl:col-span-8">
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

            {/* Primary Metrics */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Métricas Principales</span>
                    <div className="h-px flex-1 bg-slate-200"></div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DashboardMetricCard
                        title="Kilos Vendidos"
                        value={`${(data?.metrics.kilos.current || 0).toLocaleString()}`}
                        subtitle="kg totales"
                        percentChange={data?.metrics.kilos.percent || 0}
                        icon={Scale}
                        color="emerald"
                    />
                    
                    <DashboardMetricCard
                        title="Cajas Enviadas"
                        value={(data?.metrics.cajas.current || 0).toLocaleString()}
                        subtitle="unidades"
                        percentChange={data?.metrics.cajas.percent || 0}
                        icon={Package}
                        color="blue"
                    />
                    
                    <DashboardMetricCard
                        title="Facturado USD"
                        value={`${(data?.metrics.facturado.current || 0).toLocaleString()}`}
                        subtitle="dólares"
                        percentChange={data?.metrics.facturado.percent || 0}
                        icon={FileText}
                        color="indigo"
                    />
                    
                    <DashboardMetricCard
                        title="Utilidad USD"
                        value={`${(data?.metrics.utilidad.current || 0).toLocaleString()}`}
                        subtitle="dólares"
                        percentChange={data?.metrics.utilidad.percent || 0}
                        icon={DollarSign}
                        color="amber"
                    />
                </div>
            </div>

            {/* Secondary Metrics */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Indicadores de Rendimiento</span>
                    <div className="h-px flex-1 bg-slate-200"></div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DashboardMetricCard
                        title="Recuperaciones USD"
                        value={`${(data?.metrics.recuperacion.current || 0).toLocaleString()}`}
                        subtitle="dólares"
                        percentChange={data?.metrics.recuperacion.percent || 0}
                        icon={RefreshIcon}
                        color="teal"
                    />
                    
                    <DashboardMetricCard
                        title="Notas Crédito USD"
                        value={`${(data?.metrics.notas_credito.current || 0).toLocaleString()}`}
                        subtitle="dólares"
                        percentChange={data?.metrics.notas_credito.percent || 0}
                        icon={FileWarning}
                        color="rose"
                    />
                    
                    <DashboardMetricCard
                        title="Pedidos Cancelados"
                        value={(data?.metrics.cancelados.current || 0).toLocaleString()}
                        subtitle="órdenes"
                        percentChange={data?.metrics.cancelados.percent || 0}
                        icon={XCircle}
                        color="rose"
                    />
                    
                    <DashboardMetricCard
                        title="Margen Utilidad %"
                        value={`${(data?.metrics.profit_margin?.current || 0).toFixed(2)}`}
                        subtitle="porcentaje"
                        percentChange={data?.metrics.profit_margin?.percent || 0}
                        icon={TrendingUp}
                        color="emerald"
                    />
                </div>
            </div>

            {/* Third Row Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardMetricCard
                    title="Ratio Notas Crédito"
                    value={`${(data?.metrics.nc_ratio?.current || 0).toFixed(2)}`}
                    subtitle="porcentaje"
                    percentChange={data?.metrics.nc_ratio?.percent || 0}
                    icon={Percent}
                    color="amber"
                />
                
                <DashboardMetricCard
                    title="Días Cartera (Prom)"
                    value={`${Math.round(data?.metrics.portfolio_days?.current || 0)}`}
                    subtitle="días promedio"
                    percentChange={data?.metrics.portfolio_days?.percent || 0}
                    icon={Calendar}
                    color="purple"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

            {/* Charts Row 2 - Monthly Evolution */}
            <div className="w-full">
                <MonthlyEvolutionChart
                    data={{
                        current: data?.charts.mensual || [],
                        prev: data?.charts.mensual_prev || []
                    }}
                    loading={loading}
                />
            </div>

            {/* Details Table */}
            <div className="pb-6">
                <ClientsDetailTable
                    data={data?.clients_data || []}
                    loading={loading}
                />
            </div>
        </div>
    );
}
