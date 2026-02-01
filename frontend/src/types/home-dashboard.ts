export interface HomeDashboardData {
    is_heavens: boolean;
    user_name: string;
    greeting: string;
    metrics: HomeDashboardMetrics;
    activity: ActivityItem[];
    alerts: AlertItem[];
    role?: string;
    company_name?: string;
    logo?: string;
    error?: string;
    // Extended data
    upcoming_deliveries?: UpcomingDelivery[];
    trends_clients?: TrendItem[];
    trends_fruits?: TrendItem[];
    overdue_clients?: OverdueClient[];
    airlines_performance?: AirlinePerformance[];
}

export interface UpcomingDelivery {
    id: number;
    client: string;
    exporter: string;
    date: string;
    status: string;
}

export interface TrendItem {
    name: string;
    orders?: number;
    kilos?: number;
}

export interface OverdueClient {
    id: number;
    name: string;
    amount: number;
    max_days: number;
    orders: number;
}

export interface AirlinePerformance {
    name: string;
    kg_sent: number;
    avg_weight_diff: number;
    avg_delay_hours: number;
    delayed_percentage: number;
}

export interface HomeDashboardMetrics {
    // Heavens
    pending_cancellations?: number;
    orders_week?: number;
    orders_trend?: number;
    in_transit?: number;
    boxes_sent?: number;
    overdue_orders?: number;
    pending_quality_reports?: number;

    // Exportador
    active_orders?: number;
    inventory_items?: number;
    account_balance?: number;
}



export interface ActivityItem {
    id: number;
    type: 'new_order' | 'my_order' | 'system' | 'alert';
    title: string;
    description: string;
    date: string; // ISO string
    status?: string;
}

export interface AlertItem {
    id: string;
    level: 'info' | 'warning' | 'critical';
    message: string;
    action_url?: string;
}
