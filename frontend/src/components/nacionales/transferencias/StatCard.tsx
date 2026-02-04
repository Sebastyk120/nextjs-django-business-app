"use client";

import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
    title: string;
    value: number | string;
    subtitle: string;
    icon: LucideIcon;
    color: "blue" | "emerald" | "indigo" | "amber" | "rose" | "purple";
    loading?: boolean;
    format?: "number" | "currency" | "percentage";
}

const colorStyles = {
    blue: {
        bg: "bg-blue-500",
        light: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-100",
        gradient: "from-blue-500 to-blue-600"
    },
    emerald: {
        bg: "bg-emerald-500",
        light: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
        gradient: "from-emerald-500 to-emerald-600"
    },
    indigo: {
        bg: "bg-indigo-500",
        light: "bg-indigo-50",
        text: "text-indigo-600",
        border: "border-indigo-100",
        gradient: "from-indigo-500 to-indigo-600"
    },
    amber: {
        bg: "bg-amber-500",
        light: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
        gradient: "from-amber-500 to-amber-600"
    },
    rose: {
        bg: "bg-rose-500",
        light: "bg-rose-50",
        text: "text-rose-600",
        border: "border-rose-100",
        gradient: "from-rose-500 to-rose-600"
    },
    purple: {
        bg: "bg-purple-500",
        light: "bg-purple-50",
        text: "text-purple-600",
        border: "border-purple-100",
        gradient: "from-purple-500 to-purple-600"
    }
};

export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    loading = false,
    format = "number"
}: StatCardProps) {
    const colors = colorStyles[color];

    const formatValue = (val: number | string) => {
        if (format === "currency") {
            return new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(Number(val));
        }
        if (format === "percentage") {
            return `${Number(val).toFixed(1)}%`;
        }
        return new Intl.NumberFormat("es-CO").format(Number(val));
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300"
        >
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
                        {formatValue(value)}
                    </p>
                    <p className="text-xs text-slate-400">
                        {subtitle}
                    </p>
                </div>
                <div className={`p-3 rounded-xl ${colors.light} ${colors.text} transition-transform group-hover:scale-110 duration-300`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            <div className={`mt-4 h-1 w-full ${colors.light} rounded-full overflow-hidden`}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full`}
                />
            </div>
        </motion.div>
    );
}
