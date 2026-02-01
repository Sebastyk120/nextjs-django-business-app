'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TrendChartProps {
    data: { name: string; orders?: number; kilos?: number }[];
    title: string;
    dataKey?: 'orders' | 'kilos';
    unit?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export function TrendBarChart({ data, title, dataKey = 'orders', unit = 'pedidos' }: TrendChartProps) {
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={130}
                            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 17)}...` : value}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                            formatter={(value: number | undefined) => [formatValue(value), dataKey === 'kilos' ? 'Kilos' : 'Cantidad']}
                            contentStyle={{
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                padding: '12px'
                            }}
                        />
                        <Bar dataKey={dataKey} radius={[0, 8, 8, 0]} barSize={24}>
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
