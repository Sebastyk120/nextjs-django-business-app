import { useState, useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyData } from "@/types/dashboard";
import { cn } from "@/lib/utils";

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

        // We assume the periods are comparable in length and sequence.
        // We map based on the current period's sequence.

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
        kilos: { label: "Kilos Enviados", color: "#059669", prevColor: "#a7f3d0", unit: "kg" },
        cajas: { label: "Cajas Enviadas", color: "#2563eb", prevColor: "#bfdbfe", unit: "" },
        utilidad: { label: "Utilidad Total", color: "#d97706", prevColor: "#fde68a", unit: "$" },
        nc: { label: "Total NC", color: "#dc2626", prevColor: "#fecaca", unit: "$" },
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const currentPayload = payload.find((p: any) => p.dataKey === 'current');
            const prevPayload = payload.find((p: any) => p.dataKey === 'prev');

            return (
                <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl text-xs backdrop-blur-sm bg-white/90">
                    <p className="font-bold text-slate-900 mb-2 border-b pb-1 border-slate-100">{label}</p>

                    {currentPayload && (
                        <div className="flex items-center justify-between gap-4 mb-1.5">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: currentPayload.fill }} />
                                <span className="text-slate-600 font-medium">Actual:</span>
                            </div>
                            <span className="font-mono font-bold text-slate-900">
                                {config[metric].unit === '$' && '$'}
                                {currentPayload.value.toLocaleString()}
                                {config[metric].unit === 'kg' && ' kg'}
                            </span>
                        </div>
                    )}

                    {prevPayload && (
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: prevPayload.fill }} />
                                <span className="text-slate-500">Anterior:</span>
                            </div>
                            <span className="font-mono text-slate-600">
                                {config[metric].unit === '$' && '$'}
                                {prevPayload.value.toLocaleString()}
                                {config[metric].unit === 'kg' && ' kg'}
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
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 space-y-3 sm:space-y-0 bg-slate-50/50 border-b border-slate-100">
                <div className="space-y-1">
                    <CardTitle className="text-base font-bold text-slate-800 font-plus-jakarta">
                        Evolución Mensual
                    </CardTitle>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                        Comparativa de Desempeño por {metric}
                    </p>
                </div>
                <div className="flex bg-slate-200/50 p-1.5 rounded-xl overflow-x-auto max-w-full">
                    <button
                        onClick={() => setMetric("kilos")}
                        className={cn(
                            "px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                            metric === "kilos"
                                ? "bg-white text-emerald-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        Kilos
                    </button>
                    <button
                        onClick={() => setMetric("cajas")}
                        className={cn(
                            "px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                            metric === "cajas"
                                ? "bg-white text-blue-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        Cajas
                    </button>
                    <button
                        onClick={() => setMetric("utilidad")}
                        className={cn(
                            "px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                            metric === "utilidad"
                                ? "bg-white text-amber-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        Utilidad
                    </button>
                    <button
                        onClick={() => setMetric("nc")}
                        className={cn(
                            "px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                            metric === "nc"
                                ? "bg-white text-rose-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        NC
                    </button>
                </div>
            </CardHeader>
            <CardContent className="pt-8">
                <div className="h-[400px] w-full">
                    {loading ? (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm italic">
                            Procesando datos mensuales...
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                            No hay información disponible para este criterio
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                                barGap={8}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
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
                                        paddingBottom: '30px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#475569'
                                    }}
                                    iconSize={10}
                                    iconType="rect"
                                />
                                <Bar
                                    dataKey="prev"
                                    name="Periodo Anterior"
                                    fill={config[metric].prevColor}
                                    radius={[4, 4, 0, 0]}
                                    barSize={20}
                                />
                                <Bar
                                    dataKey="current"
                                    name="Periodo Actual"
                                    fill={config[metric].color}
                                    radius={[4, 4, 0, 0]}
                                    barSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
