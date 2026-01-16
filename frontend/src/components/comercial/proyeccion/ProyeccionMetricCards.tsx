import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryMetrics } from "@/types/proyeccion";
import { ArrowUpRight, ArrowDownRight, History, TrendingUp, DollarSign, Package, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    historical: number;
    forecast: number;
    growth: number;
    icon: any;
    format?: 'number' | 'currency';
}

function MetricCard({ title, historical, forecast, growth, icon: Icon, format = 'number' }: MetricCardProps) {
    const isPositive = growth >= 0;

    const formatter = new Intl.NumberFormat('es-CO', {
        style: format === 'currency' ? 'currency' : 'decimal',
        currency: 'USD',
        maximumFractionDigits: 0
    });

    return (
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-500">
                    {title}
                </CardTitle>
                <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <p className="text-2xl font-bold text-slate-900">
                            {formatter.format(forecast)}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">Proyección Total</p>
                    </div>
                    <div className={cn(
                        "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                        isPositive ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
                    )}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {Math.abs(growth).toFixed(1)}%
                    </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                    <div className="flex items-center">
                        <History className="w-3 h-3 mr-1" />
                        Histórico: <span className="font-semibold text-slate-700 ml-1">{formatter.format(historical)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function ProyeccionMetricCards({ metrics }: { metrics: SummaryMetrics }) {
    if (!metrics) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
                title="Proyección de Kilos"
                historical={metrics.historical.kilos}
                forecast={metrics.forecast.kilos}
                growth={metrics.growth_percent.kilos}
                icon={Scale}
                format="number"
            />
            <MetricCard
                title="Proyección de Cajas"
                historical={metrics.historical.cajas}
                forecast={metrics.forecast.cajas}
                growth={metrics.growth_percent.cajas}
                icon={Package}
                format="number"
            />
            <MetricCard
                title="Proyección de Ventas USD"
                historical={metrics.historical.valor}
                forecast={metrics.forecast.valor}
                growth={metrics.growth_percent.valor}
                icon={DollarSign}
                format="currency"
            />
        </div>
    );
}
