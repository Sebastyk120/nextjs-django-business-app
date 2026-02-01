'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TrendChartProps {
    data: { name: string; orders?: number; kilos?: number }[];
    title: string;
    dataKey?: 'orders' | 'kilos';
    unit?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export function TrendPieChart({ data, title, dataKey = 'orders', unit = 'pedidos' }: TrendChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
                <p className="text-slate-500 text-sm">Sin datos disponibles</p>
            </div>
        );
    }

    const formatValue = (value: number | undefined) => {
        if (value === undefined) return '';
        if (dataKey === 'kilos') {
            return `${value.toLocaleString('es-CO', { maximumFractionDigits: 0 })} kg`;
        }
        return `${value} ${unit}`;
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="40%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey={dataKey}
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number | undefined) => [formatValue(value), dataKey === 'kilos' ? 'Kilos' : 'Cantidad']}
                            contentStyle={{
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                padding: '12px'
                            }}
                        />
                        <Legend
                            verticalAlign="middle"
                            align="right"
                            layout="vertical"
                            iconType="circle"
                            formatter={(value) => (
                                <span className="text-slate-700 font-medium ml-1 text-xs" title={value}>
                                    {value.length > 15 ? `${value.substring(0, 12)}...` : value}
                                </span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
