export interface QualityChartData {
    semana: string;
    calidad_promedio: number;
    merma_promedio: number;
    precio_promedio: number;
    kg_exportacion: number;
    kg_merma: number;
}

export interface QualityKPIs {
    total_kg_recibidos: number;
    total_kg_exportacion: number;
    promedio_calidad: number;
    promedio_precio: number;
    porcentaje_merma_global: number;
}

export interface QualityDashboardResponse {
    chart_data: QualityChartData[];
    kpis: QualityKPIs;
}

export interface QualityFiltersState {
    proveedor?: string;
    exportador?: string;
    fruta?: string;
    fecha_inicio?: Date;
    fecha_fin?: Date;
}
