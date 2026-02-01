import { Plane, Scale, Clock, TrendingUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface AirlineData {
    name: string;
    kg_sent: number;
    avg_weight_diff: number;
    avg_delay_hours: number;
    delayed_percentage: number;
}

interface AirlinePerformanceCardProps {
    data: AirlineData[];
}

export function AirlinePerformanceCard({ data }: AirlinePerformanceCardProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-500 h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-50 rounded-full">
                        <Plane className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">No hay datos de aerolíneas disponibles</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow duration-300">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                <h3 className="font-bold text-slate-800 font-plus-jakarta flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Plane className="h-5 w-5 text-indigo-600" />
                    </div>
                    Aerolíneas Performance
                </h3>
                <span className="text-xs text-slate-400 font-medium">60 días</span>
            </div>
            <ScrollArea className="flex-1">
                <div className="divide-y divide-slate-100">
                    {data.map((airline, idx) => (
                        <div key={idx} className="p-4 hover:bg-slate-50/80 transition-colors group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                        {idx + 1}
                                    </span>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{airline.name}</h4>
                                        <span className="text-xs text-slate-500 font-medium">
                                            {airline.kg_sent.toLocaleString()} kg enviados
                                        </span>
                                    </div>
                                </div>
                                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${airline.delayed_percentage > 20 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}
                                >
                                    <TrendingUp className="h-3 w-3" />
                                    {airline.delayed_percentage}% Retrasos
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 group-hover:border-slate-200 transition-colors">
                                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                                        <Scale className="h-3.5 w-3.5" />
                                        <span className="text-xs font-medium">Dif. Peso Prom</span>
                                    </div>
                                    <p className={`text-sm font-bold ${Math.abs(airline.avg_weight_diff) > 5 ? 'text-amber-600' : 'text-slate-700'
                                        }`}
                                    >
                                        {airline.avg_weight_diff > 0 ? '+' : ''}{airline.avg_weight_diff} kg
                                    </p>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 group-hover:border-slate-200 transition-colors">
                                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span className="text-xs font-medium">Retraso Prom</span>
                                    </div>
                                    <p className={`text-sm font-bold ${airline.avg_delay_hours > 2 ? 'text-rose-600' : 'text-slate-700'
                                        }`}
                                    >
                                        {airline.avg_delay_hours} hrs
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
