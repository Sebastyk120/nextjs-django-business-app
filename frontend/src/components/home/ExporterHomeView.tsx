import { HomeDashboardData } from "@/types/home-dashboard";
import { StatCard } from "./StatCard";
import { ActivityFeed } from "./ActivityFeed";
import { QuickActions } from "./QuickActions";
import { OverdueClientsTable } from "./OverdueClientsTable";
import { TrendBarChart } from "./TrendBarChart";
import {
    ShoppingCart,
    Boxes,
    FileText,
    TrendingUp,
    TrendingDown,
    Store,
    Plane,
    PackageCheck,
    Wallet,
    LineChart
} from "lucide-react";
import { useRouter } from "next/navigation";

interface OverdueClient {
    name: string;
    amount: number;
    max_days: number;
    orders: number;
}

interface TrendItem {
    name: string;
    orders?: number;
    kilos?: number;
}

interface ExtendedDashboardData extends HomeDashboardData {
    overdue_clients?: OverdueClient[];
    trends_clients?: TrendItem[];
    trends_fruits?: TrendItem[];
}

export function ExporterHomeView({ data }: { data: HomeDashboardData }) {
    const router = useRouter();
    const extendedData = data as ExtendedDashboardData;
    const { metrics } = data;
    const overdueClients = extendedData.overdue_clients || [];
    const trendsClients = extendedData.trends_clients || [];
    const trendsFruits = extendedData.trends_fruits || [];

    const navActions = [
        { label: "Mis Pedidos", icon: ShoppingCart, href: "/pedidos", color: "bg-blue-600" },
        { label: "Inventario", icon: Store, href: "/inventarios", color: "bg-indigo-600" },
        { label: "Estado Cuenta", icon: Wallet, href: "/comercial/estado-cuenta", color: "bg-emerald-600" },
        { label: "Dash. Comercial", icon: LineChart, href: "/dashboard-comercial", color: "bg-amber-600" },
        { label: "Proy. Ventas", icon: TrendingUp, href: "/comercial/proyeccion-ventas", color: "bg-cyan-600" },
    ];

    const trendIsPositive = (metrics.orders_trend || 0) >= 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Critical Alerts */}
            {(metrics.overdue_orders || 0) > 0 && (
                <div
                    className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-amber-100 transition-colors"
                    onClick={() => router.push('/comercial/estado-cuenta')}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-800">Facturas Vencidas</h4>
                            <p className="text-sm text-amber-600">{metrics.overdue_orders} facturas con pago vencido</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Pedidos Semana"
                    value={metrics.orders_week || 0}
                    icon={ShoppingCart}
                    color="blue"
                    description={
                        <span className={`flex items-center gap-1 ${trendIsPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {trendIsPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {Math.abs(metrics.orders_trend || 0)}% vs semana anterior
                        </span>
                    }
                    onClick={() => router.push('/pedidos')}
                />
                <StatCard
                    title="En Tránsito"
                    value={metrics.in_transit || 0}
                    icon={Plane}
                    color="indigo"
                    description="Últimos 15 días (activos)"
                    onClick={() => router.push('/pedidos?filter=despachado')}
                />
                <StatCard
                    title="Cajas Enviadas"
                    value={(metrics.boxes_sent || 0).toLocaleString()}
                    icon={PackageCheck}
                    color="emerald"
                    description="Últimos 15 días"
                    onClick={() => router.push('/pedidos')}
                />
                <StatCard
                    title="Inventario"
                    value={metrics.inventory_items || 0}
                    icon={Store}
                    color="amber"
                    description="Referencias en bodega"
                    onClick={() => router.push('/inventarios')}
                />
            </div>

            {/* Content Split: Charts/Tables (Left) vs Activity (Right) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column (2/3) */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TrendBarChart
                            data={trendsClients}
                            title="Top Clientes (últimos 15 días)"
                            dataKey="orders"
                            unit="pedidos"
                        />
                        <TrendBarChart
                            data={trendsFruits}
                            title="Top Frutas por Kilos (últimos 15 días)"
                            dataKey="kilos"
                            unit="kg"
                        />
                    </div>

                    {/* Overdue Clients */}
                    {(overdueClients.length > 0) && (
                        <OverdueClientsTable clients={overdueClients} />
                    )}

                    {/* Quick Actions at bottom of left column */}
                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                            Acceso Rápido
                        </h2>
                        <QuickActions actions={navActions} />
                    </section>
                </div>

                {/* Right Column (1/3) - Moved Activity Feed Here for better visibility */}
                <div className="xl:col-span-1">
                    <div className="sticky top-4">
                        <ActivityFeed items={data.activity} />
                    </div>
                </div>
            </div>
        </div>
    );
}
