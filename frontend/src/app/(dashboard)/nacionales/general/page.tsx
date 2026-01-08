"use client";

import { useEffect, useState } from "react";
import { NacionalesGeneralTable } from "@/components/nacionales/general/NacionalesGeneralTable";
import { NacionalesFilters } from "@/components/nacionales/general/NacionalesFilters";
import nacionalesService from "@/services/nacionalesService";
import { CompraNacional } from "@/types/nacionales";
import { useSearchParams } from "next/navigation";
import { BarChart3, Package, CheckCircle2, AlertCircle, Activity } from "lucide-react";

export default function NacionalesGeneralPage() {
    const searchParams = useSearchParams();
    const search = searchParams.get("search");
    const completed = searchParams.get("completed");

    const [data, setData] = useState<CompraNacional[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const responseData = await nacionalesService.getComprasNacionales({
                    search: search || undefined,
                    completed: completed === "true"
                });

                // Handle both paginated ({ results: [] }) and non-paginated ([]) responses
                const results = Array.isArray(responseData) ? responseData : (responseData.results || []);

                setData(results);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [search, completed]);

    const stats = {
        total: data.length,
        completed: data.filter(c => c.porcentaje_completitud >= 100).length,
        pending: data.filter(c => c.porcentaje_completitud < 100).length,
        problematic: data.filter(c => c.estado_reporte_exp === 'Vencido').length
    };

    return (
        <div className="min-h-screen bg-slate-50/10 p-4 md:p-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-plus-jakarta flex items-center gap-3">
                    <Activity className="h-8 w-8 text-blue-600" />
                    Vista General Nacionales
                </h1>
                <p className="text-muted-foreground text-sm">Seguimiento centralizado de operaciones, compras y reportes.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Operaciones</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</h3>
                    </div>
                    <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <Package className="h-5 w-5" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Completadas</p>
                        <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</h3>
                    </div>
                    <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">En Proceso</p>
                        <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</h3>
                    </div>
                    <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                        <BarChart3 className="h-5 w-5" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Vencidos</p>
                        <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.problematic}</h3>
                    </div>
                    <div className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <NacionalesFilters />
                <NacionalesGeneralTable data={data} isLoading={loading} />
            </div>
        </div>
    );
}
