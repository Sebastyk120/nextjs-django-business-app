export interface ProyeccionFilters {
    fecha_inicio: string;
    fecha_fin: string;
    forecast_months: number;
    cliente_id?: string;
    fruta_id?: string;
    exportador_id?: string;
}

export interface MetricData {
    kilos: number;
    cajas: number;
    valor: number;
}

export interface SummaryMetrics {
    historical: MetricData;
    forecast: MetricData;
    growth_percent: MetricData;
}

export interface ForecastDataPoint {
    fecha: string;
    cliente?: string;
    fruta?: string;
    kilos: number;
    cajas: number;
    valor: number;
    kilos_lower?: number;
    kilos_upper?: number;
    is_forecast?: boolean;
}

export interface HistoricalDataPoint extends ForecastDataPoint {
    is_forecast?: false;
}

export interface SeasonalClient {
    cliente: string;
    active_months: string[];
    concentration: number;
    pattern_strength: 'Alta' | 'Media' | 'Baja';
    monthly_percentages?: Record<string, number>;
}

export interface SeasonalFruit {
    fruta: string;
    active_months: string[];
    concentration: number;
    pattern_strength: 'Alta' | 'Media' | 'Baja';
}

export interface CustomerGrowth {
    cliente: string;
    growth: number;
    current_year_kilos: number;
    previous_year_kilos: number;
    is_seasonal: boolean;
}

export interface PortfolioAnalysis {
    new_customers: string[];
    lost_customers: string[];
    growing_customers: CustomerGrowth[];
    declining_customers: CustomerGrowth[];
}

export interface ProyeccionResponse {
    filters: ProyeccionFilters;
    summary_metrics: SummaryMetrics;
    historical_data: HistoricalDataPoint[];
    forecast_data: ForecastDataPoint[];
    seasonal_patterns: {
        seasonal_clients: SeasonalClient[];
        seasonal_fruits: SeasonalFruit[];
    };
    portfolio_analysis: PortfolioAnalysis;
    model_metadata: {
        algorithm: string;
        reason?: string;
    };
}
