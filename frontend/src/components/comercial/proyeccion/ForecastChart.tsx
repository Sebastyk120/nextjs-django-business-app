import { useMemo } from "react";
import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoricalDataPoint, ForecastDataPoint } from "@/types/proyeccion";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface ForecastChartProps {
    historicalData: HistoricalDataPoint[];
    forecastData: ForecastDataPoint[];
    loading?: boolean;
    metric?: 'kilos' | 'cajas' | 'valor';
}

export function ForecastChart({
    historicalData,
    forecastData,
    loading,
    metric = 'kilos'
}: ForecastChartProps) {
    const chartData = useMemo(() => {
        // 1. Aggregate historical data to MONTHLY
        const monthlyHistorical: Record<string, { kilos: number; cajas: number; valor: number }> = {};

        historicalData.forEach(d => {
            try {
                const date = parseISO(d.fecha);
                // Create a key for the first day of the month
                const monthKey = format(date, 'yyyy-MM-01');

                if (!monthlyHistorical[monthKey]) {
                    monthlyHistorical[monthKey] = { kilos: 0, cajas: 0, valor: 0 };
                }
                monthlyHistorical[monthKey].kilos += d.kilos || 0;
                monthlyHistorical[monthKey].cajas += d.cajas || 0;
                monthlyHistorical[monthKey].valor += d.valor || 0;
            } catch (e) {
                // Skip invalid dates
            }
        });

        // Convert to array and prepare for chart
        const historicalMonthly = Object.entries(monthlyHistorical).map(([fecha, values]) => ({
            fecha,
            dateObj: parseISO(fecha),
            historical: values[metric],
            forecast: null as number | null,
            lower: null as number | null,
            upper: null as number | null
        }));

        // 2. Process forecast data (already monthly from backend)
        const forecastMonthly = forecastData.map(d => ({
            fecha: d.fecha,
            dateObj: parseISO(d.fecha),
            historical: null as number | null,
            forecast: d[metric],
            lower: (d as any)[`${metric}_lower`],
            upper: (d as any)[`${metric}_upper`]
        }));

        // 3. Combine and sort by date
        const combined = [...historicalMonthly, ...forecastMonthly].sort((a, b) =>
            a.dateObj.getTime() - b.dateObj.getTime()
        );

        // 4. Bridge: Set last historical point's forecast to its own value for smooth transition
        if (combined.length > 0) {
            const lastHistoricalIdx = combined.findIndex(d => d.forecast !== null) - 1;
            if (lastHistoricalIdx >= 0 && combined[lastHistoricalIdx]) {
                // The first forecast point should also have the last historical value for continuity
                // Actually, it's cleaner to just let them be separate. Recharts connectNulls handles it.
            }
        }

        return combined;
    }, [historicalData, forecastData, metric]);

    const formatYAxis = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
        return value.toLocaleString();
    };

    const formatXAxis = (dateStr: string) => {
        try {
            return format(parseISO(dateStr), 'MMM yy', { locale: es });
        } catch {
            return dateStr;
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const historicalValue = payload.find((p: any) => p.dataKey === 'historical')?.value;
            const forecastValue = payload.find((p: any) => p.dataKey === 'forecast')?.value;

            return (
                <div className="bg-white/95 backdrop-blur p-3 border border-slate-200 shadow-xl rounded-lg text-xs">
                    <p className="font-bold text-slate-800 mb-2 border-b pb-1">
                        {format(parseISO(label), 'MMMM yyyy', { locale: es })}
                    </p>
                    {historicalValue !== null && historicalValue !== undefined && (
                        <div className="flex items-center gap-2 text-blue-600">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>Histórico:</span>
                            <span className="font-mono font-bold ml-auto">
                                {metric === 'valor' ? '$' : ''}
                                {historicalValue.toLocaleString()}
                                {metric === 'kilos' ? ' kg' : ''}
                            </span>
                        </div>
                    )}
                    {forecastValue !== null && forecastValue !== undefined && (
                        <div className="flex items-center gap-2 text-emerald-600 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Proyección:</span>
                            <span className="font-mono font-bold ml-auto">
                                {metric === 'valor' ? '$' : ''}
                                {forecastValue.toLocaleString()}
                                {metric === 'kilos' ? ' kg' : ''}
                            </span>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const metricLabel = metric === 'kilos' ? 'Kilos' : metric === 'cajas' ? 'Cajas' : 'Ventas USD';

    if (loading) {
        return (
            <Card className="h-full border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold text-slate-800">
                        Proyección Mensual - {metricLabel}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] flex items-center justify-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            Cargando gráfico...
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-800 flex justify-between items-center">
                    <span>Proyección Mensual - {metricLabel}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                            <defs>
                                <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />

                            <XAxis
                                dataKey="fecha"
                                tickFormatter={formatXAxis}
                                tick={{ fill: '#64748b', fontSize: 10 }}
                                tickLine={false}
                                axisLine={{ stroke: '#e2e8f0' }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                interval="preserveStartEnd"
                            />

                            <YAxis
                                tickFormatter={formatYAxis}
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                width={50}
                            />

                            <Tooltip content={<CustomTooltip />} />

                            <Legend
                                verticalAlign="top"
                                height={40}
                                formatter={(value) => (
                                    <span className="text-xs font-medium text-slate-600">{value}</span>
                                )}
                            />

                            {/* Historical Area with gradient fill */}
                            <Area
                                type="monotone"
                                dataKey="historical"
                                name="Histórico"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fill="url(#historicalGradient)"
                                dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                                activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                                connectNulls={false}
                            />

                            {/* Forecast Confidence Interval */}
                            <Area
                                type="monotone"
                                dataKey="upper"
                                stroke="none"
                                fill="url(#forecastGradient)"
                                name="Intervalo Confianza"
                                connectNulls={false}
                                legendType="none"
                            />

                            {/* Forecast Line */}
                            <Line
                                type="monotone"
                                dataKey="forecast"
                                name="Proyección"
                                stroke="#10b981"
                                strokeWidth={2.5}
                                strokeDasharray="6 4"
                                dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                                activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                                connectNulls={false}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
