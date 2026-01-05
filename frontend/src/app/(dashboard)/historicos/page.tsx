"use client";

import { useEffect, useState } from "react";
import axiosClient from "@/lib/axios";
import { Movimiento, PaginatedResponse } from "@/types/inventario";
import { MovementsHistoryTable } from "@/components/inventario/MovementsHistoryTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    History,
    Search,
    RefreshCw,
    Download,
    ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

export default function HistoricoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Movimiento[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        fetchHistorico();
    }, [page]);

    const fetchHistorico = async (resetPage = false) => {
        setLoading(true);
        if (resetPage) setPage(1);

        try {
            const currentPage = resetPage ? 1 : page;
            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('page_size', pageSize.toString());
            if (searchTerm) params.append('search', searchTerm);

            const response = await axiosClient.get<PaginatedResponse<Movimiento>>(`/inventarios/api/movimientos/?${params.toString()}`);
            setData(response.data.results);
            setTotalItems(response.data.count);
        } catch (error) {
            console.error("Error fetching historico:", error);
            toast.error("Error al cargar el historial");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchHistorico(true);
    };

    const totalPages = Math.ceil(totalItems / pageSize);

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 bg-slate-50/50 min-h-screen font-outfit">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full hover:bg-white shadow-sm"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <History className="h-5 w-5 text-indigo-600" />
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-plus-jakarta">Histórico de Movimientos</h1>
                        </div>
                        <p className="text-sm text-slate-500">Registro general de auditoría de inventario</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => fetchHistorico()}
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                        disabled={loading}
                    >
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Filters & Actions Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 sticky top-[72px] z-20">
                <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por referencia u observaciones..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 bg-slate-50 border-transparent focus:bg-white transition-all rounded-xl"
                        />
                    </div>
                    <Button type="submit" className="h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider">
                        Filtrar
                    </Button>
                </form>

                <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{totalItems} Registros</span>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <MovementsHistoryTable data={data} loading={loading} />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                    <Pagination>
                        <PaginationContent className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className={cn("cursor-pointer", page === 1 && "pointer-events-none opacity-50")}
                                />
                            </PaginationItem>

                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                // Simple pagination logic, showing 5 pages around current
                                let pageNum = page;
                                if (page <= 3) pageNum = i + 1;
                                else if (page > totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = page - 2 + i;

                                if (pageNum > totalPages || pageNum < 1) return null;

                                return (
                                    <PaginationItem key={pageNum}>
                                        <PaginationLink
                                            onClick={() => setPage(pageNum)}
                                            isActive={page === pageNum}
                                            className="cursor-pointer"
                                        >
                                            {pageNum}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            })}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className={cn("cursor-pointer", page === totalPages && "pointer-events-none opacity-50")}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}
