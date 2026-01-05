"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosClient from "@/lib/axios";
import {
    DashboardNacionalesData,
    DashboardNacionalesFilters
} from "@/types/nacionales-dashboard";
import { NacionalesFilters } from "@/components/nacionales/dashboard/NacionalesFilters";
import { NacionalesMetricCard } from "@/components/nacionales/dashboard/NacionalesMetricCard";
import { UtilityByProviderChart } from "@/components/nacionales/dashboard/UtilityByProviderChart";
import { KilosParticipationChart } from "@/components/nacionales/dashboard/KilosParticipationChart";
import { QualityEvolutionChart } from "@/components/nacionales/dashboard/QualityEvolutionChart";
import { ProveedoresDetailTable } from "@/components/nacionales/dashboard/ProveedoresDetailTable";
import { NacionalesDashboardModals } from "@/components/nacionales/dashboard/NacionalesDashboardModals";
import { Button } from "@/components/ui/button";
import {
    ShoppingCart,
    Scale,
    Weight,
    DollarSign,
    Calculator,
    AlertTriangle,
    Download,
    RefreshCw,
    FileText,
    Send,
    Scale as BalanceIcon,
    Truck
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DashboardNacionalesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardNacionalesData | null>(null);

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const [filters, setFilters] = useState<DashboardNacionalesFilters>({
        fecha_inicio: formatDate(thirtyDaysAgo),
        fecha_fin: formatDate(today),
        proveedor_id: null,
        fruta_id: null
    });

    const [estadoCuentaOpen, setEstadoCuentaOpen] = useState(false);
    const [resumenReportesOpen, setResumenReportesOpen] = useState(false);
    const [balanceOpen, setBalanceOpen] = useState(false);

    const fetchData = useCallback(async (currentFilters?: DashboardNacionalesFilters) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            const filtersToSend = currentFilters || filters;

            if (filtersToSend.fecha_inicio) params.append('fecha_inicio', filtersToSend.fecha_inicio);
            if (filtersToSend.fecha_fin) params.append('fecha_fin', filtersToSend.fecha_fin);
            if (filtersToSend.proveedor_id) params.append('proveedor_id', filtersToSend.proveedor_id);
            if (filtersToSend.fruta_id) params.append('fruta_id', filtersToSend.fruta_id);

            const response = await axiosClient.get(`/nacionales/api/dashboard/?${params.toString()}`);
            setData(response.data);

            if (response.data.filters) {
                const f = response.data.filters;
                setFilters({
                    fecha_inicio: f.fecha_inicio || "",
                    fecha_fin: f.fecha_fin || "",
                    proveedor_id: f.proveedor_id?.toString() || null,
                    fruta_id: f.fruta_id?.toString() || null,
                });
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error("Error al cargar los datos del dashboard");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, []);

    const handleFilterChange = (key: string, value: string) => {
        // Para fechas, usamos string vacío en lugar de null para evitar error de uncontrolled input
        let newValue: string | null = value;
        
        if (key === 'fecha_inicio' || key === 'fecha_fin') {
            newValue = value; // Mantener como string (vacío o valor)
        } else {
            // Para selectores (proveedor/fruta), usamos null si está vacío
            newValue = value || null;
        }
        
        const newFilters = { ...filters, [key]: newValue };
        setFilters(newFilters as DashboardNacionalesFilters);
    };

    const handleRefresh = () => {
        fetchData(filters);
    };

    const handleReset = () => {
        const resetToday = new Date();
        const resetThirtyDaysAgo = new Date(resetToday);
        resetThirtyDaysAgo.setDate(resetThirtyDaysAgo.getDate() - 30);

        const defaultFilters: DashboardNacionalesFilters = {
            fecha_inicio: formatDate(resetThirtyDaysAgo),
            fecha_fin: formatDate(resetToday),
            proveedor_id: null,
            fruta_id: null
        };
        setFilters(defaultFilters);
        fetchData(defaultFilters);
    };

    const handleExportExcel = async () => {
        try {
            toast.info("Generando reporte...");

            const params = new URLSearchParams();
            params.append('data', 'dashboard');
            if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
            if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
            if (filters.proveedor_id) params.append('proveedor', filters.proveedor_id);
            if (filters.fruta_id) params.append('fruta', filters.fruta_id);

            const response = await axiosClient.get(
                `/nacionales/export_data/?${params.toString()}`,
                {
                    responseType: 'blob',
                    timeout: 30000
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const dateStr = format(new Date(), 'yyyy-MM-dd');
            link.setAttribute('download', `Dashboard_Nacionales_${dateStr}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Reporte descargado correctamente");
        } catch (error) {
            console.error("Error exporting:", error);
            toast.error("Error al descargar el reporte");
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    };

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat('es-CO').format(Math.round(val));
    };

    if (!data && loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
                    <p className="text-slate-500 font-medium">Cargando Dashboard Nacionales...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-8 font-outfit">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-plus-jakarta flex items-center gap-3">
                        <Truck className="h-8 w-8 text-emerald-600" />
                        Dashboard Compras Nacionales
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Estado general de compras, utilidades y calidad de proveedores nacionales.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEstadoCuentaOpen(true)}
                        className="text-slate-600"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Estado de Cuenta
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResumenReportesOpen(true)}
                        className="text-slate-600"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Resumen Reportes
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBalanceOpen(true)}
                        className="text-slate-600"
                    >
                        <BalanceIcon className="h-4 w-4 mr-2" />
                        Balance Proveedores
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="text-slate-500 hover:text-slate-900"
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                        Actualizar
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportExcel}
                        className="bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                    </Button>
                </div>
            </div>

            <NacionalesFilters
                filters={filters}
                proveedores={data?.proveedores || []}
                frutas={data?.frutas || []}
                onFilterChange={handleFilterChange}
                onRefresh={handleRefresh}
                onReset={handleReset}
                loading={loading}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <NacionalesMetricCard
                    title="Compras Totales"
                    value={formatCurrency(data?.metrics.compras_totales.current || 0)}
                    percentChange={data?.metrics.compras_totales.percent || 0}
                    icon={ShoppingCart}
                    color="blue"
                />
                <NacionalesMetricCard
                    title="Kilos Brutos"
                    value={formatNumber(data?.metrics.kilos_brutos.current || 0)}
                    percentChange={data?.metrics.kilos_brutos.percent || 0}
                    icon={Scale}
                    color="emerald"
                />
                <NacionalesMetricCard
                    title="Kilos Netos"
                    value={formatNumber(data?.metrics.kilos_netos.current || 0)}
                    percentChange={data?.metrics.kilos_netos.percent || 0}
                    icon={Weight}
                    color="indigo"
                />
                <NacionalesMetricCard
                    title="Utilidad Real"
                    value={formatCurrency(data?.metrics.utilidad_real.current || 0)}
                    percentChange={data?.metrics.utilidad_real.percent || 0}
                    icon={DollarSign}
                    color="amber"
                />
                <NacionalesMetricCard
                    title="Utilidad Antes Ajuste"
                    value={formatCurrency(data?.metrics.utilidad_sin_ajuste.current || 0)}
                    percentChange={data?.metrics.utilidad_sin_ajuste.percent || 0}
                    icon={Calculator}
                    color="purple"
                />
                <NacionalesMetricCard
                    title="Reportes Pendientes"
                    value={(data?.metrics.reportes_pendientes.current || 0).toString()}
                    percentChange={data?.metrics.reportes_pendientes.percent || 0}
                    icon={AlertTriangle}
                    color="rose"
                    isClickable
                    onClick={() => router.push('/nacionales-detallada')}
                    invertTrend
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <UtilityByProviderChart
                        utilidadesProveedor={data?.charts.utilidades_proveedor || []}
                        utilidadesFruta={data?.charts.utilidades_fruta || []}
                        loading={loading}
                    />
                </div>
                <div className="lg:col-span-1">
                    <KilosParticipationChart
                        data={data?.charts.kilos_distribucion || []}
                        loading={loading}
                    />
                </div>
            </div>

            <QualityEvolutionChart
                data={data?.charts.evolucion_calidad || { meses: [], proveedores: [] }}
                loading={loading}
            />

            <ProveedoresDetailTable
                data={data?.proveedores_data || []}
                loading={loading}
            />

            <NacionalesDashboardModals
                proveedores={data?.proveedores || []}
                estadoCuentaOpen={estadoCuentaOpen}
                setEstadoCuentaOpen={setEstadoCuentaOpen}
                resumenReportesOpen={resumenReportesOpen}
                setResumenReportesOpen={setResumenReportesOpen}
                balanceOpen={balanceOpen}
                setBalanceOpen={setBalanceOpen}
            />
        </div>
    );
}
