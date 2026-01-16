"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Banknote, AlertCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface EstadoCuentaProveedorMetricsProps {
    totalComprasValor: number;
    totalKilos: number;
    totalTransferido: number;
    saldoPendiente: number;
    totalUtilidad: number;
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
        maximumFractionDigits: 2,
    }).format(value);
};

interface MetricCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ReactNode;
    colorClass: string;
    valueColorClass?: string;
}

function MetricCard({ title, value, subtitle, icon, colorClass, valueColorClass }: MetricCardProps) {
    return (
        <Card className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    {title}
                </CardTitle>
                <div className={cn("p-2 rounded-full border", colorClass)}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold tabular-nums tracking-tight", valueColorClass || "text-slate-900")}>
                    {value}
                </div>
                {subtitle && (
                    <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
                )}
            </CardContent>
        </Card>
    );
}

export function EstadoCuentaProveedorMetrics({
    totalComprasValor,
    totalKilos,
    totalTransferido,
    saldoPendiente,
    totalUtilidad
}: EstadoCuentaProveedorMetricsProps) {
    const saldoPositivo = saldoPendiente > 0;
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
                title="Total Compras"
                value={formatCurrency(totalComprasValor)}
                subtitle={`${formatNumber(totalKilos)} kg`}
                icon={<ShoppingCart className="h-4 w-4 text-indigo-600" />}
                colorClass="bg-indigo-50 text-indigo-600 border-indigo-100"
            />
            <MetricCard
                title="Total Transferido"
                value={formatCurrency(totalTransferido)}
                icon={<Banknote className="h-4 w-4 text-emerald-600" />}
                colorClass="bg-emerald-50 text-emerald-600 border-emerald-100"
            />
            <MetricCard
                title="Saldo Pendiente"
                value={formatCurrency(saldoPendiente)}
                icon={<AlertCircle className={cn("h-4 w-4", saldoPositivo ? "text-amber-600" : "text-emerald-600")} />}
                colorClass={cn(saldoPositivo ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100")}
                valueColorClass={saldoPositivo ? "text-amber-700" : "text-emerald-700"}
            />
            <MetricCard
                title="Utilidad"
                value={formatCurrency(totalUtilidad)}
                icon={<TrendingUp className={cn("h-4 w-4", totalUtilidad >= 0 ? "text-green-600" : "text-rose-600")} />}
                colorClass={cn(totalUtilidad >= 0 ? "bg-green-50 text-green-600 border-green-100" : "bg-rose-50 text-rose-600 border-rose-100")}
                valueColorClass={totalUtilidad >= 0 ? "text-green-700" : "text-rose-700"}
            />
        </div>
    );
}
