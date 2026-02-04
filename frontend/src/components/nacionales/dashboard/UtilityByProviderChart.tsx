"use client";

import { useState, useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtilidadItem } from "@/types/nacionales-dashboard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, Package } from "lucide-react";

interface UtilityByProviderChartProps {
    utilidadesProveedor: UtilidadItem[];
    utilidadesFruta: UtilidadItem[];
    loading?: boolean;
}

type ViewMode = "proveedor" | "fruta";

export function UtilityByProviderChart({
    utilidadesProveedor,
    utilidadesFruta,
    loading
}: UtilityByProviderChartProps) {
    const [mode, setMode] = useState<ViewMode>("proveedor");

    const chartData = useMemo(() => {
        const data = mode === "proveedor" ? utilidadesProveedor : utilidadesFruta;
        return data.map(item => ({
            name: item.nombre,
            utilidad: item.utilidad
        }));
    }, [mode, utilidadesProveedor, utilidadesFruta]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const value = payload[0].value;
            return (
                <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-xl text-xs">
                    <p className="font-semibold text-slate-800 mb-2 text-sm">{label}</p>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            value >= 0 ? "bg-emerald-100" : "bg-rose-100"
                        )}>
                            <TrendingUp className={cn(
                                "h-5 w-5",
                                value >= 0 ? "text-emerald-600" : "text-rose-600"
                            )} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider font-medium">
                                Utilidad
                            </p>
                            <p className={cn(
                                "text-lg font-bold tabular-nums",
                                value >= 0 ? "text-emerald-600" : "text-rose-600"
                            )}>
                                {formatCurrency(value)}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const getBarColor = (value: number) => {
        if (mode === 'proveedor') {
            return value >= 0 ? '#10b981' : '#ef4444';
        }
        return value >= 0 ? '#f59e0b' : '#ef4444';
    };

    return (
        <Card className="h-full border-slate-200/60 shadow-soft-md overflow-hidden flex flex-col bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6 space-y-0 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200/50">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold text-slate-800">
                            Distribución de Utilidades
                        </CardTitle>
                        <p className="text-xs text-slate-500">
                            Análisis por {mode === 'proveedor' ? 'proveedor' : 'tipo de fruta'}
                        </p>
                    </div>
                </div>

                <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                    <button
                        onClick={() => setMode("proveedor")}
                        className={cn(
                            "px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-2",
                            mode === "proveedor"
                                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        )}
                    >
                        <Package className="h-3.5 w-3.5" />
                        Por Proveedor
                    </button>
                    <button
                        onClick={() => setMode("fruta")}
                        className={cn(
                            "px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-2",
                            mode === "fruta"
                                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        )}
                    >
                        <Package className="h-3.5 w-3.5" />
                        Por Fruta
                    </button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-6">
                <div className="h-full w-full min-h-[380px]">
                    {loading ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                            <div className="relative mb-4">
                                <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 border-t-emerald-500" />
                            </div>
                            <p className="text-sm font-medium">Cargando datos...</p>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                            <div className="p-4 rounded-full bg-slate-100 mb-3">
                                <TrendingUp className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium">No hay datos para mostrar</p>
                            <p className="text-xs text-slate-400 mt-1">Ajusta los filtros para ver resultados</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    horizontal={true}
                                    vertical={false}
                                    stroke="#e2e8f0"
                                    opacity={0.5}
                                />
                                <XAxis
                                    type="number"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                                    width={140}
                                    tickFormatter={(value) =>
                                        value.length > 20 ? `${value.substring(0, 17)}...` : value
                                    }
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: '#f8fafc', opacity: 0.8 }}
                                />
                                <Bar
                                    dataKey="utilidad"
                                    radius={[0, 8, 8, 0]}
                                    barSize={24}
                                    animationDuration={1000}
                                    animationBegin={0}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={getBarColor(entry.utilidad)}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
