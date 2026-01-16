export interface DashboardMetrics {
    kilos: MetricData;
    cajas: MetricData;
    facturado: MetricData;
    utilidad: MetricData;
    recuperacion: MetricData;
    notas_credito: MetricData;
    cancelados: MetricData;
}

export interface MetricData {
    current: number;
    prev: number;
    percent: number;
}

export interface DashboardFilters {
    fecha_inicio: string;
    fecha_fin: string;
    fecha_inicio_anterior: string;
    fecha_fin_anterior: string;
    cliente_id: string;
    intermediario_id: string;
    fruta_id: string;
    exportador_id: string;
}

export interface FilterOption {
    id: number;
    nombre: string;
}

export interface UtilidadData {
    cliente__nombre?: string;
    fruta__nombre?: string;
    exportadora__nombre?: string;
    total_utilidad: number;
    total_nc: number;
}

export interface MonthlyData {
    año: number;
    mes: number;
    fecha: string;
    nombre_mes: string;
    total_kilos: number;
    total_cajas: number;
    total_utilidad: number;
    total_nc: number;
}

export interface ClientData {
    cliente__nombre: string;
    num_pedidos: number;
    total_kilos: number;
    total_facturado: number;
    total_utilidades: number;
    total_nc: number;
    percent_kilos: number;
    percent_utilidad: number;
}

export interface DashboardData {
    clientes: FilterOption[];
    intermediarios: FilterOption[];
    frutas: FilterOption[];
    exportadores: FilterOption[];
    filters: DashboardFilters;
    metrics: DashboardMetrics;
    charts: {
        utilidad_cliente: UtilidadData[];
        utilidad_cliente_prev: UtilidadData[];
        utilidad_fruta: UtilidadData[];
        utilidad_fruta_prev: UtilidadData[];
        utilidad_exportador: UtilidadData[];
        utilidad_exportador_prev: UtilidadData[];
        kilos_fruta: { fruta__nombre: string; total_kilos: number }[];
        mensual: MonthlyData[];
        mensual_prev: MonthlyData[];
    };
    clients_data: ClientData[];
}
