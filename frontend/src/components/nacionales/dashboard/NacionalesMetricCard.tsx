import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NacionalesMetricCardProps {
    title: string;
    value: string;
    percentChange: number;
    icon: LucideIcon;
    color: "blue" | "green" | "emerald" | "amber" | "rose" | "indigo" | "purple";
    onClick?: () => void;
    isClickable?: boolean;
    invertTrend?: boolean;
}

export function NacionalesMetricCard({
    title,
    value,
    percentChange,
    icon: Icon,
    color,
    onClick,
    isClickable = false,
    invertTrend = false
}: NacionalesMetricCardProps) {

    const colorStyles = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        green: "bg-green-50 text-green-600 border-green-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
    };

    const rawPositive = percentChange > 0;
    const rawNegative = percentChange < 0;
    const isNeutral = percentChange === 0;

    const isPositive = invertTrend ? rawNegative : rawPositive;
    const isNegative = invertTrend ? rawPositive : rawNegative;

    return (
        <Card
            className={cn(
                "overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group",
                isClickable && "cursor-pointer hover:border-emerald-300"
            )}
            onClick={isClickable ? onClick : undefined}
        >
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
                        {rawPositive && <ArrowUpRight className="mr-1 h-3 w-3" />}
                        {rawNegative && <ArrowDownRight className="mr-1 h-3 w-3" />}
                        {isNeutral && <Minus className="mr-1 h-3 w-3" />}
                        {Math.abs(percentChange).toFixed(1)}%
                    </span>
                    <span className="text-slate-400">vs periodo anterior</span>
                </div>
            </CardContent>
        </Card>
    );
}
