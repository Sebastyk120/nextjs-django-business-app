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
    ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EvolucionCalidad } from "@/types/nacionales-dashboard";

interface QualityEvolutionChartProps {
    data: EvolucionCalidad;
    loading?: boolean;
}

const COLORS = [
    '#10b981',
    '#3b82f6',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#f97316',
    '#84cc16',
    '#14b8a6',
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
                <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs max-w-xs">
                    <p className="font-bold text-slate-800 mb-2">{formatMonth(label)}</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-slate-600 truncate flex-1">{entry.name}:</span>
                                <span className="font-mono font-medium text-slate-800">
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
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-800">
                    Evolución de Calidad por Proveedor
                </CardTitle>
                <p className="text-xs text-slate-400">
                    Porcentaje de exportación mensual promedio
                </p>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {loading ? (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm italic">
                            Cargando evolución de calidad...
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                            No hay datos de evolución
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="mes"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    tickFormatter={formatMonth}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    domain={[0, 100]}
                                    tickFormatter={(value) => `${value}%`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconSize={8}
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '11px' }}
                                />
                                {data.proveedores.map((prov, index) => (
                                    <Line
                                        key={prov.nombre}
                                        type="monotone"
                                        dataKey={prov.nombre}
                                        stroke={COLORS[index % COLORS.length]}
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: COLORS[index % COLORS.length] }}
                                        activeDot={{ r: 5, strokeWidth: 2 }}
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
