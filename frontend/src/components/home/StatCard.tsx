import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    className?: string;
    color?: "emerald" | "blue" | "indigo" | "rose" | "amber" | "purple" | "cyan";
    onClick?: () => void;
}

const COLORS = {
    emerald: {
        bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50",
        icon: "bg-emerald-500 text-white shadow-emerald-200",
        border: "border-emerald-100",
        hover: "hover:border-emerald-300 hover:shadow-emerald-100"
    },
    blue: {
        bg: "bg-gradient-to-br from-blue-50 to-blue-100/50",
        icon: "bg-blue-500 text-white shadow-blue-200",
        border: "border-blue-100",
        hover: "hover:border-blue-300 hover:shadow-blue-100"
    },
    indigo: {
        bg: "bg-gradient-to-br from-indigo-50 to-indigo-100/50",
        icon: "bg-indigo-500 text-white shadow-indigo-200",
        border: "border-indigo-100",
        hover: "hover:border-indigo-300 hover:shadow-indigo-100"
    },
    rose: {
        bg: "bg-gradient-to-br from-rose-50 to-rose-100/50",
        icon: "bg-rose-500 text-white shadow-rose-200",
        border: "border-rose-100",
        hover: "hover:border-rose-300 hover:shadow-rose-100"
    },
    amber: {
        bg: "bg-gradient-to-br from-amber-50 to-amber-100/50",
        icon: "bg-amber-500 text-white shadow-amber-200",
        border: "border-amber-100",
        hover: "hover:border-amber-300 hover:shadow-amber-200"
    },
    purple: {
        bg: "bg-gradient-to-br from-purple-50 to-purple-100/50",
        icon: "bg-purple-500 text-white shadow-purple-200",
        border: "border-purple-100",
        hover: "hover:border-purple-300 hover:shadow-purple-100"
    },
    cyan: {
        bg: "bg-gradient-to-br from-cyan-50 to-cyan-100/50",
        icon: "bg-cyan-500 text-white shadow-cyan-200",
        border: "border-cyan-100",
        hover: "hover:border-cyan-300 hover:shadow-cyan-100"
    },
};

export function StatCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    trendUp,
    className,
    color = "blue",
    onClick
}: StatCardProps) {
    const colorStyles = COLORS[color];

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-2xl border bg-white p-6 transition-all duration-300",
                "hover:shadow-lg hover:-translate-y-1 cursor-pointer",
                colorStyles.border,
                colorStyles.hover,
                className
            )}
        >
            {/* Subtle gradient background */}
            <div className={cn("absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100", colorStyles.bg)} />

            <div className="relative flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500 group-hover:text-slate-600 transition-colors">{title}</p>
                    <h3 className="text-3xl font-bold tracking-tight text-slate-900 font-plus-jakarta">
                        {value}
                    </h3>
                </div>
                <div className={cn(
                    "rounded-xl p-3 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl",
                    colorStyles.icon
                )}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            {(description || trend) && (
                <div className="relative mt-4 flex items-center gap-2 text-sm">
                    {trend && (
                        <span className={cn(
                            "font-semibold px-2 py-0.5 rounded-full text-xs",
                            trendUp === true && "bg-emerald-100 text-emerald-700",
                            trendUp === false && "bg-rose-100 text-rose-700",
                            trendUp === undefined && "bg-slate-100 text-slate-600"
                        )}>
                            {trend}
                        </span>
                    )}
                    {description && (
                        <span className="text-slate-500 line-clamp-1 group-hover:text-slate-600 transition-colors">
                            {description}
                        </span>
                    )}
                </div>
            )}

            {/* Decorative background pattern */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 rotate-12">
                <Icon className="h-24 w-24" />
            </div>
        </div>
    );
}
