"use client";

import { useState, useEffect } from "react";
import axiosClient from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { CompraNacional, VentaNacional, ReporteCalidadExportador } from "@/types/nacionales";
import { NacionalesFilters, NacionalesFilterState } from "@/components/nacionales/NacionalesFilters";
import { NacionalesTimeline } from "@/components/nacionales/NacionalesTimeline";
import { NacionalesDetailsAccordion } from "@/components/nacionales/NacionalesDetailsAccordion";
import { IncompletePurchasesTable } from "@/components/nacionales/IncompletePurchasesTable";
import { CompraNacionalModal } from "@/components/nacionales/CompraNacionalModal";
import { VentaNacionalModal } from "@/components/nacionales/VentaNacionalModal";
import { ReporteExportadorModal } from "@/components/nacionales/ReporteExportadorModal";
import { ReporteProveedorModal } from "@/components/nacionales/ReporteProveedorModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ArrowLeft, Search, X } from "lucide-react";
import { toast } from "sonner";

const initialFilterState: NacionalesFilterState = {
    search: "",
    proveedorSearch: "",
    remisionSearch: "",
    estadoReporteExp: null,
    estadoFacturacionExp: null,
    estadoReporteProv: null,
};

export default function NacionalesPage() {
    const { user } = useAuth({ middleware: 'auth' });
    const [incompletas, setIncompletas] = useState<CompraNacional[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<NacionalesFilterState>(initialFilterState);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResult, setSearchResult] = useState<CompraNacional | null>(null);

    // Modal States
    const [openCompraModal, setOpenCompraModal] = useState(false);
    const [openVentaModal, setOpenVentaModal] = useState(false);
    const [openReporteExpModal, setOpenReporteExpModal] = useState(false);
    const [openReporteProvModal, setOpenReporteProvModal] = useState(false);

    // Initial load of incomplete purchases
    useEffect(() => {
        fetchIncompletas();
    }, []);

    const fetchIncompletas = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/nacionales/api/compra/incompletas/');
            setIncompletas(response.data.results || response.data);
        } catch (error) {
            console.error("Error fetching incompletas:", error);
            toast.error("Error al cargar compras incompletas");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (!term) {
            setSearchResult(null);
            return;
        }

        if (term.length > 2) {
            try {
                const response = await axiosClient.get(`/nacionales/api/compra/search_guia/?guia=${term}`);
                if (response.data && response.data.id) {
                    setSearchResult(response.data);
                } else {
                    setSearchResult(null);
                }
            } catch (error) {
                setSearchResult(null);
            }
        } else {
            setSearchResult(null);
        }
    };

    const refreshCurrentView = () => {
        fetchIncompletas();
        if (searchResult) {
            handleSearch(searchResult.numero_guia);
        }
    };

    const handleClearSearch = () => {
        setSearchTerm("");
        setSearchResult(null);
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
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Acceso Restringido</h2>
                <p className="text-slate-500">Este módulo está reservado exclusivamente para el grupo Heavens.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[100vw] overflow-x-hidden bg-slate-50/30 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-plus-jakarta">Nacionales Detallada</h1>
                    <p className="text-muted-foreground text-sm">Gestión de compras, ventas y reportes de calidad nacionales.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100/50 transition-all active:scale-95"
                        onClick={() => {
                            setSearchResult(null);
                            setOpenCompraModal(true);
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Compra
                    </Button>
                </div>
            </div>

            {/* Search Bar for specific Guia */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar guía específica..."
                            className="pl-9 h-10"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    {searchTerm && (
                        <Button variant="ghost" onClick={handleClearSearch} className="h-10 px-3">
                            <X className="h-4 w-4 mr-2" />
                            Limpiar
                        </Button>
                    )}
                </div>

                {/* Advanced Filters - only show when not viewing a specific result */}
                {!searchResult && (
                    <NacionalesFilters
                        filters={filters}
                        onFiltersChange={setFilters}
                        onClear={handleClearFilters}
                    />
                )}
            </div>

            {searchResult ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800">Detalle del Proceso</h2>
                        <Button variant="outline" size="sm" onClick={handleClearSearch}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver al listado
                        </Button>
                    </div>

                    <div className="space-y-6">
                        {/* Timeline */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-2">Línea de Tiempo</h3>
                            <NacionalesTimeline data={searchResult} />
                        </div>

                        {/* Accordion Details */}
                        <NacionalesDetailsAccordion
                            data={searchResult}
                            onEditCompra={() => setOpenCompraModal(true)}
                            onCreateVenta={() => setOpenVentaModal(true)}
                            onEditVenta={() => setOpenVentaModal(true)}
                            onCreateReporteExp={() => setOpenReporteExpModal(true)}
                            onEditReporteExp={() => setOpenReporteExpModal(true)}
                            onCreateReporteProv={() => setOpenReporteProvModal(true)}
                            onEditReporteProv={() => setOpenReporteProvModal(true)}
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <IncompletePurchasesTable
                        data={incompletas}
                        filters={filters}
                        onSelect={(compra) => {
                            setSearchTerm(compra.numero_guia);
                            handleSearch(compra.numero_guia);
                        }}
                    />
                </div>
            )}

            {/* Modals */}
            <CompraNacionalModal
                open={openCompraModal}
                onOpenChange={setOpenCompraModal}
                initialData={searchResult}
                onSuccess={(data) => {
                    handleSearch(data.numero_guia);
                    fetchIncompletas();
                }}
            />

            {searchResult && (
                <>
                    <VentaNacionalModal
                        open={openVentaModal}
                        onOpenChange={setOpenVentaModal}
                        compraData={searchResult}
                        initialData={searchResult.ventanacional}
                        onSuccess={refreshCurrentView}
                    />

                    {searchResult.ventanacional && (
                        <ReporteExportadorModal
                            open={openReporteExpModal}
                            onOpenChange={setOpenReporteExpModal}
                            ventaData={searchResult.ventanacional}
                            compraData={searchResult}
                            initialData={searchResult.ventanacional.reportecalidadexportador}
                            onSuccess={refreshCurrentView}
                        />
                    )}

                    {searchResult.ventanacional?.reportecalidadexportador && (
                        <ReporteProveedorModal
                            open={openReporteProvModal}
                            onOpenChange={setOpenReporteProvModal}
                            reporteExpData={searchResult.ventanacional.reportecalidadexportador}
                            compraData={searchResult}
                            initialData={searchResult.ventanacional.reportecalidadexportador.reportecalidadproveedor}
                            onSuccess={refreshCurrentView}
                        />
                    )}
                </>
            )}
        </div>
    );
}
