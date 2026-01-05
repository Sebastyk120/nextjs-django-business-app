"use client";

import { useEffect, useState } from "react";
import axiosClient from "@/lib/axios";
import { Referencia, PaginatedReferencias } from "@/types/comercial";
import { ReferenciasTable } from "@/components/inventario/ReferenciasTable";
import { ReferenciaEditSheet } from "@/components/inventario/ReferenciaEditSheet";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Database,
    Search,
    RefreshCw,
    Plus,
    Download,
    ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DeleteItemDialog } from "@/components/inventario/DeleteItemDialog";

export default function ReferenciasPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Referencia[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 20;

    // User info for permissions
    const [userGroups, setUserGroups] = useState<string[]>([]);
    const [canCreate, setCanCreate] = useState(false);

    // Edit/Create State
    const [editItem, setEditItem] = useState<Referencia | null>(null);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

    // Delete State
    const [deleteItem, setDeleteItem] = useState<Referencia | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        checkPermissions();
        fetchReferencias();
    }, [page]);

    const checkPermissions = async () => {
        const authStatus = await auth.checkAuth();
        if (authStatus.authenticated && authStatus.user) {
            const groups = authStatus.user.groups || [];
            setUserGroups(groups);
            setCanCreate(groups.includes("Heavens") || groups.includes("Superuser") || groups.includes("Autorizadores"));
        }
    };

    const fetchReferencias = async (resetPage = false) => {
        setLoading(true);
        if (resetPage) setPage(1);

        try {
            const currentPage = resetPage ? 1 : page;
            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('page_size', pageSize.toString());
            if (searchTerm) params.append('search', searchTerm);

            const response = await axiosClient.get<PaginatedReferencias>(`/inventarios/api/referencias/?${params.toString()}`);
            setData(response.data.results);
            setTotalItems(response.data.count);
        } catch (error) {
            console.error("Error fetching referencias:", error);
            toast.error("Error al cargar referencias");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchReferencias(true);
    };

    const handleExport = async () => {
        try {
            const response = await axiosClient.get('/inventarios/api/referencias/export-excel/', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `referencias_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error exporting:", error);
            toast.error("Error al exportar a Excel");
        }
    };

    const handleDelete = async () => {
        if (!deleteItem) return;
        setIsDeleting(true);
        try {
            await axiosClient.delete(`/inventarios/api/referencias/${deleteItem.id}/`);
            toast.success("Referencia eliminada");
            fetchReferencias();
            setIsDeleteDialogOpen(false);
            setDeleteItem(null);
        } catch (error) {
            console.error("Error deleting:", error);
            toast.error("Error al eliminar referencia");
        } finally {
            setIsDeleting(false);
        }
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
                            <Database className="h-5 w-5 text-indigo-600" />
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-plus-jakarta">Gestión de Referencias</h1>
                        </div>
                        <p className="text-sm text-slate-500">Administración maestra de productos por exportador</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                    {canCreate && (
                        <Button
                            onClick={() => {
                                setEditItem(null);
                                setIsEditSheetOpen(true);
                            }}
                            className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm shadow-slate-900/10"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Referencia
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 sticky top-[72px] z-20">
                <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar referencia, código o exportador..."
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
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fetchReferencias()}
                        className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        title="Actualizar lista"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                    <div className="px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{totalItems} Items</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <ReferenciasTable
                data={data}
                loading={loading}
                userGroups={userGroups}
                onEdit={(item) => {
                    setEditItem(item);
                    setIsEditSheetOpen(true);
                }}
                onDelete={(item) => {
                    setDeleteItem(item);
                    setIsDeleteDialogOpen(true);
                }}
            />

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

            {/* Modals */}
            <ReferenciaEditSheet
                open={isEditSheetOpen}
                onOpenChange={setIsEditSheetOpen}
                item={editItem}
                onItemUpdated={() => fetchReferencias()}
                userGroups={userGroups}
            />

            <DeleteItemDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDelete}
                title="Eliminar Referencia"
                description={`¿Estás seguro de eliminar la referencia "${deleteItem?.nombre}"? Esta acción no se puede deshacer.`}
                isDeleting={isDeleting}
            />
        </div>
    );
}
