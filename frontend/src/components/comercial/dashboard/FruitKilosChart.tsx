import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FruitKilosChartProps {
    data: { fruta__nombre: string; total_kilos: number }[];
    loading?: boolean;
}

const COLORS = [
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
    '#ef4444', // red-500
    '#14b8a6', // teal-500
    '#6366f1', // indigo-500
];

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

    return (
        <g>
            <text x={cx} y={cy - 20} textAnchor="middle" fill={fill} className="text-sm font-bold">
                {payload.name}
            </text>
            <text x={cx} y={cy + 5} textAnchor="middle" fill="#1e293b" className="text-lg font-bold">
                {`${value.toLocaleString()} kg`}
            </text>
            <text x={cx} y={cy + 25} textAnchor="middle" fill="#64748b" className="text-xs font-medium">
                {`(${(percent * 100).toFixed(1)}%)`}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 12}
                outerRadius={outerRadius + 16}
                fill={fill}
                opacity={0.4}
            />
        </g>
    );
};

export function FruitKilosChart({ data, loading }: FruitKilosChartProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const chartData = useMemo(() => {
        return data
            .map(item => ({
                name: item.fruta__nombre,
                value: item.total_kilos
            }))
            .sort((a, b) => b.value - a.value);
    }, [data]);

    const totalKilos = useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.value, 0);
    }, [chartData]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const percent = ((data.value / totalKilos) * 100).toFixed(1);
            
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl text-xs">
                    <div className="flex items-center gap-2 mb-2">
                        <div 
                            className="w-3 h-3 rounded-sm" 
                            style={{ backgroundColor: data.payload.fill }}
                        />
                        <span className="font-bold text-slate-800">{data.name}</span>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Kilos:</span>
                            <span className="font-mono font-bold text-slate-900">
                                {data.value.toLocaleString()} kg
                            </span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Participación:</span>
                            <span className="font-bold text-slate-900">{percent}%</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="h-full border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <PieChartIcon className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-bold text-slate-800">
                            Participación de Kilos
                        </CardTitle>
                        <p className="text-[11px] text-slate-400">
                            Distribución por tipo de fruta
                        </p>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-5">
                <div className="h-[450px] w-full">
                    {loading ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mb-3" />
                            <span className="text-sm">Calculando participación...</span>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                <PieChartIcon className="h-8 w-8 text-slate-300" />
                            </div>
                            <span className="text-sm font-medium">Sin datos disponibles</span>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    activeIndex={activeIndex}
                                    activeShape={renderActiveShape}
                                    data={chartData}
                                    cx="45%"
                                    cy="50%"
                                    innerRadius={85}
                                    outerRadius={115}
                                    fill="#8884d8"
                                    dataKey="value"
                                    onMouseEnter={onPieEnter}
                                    paddingAngle={2}
                                    animationDuration={800}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="white"
                                            strokeWidth={3}
                                            className="outline-none"
                                        />
                                    ))}
                                </Pie>
                                
                                <Tooltip content={<CustomTooltip />} />
                                
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    wrapperStyle={{
                                        right: 0,
                                        fontSize: '11px',
                                        fontWeight: 600
                                    }}
                                    formatter={(value, entry: any) => {
                                        const { payload } = entry;
                                        const percent = ((payload.value / totalKilos) * 100).toFixed(1);
                                        return (
                                            <span className="text-slate-600">
                                                {value} <span className="text-slate-400 font-normal">({percent}%)</span>
                                            </span>
                                        );
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
