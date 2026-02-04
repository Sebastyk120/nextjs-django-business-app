"use client";

import { useEffect, useState } from "react";
import { NacionalesGeneralTable } from "@/components/nacionales/general/NacionalesGeneralTable";
import { NacionalesFilters } from "@/components/nacionales/general/NacionalesFilters";
import { Pagination } from "@/components/comercial/Pagination";
import nacionalesService from "@/services/nacionalesService";
import { CompraNacional } from "@/types/nacionales";
import { useSearchParams } from "next/navigation";
import { BarChart3, Package, CheckCircle2, AlertCircle, Activity, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NacionalesGeneralPage() {
    const searchParams = useSearchParams();
    const search = searchParams.get("search");
    const completed = searchParams.get("completed");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalItems, setTotalItems] = useState(0);

    const [data, setData] = useState<CompraNacional[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const responseData = await nacionalesService.getComprasNacionales({
                    search: search || undefined,
                    completed: completed === "true",
                    page,
                    pageSize
                });

                if ('results' in responseData) {
                    setData(responseData.results);
                    setTotalItems(responseData.count);
                } else {
                    const results = Array.isArray(responseData) ? responseData : [];
                    setData(results);
                    setTotalItems(results.length);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setData([]);
                setTotalItems(0);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [search, completed, page, pageSize]);

    const stats = {
        total: totalItems,
        completed: data.filter(c => c.porcentaje_completitud >= 100).length,
        pending: data.filter(c => c.porcentaje_completitud < 100).length,
        problematic: data.filter(c => c.estado_reporte_exp === 'Vencido').length
    };

    const statCards = [
        {
            label: "Operaciones (Total)",
            value: stats.total,
            icon: Package,
            color: "blue",
            gradient: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600"
        },
        {
            label: "Completadas (Pág)",
            value: stats.completed,
            icon: CheckCircle2,
            color: "emerald",
            gradient: "from-emerald-500 to-emerald-600",
            bgColor: "bg-emerald-50",
            textColor: "text-emerald-600"
        },
        {
            label: "En Proceso (Pág)",
            value: stats.pending,
            icon: Clock,
            color: "amber",
            gradient: "from-amber-500 to-amber-600",
            bgColor: "bg-amber-50",
            textColor: "text-amber-600"
        },
        {
            label: "Vencidos (Pág)",
            value: stats.problematic,
            icon: AlertCircle,
            color: "red",
            gradient: "from-red-500 to-red-600",
            bgColor: "bg-red-50",
            textColor: "text-red-600"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Vista General Nacionales
                        </h1>
                        <p className="text-muted-foreground text-sm">Seguimiento centralizado de operaciones, compras y reportes.</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards - Modern Design */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-3">
                                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                <h3 className={cn("text-3xl font-bold", stat.textColor)}>
                                    {stat.value}
                                </h3>
                            </div>
                            <div className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                                stat.bgColor
                            )}>
                                <stat.icon className={cn("h-6 w-6", stat.textColor)} />
                            </div>
                        </div>
                        <div className={cn("mt-4 h-1 w-full rounded-full overflow-hidden", stat.bgColor)}>
                            <div className={cn("h-full rounded-full bg-gradient-to-r", stat.gradient)} style={{ width: '60%' }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <NacionalesFilters />

            {/* Table Section */}
            <div className="space-y-0">
                <NacionalesGeneralTable data={data} isLoading={loading} />
                <div className="mt-4">
                    <Pagination
                        currentPage={page}
                        totalItems={totalItems}
                        totalPages={Math.ceil(totalItems / pageSize)}
                        itemsPerPage={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setPage(1);
                        }}
                        itemLabel="registros"
                    />
                </div>
            </div>
        </div>
    );
}
