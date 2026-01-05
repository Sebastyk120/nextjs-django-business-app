import { useState, useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtilidadData } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface UtilityDistributionChartProps {
    data: {
        cliente: UtilidadData[];
        cliente_prev: UtilidadData[];
        fruta: UtilidadData[];
        fruta_prev: UtilidadData[];
        exportador: UtilidadData[];
        exportador_prev: UtilidadData[];
    };
    loading?: boolean;
}

type ViewMode = "cliente" | "fruta" | "exportador";

export function UtilityDistributionChart({ data, loading }: UtilityDistributionChartProps) {
    const [mode, setMode] = useState<ViewMode>("cliente");

    const chartData = useMemo(() => {
        let currentData: UtilidadData[] = [];
        let prevData: UtilidadData[] = [];
        let nameKey = "";

        switch (mode) {
            case "cliente":
                currentData = data.cliente;
                prevData = data.cliente_prev;
                nameKey = "cliente__nombre";
                break;
            case "fruta":
                currentData = data.fruta;
                prevData = data.fruta_prev;
                nameKey = "fruta__nombre";
                break;
            case "exportador":
                currentData = data.exportador;
                prevData = data.exportador_prev;
                nameKey = "exportadora__nombre";
                break;
        }

        // Merge current and previous data
        const mergedData = currentData.map(item => {
            const name = (item as any)[nameKey] || "Desconocido";
            // Find corresponding previous item
            const prevItem = prevData.find(p => (p as any)[nameKey] === name);

            return {
                name,
                current: item.total_utilidad,
                prev: prevItem ? prevItem.total_utilidad : 0
            };
        });

        return mergedData;
    }, [data, mode]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs">
                    <p className="font-bold text-slate-800 mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} style={{ color: entry.color }} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span>{entry.name}:</span>
                            <span className="font-mono font-medium">
                                ${entry.value.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="h-full border-slate-200 shadow-sm flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-base font-semibold text-slate-800">
                    Distribución de Utilidad USD
                </CardTitle>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setMode("cliente")}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                            mode === "cliente"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        Por Cliente
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
                    <button
                        onClick={() => setMode("exportador")}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                            mode === "exportador"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        Por Exportador
                    </button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
                <div className="h-full w-full mt-4 min-h-[450px]">
                    {loading ? (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm italic">
                            Cargando distribución de utilidad...
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                            No hay datos para mostrar en este nivel de detalle
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                                barGap={0}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    interval={0}
                                    angle={-45}
                                    textAnchor="end"
                                    height={75}
                                    tickFormatter={(value) =>
                                        value.length > 15 ? `${value.substring(0, 12)}...` : value
                                    }
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px' }}
                                    iconSize={8}
                                    iconType="circle"
                                />
                                <Bar
                                    dataKey="prev"
                                    name="Periodo Anterior"
                                    fill="#cbd5e1"
                                    radius={[4, 4, 0, 0]}
                                    barSize={20}
                                />
                                <Bar
                                    dataKey="current"
                                    name="Periodo Actual"
                                    fill={
                                        mode === 'cliente' ? '#10b981' :
                                            mode === 'fruta' ? '#f59e0b' :
                                                '#3b82f6'
                                    }
                                    radius={[4, 4, 0, 0]}
                                    barSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
