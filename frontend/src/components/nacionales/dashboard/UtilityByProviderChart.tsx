"use client";

import { useState, useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtilidadItem } from "@/types/nacionales-dashboard";
import { cn } from "@/lib/utils";

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
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs">
                    <p className="font-bold text-slate-800 mb-1">{label}</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Utilidad:</span>
                        <span className={cn(
                            "font-mono font-medium",
                            payload[0].value >= 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                            {formatCurrency(payload[0].value)}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="h-full border-slate-200 shadow-sm flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-base font-semibold text-slate-800">
                    Distribución de Utilidades
                </CardTitle>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setMode("proveedor")}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                            mode === "proveedor"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        Por Proveedor
                    </button>
                    <button
                        onClick={() => setMode("fruta")}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                            mode === "fruta"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        Por Fruta
                    </button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
                <div className="h-full w-full mt-4 min-h-[350px]">
                    {loading ? (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm italic">
                            Cargando distribución de utilidad...
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                            No hay datos para mostrar
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    type="number"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    width={120}
                                    tickFormatter={(value) =>
                                        value.length > 18 ? `${value.substring(0, 15)}...` : value
                                    }
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar
                                    dataKey="utilidad"
                                    fill={mode === 'proveedor' ? '#10b981' : '#f59e0b'}
                                    radius={[0, 4, 4, 0]}
                                    barSize={18}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
