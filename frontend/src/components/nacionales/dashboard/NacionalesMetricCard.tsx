import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface NacionalesMetricCardProps {
    title: string;
    value: string;
    percentChange: number;
    icon: LucideIcon;
    color: "blue" | "green" | "emerald" | "amber" | "rose" | "indigo" | "purple";
    subtitle?: string;
    onClick?: () => void;
    isClickable?: boolean;
    invertTrend?: boolean;
}

const colorConfig = {
    blue: {
        bg: "from-blue-500 to-blue-600",
        light: "bg-blue-50",
        border: "border-blue-100",
        text: "text-blue-600",
        shadow: "shadow-blue-500/20",
        ring: "ring-blue-500/20"
    },
    green: {
        bg: "from-green-500 to-green-600",
        light: "bg-green-50",
        border: "border-green-100",
        text: "text-green-600",
        shadow: "shadow-green-500/20",
        ring: "ring-green-500/20"
    },
    emerald: {
        bg: "from-emerald-500 to-emerald-600",
        light: "bg-emerald-50",
        border: "border-emerald-100",
        text: "text-emerald-600",
        shadow: "shadow-emerald-500/20",
        ring: "ring-emerald-500/20"
    },
    amber: {
        bg: "from-amber-500 to-amber-600",
        light: "bg-amber-50",
        border: "border-amber-100",
        text: "text-amber-600",
        shadow: "shadow-amber-500/20",
        ring: "ring-amber-500/20"
    },
    rose: {
        bg: "from-rose-500 to-rose-600",
        light: "bg-rose-50",
        border: "border-rose-100",
        text: "text-rose-600",
        shadow: "shadow-rose-500/20",
        ring: "ring-rose-500/20"
    },
    indigo: {
        bg: "from-indigo-500 to-indigo-600",
        light: "bg-indigo-50",
        border: "border-indigo-100",
        text: "text-indigo-600",
        shadow: "shadow-indigo-500/20",
        ring: "ring-indigo-500/20"
    },
    purple: {
        bg: "from-purple-500 to-purple-600",
        light: "bg-purple-50",
        border: "border-purple-100",
        text: "text-purple-600",
        shadow: "shadow-purple-500/20",
        ring: "ring-purple-500/20"
    },
};

export function NacionalesMetricCard({
    title,
    value,
    percentChange,
    icon: Icon,
    color,
    subtitle,
    onClick,
    isClickable = false,
    invertTrend = false
}: NacionalesMetricCardProps) {
    const colors = colorConfig[color];
    const rawPositive = percentChange > 0;
    const rawNegative = percentChange < 0;
    const isNeutral = percentChange === 0;

    const isPositive = invertTrend ? rawNegative : rawPositive;
    const isNegative = invertTrend ? rawPositive : rawNegative;

    return (
        <motion.div
            whileHover={isClickable ? { y: -4, scale: 1.02 } : { y: -2 }}
            whileTap={isClickable ? { scale: 0.98 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            <Card
                className={cn(
                    "relative overflow-hidden border-slate-200/60 bg-white transition-all duration-300",
                    "shadow-soft-sm hover:shadow-soft-md",
                    isClickable && "cursor-pointer hover:border-emerald-300/50",
                    isClickable && colors.ring
                )}
                onClick={isClickable ? onClick : undefined}
            >
                {/* Subtle gradient overlay on hover */}
                <div className={cn(
                    "absolute inset-0 opacity-0 transition-opacity duration-300",
                    "bg-gradient-to-br from-transparent via-transparent to-slate-50/50",
                    "group-hover:opacity-100"
                )} />

                <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-3 pt-5 px-5">
                    <div className="space-y-1">
                        <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {title}
                        </CardTitle>
                        {subtitle && (
                            <p className="text-[10px] text-slate-400">{subtitle}</p>
                        )}
                    </div>
                    <div className={cn(
                        "p-2.5 rounded-xl bg-gradient-to-br shadow-lg",
                        colors.bg,
                        colors.shadow
                    )}>
                        <Icon className="h-4 w-4 text-white" />
                    </div>
                </CardHeader>

                <CardContent className="relative pb-5 px-5">
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
                            {value}
                        </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <span
                            className={cn(
                                "inline-flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-semibold",
                                isPositive && "text-emerald-700 bg-emerald-100/80",
                                isNegative && "text-rose-700 bg-rose-100/80",
                                isNeutral && "text-slate-600 bg-slate-100"
                            )}
                        >
                            {rawPositive && <ArrowUpRight className="h-3 w-3" />}
                            {rawNegative && <ArrowDownRight className="h-3 w-3" />}
                            {isNeutral && <Minus className="h-3 w-3" />}
                            {Math.abs(percentChange).toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                            vs periodo anterior
                        </span>
                    </div>
                </CardContent>

                {/* Clickable indicator */}
                {isClickable && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </Card>
        </motion.div>
    );
}
