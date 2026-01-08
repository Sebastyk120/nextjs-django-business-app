"use client";

import { useEffect, useState, useCallback } from "react";
import { format, subYears } from "date-fns";
import { toast } from "sonner";
import { ProyeccionFilters, ProyeccionResponse } from "@/types/proyeccion";
import { proyeccionApi } from "@/lib/proyeccion-api";
import { ProyeccionFiltersPanel } from "@/components/comercial/proyeccion/ProyeccionFilters";
import { ProyeccionMetricCards } from "@/components/comercial/proyeccion/ProyeccionMetricCards";
import { ForecastChart } from "@/components/comercial/proyeccion/ForecastChart";
import { SeasonalityPanel } from "@/components/comercial/proyeccion/SeasonalityPanel";
import { CustomerPortfolioAnalysis } from "@/components/comercial/proyeccion/CustomerPortfolioAnalysis";
import { DetailedForecastTable } from "@/components/comercial/proyeccion/DetailedForecastTable";
import { Button } from "@/components/ui/button";
import { Download, Info, Sparkles, BarChart3, Users, Calendar, Table as TableIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axiosClient from "@/lib/axios";

export default function ProyeccionVentasPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ProyeccionResponse | null>(null);
    const [options, setOptions] = useState<{
        clientes: { id: number; nombre: string }[];
        frutas: { id: number; nombre: string }[];
        exportadores: { id: number; nombre: string }[];
    }>({ clientes: [], frutas: [], exportadores: [] });

    // Initial Filters
    const [filters, setFilters] = useState<ProyeccionFilters>({
        fecha_inicio: format(subYears(new Date(), 1), 'yyyy-MM-dd'),
        fecha_fin: format(new Date(), 'yyyy-MM-dd'),
        forecast_months: 3,
        cliente_id: "",
        fruta_id: "",
        exportador_id: ""
    });

    const fetchOptions = async () => {
        try {
            const response = await axiosClient.get('/comercial/api/dashboard/?limit=1');
            if (response.data) {
                setOptions({
                    clientes: response.data.clientes || [],
                    frutas: response.data.frutas || [],
                    exportadores: response.data.exportadores || []
                });
            }
        } catch (error) {
            console.error("Error fetching options:", error);
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await proyeccionApi.getProyeccion(filters);
            setData(response);
        } catch (error) {
            console.error("Error fetching projection:", error);
            toast.error("Error al cargar la proyección");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchOptions();
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterChange = (key: keyof ProyeccionFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleRefresh = () => {
        fetchData();
    };

    const handleReset = () => {
        setFilters({
            fecha_inicio: format(subYears(new Date(), 1), 'yyyy-MM-dd'),
            fecha_fin: format(new Date(), 'yyyy-MM-dd'),
            forecast_months: 3,
            cliente_id: "",
            fruta_id: "",
            exportador_id: ""
        });
        setTimeout(fetchData, 100);
    };

    const handleExport = async () => {
        try {
            toast.info("Generando reporte Excel...");
            const response = await proyeccionApi.exportExcel(filters);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Proyeccion_Ventas_${format(new Date(), 'yyyyMMdd')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Reporte descargado");
        } catch (error) {
            toast.error("Error al exportar");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-8 font-outfit">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-plus-jakarta flex items-center gap-2">
                        Proyección de Ventas
                        {data?.model_metadata?.algorithm === 'weighted_seasonal_growth' && (
                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Proyección Inteligente
                            </span>
                        )}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Análisis predictivo con detección de estacionalidad y tendencias de crecimiento.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleExport}
                    className="bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 shadow-sm"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Excel
                </Button>
            </div>

            {/* Filters */}
            <ProyeccionFiltersPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                onRefresh={handleRefresh}
                onReset={handleReset}
                options={options}
                loading={loading}
            />

            {/* Info Box */}
            <Alert className="bg-blue-50 border-blue-200 text-blue-900 shadow-sm">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-700 font-semibold flex items-center gap-2">
                    Información de Proyección
                    {data && <span className="text-xs font-normal bg-blue-100 px-2 py-0.5 rounded-full">Algoritmo: Estacionalidad + Crecimiento Ponderado</span>}
                </AlertTitle>
                <AlertDescription className="text-blue-800/80 mt-1">
                    La proyección analiza sus patrones históricos (mes a mes) y aplica un factor de crecimiento basado en la tendencia reciente de los últimos trimestres.
                </AlertDescription>
            </Alert>

            {/* Metrics Cards */}
            {data && <ProyeccionMetricCards metrics={data.summary_metrics} />}

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-white p-1 border shadow-sm rounded-lg h-auto flex-wrap justify-start w-full md:w-auto">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 px-4 py-2 h-auto">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Gráfico & Resumen
                    </TabsTrigger>
                    <TabsTrigger value="portfolio" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 px-4 py-2 h-auto">
                        <Users className="w-4 h-4 mr-2" />
                        Análisis de Cartera
                    </TabsTrigger>
                    <TabsTrigger value="seasonality" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 px-4 py-2 h-auto">
                        <Calendar className="w-4 h-4 mr-2" />
                        Patrones Estacionales
                    </TabsTrigger>
                    <TabsTrigger value="details" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 px-4 py-2 h-auto">
                        <TableIcon className="w-4 h-4 mr-2" />
                        Datos Detallados
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <ForecastChart
                        historicalData={data?.historical_data || []}
                        forecastData={data?.forecast_data || []}
                        loading={loading}
                        metric="kilos"
                    />
                </TabsContent>

                <TabsContent value="portfolio">
                    <CustomerPortfolioAnalysis
                        data={data?.portfolio_analysis || {
                            new_customers: [],
                            lost_customers: [],
                            growing_customers: [],
                            declining_customers: []
                        }}
                    />
                </TabsContent>

                <TabsContent value="seasonality">
                    <SeasonalityPanel
                        seasonalPatterns={data?.seasonal_patterns || { seasonal_clients: [], seasonal_fruits: [] }}
                        loading={loading}
                    />
                </TabsContent>

                <TabsContent value="details">
                    <DetailedForecastTable
                        historicalData={data?.historical_data || []}
                        forecastData={data?.forecast_data || []}
                        loading={loading}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
