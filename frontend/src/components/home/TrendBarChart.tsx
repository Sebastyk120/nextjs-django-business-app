'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TrendChartProps {
    data: { name: string; orders?: number; kilos?: number }[];
    title: string;
    dataKey?: 'orders' | 'kilos';
    unit?: string;
}

const COLORS = ['#F8C8DC', '#FFDAB9', '#B2DFDB', '#DCEDC8', '#FFF9C4']; // Soft Pastel palette (Rose, Peach, Mint, Sage, Lemon)

export function TrendBarChart({ data, title, dataKey = 'orders', unit = 'pedidos' }: TrendChartProps) {
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
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={100}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            formatter={(value: number | undefined) => [formatValue(value), dataKey === 'kilos' ? 'Kilos' : 'Cantidad']}
                            contentStyle={{
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
