import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: React.ReactNode;
    trend?: string; // e.g. "+12% vs last month"
    trendUp?: boolean; // true for green, false for red
    className?: string;
    color?: "emerald" | "blue" | "indigo" | "rose" | "amber" | "purple" | "cyan";
    onClick?: () => void;
}

const COLORS = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
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
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1",
                onClick && "cursor-pointer",
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-plus-jakarta">
                        {value}
                    </h3>
                </div>
                <div className={cn("rounded-xl p-2.5 transition-colors", COLORS[color])}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            {(description || trend) && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                    {trend && (
                        <span className={cn(
                            "font-semibold",
                            trendUp === true && "text-emerald-600",
                            trendUp === false && "text-rose-600",
                            trendUp === undefined && "text-slate-600"
                        )}>
                            {trend}
                        </span>
                    )}
                    {description && (
                        <span className="text-slate-500 line-clamp-1">
                            {description}
                        </span>
                    )}
                </div>
            )}

            {/* Decorative background pattern */}
            <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity rotate-12">
                <Icon className="h-32 w-32" />
            </div>
        </div>
    );
}
