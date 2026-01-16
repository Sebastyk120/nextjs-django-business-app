'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TrendChartProps {
    data: { name: string; orders?: number; kilos?: number }[];
    title: string;
    dataKey?: 'orders' | 'kilos';
    unit?: string;
}

const COLORS = ['#F8C8DC', '#FFDAB9', '#B2DFDB', '#DCEDC8', '#FFF9C4']; // Soft Pastel palette

export function TrendPieChart({ data, title, dataKey = 'orders', unit = 'pedidos' }: TrendChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
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
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey={dataKey}
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number | undefined) => [formatValue(value), dataKey === 'kilos' ? 'Kilos' : 'Cantidad']}
                            contentStyle={{
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Legend
                            verticalAlign="middle"
                            align="right"
                            layout="vertical"
                            iconType="circle"
                            formatter={(value) => (
                                <span className="text-slate-700 font-medium ml-1 text-xs">{value}</span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
