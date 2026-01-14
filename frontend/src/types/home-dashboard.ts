export interface HomeDashboardData {
    is_heavens: boolean;
    user_name: string;
    greeting: string;
    metrics: HomeDashboardMetrics;
    activity: ActivityItem[];
    alerts: AlertItem[];
    role?: string;
    company_name?: string;
    error?: string;
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
