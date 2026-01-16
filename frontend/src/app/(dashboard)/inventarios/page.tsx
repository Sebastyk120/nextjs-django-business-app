"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import axiosClient from "@/lib/axios";
import { Inventario, InventarioFilters } from "@/types/inventario";
import { Button } from "@/components/ui/button";
import { Plus, Download, RefreshCw, Warehouse } from "lucide-react";
import { InventoryTable } from "@/components/inventario/InventoryTable";
import { InventoryFilters as FiltersComponent } from "@/components/inventario/InventoryFilters";
import { InventoryStockCard } from "@/components/inventario/InventoryStockCard";
import { NewItemModal } from "@/components/inventario/NewItemModal";
import { ExportInventoryModal } from "@/components/inventario/ExportInventoryModal";
import { MovimientoHistoryDrawer } from "@/components/inventario/MovimientoHistoryDrawer";
import { Pagination } from "@/components/comercial/Pagination"; // Reuse existing
import { toast } from "sonner";

function InventariosContent() {
    const { user } = useAuth({ middleware: 'auth' });

    // Data State
    const [data, setData] = useState<Inventario[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Filters State
    const [filters, setFilters] = useState<InventarioFilters>({});

    // KPI State
    const [kpis, setKpis] = useState({
        stockTotal: 0,
        referenciasCount: 0,
        lowStockCount: 0,
        outOfStockCount: 0
    });

    // Modals State
    const [isNewItemOpen, setIsNewItemOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [historyItem, setHistoryItem] = useState<Inventario | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    useEffect(() => {
        fetchInventario();
    }, [page, pageSize, filters, refreshTrigger]);

    const fetchInventario = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('page_size', pageSize.toString());
            if (filters.search) params.append('search', filters.search);
            if (filters.exportador) params.append('exportador', filters.exportador);

            const response = await axiosClient.get(`/inventarios/api/inventario-resumen/?${params.toString()}`);

            const results = response.data.results || [];
            setData(results);
            setTotalItems(response.data.count || 0);

            // Calculate metrics from CURRENT PAGE results
            const lowStock = results.filter((item: Inventario) => {
                const stock = (item.stock_actual !== undefined) ? item.stock_actual : 0;
                return stock > 0 && stock < 50;
            }).length;

            const outOfStock = results.filter((item: Inventario) => {
                const stock = (item.stock_actual !== undefined) ? item.stock_actual : 0;
                return stock <= 0;
            }).length;

            setKpis({
                stockTotal: 0,
                referenciasCount: response.data.count || 0,
                lowStockCount: lowStock,
                outOfStockCount: outOfStock
            });

        } catch (error) {
            console.error("Error fetching inventory:", error);
            toast.error("Error al cargar inventario");
        } finally {
            setLoading(false);
        }
    };

    const handleEditHistory = (item: Inventario) => {
        setHistoryItem(item);
        setIsHistoryOpen(true);
    };

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[100vw] overflow-x-hidden bg-slate-50/50 min-h-screen">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-plus-jakarta flex items-center gap-3">
                        <Warehouse className="h-8 w-8 text-indigo-600" />
                        Inventarios
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Gestión de existencias y movimientos por exportador.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setIsExportOpen(true)}
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                        <Download className="mr-2 h-4 w-4 text-green-600" />
                        Exportar
                    </Button>
                    <Button
                        onClick={() => setIsNewItemOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Movimiento
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <InventoryStockCard
                stockTotal={kpis.stockTotal}
                referenciasCount={kpis.referenciasCount}
                lowStockCount={kpis.lowStockCount}
                outOfStockCount={kpis.outOfStockCount}
                loading={loading}
            />

            {/* Filters & Table Container */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-100/50 overflow-hidden">
                <FiltersComponent
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClearFilters={() => setFilters({})}
                    userGroups={user?.groups}
                />

                <div className="p-0 border-t border-slate-100">
                    <InventoryTable
                        data={data}
                        loading={loading}
                        onEdit={handleEditHistory}
                        userGroups={user?.groups}
                    />
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center bg-white p-4 border-t border-slate-100">
                    <div className="text-sm text-slate-500 font-medium">
                        Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, totalItems)} de {totalItems} referencias
                    </div>
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
                    />
                </div>
            </div>

            {/* Dialogs */}
            <NewItemModal
                open={isNewItemOpen}
                onOpenChange={setIsNewItemOpen}
                onItemCreated={handleRefresh}
                userGroups={user?.groups}
            />

            <ExportInventoryModal
                open={isExportOpen}
                onOpenChange={setIsExportOpen}
                currentFilters={filters}
            />

            <MovimientoHistoryDrawer
                open={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
                inventarioItem={historyItem}
                userGroups={user?.groups}
            />
        </div>
    );
}

export default function InventariosPage() {
    return (
        <Suspense fallback={<div className="p-8">Cargando inventarios...</div>}>
            <InventariosContent />
        </Suspense>
    );
}
