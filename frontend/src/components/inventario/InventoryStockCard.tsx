"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle, XCircle, Boxes, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface InventoryStockCardProps {
    stockTotal: number;
    referenciasCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    loading: boolean;
}

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    })
};

export function InventoryStockCard({
    referenciasCount,
    lowStockCount,
    outOfStockCount,
    loading
}: InventoryStockCardProps) {
    const cards = [
        {
            id: "total",
            title: "Total Referencias",
            value: referenciasCount,
            subtitle: "SKUs activos",
            icon: Boxes,
            gradient: "from-blue-500 to-indigo-600",
            bgGradient: "from-blue-50/80 to-indigo-50/50",
            iconBg: "bg-blue-100 text-blue-600",
            textColor: "text-blue-900",
            subtextColor: "text-blue-500/70",
            trend: "up"
        },
        {
            id: "low",
            title: "Stock Bajo",
            value: lowStockCount,
            subtitle: "Ref. < 50 unidades",
            icon: AlertTriangle,
            gradient: "from-amber-400 to-orange-500",
            bgGradient: "from-amber-50/80 to-orange-50/50",
            iconBg: lowStockCount > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400",
            textColor: lowStockCount > 0 ? "text-amber-900" : "text-slate-700",
            subtextColor: lowStockCount > 0 ? "text-amber-600/70" : "text-slate-400",
            trend: "down",
            alert: lowStockCount > 0
        },
        {
            id: "out",
            title: "Sin Stock",
            value: outOfStockCount,
            subtitle: "Agotadas",
            icon: XCircle,
            gradient: "from-rose-400 to-red-600",
            bgGradient: "from-rose-50/80 to-red-50/50",
            iconBg: outOfStockCount > 0 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-400",
            textColor: outOfStockCount > 0 ? "text-rose-900" : "text-slate-700",
            subtextColor: outOfStockCount > 0 ? "text-rose-600/70" : "text-slate-400",
            trend: "down",
            alert: outOfStockCount > 0
        }
    ];

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {cards.map((card, index) => {
                const Icon = card.icon;
                const TrendIcon = card.trend === "up" ? TrendingUp : TrendingDown;

                return (
                    <motion.div
                        key={card.id}
                        custom={index}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                    >
                        <Card className={cn(
                            "relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-default group",
                            card.alert && "ring-2 ring-offset-2",
                            card.id === "low" && card.alert && "ring-amber-400/50",
                            card.id === "out" && card.alert && "ring-rose-400/50"
                        )}>
                            {/* Background gradient */}
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                                card.bgGradient
                            )} />

                            {/* Top accent bar */}
                            <div className={cn(
                                "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
                                card.gradient
                            )} />

                            {/* Decorative circle */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />

                            <CardContent className="relative p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className={cn("text-xs font-semibold tracking-wide uppercase", card.subtextColor)}>
                                                {card.title}
                                            </p>
                                            {card.alert && (
                                                <span className={cn(
                                                    "flex h-2 w-2 rounded-full animate-pulse",
                                                    card.id === "low" ? "bg-amber-500" : "bg-rose-500"
                                                )} />
                                            )}
                                        </div>

                                        <div className="flex items-baseline gap-2 mt-2">
                                            <h3 className={cn("text-4xl font-black tracking-tight", card.textColor)}>
                                                {loading ? (
                                                    <span className="inline-flex items-center">
                                                        <span className="w-8 h-8 border-3 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
                                                    </span>
                                                ) : (
                                                    card.value.toLocaleString()
                                                )}
                                            </h3>
                                        </div>

                                        <p className={cn("text-xs font-medium mt-1", card.subtextColor)}>
                                            {card.subtitle}
                                        </p>
                                    </div>

                                    <div className={cn(
                                        "p-3.5 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg",
                                        card.iconBg
                                    )}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                </div>

                                {/* Bottom trend indicator */}
                                {!loading && (
                                    <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
                                        <TrendIcon className={cn(
                                            "h-3.5 w-3.5",
                                            card.trend === "up" ? "text-emerald-500" : "text-slate-400"
                                        )} />
                                        <span className={cn(
                                            "text-xs font-medium",
                                            card.trend === "up" ? "text-emerald-600" : "text-slate-500"
                                        )}>
                                            {card.trend === "up" ? "En inventario" : "Requiere atención"}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}
