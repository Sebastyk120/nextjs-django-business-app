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
import { ExportDataModal } from "@/components/nacionales/dashboard/ExportDataModal";
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
    Truck,
    TrendingUp,
    Calendar,
    Filter,
    ArrowUpRight
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

export default function DashboardNacionalesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardNacionalesData | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const today = new Date();
    const startOfPrevYear = new Date(today.getFullYear() - 1, 0, 1);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const [filters, setFilters] = useState<DashboardNacionalesFilters>({
        fecha_inicio: formatDate(startOfPrevYear),
        fecha_fin: formatDate(today),
        proveedor_id: null,
        fruta_id: null
    });

    const [estadoCuentaOpen, setEstadoCuentaOpen] = useState(false);
    const [resumenReportesOpen, setResumenReportesOpen] = useState(false);
    const [balanceOpen, setBalanceOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);

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
            setIsRefreshing(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, []);

    const handleFilterChange = (key: string, value: string) => {
        let newValue: string | null = value;

        if (key === 'fecha_inicio' || key === 'fecha_fin') {
            newValue = value;
        } else {
            newValue = value || null;
        }

        const newFilters = { ...filters, [key]: newValue };
        setFilters(newFilters as DashboardNacionalesFilters);
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchData(filters);
    };

    const handleReset = () => {
        const resetToday = new Date();
        const resetPrevYear = new Date(resetToday.getFullYear() - 1, 0, 1);

        const defaultFilters: DashboardNacionalesFilters = {
            fecha_inicio: formatDate(resetPrevYear),
            fecha_fin: formatDate(resetToday),
            proveedor_id: null,
            fruta_id: null
        };
        setFilters(defaultFilters);
        fetchData(defaultFilters);
        toast.success("Filtros restablecidos");
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

    // Calculate summary stats for the header
    const totalProveedores = data?.proveedores?.length || 0;
    const totalFrutas = data?.frutas?.length || 0;

    if (!data && loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                        <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full border-4 border-emerald-400 opacity-20" />
                    </div>
                    <p className="text-slate-500 font-medium animate-pulse">Cargando Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 p-4 md:p-6 lg:p-8 space-y-6">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-soft-lg"
            >
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-transparent to-blue-600/5" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative p-6 md:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Title Section */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
                                    <Truck className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                                        Dashboard Compras Nacionales
                                    </h1>
                                    <p className="text-slate-500 text-sm mt-0.5">
                                        Gestión integral de compras, utilidades y calidad de proveedores
                                    </p>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex items-center gap-4 pt-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/50">
                                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-600">
                                        {format(new Date(filters.fecha_inicio || ''), 'dd MMM yyyy', { locale: es })} - {format(new Date(filters.fecha_fin || ''), 'dd MMM yyyy', { locale: es })}
                                    </span>
                                </div>
                                {totalProveedores > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/50">
                                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                                        <span className="text-xs font-medium text-emerald-700">
                                            {totalProveedores} proveedores activos
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEstadoCuentaOpen(true)}
                                className="h-10 px-4 bg-white hover:bg-slate-50 border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <FileText className="h-4 w-4 mr-2 text-emerald-600" />
                                Estado de Cuenta
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setResumenReportesOpen(true)}
                                className="h-10 px-4 bg-white hover:bg-slate-50 border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <Send className="h-4 w-4 mr-2 text-blue-600" />
                                Resumen Reportes
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setBalanceOpen(true)}
                                className="h-10 px-4 bg-white hover:bg-slate-50 border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-700 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <BalanceIcon className="h-4 w-4 mr-2 text-amber-600" />
                                Balance
                            </Button>
                            <div className="w-px h-8 bg-slate-200 mx-1" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={loading}
                                className="h-10 px-3 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            >
                                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setExportOpen(true)}
                                className="h-10 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Exportar
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Filters Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <NacionalesFilters
                    filters={filters}
                    proveedores={data?.proveedores || []}
                    frutas={data?.frutas || []}
                    onFilterChange={handleFilterChange}
                    onRefresh={handleRefresh}
                    onReset={handleReset}
                    loading={loading}
                />
            </motion.div>

            {/* Metrics Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
            >
                <motion.div variants={cardVariants}>
                    <NacionalesMetricCard
                        title="Compras Totales"
                        value={formatCurrency(data?.metrics.compras_totales.current || 0)}
                        percentChange={data?.metrics.compras_totales.percent || 0}
                        icon={ShoppingCart}
                        color="blue"
                        subtitle="Valor total comprado"
                    />
                </motion.div>
                <motion.div variants={cardVariants}>
                    <NacionalesMetricCard
                        title="Kilos Brutos"
                        value={formatNumber(data?.metrics.kilos_brutos.current || 0)}
                        percentChange={data?.metrics.kilos_brutos.percent || 0}
                        icon={Scale}
                        color="emerald"
                        subtitle="Peso total recibido"
                    />
                </motion.div>
                <motion.div variants={cardVariants}>
                    <NacionalesMetricCard
                        title="Kilos Netos"
                        value={formatNumber(data?.metrics.kilos_netos.current || 0)}
                        percentChange={data?.metrics.kilos_netos.percent || 0}
                        icon={Weight}
                        color="indigo"
                        subtitle="Peso después de merma"
                    />
                </motion.div>
                <motion.div variants={cardVariants}>
                    <NacionalesMetricCard
                        title="Utilidad Real"
                        value={formatCurrency(data?.metrics.utilidad_real.current || 0)}
                        percentChange={data?.metrics.utilidad_real.percent || 0}
                        icon={DollarSign}
                        color="amber"
                        subtitle="Ganancia neta calculada"
                    />
                </motion.div>
                <motion.div variants={cardVariants}>
                    <NacionalesMetricCard
                        title="Utilidad Antes Ajuste"
                        value={formatCurrency(data?.metrics.utilidad_sin_ajuste.current || 0)}
                        percentChange={data?.metrics.utilidad_sin_ajuste.percent || 0}
                        icon={Calculator}
                        color="purple"
                        subtitle="Sin considerar ajustes"
                    />
                </motion.div>
                <motion.div variants={cardVariants}>
                    <NacionalesMetricCard
                        title="Reportes Pendientes"
                        value={(data?.metrics.reportes_pendientes.current || 0).toString()}
                        percentChange={data?.metrics.reportes_pendientes.percent || 0}
                        icon={AlertTriangle}
                        color="rose"
                        isClickable
                        onClick={() => router.push('/nacionales-detallada')}
                        invertTrend
                        subtitle="Requieren atención"
                    />
                </motion.div>
            </motion.div>

            {/* Charts Row */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <UtilityByProviderChart
                        utilidadesProveedor={data?.charts.utilidades_proveedor || []}
                        utilidadesFruta={data?.charts.utilidades_fruta || []}
                        loading={loading}
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <KilosParticipationChart
                        data={data?.charts.kilos_distribucion || []}
                        loading={loading}
                    />
                </motion.div>
            </motion.div>

            {/* Quality Evolution Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <QualityEvolutionChart
                    data={data?.charts.evolucion_calidad || { meses: [], proveedores: [] }}
                    loading={loading}
                />
            </motion.div>

            {/* Detail Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
            >
                <ProveedoresDetailTable
                    data={data?.proveedores_data || []}
                    loading={loading}
                />
            </motion.div>

            {/* Modals */}
            <NacionalesDashboardModals
                proveedores={data?.proveedores || []}
                estadoCuentaOpen={estadoCuentaOpen}
                setEstadoCuentaOpen={setEstadoCuentaOpen}
                resumenReportesOpen={resumenReportesOpen}
                setResumenReportesOpen={setResumenReportesOpen}
                balanceOpen={balanceOpen}
                setBalanceOpen={setBalanceOpen}
            />

            <ExportDataModal
                open={exportOpen}
                onOpenChange={setExportOpen}
                filters={filters}
            />
        </div>
    );
}
