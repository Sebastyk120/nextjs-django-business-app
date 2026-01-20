"use client";

import { useEffect, useState } from "react";
import { NacionalesGeneralTable } from "@/components/nacionales/general/NacionalesGeneralTable";
import { NacionalesFilters } from "@/components/nacionales/general/NacionalesFilters";
import { Pagination } from "@/components/comercial/Pagination";
import nacionalesService from "@/services/nacionalesService";
import { CompraNacional } from "@/types/nacionales";
import { useSearchParams } from "next/navigation";
import { BarChart3, Package, CheckCircle2, AlertCircle, Activity } from "lucide-react";

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

                // Handle both paginated ({ results: [], count: 0 }) and non-paginated ([]) responses
                // Note: responseData can be cast or checked. API now returns { results, count, ... }
                if ('results' in responseData) {
                    setData(responseData.results);
                    setTotalItems(responseData.count);
                } else {
                    // Fallback for array response
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
        total: totalItems, // Show total from count
        // Note: These stats are now only approximate if based on 'data' (current page) 
        // OR we need a separate stats endpoint. For now, let's keep calculating from current 'data' 
        // but acknowledge it might be misleading if not all data is loaded. 
        // However, user asked for pagination. 
        // Ideally we would fetch stats separately. 
        // Given the request scope, I will base stats on current page for now or 
        // just keep logic but update 'total' to be the total count from backend.
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

            {/* Stats Cards - Note: These now reflect CURRENT PAGE stats except Total which is global if paginated */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Operaciones (Total)</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</h3>
                    </div>
                    <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <Package className="h-5 w-5" />
                    </div>
                </div>
                {/* Other stats cards show stats for the visible page, which is acceptable for tables but maybe confusing. 
                    Fixing this properly would require backend aggregate endpoints. 
                    I'll leave them as is per instructions to just "add pagination". */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Completadas (Pág)</p>
                        <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</h3>
                    </div>
                    <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">En Proceso (Pág)</p>
                        <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</h3>
                    </div>
                    <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                        <BarChart3 className="h-5 w-5" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Vencidos (Pág)</p>
                        <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.problematic}</h3>
                    </div>
                    <div className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <NacionalesFilters />
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-0">
                    <NacionalesGeneralTable data={data} isLoading={loading} />
                    <div className="border-t border-slate-100">
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
        </div>
    );
}
