"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KilosDistribucion } from "@/types/nacionales-dashboard";
import { cn } from "@/lib/utils";
import { Scale, TrendingUp } from "lucide-react";

interface KilosParticipationChartProps {
    data: KilosDistribucion[];
    loading?: boolean;
}

const COLORS: Record<string, string> = {
    'Exportación': '#10b981',
    'Nacional': '#3b82f6',
    'Merma': '#ef4444',
};

const COLOR_BG: Record<string, string> = {
    'Exportación': 'bg-emerald-500',
    'Nacional': 'bg-blue-500',
    'Merma': 'bg-rose-500',
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

    const totalKilos = useMemo(() => {
        return chartData.reduce((sum, item) => sum + item.kilos, 0);
    }, [chartData]);

    return (
        <Card className="h-full border-slate-200/60 shadow-soft-md overflow-hidden flex flex-col bg-white">
            <CardHeader className="pb-4 pt-6 px-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200/50">
                        <Scale className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold text-slate-800">
                            Participación de Kilos
                        </CardTitle>
                        <p className="text-xs text-slate-500">
                            Distribución por tipo de calidad
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-6">
                <div className="h-[350px] w-full">
                    {loading ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                            <div className="relative mb-4">
                                <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 border-t-blue-500" />
                            </div>
                            <p className="text-sm font-medium">Calculando participación...</p>
                        </div>
                    ) : chartData.length === 0 || chartData.every(d => d.kilos === 0) ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                            <div className="p-4 rounded-full bg-slate-100 mb-3">
                                <Scale className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium">Sin datos de kilos</p>
                        </div>
                    ) : (
                        <div className="flex h-full gap-4">
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
                                            innerRadius={65}
                                            outerRadius={95}
                                            dataKey="kilos"
                                            onMouseEnter={onPieEnter}
                                            paddingAngle={4}
                                            animationBegin={0}
                                            animationDuration={800}
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.fill}
                                                    stroke="white"
                                                    strokeWidth={3}
                                                    className="transition-all duration-300"
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="w-44 flex flex-col justify-center space-y-3">
                                {chartData.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveIndex(index)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left",
                                            activeIndex === index
                                                ? "bg-slate-100 shadow-sm"
                                                : "hover:bg-slate-50"
                                        )}
                                        onMouseEnter={() => setActiveIndex(index)}
                                    >
                                        <div
                                            className={cn(
                                                "w-4 h-4 rounded-full flex-shrink-0 shadow-sm",
                                                COLOR_BG[item.tipo] || "bg-slate-400"
                                            )}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-sm font-semibold truncate",
                                                activeIndex === index ? "text-slate-900" : "text-slate-700"
                                            )}>
                                                {item.tipo}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {formatNumber(item.kilos)} kg
                                            </p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-500",
                                                            COLOR_BG[item.tipo] || "bg-slate-400"
                                                        )}
                                                        style={{ width: `${item.porcentaje}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-500 w-8 text-right">
                                                    {item.porcentaje}%
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}

                                {/* Total Summary */}
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500 font-medium">Total</span>
                                        <span className="text-sm font-bold text-slate-800">
                                            {formatNumber(totalKilos)} kg
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
