import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardMetricCardProps {
    title: string;
    value: string; // Formatted value
    percentChange: number;
    icon: LucideIcon;
    color: "blue" | "green" | "emerald" | "amber" | "rose" | "indigo" | "purple";
    prefix?: string;
    description?: string;
}

export function DashboardMetricCard({
    title,
    value,
    percentChange,
    icon: Icon,
    color,
    prefix,
    description
}: DashboardMetricCardProps) {

    const colorStyles = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        green: "bg-green-50 text-green-600 border-green-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
    };

    const isPositive = percentChange > 0;
    const isNegative = percentChange < 0;
    const isNeutral = percentChange === 0;

    return (
        <Card className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 font-plus-jakarta uppercase tracking-wider">
                    {title}
                </CardTitle>
                <div className={cn("p-2 rounded-full border", colorStyles[color])}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline space-x-2">
                    {prefix && <span className="text-xl font-semibold text-slate-400">{prefix}</span>}
                    <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
                        {value}
                    </div>
                </div>
                <div className="mt-2 flex items-center text-xs">
                    <span
                        className={cn(
                            "flex items-center font-medium px-1.5 py-0.5 rounded-full mr-2",
                            isPositive && "text-emerald-700 bg-emerald-50",
                            isNegative && "text-rose-700 bg-rose-50",
                            isNeutral && "text-slate-600 bg-slate-100"
                        )}
                    >
                        {isPositive && <ArrowUpRight className="mr-1 h-3 w-3" />}
                        {isNegative && <ArrowDownRight className="mr-1 h-3 w-3" />}
                        {isNeutral && <Minus className="mr-1 h-3 w-3" />}
                        {Math.abs(percentChange).toFixed(1)}%
                    </span>
                    <span className="text-slate-400">vs periodo anterior</span>
                </div>
                {description && (
                    <p className="text-xs text-slate-400 mt-2">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
