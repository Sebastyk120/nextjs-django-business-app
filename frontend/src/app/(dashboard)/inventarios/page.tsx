"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import axiosClient from "@/lib/axios";
import { Inventario, InventarioFilters } from "@/types/inventario";
import { Button } from "@/components/ui/button";
import { Plus, Download, RefreshCw, Warehouse, Package, Filter } from "lucide-react";
import { InventoryTable } from "@/components/inventario/InventoryTable";
import { InventoryFilters as FiltersComponent } from "@/components/inventario/InventoryFilters";
import { InventoryStockCard } from "@/components/inventario/InventoryStockCard";
import { NewItemModal } from "@/components/inventario/NewItemModal";
import { ExportInventoryModal } from "@/components/inventario/ExportInventoryModal";
import { MovimientoHistoryDrawer } from "@/components/inventario/MovimientoHistoryDrawer";
import { Pagination } from "@/components/comercial/Pagination";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

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

    const [kpis, setKpis] = useState({
        stockTotal: 0,
        referenciasCount: 0,
        lowStockCount: 0,
        outOfStockCount: 0
    });

    const [grandTotals, setGrandTotals] = useState({
        compras_efectivas: 0,
        saldos_iniciales: 0,
        salidas: 0,
        traslado_propio: 0,
        traslado_remisionado: 0,
        ventas: 0,
        stock_actual: 0
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
            
            // Use totals from backend if available
            if (response.data.totals) {
                const { totals } = response.data;
                setGrandTotals({
                    compras_efectivas: totals.compras_efectivas,
                    saldos_iniciales: totals.saldos_iniciales,
                    salidas: totals.salidas,
                    traslado_propio: totals.traslado_propio,
                    traslado_remisionado: totals.traslado_remisionado,
                    ventas: totals.ventas,
                    stock_actual: totals.stock_actual
                });

                setKpis({
                    stockTotal: totals.stock_actual,
                    referenciasCount: response.data.count || 0,
                    lowStockCount: totals.low_stock_count,
                    outOfStockCount: totals.out_of_stock_count
                });
            }

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
        toast.success("Inventario actualizado");
    };

    const activeFiltersCount = (filters.search ? 1 : 0) + (filters.exportador ? 1 : 0) + (filters.stockStatus ? 1 : 0);

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-b border-slate-200 sticky top-0 z-20"
            >
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-200">
                                <Warehouse className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">Inventarios</h1>
                                <p className="text-sm text-slate-500">Gestion de existencias y movimientos</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                className="h-10 px-3 text-slate-600 hover:text-slate-900 border-slate-200"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Actualizar
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsExportOpen(true)}
                                className="h-10 px-3 text-slate-600 hover:text-slate-900 border-slate-200"
                            >
                                <Download className="h-4 w-4 mr-2 text-emerald-600" />
                                Exportar
                            </Button>

                            <Button
                                size="sm"
                                onClick={() => setIsNewItemOpen(true)}
                                className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Nuevo Movimiento
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* KPI Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <InventoryStockCard
                        stockTotal={kpis.stockTotal}
                        referenciasCount={kpis.referenciasCount}
                        lowStockCount={kpis.lowStockCount}
                        outOfStockCount={kpis.outOfStockCount}
                        loading={loading}
                    />
                </motion.div>

                {/* Table Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                    {/* Filters */}
                    <FiltersComponent
                        filters={filters}
                        onFiltersChange={setFilters}
                        onClearFilters={() => setFilters({})}
                        userGroups={user?.groups}
                    />

                    {/* Active Filters Indicator */}
                    {activeFiltersCount > 0 && (
                        <div className="px-4 py-2 bg-blue-50/50 border-b border-slate-100 flex items-center gap-2">
                            <Filter className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-xs text-blue-700">
                                Filtros activos: {activeFiltersCount}
                            </span>
                        </div>
                    )}

                    {/* Table */}
                    <div className="border-t border-slate-100">
                        <InventoryTable
                            data={data}
                            loading={loading}
                            onEdit={handleEditHistory}
                            userGroups={user?.groups}
                            totals={grandTotals}
                        />
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 py-4 bg-slate-50/50 border-t border-slate-200">
                        <div className="text-sm text-slate-500">
                            Mostrando <span className="font-medium text-slate-900">{(page - 1) * pageSize + 1}</span> a{" "}
                            <span className="font-medium text-slate-900">{Math.min(page * pageSize, totalItems)}</span> de{" "}
                            <span className="font-medium text-slate-900">{totalItems}</span> referencias
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
                </motion.div>
            </div>

            {/* Modals */}
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
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-slate-500">Cargando inventarios...</p>
            </div>
        </div>}>
            <InventariosContent />
        </Suspense>
    );
}
