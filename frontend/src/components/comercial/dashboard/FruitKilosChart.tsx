import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

interface FruitKilosChartProps {
    data: { fruta__nombre: string; total_kilos: number }[];
    loading?: boolean;
}

const COLORS = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
];

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

    return (
        <g>
            <text x={cx} y={cy} dy={-15} textAnchor="middle" fill={fill} className="text-sm font-bold font-plus-jakarta">
                {payload.name}
            </text>
            <text x={cx} y={cy} dy={10} textAnchor="middle" fill="#1e293b" className="text-xs font-bold">
                {`${value.toLocaleString()} kg`}
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
            .sort((a, b) => b.value - a.value); // Order by % highest to lowest
    }, [data]);

    return (
        <Card className="h-full border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100 mb-4">
                <CardTitle className="text-base font-bold text-slate-800 font-plus-jakarta">
                    Participación de Kilos
                </CardTitle>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                    Distribución por Variedad de Fruta
                </p>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="h-[450px] w-full">
                    {loading ? (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm italic">
                            Calculando participación...
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                            Sin datos de kilos por fruta
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    // @ts-expect-error activeIndex and activeShape work at runtime but are not typed
                                    activeIndex={activeIndex}
                                    activeShape={renderActiveShape}
                                    data={chartData}
                                    cx="40%"
                                    cy="50%"
                                    innerRadius={90}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                    onMouseEnter={onPieEnter}
                                    paddingAngle={3}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="white"
                                            strokeWidth={2}
                                        />
                                    ))}
                                </Pie>
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
                                        const total = chartData.reduce((acc, curr) => acc + curr.value, 0);
                                        const percent = ((payload.value / total) * 100).toFixed(1);
                                        return <span className="text-slate-600 ml-2">{value} ({percent}%)</span>;
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
