"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle, XCircle, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryStockCardProps {
    stockTotal: number; // Keep for compatibility
    referenciasCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    loading: boolean;
}

export function InventoryStockCard({
    referenciasCount,
    lowStockCount,
    outOfStockCount,
    loading
}: InventoryStockCardProps) {
    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {/* Card: Total Referencias */}
            <Card className="relative overflow-hidden border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
                    <Package className="h-20 w-20" />
                </div>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                            <Boxes className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold tracking-wider text-slate-400">Total Referencias</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-black text-slate-900 leading-none">
                                    {loading ? "..." : referenciasCount}
                                </h3>
                                <span className="text-[10px] font-bold text-slate-400">SKUs</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card: Bajo Stock */}
            <Card className="relative overflow-hidden border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
                    <AlertTriangle className="h-20 w-20" />
                </div>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-3 rounded-2xl transition-colors",
                            lowStockCount > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"
                        )}>
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold tracking-wider text-slate-400">Bajo Stock</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className={cn(
                                    "text-3xl font-black leading-none",
                                    lowStockCount > 0 ? "text-amber-600" : "text-slate-900"
                                )}>
                                    {loading ? "..." : lowStockCount}
                                </h3>
                                <span className="text-[10px] font-bold text-slate-400">Ref. &lt; 50</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card: Sin Stock */}
            <Card className="relative overflow-hidden border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
                    <XCircle className="h-20 w-20" />
                </div>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-3 rounded-2xl transition-colors",
                            outOfStockCount > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"
                        )}>
                            <XCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold tracking-wider text-slate-400">Sin Stock</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className={cn(
                                    "text-3xl font-black leading-none",
                                    outOfStockCount > 0 ? "text-rose-600" : "text-slate-900"
                                )}>
                                    {loading ? "..." : outOfStockCount}
                                </h3>
                                <span className="text-[10px] font-bold text-slate-400">Agotadas</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
