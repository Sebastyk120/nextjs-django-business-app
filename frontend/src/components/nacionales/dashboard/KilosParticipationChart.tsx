"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KilosDistribucion } from "@/types/nacionales-dashboard";

interface KilosParticipationChartProps {
    data: KilosDistribucion[];
    loading?: boolean;
}

const COLORS: Record<string, string> = {
    'Exportación': '#10b981',
    'Nacional': '#3b82f6',
    'Merma': '#ef4444',
};

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat('es-CO').format(val);
    };

    return (
        <g>
            <text x={cx} y={cy} dy={-15} textAnchor="middle" fill={fill} className="text-sm font-bold">
                {payload.tipo}
            </text>
            <text x={cx} y={cy} dy={10} textAnchor="middle" fill="#1e293b" className="text-xs font-bold">
                {`${formatNumber(value)} kg`}
            </text>
            <text x={cx} y={cy} dy={30} textAnchor="middle" fill="#64748b" className="text-[10px] font-medium">
                {`(${(percent * 100).toFixed(1)}%)`}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 8}
                outerRadius={outerRadius + 12}
                fill={fill}
                opacity={0.6}
            />
        </g>
    );
};

export function KilosParticipationChart({ data, loading }: KilosParticipationChartProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const chartData = useMemo(() => {
        return data.map(item => ({
            ...item,
            fill: COLORS[item.tipo] || '#94a3b8'
        }));
    }, [data]);

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat('es-CO').format(val);
    };

    return (
        <Card className="h-full border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100 mb-4">
                <CardTitle className="text-base font-bold text-slate-800">
                    Participación de Kilos
                </CardTitle>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                    Distribución por Tipo de Calidad
                </p>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="h-[350px] w-full">
                    {loading ? (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm italic">
                            Calculando participación...
                        </div>
                    ) : chartData.length === 0 || chartData.every(d => d.kilos === 0) ? (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                            Sin datos de kilos
                        </div>
                    ) : (
                        <div className="flex h-full">
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            // @ts-expect-error activeIndex and activeShape work at runtime but are not typed
                                            activeIndex={activeIndex}
                                            activeShape={renderActiveShape}
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            dataKey="kilos"
                                            onMouseEnter={onPieEnter}
                                            paddingAngle={3}
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.fill}
                                                    stroke="white"
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-40 flex flex-col justify-center space-y-3 pr-4">
                                {chartData.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                                        onMouseEnter={() => setActiveIndex(index)}
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: item.fill }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-slate-700 truncate">
                                                {item.tipo}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {formatNumber(item.kilos)} kg ({item.porcentaje}%)
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
