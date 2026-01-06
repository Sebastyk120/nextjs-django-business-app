"use client";

import { QualityChartData, QualityKPIs } from "@/types/quality-dashboard";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Activity, Percent, DollarSign, Scale } from "lucide-react";

interface QualityChartsProps {
    data: QualityChartData[];
    kpis: QualityKPIs;
    loading: boolean;
}

export function QualityCharts({ data, kpis, loading }: QualityChartsProps) {
    if (loading) {
        return <div className="h-96 flex items-center justify-center text-muted-foreground">Cargando gráficos...</div>;
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Calidad Promedio"
                    value={`${kpis.promedio_calidad}%`}
                    subtitle="Promedio Ponderado"
                    icon={<Activity className="h-4 w-4 text-emerald-500" />}
                    trend="high-good"
                />
                <KPICard
                    title="Precio Promedio"
                    value={`$${kpis.promedio_precio.toLocaleString()}`}
                    subtitle="Por Kg Exportación"
                    icon={<DollarSign className="h-4 w-4 text-amber-500" />}
                    trend="neutral"
                />
                <KPICard
                    title="Merma Global"
                    value={`${kpis.porcentaje_merma_global}%`}
                    subtitle="Sobre Total Recibido"
                    icon={<Percent className="h-4 w-4 text-red-500" />}
                    trend="low-good"
                />
                <KPICard
                    title="Total Exportado"
                    value={`${kpis.total_kg_exportacion.toLocaleString()} kg`}
                    subtitle={`De ${kpis.total_kg_recibidos.toLocaleString()} kg recibidos`}
                    icon={<Scale className="h-4 w-4 text-blue-500" />}
                    trend="neutral"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calidad Chart */}
                <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-slate-50">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-emerald-100/50">
                                <Activity className="h-4 w-4 text-emerald-600" />
                            </div>
                            Calidad Semanal (% Exportación)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="semana"
                                    tickFormatter={(str) => {
                                        const d = new Date(str);
                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                    }}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    unit="%"
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="calidad_promedio"
                                    name="% Exportación"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Precio Chart */}
                <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-slate-50">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-amber-100/50">
                                <DollarSign className="h-4 w-4 text-amber-600" />
                            </div>
                            Precio Promedio Semanal ($/Kg Exp)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="semana"
                                    tickFormatter={(str) => {
                                        const d = new Date(str);
                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                    }}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tickFormatter={(val) => `$${val}`}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    formatter={(value) => [`$${value}`, 'Precio']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="precio_promedio"
                                    name="Precio ($)"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Merma Chart - Mixed Chart */}
                <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-slate-50 col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-red-100/50">
                                <Percent className="h-4 w-4 text-red-600" />
                            </div>
                            Merma Semanal vs Volumen
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="semana"
                                    tickFormatter={(str) => {
                                        const d = new Date(str);
                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                    }}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    yAxisId="left"
                                    unit="kg"
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    yAxisId="right"
                                    unit="%"
                                    orientation="right"
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Bar
                                    yAxisId="left"
                                    dataKey="kg_merma"
                                    name="Kg Merma"
                                    fill="#fecaca"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="merma_promedio"
                                    name="% Merma"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    dot={{ fill: '#ef4444', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function KPICard({ title, value, subtitle, icon, trend }: any) {
    return (
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </CardContent>
        </Card>
    );
}
