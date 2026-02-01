import { useState, useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    ComposedChart,
    Line
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyData } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { TrendingUp, Package, DollarSign, AlertCircle } from "lucide-react";

interface MonthlyEvolutionChartProps {
    data: {
        current: MonthlyData[];
        prev: MonthlyData[];
    };
    loading?: boolean;
}

type MetricType = "kilos" | "cajas" | "utilidad" | "nc";

export function MonthlyEvolutionChart({ data, loading }: MonthlyEvolutionChartProps) {
    const [metric, setMetric] = useState<MetricType>("kilos");

    const chartData = useMemo(() => {
        const currentData = data.current || [];
        const prevData = data.prev || [];

        return currentData.map((item, index) => {
            const prevItem = prevData[index];

            let currentValue = 0;
            let prevValue = 0;

            switch (metric) {
                case "kilos":
                    currentValue = item.total_kilos;
                    prevValue = prevItem?.total_kilos || 0;
                    break;
                case "cajas":
                    currentValue = item.total_cajas;
                    prevValue = prevItem?.total_cajas || 0;
                    break;
                case "utilidad":
                    currentValue = item.total_utilidad;
                    prevValue = prevItem?.total_utilidad || 0;
                    break;
                case "nc":
                    currentValue = item.total_nc;
                    prevValue = prevItem?.total_nc || 0;
                    break;
            }

            return {
                name: item.nombre_mes ? `${item.nombre_mes} ${item.año}` : item.fecha,
                current: currentValue,
                prev: prevValue,
                prevLabel: prevItem ? `${prevItem.nombre_mes} ${prevItem.año}` : 'Periodo Anterior'
            };
        });
    }, [data, metric]);

    const config = {
        kilos: { 
            label: "Kilos Enviados", 
            color: "#10b981", 
            prevColor: "#a7f3d0", 
            bgColor: "#ecfdf5",
            unit: "kg",
            icon: TrendingUp,
            description: "Evolución mensual de kilos exportados"
        },
        cajas: { 
            label: "Cajas Enviadas", 
            color: "#3b82f6", 
            prevColor: "#bfdbfe", 
            bgColor: "#eff6ff",
            unit: "",
            icon: Package,
            description: "Evolución mensual de cajas enviadas"
        },
        utilidad: { 
            label: "Utilidad Total", 
            color: "#f59e0b", 
            prevColor: "#fde68a", 
            bgColor: "#fffbeb",
            unit: "$",
            icon: DollarSign,
            description: "Evolución mensual de utilidad generada"
        },
        nc: { 
            label: "Total Notas Crédito", 
            color: "#ef4444", 
            prevColor: "#fecaca", 
            bgColor: "#fef2f2",
            unit: "$",
            icon: AlertCircle,
            description: "Evolución mensual de notas de crédito"
        },
    };

    const currentConfig = config[metric];
    const Icon = currentConfig.icon;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const currentPayload = payload.find((p: any) => p.dataKey === 'current');
            const prevPayload = payload.find((p: any) => p.dataKey === 'prev');

            return (
                <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-xl text-xs min-w-[220px]">
                    <p className="font-bold text-slate-800 mb-3 text-sm border-b border-slate-100 pb-2">{label}</p>

                    {currentPayload && (
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div 
                                    className="w-3 h-3 rounded-sm" 
                                    style={{ backgroundColor: currentConfig.color }}
                                />
                                <span className="text-slate-600 font-medium">Periodo Actual:</span>
                            </div>
                            <span className="font-mono font-bold text-slate-900">
                                {currentConfig.unit === '$' && '$'}
                                {currentPayload.value.toLocaleString()}
                                {currentConfig.unit === 'kg' && ' kg'}
                            </span>
                        </div>
                    )}

                    {prevPayload && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div 
                                    className="w-3 h-3 rounded-sm" 
                                    style={{ backgroundColor: currentConfig.prevColor }}
                                />
                                <span className="text-slate-500">Periodo Anterior:</span>
                            </div>
                            <span className="font-mono text-slate-600">
                                {currentConfig.unit === '$' && '$'}
                                {prevPayload.value.toLocaleString()}
                                {currentConfig.unit === 'kg' && ' kg'}
                            </span>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="h-full border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 space-y-3 sm:space-y-0 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                        style={{ backgroundColor: currentConfig.color }}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-bold text-slate-800">
                            Evolución Mensual
                        </CardTitle>
                        <p className="text-[11px] text-slate-400">
                            {currentConfig.description}
                        </p>
                    </div>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setMetric("kilos")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                            metric === "kilos"
                                ? "bg-white text-emerald-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Kilos</span>
                    </button>
                    <button
                        onClick={() => setMetric("cajas")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                            metric === "cajas"
                                ? "bg-white text-blue-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Package className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Cajas</span>
                    </button>
                    <button
                        onClick={() => setMetric("utilidad")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                            metric === "utilidad"
                                ? "bg-white text-amber-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <DollarSign className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Utilidad</span>
                    </button>
                    <button
                        onClick={() => setMetric("nc")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                            metric === "nc"
                                ? "bg-white text-rose-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">NC</span>
                    </button>
                </div>
            </CardHeader>
            
            <CardContent className="p-5">
                <div className="h-[400px] w-full">
                    {loading ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mb-3" />
                            <span className="text-sm">Procesando datos mensuales...</span>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                <Icon className="h-8 w-8 text-slate-300" />
                            </div>
                            <span className="text-sm font-medium">No hay información disponible</span>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 0 }}
                                barGap={6}
                            >
                                <defs>
                                    <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={currentConfig.color} stopOpacity={0.9} />
                                        <stop offset="100%" stopColor={currentConfig.color} stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                                
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                    dy={10}
                                />
                                
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                    tickFormatter={(value) => {
                                        if (metric === 'cajas') return value.toLocaleString();
                                        if (metric === 'kilos') return `${(value / 1000).toFixed(0)}k`;
                                        return `$${(value / 1000).toFixed(0)}k`;
                                    }}
                                />
                                
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 4 }} />
                                
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    wrapperStyle={{
                                        paddingBottom: '20px',
                                        fontSize: '12px',
                                        fontWeight: 600
                                    }}
                                    iconSize={10}
                                    iconType="circle"
                                />
                                
                                <Bar
                                    dataKey="prev"
                                    name="Periodo Anterior"
                                    fill={currentConfig.prevColor}
                                    radius={[4, 4, 0, 0]}
                                    barSize={24}
                                    animationDuration={1000}
                                />
                                
                                <Bar
                                    dataKey="current"
                                    name="Periodo Actual"
                                    fill={`url(#gradient-${metric})`}
                                    radius={[4, 4, 0, 0]}
                                    barSize={24}
                                    animationDuration={1000}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
