export interface DashboardNacionalesMetric {
    current: number;
    prev: number;
    percent: number;
}

export interface DashboardNacionalesMetrics {
    compras_totales: DashboardNacionalesMetric;
    kilos_brutos: DashboardNacionalesMetric;
    kilos_netos: DashboardNacionalesMetric;
    utilidad_real: DashboardNacionalesMetric;
    utilidad_sin_ajuste: DashboardNacionalesMetric;
    reportes_pendientes: DashboardNacionalesMetric;
}

export interface ProveedorDashboardData {
    proveedor_id: number;
    proveedor_nombre: string;
    numero_compras: number;
    reportes_pendientes: number;
    valor_compras: number;
    total_pagado: number;
    facturado_exportadores: number;
    kilos_brutos: number;
    kilos_netos: number;
    utilidad_real: number;
    percent_kilos: number;
    percent_utilidad: number;
    percent_utilidad_compra: number;
}

export interface KilosDistribucion {
    tipo: string;
    kilos: number;
    porcentaje: number;
}

export interface EvolucionCalidadProveedor {
    nombre: string;
    exportacion: number[];
}

export interface EvolucionCalidad {
    meses: string[];
    proveedores: EvolucionCalidadProveedor[];
}

export interface UtilidadItem {
    nombre: string;
    utilidad: number;
}

export interface DashboardNacionalesCharts {
    utilidades_proveedor: UtilidadItem[];
    utilidades_fruta: UtilidadItem[];
    kilos_distribucion: KilosDistribucion[];
    evolucion_calidad: EvolucionCalidad;
}

export interface DashboardNacionalesFilters {
    fecha_inicio: string;
    fecha_fin: string;
    proveedor_id: string | null;
    fruta_id: string | null;
}

export interface FilterOption {
    id: number;
    nombre: string;
}

export interface DashboardNacionalesData {
    filters: DashboardNacionalesFilters;
    proveedores: FilterOption[];
    frutas: FilterOption[];
    metrics: DashboardNacionalesMetrics;
    proveedores_data: ProveedorDashboardData[];
    charts: DashboardNacionalesCharts;
}

export interface BalanceProveedor {
    proveedor_id: number;
    proveedor_nombre: string;
    saldo_disponible: number;
    ultima_actualizacion: string;
    total_compras: number;
    total_transferido: number;
    saldo_pendiente: number;
    total_utilidad: number;
}

export interface BalanceProveedoresResponse {
    balances: BalanceProveedor[];
    total_saldo: number;
    totales: {
        total_compras: number;
        total_transferido: number;
        total_saldo_pendiente: number;
        total_utilidad: number;
    };
}
