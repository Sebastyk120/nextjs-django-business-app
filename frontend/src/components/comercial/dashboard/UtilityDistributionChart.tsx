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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtilidadData } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { Users, Apple, Building2 } from "lucide-react";

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

        const mergedData = currentData.map(item => {
            const name = (item as any)[nameKey] || "Desconocido";
            const prevItem = prevData.find(p => (p as any)[nameKey] === name);

            return {
                name,
                current: item.total_utilidad,
                prev: prevItem ? prevItem.total_utilidad : 0
            };
        });

        return mergedData;
    }, [data, mode]);

    const modeConfig = {
        cliente: {
            label: "Por Cliente",
            icon: Users,
            color: "#10b981",
            gradient: ["#10b981", "#059669"]
        },
        fruta: {
            label: "Por Fruta",
            icon: Apple,
            color: "#f59e0b",
            gradient: ["#f59e0b", "#d97706"]
        },
        exportador: {
            label: "Por Exportador",
            icon: Building2,
            color: "#3b82f6",
            gradient: ["#3b82f6", "#2563eb"]
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const current = payload.find((p: any) => p.dataKey === 'current');
            const prev = payload.find((p: any) => p.dataKey === 'prev');
            const currentValue = current?.value || 0;
            const prevValue = prev?.value || 0;
            const change = prevValue > 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0;

            return (
                <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-xl text-xs min-w-[200px]">
                    <p className="font-bold text-slate-800 mb-3 text-sm">{label}</p>
                    
                    <div className="space-y-2">
                        {current && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="w-3 h-3 rounded-sm" 
                                        style={{ backgroundColor: modeConfig[mode].color }}
                                    />
                                    <span className="text-slate-600 font-medium">Actual:</span>
                                </div>
                                <span className="font-mono font-bold text-slate-900">
                                    ${currentValue.toLocaleString()}
                                </span>
                            </div>
                        )}
                        
                        {prev && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-slate-300" />
                                    <span className="text-slate-500">Anterior:</span>
                                </div>
                                <span className="font-mono text-slate-600">
                                    ${prevValue.toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Variación:</span>
                            <span className={cn(
                                "font-bold",
                                change > 0 ? "text-emerald-600" : change < 0 ? "text-rose-600" : "text-slate-600"
                            )}>
                                {change > 0 ? "+" : ""}{change.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const currentMode = modeConfig[mode];
    const Icon = currentMode.icon;

    return (
        <Card className="h-full border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 space-y-3 sm:space-y-0 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                        style={{ backgroundColor: currentMode.color }}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-bold text-slate-800">
                            Distribución de Utilidad
                        </CardTitle>
                        <p className="text-[11px] text-slate-400">
                            Comparativa por {mode}
                        </p>
                    </div>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {(Object.keys(modeConfig) as ViewMode[]).map((m) => {
                        const config = modeConfig[m];
                        const IconComponent = config.icon;
                        return (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                                    mode === m
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <IconComponent className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{config.label}</span>
                            </button>
                        );
                    })}
                </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-5">
                <div className="h-full w-full min-h-[450px]">
                    {loading ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mb-3" />
                            <span className="text-sm">Cargando distribución...</span>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                <Icon className="h-8 w-8 text-slate-300" />
                            </div>
                            <span className="text-sm font-medium">No hay datos disponibles</span>
                            <p className="text-xs text-slate-400 mt-1">Intenta con diferentes filtros</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 10, bottom: 80 }}
                                barGap={4}
                            >
                                <defs>
                                    <linearGradient id={`gradient-${mode}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={currentMode.gradient[0]} stopOpacity={0.9} />
                                        <stop offset="100%" stopColor={currentMode.gradient[1]} stopOpacity={0.7} />
                                    </linearGradient>
                                </defs>
                                
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                    interval={0}
                                    angle={-35}
                                    textAnchor="end"
                                    height={80}
                                    tickFormatter={(value) =>
                                        value.length > 18 ? `${value.substring(0, 15)}...` : value
                                    }
                                />
                                
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                />
                                
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600 }}
                                    iconSize={10}
                                    iconType="circle"
                                />
                                
                                <Bar
                                    dataKey="prev"
                                    name="Periodo Anterior"
                                    fill="#cbd5e1"
                                    radius={[4, 4, 0, 0]}
                                    barSize={24}
                                    animationDuration={1000}
                                />
                                
                                <Bar
                                    dataKey="current"
                                    name="Periodo Actual"
                                    fill={`url(#gradient-${mode})`}
                                    radius={[4, 4, 0, 0]}
                                    barSize={24}
                                    animationDuration={1000}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
