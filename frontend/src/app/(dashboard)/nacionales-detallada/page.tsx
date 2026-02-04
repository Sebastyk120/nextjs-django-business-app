"use client";

import { useState, useEffect, Suspense } from "react";
import axiosClient from "@/lib/axios";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { CompraNacional, VentaNacional } from "@/types/nacionales";
import { NacionalesFilters, NacionalesFilterState } from "@/components/nacionales/NacionalesFilters";
import { NacionalesTimeline } from "@/components/nacionales/NacionalesTimeline";
import { NacionalesDetailsAccordion } from "@/components/nacionales/NacionalesDetailsAccordion";
import { IncompletePurchasesTable } from "@/components/nacionales/IncompletePurchasesTable";
import { CompraNacionalModal } from "@/components/nacionales/CompraNacionalModal";
import { VentaNacionalModal } from "@/components/nacionales/VentaNacionalModal";
import { ReporteExportadorModal } from "@/components/nacionales/ReporteExportadorModal";
import { ReporteProveedorModal } from "@/components/nacionales/ReporteProveedorModal";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, List, Package, Filter } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const initialFilterState: NacionalesFilterState = {
    search: "",
    proveedorSearch: "",
    remisionSearch: "",
    estadoReporteExp: null,
    estadoFacturacionExp: null,
    estadoReporteProv: null,
};

function NacionalesPageContent() {
    const { user } = useAuth({ middleware: 'auth' });
    const searchParams = useSearchParams();
    const querySearch = searchParams.get("search");

    const [incompletas, setIncompletas] = useState<CompraNacional[]>([]);
    const [, setLoading] = useState(true);
    const [filters, setFilters] = useState<NacionalesFilterState>(() => ({
        ...initialFilterState,
        search: querySearch || ""
    }));
    const [searchTerm, setSearchTerm] = useState(querySearch || "");
    const [searchResult, setSearchResult] = useState<CompraNacional | null>(null);
    const [selectedVentaForAction, setSelectedVentaForAction] = useState<VentaNacional | null>(null);

    // Modal States
    const [openCompraModal, setOpenCompraModal] = useState(false);
    const [openVentaModal, setOpenVentaModal] = useState(false);
    const [openReporteExpModal, setOpenReporteExpModal] = useState(false);
    const [openReporteProvModal, setOpenReporteProvModal] = useState(false);

    const [isSearching, setIsSearching] = useState(false);

    // Initial load of incomplete purchases
    useEffect(() => {
        if (!searchTerm) {
            fetchIncompletas();
        }
    }, [searchTerm]);

    const fetchIncompletas = async () => {
        setLoading(true);
        try {
            const timestamp = new Date().getTime();
            const response = await axiosClient.get(`/nacionales/api/compra/incompletas/?t=${timestamp}`);
            setIncompletas(response.data.results || response.data);
        } catch (error) {
            console.error("Error fetching incompletas:", error);
            toast.error("Error al cargar compras incompletas");
        } finally {
            setLoading(false);
        }
    };

    // Debounced search logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length > 2) {
                performGlobalSearch(searchTerm);
            } else if (!searchTerm) {
                setSearchResult(null);
                setFilters(initialFilterState);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const performGlobalSearch = async (term: string) => {
        setIsSearching(true);
        try {
            const timestamp = new Date().getTime();
            const exactResponse = await axiosClient.get(`/nacionales/api/compra/search_guia/?guia=${term}&t=${timestamp}`);

            if (exactResponse.data && exactResponse.data.id) {
                setSearchResult(exactResponse.data);
                setIsSearching(false);
                return;
            }

            const searchResponse = await axiosClient.get(`/nacionales/api/compra/?search=${term}&t=${timestamp}`);
            const results = searchResponse.data.results || searchResponse.data;

            if (results && results.length > 0) {
                setIncompletas(results);
                setSearchResult(null);
            } else {
                setIncompletas([]);
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setFilters(prev => ({ ...prev, search: term }));
    };

    const refreshCurrentView = () => {
        if (searchTerm) {
            performGlobalSearch(searchTerm);
        } else {
            fetchIncompletas();
        }
    };

    const handleClearSearch = () => {
        setSearchTerm("");
        setSearchResult(null);
        setFilters(initialFilterState);
        fetchIncompletas();
    };

    const handleClearFilters = () => {
        setFilters(initialFilterState);
    };

    // Permission check
    const isHeavens = user?.groups?.includes("Heavens");

    // While authenticating
    if (!user) return <div className="p-8">Cargando...</div>;

    if (!isHeavens) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Package className="h-10 w-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Acceso Restringido</h2>
                <p className="text-slate-500">Este módulo está reservado exclusivamente para el grupo Heavens.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[100vw] overflow-x-hidden bg-gradient-to-br from-slate-50/50 to-slate-100/30 min-h-screen">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                        <List className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Nacionales Detallada
                        </h1>
                        <p className="text-slate-500 text-sm">Gestión de compras, ventas y reportes de calidad nacionales.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 transition-all active:scale-95 h-10"
                        onClick={() => {
                            setSearchResult(null);
                            setOpenCompraModal(true);
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Compra
                    </Button>
                </div>
            </motion.div>

            {/* Search & Filters Container */}
            <AnimatePresence mode="wait">
                {!searchResult ? (
                    <motion.div
                        key="filters"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <NacionalesFilters
                            filters={filters}
                            onFiltersChange={setFilters}
                            onClear={handleClearFilters}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Package className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Detalle del Proceso</h2>
                                <p className="text-sm text-slate-500">Guía: {searchResult.numero_guia}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearSearch}
                            className="h-9"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver al listado
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <AnimatePresence mode="wait">
                {searchResult ? (
                    <motion.div
                        key="detail-view"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Timeline */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                    <Filter className="h-4 w-4 text-indigo-600" />
                                </div>
                                <h3 className="text-sm font-semibold text-slate-700">Línea de Tiempo del Proceso</h3>
                            </div>
                            <NacionalesTimeline data={searchResult} />
                        </div>

                        {/* Accordion Details */}
                        <NacionalesDetailsAccordion
                            data={searchResult}
                            onEditCompra={() => setOpenCompraModal(true)}
                            onCreateVenta={() => {
                                setSelectedVentaForAction(null);
                                setOpenVentaModal(true);
                            }}
                            onEditVenta={(venta) => {
                                setSelectedVentaForAction(venta);
                                setOpenVentaModal(true);
                            }}
                            onCreateReporteExp={(venta) => {
                                setSelectedVentaForAction(venta);
                                setOpenReporteExpModal(true);
                            }}
                            onEditReporteExp={(venta) => {
                                setSelectedVentaForAction(venta);
                                setOpenReporteExpModal(true);
                            }}
                            onCreateReporteProv={(venta) => {
                                setSelectedVentaForAction(venta);
                                setOpenReporteProvModal(true);
                            }}
                            onEditReporteProv={(venta) => {
                                setSelectedVentaForAction(venta);
                                setOpenReporteProvModal(true);
                            }}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="table-view"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <IncompletePurchasesTable
                            data={incompletas}
                            filters={filters}
                            onSelect={(compra) => {
                                setSearchTerm(compra.numero_guia);
                                handleSearch(compra.numero_guia);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <CompraNacionalModal
                open={openCompraModal}
                onOpenChange={setOpenCompraModal}
                initialData={searchResult}
                onSuccess={(data) => {
                    if (searchTerm === data.numero_guia) {
                        refreshCurrentView();
                    } else {
                        handleSearch(data.numero_guia);
                    }
                    fetchIncompletas();
                }}
            />

            {searchResult && (
                <>
                    <VentaNacionalModal
                        open={openVentaModal}
                        onOpenChange={setOpenVentaModal}
                        compraData={searchResult}
                        initialData={selectedVentaForAction || undefined}
                        onSuccess={refreshCurrentView}
                    />

                    {selectedVentaForAction && (
                        <ReporteExportadorModal
                            open={openReporteExpModal}
                            onOpenChange={setOpenReporteExpModal}
                            ventaData={selectedVentaForAction}
                            compraData={searchResult}
                            initialData={selectedVentaForAction.reportecalidadexportador}
                            onSuccess={refreshCurrentView}
                        />
                    )}

                    {selectedVentaForAction?.reportecalidadexportador && (
                        <ReporteProveedorModal
                            open={openReporteProvModal}
                            onOpenChange={setOpenReporteProvModal}
                            reporteExpData={selectedVentaForAction.reportecalidadexportador}
                            compraData={searchResult}
                            initialData={selectedVentaForAction.reportecalidadexportador.reportecalidadproveedor}
                            onSuccess={refreshCurrentView}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default function NacionalesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                    <p className="text-slate-500">Cargando...</p>
                </div>
            </div>
        }>
            <NacionalesPageContent />
        </Suspense>
    );
}
