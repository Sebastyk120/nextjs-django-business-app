"use client";

import { useState, useEffect } from "react";
import { OrdersTable } from "@/components/comercial/OrdersTable";
import { OrdersFilters } from "@/components/comercial/OrdersFilters";
import { Pagination } from "@/components/comercial/Pagination";
import { Pedido, PedidoFilters } from "@/types/pedido";
import { Button } from "@/components/ui/button";
import { Plus, Download, FileSpreadsheet, LayoutList } from "lucide-react";
import axiosClient from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { GroupedColumn, GroupedColumnSelector, ColumnGroup } from "@/components/comercial/GroupedColumnSelector";
import { NewOrderModal } from "@/components/comercial/NewOrderModal";
import { OrderDetailsDrawer } from "@/components/comercial/OrderDetailsDrawer";
import { OrderCancellationModal } from "@/components/comercial/OrderCancellationModal";
import { ExportOrdersModal } from "@/components/comercial/ExportOrdersModal";
import { ExportDetailsModal } from "@/components/comercial/ExportDetailsModal";
import { ExportUtilitiesModal } from "@/components/comercial/ExportUtilitiesModal";
import { ExportCarteraModal } from "@/components/comercial/ExportCarteraModal";
import { ExportCarteraEnviarModal } from "@/components/comercial/ExportCarteraEnviarModal";
import { ExportSeguimientoModal } from "@/components/comercial/ExportSeguimientoModal";
import { ExportResumenModal } from "@/components/comercial/ExportResumenModal";
import { OrderEditSheet } from "@/components/comercial/OrderEditSheet";
import { VIEW_PRESETS } from "@/components/comercial/ViewPresets";
import { cn } from "@/lib/utils";
import {
    Briefcase,
    TrendingUp,
    Plane,
    FileText,
    Send,
    ClipboardList
} from "lucide-react";

const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US').format(value);
};

// Initial Columns Configuration based on user request
const INITIAL_COLUMNS: GroupedColumn[] = [
    // General
    { key: "id", label: "No.", group: "General" },
    { key: "cliente", label: "Cliente", group: "General" },
    { key: "intermediario", label: "Intermediario", group: "General" },
    { key: "semana", label: "Semana", group: "General" },

    // Fechas
    { key: "fecha_solicitud", label: "Fecha Solicitud", group: "Fechas" },
    { key: "fecha_entrega", label: "Fecha Entrega", group: "Fechas" },
    { key: "fecha_llegada", label: "Llegada Estimada", group: "Fechas" },

    // Logística
    { key: "exportadora", label: "Exportador", group: "Logística" },
    { key: "subexportadora", label: "Subexportadora", group: "Logística" },
    { key: "dias_cartera", label: "Días Cartera", group: "Logística" },
    { key: "awb", label: "Guía AWB", group: "Logística" },
    { key: "destino", label: "Destino IATA", group: "Logística" },

    // Tracking
    { key: "variedades", label: "Variedades", group: "Tracking" },
    { key: "estado_pedido", label: "Estado Pedido", group: "Tracking" },
    { key: "estado_cancelacion", label: "Cancelación", group: "Tracking" },
    { key: "observaciones", label: "Observaciones", group: "Tracking" },

    // Facturación
    { key: "numero_factura", label: "N° Factura", group: "Facturación" },
    { key: "estado_factura", label: "Estado Factura", group: "Facturación" },
    { key: "fecha_pago", label: "Fecha Pago", group: "Facturación" },
    { key: "valor_pagado_cliente_usd", label: "Pagado (USD)", group: "Facturación" },
    { key: "dias_de_vencimiento", label: "Días Venc.", group: "Facturación" },
    { key: "valor_total_factura_usd", label: "Total Factura", group: "Facturación" },
    { key: "diferencia_por_abono", label: "Dif / Abono", group: "Facturación" },

    // Cantidades
    { key: "total_cajas_solicitadas", label: "Cajas Sol.", group: "Cantidades" },
    { key: "total_cajas_enviadas", label: "Cajas Env.", group: "Cantidades" },
    { key: "total_peso_bruto_solicitado", label: "Peso Bruto Sol.", group: "Cantidades" },
    { key: "total_peso_bruto_enviado", label: "Peso Bruto Env.", group: "Cantidades" },
    { key: "total_piezas_solicitadas", label: "Piezas Sol.", group: "Cantidades" },
    { key: "total_piezas_enviadas", label: "Piezas Env.", group: "Cantidades" },

    // Financiero
    { key: "descuento", label: "Descuento", group: "Financiero" },
    { key: "nota_credito_no", label: "N° Nota Crédito", group: "Financiero" },
    { key: "motivo_nota_credito", label: "Motivo NC", group: "Financiero" },
    { key: "valor_total_nota_credito_usd", label: "Total NC (USD)", group: "Financiero" },
    { key: "utilidad_bancaria_usd", label: "Comisión Bancaria", group: "Financiero" },
    { key: "fecha_monetizacion", label: "Fecha Monetiz.", group: "Financiero" },
    { key: "trm_monetizacion", label: "TRM Monetiz.", group: "Financiero" },
    { key: "tasa_representativa_usd_diaria", label: "TRM Oficial", group: "Financiero" },
    { key: "trm_cotizacion", label: "TRM Cotiz.", group: "Financiero" },
    { key: "valor_total_utilidad_usd", label: "Utilidad (USD)", group: "Financiero" },
    { key: "valor_utilidad_pesos", label: "Utilidad (COP)", group: "Financiero" },
    { key: "valor_total_recuperacion_usd", label: "Recup. (USD)", group: "Financiero" },
    { key: "documento_cobro_utilidad", label: "Doc. Cobro Utilidad", group: "Financiero" },
    { key: "fecha_pago_utilidad", label: "Pago Utilidad", group: "Financiero" },
    { key: "estado_utilidad", label: "Estado Utilidad", group: "Financiero" },
];

const DEFAULT_VISIBLE_COLUMNS: (keyof Pedido)[] = [
    "id", "semana", "cliente", "fecha_entrega", "exportadora", "awb", "destino", "variedades",
    "total_cajas_solicitadas", "numero_factura", "estado_factura", "valor_total_factura_usd",
    "valor_pagado_cliente_usd", "fecha_pago", "estado_pedido", "dias_de_vencimiento"
];

import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function OrdersPageContent() {
    const { user } = useAuth({ middleware: 'auth' });
    const searchParams = useSearchParams();

    // Initial State from URL
    const initialPreset = searchParams.get('preset');
    const initialExportadora = searchParams.get('exportadora');

    const [orders, setOrders] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [visibleColumns, setVisibleColumns] = useState<(keyof Pedido)[]>(DEFAULT_VISIBLE_COLUMNS);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [activePreset, setActivePreset] = useState<string | null>(initialPreset);

    // Prepare initial filters
    const [filters, setFilters] = useState<PedidoFilters>(() => {
        const init: PedidoFilters = {};
        if (initialExportadora) init.exportadora = initialExportadora;
        return init;
    });

    const [clients, setClients] = useState<{ id: number, nombre: string }[]>([]);
    const [intermediaries, setIntermediaries] = useState<{ id: number, nombre: string }[]>([]);
    const [exportadoras, setExportadoras] = useState<{ id: number, nombre: string }[]>([]);
    const [weeks, setWeeks] = useState<{ id: string, label: string }[]>([]);

    // Edit State
    const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

    const handleEditOrder = (order: Pedido) => {
        setEditingOrderId(order.id);
        setIsEditSheetOpen(true);
    };

    // Details Drawer State
    const [detailsOrderId, setDetailsOrderId] = useState<number | null>(null);
    const [detailsOrderNumber, setDetailsOrderNumber] = useState<string | null>(null);
    const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

    const handleViewDetails = (order: Pedido) => {
        setDetailsOrderId(order.id);
        setDetailsOrderNumber(order.id.toString());
        setIsDetailsDrawerOpen(true);
    };

    // Initialize Preset Columns if preset is in URL
    useEffect(() => {
        if (initialPreset) {
            const preset = VIEW_PRESETS.find(p => p.id === initialPreset);
            if (preset) {
                setVisibleColumns(preset.columns);
            }
        }
    }, [initialPreset]);

    // Update filters if URL changes (re-sync)
    useEffect(() => {
        const currentExportadora = searchParams.get('exportadora');
        setFilters(prev => {
            if (prev.exportadora !== currentExportadora && currentExportadora) {
                return { ...prev, exportadora: currentExportadora };
            }
            return prev;
        });
        const currentPreset = searchParams.get('preset');
        if (currentPreset && currentPreset !== activePreset) {
            setActivePreset(currentPreset);
            const preset = VIEW_PRESETS.find(p => p.id === currentPreset);
            if (preset) {
                setVisibleColumns(preset.columns);
            }
        }
    }, [searchParams]);


    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [cRes, iRes, eRes, wRes] = await Promise.all([
                    axiosClient.get('/comercial/api/clientes/'),
                    axiosClient.get('/comercial/api/intermediarios/'),
                    axiosClient.get('/comercial/api/exportadores/'),
                    axiosClient.get('/comercial/api/pedidos/weeks/')
                ]);
                setClients(Array.isArray(cRes.data) ? cRes.data : (cRes.data.results || []));
                setIntermediaries(Array.isArray(iRes.data) ? iRes.data : (iRes.data.results || []));
                setExportadoras(Array.isArray(eRes.data) ? eRes.data : (eRes.data.results || []));
                setWeeks(wRes.data);
            } catch (error) {
                console.error("Error fetching filter options:", error);
            }
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                // Construct Query Params
                const params = new URLSearchParams();
                params.append('page', page.toString());
                params.append('page_size', pageSize.toString());

                if (filters.search) params.append('search', filters.search);
                if (filters.awb) params.append('awb', filters.awb);
                if (filters.pedido_id) params.append('pedido_id', filters.pedido_id);
                if (filters.cliente) params.append('cliente', filters.cliente);
                if (filters.intermediario) params.append('intermediario', filters.intermediario);
                if (filters.numero_factura) params.append('numero_factura', filters.numero_factura);
                if (filters.estado_pedido) params.append('estado_pedido', filters.estado_pedido);
                if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
                if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
                if (filters.semana) params.append('semana', filters.semana);

                // Add exportadora filter
                if (filters.exportadora) params.append('exportadora', filters.exportadora);

                const response = await axiosClient.get(`/comercial/api/pedidos/?${params.toString()}`);

                setOrders(response.data.results);
                setTotalItems(response.data.count);
            } catch (error) {
                console.error("Error loading orders:", error);
                setOrders([]);
                setTotalItems(0);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [page, pageSize, filters, refreshTrigger]);

    const handleToggleColumn = (key: keyof Pedido) => {
        if (visibleColumns.includes(key)) {
            setVisibleColumns(visibleColumns.filter(c => c !== key));
        } else {
            setVisibleColumns([...visibleColumns, key]);
        }
    };

    const handleToggleGroup = (group: ColumnGroup, show: boolean) => {
        const groupCols = INITIAL_COLUMNS.filter(col => col.group === group).map(col => col.key);
        if (show) {
            // Add all columns from this group that aren't already visible
            const newCols = [...visibleColumns];
            groupCols.forEach(key => {
                if (!newCols.includes(key)) newCols.push(key);
            });
            setVisibleColumns(newCols);
        } else {
            // Remove all columns from this group
            setVisibleColumns(visibleColumns.filter(key => !groupCols.includes(key)));
        }
    };

    // Merge formatters with initial columns configuration AND apply overrides from activePreset
    const columnsWithFormatters = INITIAL_COLUMNS.map(col => {
        let formatter;
        let label = col.label;

        // Apply Header Overrides from Active Preset
        if (activePreset) {
            const preset = VIEW_PRESETS.find(p => p.id === activePreset);
            if (preset && preset.headers && preset.headers[col.key]) {
                label = preset.headers[col.key]!;
            }
        }

        // Apply formatters based on key
        if (['total_peso_bruto_solicitado', 'total_peso_bruto_enviado', 'total_piezas_solicitadas', 'total_piezas_enviadas'].includes(col.key)) {
            formatter = formatNumber;
        } else if (['descuento', 'valor_total_nota_credito_usd', 'utilidad_bancaria_usd', 'valor_pagado_cliente_usd', 'trm_monetizacion', 'tasa_representativa_usd_diaria', 'trm_cotizacion', 'diferencia_por_abono', 'valor_total_factura_usd', 'valor_total_utilidad_usd', 'valor_total_recuperacion_usd'].includes(col.key)) {
            formatter = formatCurrency;
        } else if (col.key === 'valor_utilidad_pesos') {
            formatter = (val: any) => val ? `$${Number(val).toLocaleString('es-CO')}` : '-';
        } else if (['cliente', 'intermediario', 'exportadora', 'subexportadora'].includes(col.key)) {
            formatter = (val: string | null | undefined) => (
                <div className="max-w-[150px] truncate text-slate-700 font-medium" title={val || ''}>
                    {val || '-'}
                </div>
            );
        } else if (col.key === 'dias_de_vencimiento') {
            formatter = (val: any) => (
                <span className={val <= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                    {val}
                </span>
            );
        } else if (col.key === 'variedades') {
            formatter = (val: string | null | undefined) => {
                if (!val) return '-';
                const items = val.split(',').map(s => s.trim());
                if (items.length <= 2) return val;

                return (
                    <div className="flex items-center gap-1.5 min-w-[120px]">
                        <span className="truncate max-w-[140px] text-slate-700">
                            {items.slice(0, 2).join(', ')}
                        </span>
                        <Badge variant="secondary" className="px-1.5 h-4.5 text-[9px] bg-slate-100 text-slate-500 font-bold border-none shrink-0" title={val}>
                            +{items.length - 2}
                        </Badge>
                    </div>
                );
            };
        } else if (col.key === 'estado_pedido') {
            formatter = (val: any) => (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${val === 'Finalizado' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                    val === 'Cancelado' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                        val === 'Despachado' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                            'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                    }`}>
                    {val}
                </span>
            );
        }

        return { ...col, label, format: formatter };
    });

    const handlePresetChange = (presetId: string) => {
        const preset = VIEW_PRESETS.find(p => p.id === presetId);
        if (preset) {
            setActivePreset(presetId);
            setVisibleColumns(preset.columns);
            // Updating URL without reload would be ideal here but for now just state
        }
    };

    // Cancellation State
    const [cancellationOrder, setCancellationOrder] = useState<Pedido | null>(null);
    const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);

    const handleCancelOrder = (order: Pedido) => {
        setCancellationOrder(order);
        setIsCancellationModalOpen(true);
    };

    // Export Modals State
    const [isExportOrdersModalOpen, setIsExportOrdersModalOpen] = useState(false);
    const [isExportDetailsModalOpen, setIsExportDetailsModalOpen] = useState(false);
    const [isExportUtilitiesModalOpen, setIsExportUtilitiesModalOpen] = useState(false);
    const [isExportCarteraModalOpen, setIsExportCarteraModalOpen] = useState(false);
    const [isExportCarteraEnviarModalOpen, setIsExportCarteraEnviarModalOpen] = useState(false);
    const [isExportSeguimientoModalOpen, setIsExportSeguimientoModalOpen] = useState(false);
    const [isExportResumenModalOpen, setIsExportResumenModalOpen] = useState(false);

    const isHeavens = user?.groups?.includes("Heavens") || user?.groups?.includes("Autorizadores");

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[100vw] overflow-x-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-plus-jakarta">Gestión de Pedidos</h1>
                    <p className="text-muted-foreground text-sm">Visualiza y administra todos los pedidos de exportación.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {isHeavens && (
                        <NewOrderModal onOrderCreated={() => setRefreshTrigger(prev => prev + 1)} />
                    )}

                    {activePreset === 'utilidades' && (
                        <Button
                            variant="default"
                            onClick={() => setIsExportUtilitiesModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100"
                        >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Exportar Utilidades
                        </Button>
                    )}

                    {activePreset === 'cartera' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setIsExportCarteraModalOpen(true)}
                                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                            >
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Exp. Cartera
                            </Button>

                            {isHeavens && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsExportCarteraEnviarModalOpen(true)}
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        Enviar Cartera
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => toast.info("Funcionalidad en desarrollo")}
                                        className="text-slate-600 border-slate-200 hover:bg-slate-50"
                                    >
                                        <TrendingUp className="mr-2 h-4 w-4" />
                                        Estado de Cuenta
                                    </Button>
                                </>
                            )}
                        </>
                    )}

                    {activePreset === 'seguimiento' && (
                        <Button
                            variant="default"
                            onClick={() => setIsExportSeguimientoModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100"
                        >
                            <Plane className="mr-2 h-4 w-4" />
                            Exportar Seguimiento
                        </Button>
                    )}

                    {activePreset === 'resumen' && (
                        <Button
                            variant="default"
                            onClick={() => setIsExportResumenModalOpen(true)}
                            className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100"
                        >
                            <ClipboardList className="mr-2 h-4 w-4" />
                            Exportar Resumen
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => setIsExportOrdersModalOpen(true)}
                        className="text-slate-600 border-slate-200 hover:bg-slate-50"
                    >
                        <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                        Exportar
                    </Button>
                    {isHeavens && (
                        <Button
                            variant="outline"
                            onClick={() => setIsExportDetailsModalOpen(true)}
                            className="text-slate-600 border-slate-200 hover:bg-slate-50"
                        >
                            <Download className="mr-2 h-4 w-4 text-blue-600" />
                            Detalles
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-100/50">
                <OrdersFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClearFilters={() => setFilters({})}
                    clients={clients}
                    intermediaries={intermediaries}
                    exportadoras={exportadoras}
                    weeks={weeks}
                    activePreset={activePreset}
                />

                <div className="flex flex-wrap justify-end gap-2 px-4 py-2 border-t border-slate-50">
                    <div className="flex items-center gap-1 mr-auto overflow-x-auto pb-1 md:pb-0">
                        {VIEW_PRESETS.map((preset) => (
                            <Button
                                key={preset.id}
                                variant={activePreset === preset.id ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => handlePresetChange(preset.id)}
                                className={cn(
                                    "text-xs whitespace-nowrap transition-all",
                                    activePreset === preset.id
                                        ? "bg-slate-200 text-slate-900 font-medium"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                )}
                                title={preset.description}
                            >
                                {preset.id === 'general' && <LayoutList className="mr-2 h-3.5 w-3.5 text-slate-600" />}
                                {preset.id === 'cartera' && <Briefcase className="mr-2 h-3.5 w-3.5 text-amber-600" />}
                                {preset.id === 'utilidades' && <TrendingUp className="mr-2 h-3.5 w-3.5 text-emerald-600" />}
                                {preset.id === 'seguimiento' && <Plane className="mr-2 h-3.5 w-3.5 text-blue-600" />}
                                {preset.id === 'resumen' && <FileText className="mr-2 h-3.5 w-3.5 text-purple-600" />}
                                {preset.label}
                            </Button>
                        ))}
                    </div>

                    <GroupedColumnSelector
                        columns={INITIAL_COLUMNS}
                        visibleColumns={visibleColumns}
                        onToggleColumn={handleToggleColumn}
                        onToggleGroup={handleToggleGroup}
                    />
                </div>

                <div className="p-0 border-t border-slate-100">
                    <OrdersTable
                        data={orders}
                        visibleColumns={visibleColumns}
                        columnsConfig={columnsWithFormatters}
                        onEdit={handleEditOrder}
                        onViewDetails={handleViewDetails}
                        onCancel={handleCancelOrder}
                        activePreset={activePreset}
                        userGroups={user?.groups}
                    />
                </div>

                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                    <div className="text-sm text-slate-500 font-medium">
                        Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, totalItems)} de {totalItems} pedidos
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

            <OrderEditSheet
                open={isEditSheetOpen}
                onOpenChange={setIsEditSheetOpen}
                orderId={editingOrderId}
                mode={activePreset === 'cartera' ? 'cartera' : activePreset === 'utilidades' ? 'utilidades' : activePreset === 'seguimiento' ? 'seguimiento' : 'base'}
                onOrderUpdated={() => setRefreshTrigger(prev => prev + 1)}
                userGroups={user?.groups}
                activeExportadora={filters.exportadora}
            />

            <OrderDetailsDrawer
                open={isDetailsDrawerOpen}
                onOpenChange={setIsDetailsDrawerOpen}
                orderId={detailsOrderId}
                orderNumber={detailsOrderNumber}
                userGroups={user?.groups}
            />

            <OrderCancellationModal
                open={isCancellationModalOpen}
                onOpenChange={setIsCancellationModalOpen}
                order={cancellationOrder}
                onOrderUpdated={() => setRefreshTrigger(prev => prev + 1)}
                userGroups={user?.groups}
            />

            <ExportOrdersModal
                open={isExportOrdersModalOpen}
                onOpenChange={setIsExportOrdersModalOpen}
            />

            <ExportDetailsModal
                open={isExportDetailsModalOpen}
                onOpenChange={setIsExportDetailsModalOpen}
            />

            <ExportUtilitiesModal
                open={isExportUtilitiesModalOpen}
                onOpenChange={setIsExportUtilitiesModalOpen}
            />

            <ExportCarteraModal
                open={isExportCarteraModalOpen}
                onOpenChange={setIsExportCarteraModalOpen}
            />

            <ExportCarteraEnviarModal
                open={isExportCarteraEnviarModalOpen}
                onOpenChange={setIsExportCarteraEnviarModalOpen}
                clients={clients}
                intermediaries={intermediaries}
            />

            <ExportSeguimientoModal
                open={isExportSeguimientoModalOpen}
                onOpenChange={setIsExportSeguimientoModalOpen}
                clients={clients}
                intermediaries={intermediaries}
            />

            <ExportResumenModal
                open={isExportResumenModalOpen}
                onOpenChange={setIsExportResumenModalOpen}
                exportadoras={exportadoras}
                weeks={weeks}
                currentSemana={filters.semana}
            />
        </div>
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <OrdersPageContent />
        </Suspense>
    );
}
