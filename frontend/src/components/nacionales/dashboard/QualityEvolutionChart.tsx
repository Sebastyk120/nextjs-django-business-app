"use client";

import { useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EvolucionCalidad } from "@/types/nacionales-dashboard";
import { cn } from "@/lib/utils";
import { Activity, TrendingUp } from "lucide-react";

interface QualityEvolutionChartProps {
    data: EvolucionCalidad;
    loading?: boolean;
}

const COLORS = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ef4444', // rose
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#14b8a6', // teal
];

export function QualityEvolutionChart({ data, loading }: QualityEvolutionChartProps) {

    const chartData = useMemo(() => {
        if (!data.meses || data.meses.length === 0) return [];

        return data.meses.map((mes, index) => {
            const point: Record<string, any> = { mes };
            data.proveedores.forEach(prov => {
                point[prov.nombre] = prov.exportacion[index] || 0;
            });
            return point;
        });
    }, [data]);

    const formatMonth = (mes: string) => {
        const [year, month] = mes.split('-');
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-xl text-xs max-w-xs">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-emerald-100">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <p className="font-semibold text-slate-800 text-sm">{formatMonth(label)}</p>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-slate-600 truncate max-w-[120px]">{entry.name}</span>
                                </div>
                                <span className="font-mono font-semibold text-slate-800">
                                    {entry.value.toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="border-slate-200/60 shadow-soft-md overflow-hidden bg-white">
            <CardHeader className="pb-4 pt-6 px-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200/50">
                            <Activity className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold text-slate-800">
                                Evolución de Calidad por Proveedor
                            </CardTitle>
                            <p className="text-xs text-slate-500">
                                Porcentaje de exportación mensual promedio
                            </p>
                        </div>
                    </div>

                    {/* Legend Summary */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs text-slate-600">Excelente (&gt;80%)</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-xs text-slate-600">Regular (50-80%)</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="h-[320px] w-full">
                    {loading ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                            <div className="relative mb-4">
                                <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 border-t-purple-500" />
                            </div>
                            <p className="text-sm font-medium">Cargando evolución de calidad...</p>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                            <div className="p-4 rounded-full bg-slate-100 mb-3">
                                <Activity className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium">No hay datos de evolución</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                            >
                                <defs>
                                    {data.proveedores.map((prov, index) => (
                                        <linearGradient
                                            key={prov.nombre}
                                            id={`gradient-${index}`}
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor={COLORS[index % COLORS.length]}
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor={COLORS[index % COLORS.length]}
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    ))}
                                </defs>

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e2e8f0"
                                    opacity={0.5}
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="mes"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                    tickFormatter={formatMonth}
                                    dy={10}
                                />

                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                    domain={[0, 100]}
                                    tickFormatter={(value) => `${value}%`}
                                />

                                <Tooltip content={<CustomTooltip />} />

                                <Legend
                                    verticalAlign="bottom"
                                    height={40}
                                    iconSize={8}
                                    iconType="circle"
                                    wrapperStyle={{
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        paddingTop: '10px'
                                    }}
                                />

                                <ReferenceLine
                                    y={80}
                                    stroke="#10b981"
                                    strokeDasharray="5 5"
                                    strokeOpacity={0.5}
                                    label={{
                                        value: "Meta 80%",
                                        position: "right",
                                        fill: "#10b981",
                                        fontSize: 10,
                                        fontWeight: 600
                                    }}
                                />

                                {data.proveedores.map((prov, index) => (
                                    <Line
                                        key={prov.nombre}
                                        type="monotone"
                                        dataKey={prov.nombre}
                                        stroke={COLORS[index % COLORS.length]}
                                        strokeWidth={2.5}
                                        dot={{ r: 4, fill: COLORS[index % COLORS.length], strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff' }}
                                        animationDuration={1000}
                                        animationBegin={index * 100}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
