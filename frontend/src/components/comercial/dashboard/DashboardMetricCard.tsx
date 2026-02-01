import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardMetricCardProps {
    title: string;
    value: string;
    percentChange: number;
    icon: LucideIcon;
    color: "blue" | "green" | "emerald" | "amber" | "rose" | "indigo" | "purple" | "cyan" | "teal";
    prefix?: string;
    description?: string;
    subtitle?: string;
}

export function DashboardMetricCard({
    title,
    value,
    percentChange,
    icon: Icon,
    color,
    prefix,
    description,
    subtitle
}: DashboardMetricCardProps) {

    const colorStyles = {
        blue: {
            bg: "bg-gradient-to-br from-blue-500/10 to-blue-600/5",
            iconBg: "bg-blue-500",
            iconColor: "text-white",
            border: "border-blue-200/50",
            glow: "shadow-blue-500/20"
        },
        green: {
            bg: "bg-gradient-to-br from-green-500/10 to-green-600/5",
            iconBg: "bg-green-500",
            iconColor: "text-white",
            border: "border-green-200/50",
            glow: "shadow-green-500/20"
        },
        emerald: {
            bg: "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5",
            iconBg: "bg-emerald-500",
            iconColor: "text-white",
            border: "border-emerald-200/50",
            glow: "shadow-emerald-500/20"
        },
        amber: {
            bg: "bg-gradient-to-br from-amber-500/10 to-amber-600/5",
            iconBg: "bg-amber-500",
            iconColor: "text-white",
            border: "border-amber-200/50",
            glow: "shadow-amber-500/20"
        },
        rose: {
            bg: "bg-gradient-to-br from-rose-500/10 to-rose-600/5",
            iconBg: "bg-rose-500",
            iconColor: "text-white",
            border: "border-rose-200/50",
            glow: "shadow-rose-500/20"
        },
        indigo: {
            bg: "bg-gradient-to-br from-indigo-500/10 to-indigo-600/5",
            iconBg: "bg-indigo-500",
            iconColor: "text-white",
            border: "border-indigo-200/50",
            glow: "shadow-indigo-500/20"
        },
        purple: {
            bg: "bg-gradient-to-br from-purple-500/10 to-purple-600/5",
            iconBg: "bg-purple-500",
            iconColor: "text-white",
            border: "border-purple-200/50",
            glow: "shadow-purple-500/20"
        },
        cyan: {
            bg: "bg-gradient-to-br from-cyan-500/10 to-cyan-600/5",
            iconBg: "bg-cyan-500",
            iconColor: "text-white",
            border: "border-cyan-200/50",
            glow: "shadow-cyan-500/20"
        },
        teal: {
            bg: "bg-gradient-to-br from-teal-500/10 to-teal-600/5",
            iconBg: "bg-teal-500",
            iconColor: "text-white",
            border: "border-teal-200/50",
            glow: "shadow-teal-500/20"
        }
    };

    const isPositive = percentChange > 0;
    const isNegative = percentChange < 0;
    const isNeutral = percentChange === 0;

    const styles = colorStyles[color];

    return (
        <Card className={cn(
            "relative overflow-hidden border bg-white",
            "hover:shadow-lg hover:shadow-slate-200/50",
            "transition-all duration-300 ease-out",
            "group cursor-default",
            styles.border
        )}>
            {/* Subtle gradient background */}
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500", styles.bg)} />
            
            <CardContent className="relative p-5">
                {/* Header with icon */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            {title}
                        </p>
                        {subtitle && (
                            <p className="text-[10px] text-slate-400 truncate">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <div className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                        "shadow-lg shadow-slate-200/50",
                        styles.iconBg,
                        styles.iconColor,
                        "group-hover:scale-110 group-hover:shadow-xl",
                        "transition-all duration-300"
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>

                {/* Value display */}
                <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                        {prefix && (
                            <span className="text-lg font-semibold text-slate-400">
                                {prefix}
                            </span>
                        )}
                        <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
                            {value}
                        </span>
                    </div>
                </div>

                {/* Trend indicator */}
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold",
                        isPositive && "bg-emerald-100 text-emerald-700",
                        isNegative && "bg-rose-100 text-rose-700",
                        isNeutral && "bg-slate-100 text-slate-600"
                    )}>
                        {isPositive && <ArrowUpRight className="h-3 w-3" />}
                        {isNegative && <ArrowDownRight className="h-3 w-3" />}
                        {isNeutral && <Minus className="h-3 w-3" />}
                        <span>{Math.abs(percentChange).toFixed(1)}%</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                        vs anterior
                    </span>
                </div>

                {/* Optional description */}
                {description && (
                    <p className="mt-3 text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
