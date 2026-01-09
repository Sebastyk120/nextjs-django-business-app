"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getEstadoCuenta } from '@/services/estadoCuentaService';
import { EstadoCuentaData, EstadoCuentaFilters, EstadoCuentaInvoice } from '@/types/estadoCuenta';
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    ComposedChart, Line, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    LayoutDashboard, DollarSign, Calendar, TrendingUp,
    AlertCircle, CheckCircle2, FileText, Download, Filter
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateTimePicker } from "@/components/comercial/DateTimePicker";

// Helper for currency formatting
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(value);
};

export default function EstadoCuentaPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<EstadoCuentaFilters | null>(null);
    const [data, setData] = useState<EstadoCuentaData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [tableSearch, setTableSearch] = useState('');
    const [tableStatusFilter, setTableStatusFilter] = useState('all');

    // Initial Params
    const [selectedClient, setSelectedClient] = useState(searchParams.get('cliente') || '');
    const [startDate, setStartDate] = useState(searchParams.get('fecha_inicial') || '');
    const [endDate, setEndDate] = useState(searchParams.get('fecha_final') || '');
    const [selectedGroup, setSelectedGroup] = useState(searchParams.get('grupo') || '');

    // Colors for charts
    const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#6366f1'];

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: any = {};
            if (selectedClient) params.cliente = selectedClient;
            if (startDate) params.fecha_inicial = startDate;
            if (endDate) params.fecha_final = endDate;
            if (selectedGroup && selectedGroup !== 'all') params.grupo = selectedGroup;

            const res = await getEstadoCuenta(params);

            if (res.error) {
                setError(res.error);
            } else {
                setFilters(res.filters);
                if (res.data) setData(res.data);

                // Update local state with returned filter defaults if empty
                if (!startDate && res.filters.fecha_inicial) setStartDate(res.filters.fecha_inicial);
                if (!endDate && res.filters.fecha_final) setEndDate(res.filters.fecha_final);
            }
        } catch (err) {
            setError('Error al cargar datos. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // Effect to fetch on mount or when params change (if we wanted auto-fetch)
    // For now, we fetch on mount to get filter lists
    useEffect(() => {
        fetchData();
    }, []);

    // Handle Filter Submit
    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();

        // Update URL
        const params = new URLSearchParams();
        if (selectedClient) params.set('cliente', selectedClient);
        if (startDate) params.set('fecha_inicial', startDate);
        if (endDate) params.set('fecha_final', endDate);
        if (selectedGroup) params.set('grupo', selectedGroup);
        router.push(`?${params.toString()}`);
    };

    const availableStatuses = useMemo(() => {
        if (!data) return [];
        return Array.from(new Set(data.facturas.map(f => f.estado_texto))).sort();
    }, [data?.facturas]);

    const filteredInvoices = useMemo(() => {
        if (!data) return [];
        return data.facturas.filter(f => {
            const numeroFactura = (f.numero_factura || '').toString().toLowerCase();
            const awb = (f.awb || '').toString().toLowerCase();
            const search = tableSearch.toLowerCase();

            const matchesSearch = numeroFactura.includes(search) || awb.includes(search);
            const matchesStatus = tableStatusFilter === 'all' || f.estado_texto === tableStatusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [data, tableSearch, tableStatusFilter]);
    // --- Render Components ---

    if (!filters && loading) return <div className="p-8 text-center">Cargando sistema...</div>;

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-plus-jakarta flex items-center gap-2">
                        <LayoutDashboard className="h-8 w-8 text-indigo-600" />
                        Estado de Cuenta Clientes
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Gestión y seguimiento de cartera por cliente</p>
                </div>

                {data && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                            onClick={() => window.open(`/comercial/dashboard_cliente/exportar/?cliente=${selectedClient}&fecha_inicial=${startDate}&fecha_final=${endDate}&grupo=${selectedGroup}`, '_blank')}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Exportar Excel
                        </Button>
                    </div>
                )}
            </div>

            {/* Filters Bar */}
            <Card className="border-slate-200 shadow-sm bg-white/80 backdrop-blur sticky top-0 z-10">
                <CardContent className="p-4">
                    <form onSubmit={handleFilter} className="flex flex-col lg:flex-row gap-4 items-end">
                        <div className="flex-1 w-full lg:w-auto space-y-2">
                            <label className="text-sm font-medium text-slate-700">Cliente</label>
                            <Select value={selectedClient} onValueChange={setSelectedClient}>
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue placeholder="Seleccione un cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filters?.clientes.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full lg:w-56 space-y-2">
                            <label className="text-sm font-medium text-slate-700">Desde</label>
                            <DateTimePicker
                                value={startDate}
                                onChange={setStartDate}
                                showTime={false}
                            />
                        </div>

                        <div className="w-full lg:w-56 space-y-2">
                            <label className="text-sm font-medium text-slate-700">Hasta</label>
                            <DateTimePicker
                                value={endDate}
                                onChange={setEndDate}
                                showTime={false}
                            />
                        </div>

                        {/* Exportadora Filter - Only show selection if user allowed (logic handled by backend sending all exportadoras) */}
                        <div className="w-full lg:w-48 space-y-2">
                            <label className="text-sm font-medium text-slate-700">Exportadora</label>
                            <Select
                                value={selectedGroup}
                                onValueChange={setSelectedGroup}
                                disabled={!!filters?.grupo_usuario && filters.grupo_usuario !== 'Heavens'}
                            >
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {filters?.exportadoras.map(e => (
                                        <SelectItem key={e.nombre} value={e.nombre}>{e.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" className="w-full lg:w-auto bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]">
                            <Filter className="mr-2 h-4 w-4" />
                            Filtrar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {error}
                </div>
            )}

            {!data && !loading && !error && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <LayoutDashboard className="h-16 w-16 mb-4 opacity-20" />
                    <h3 className="text-lg font-medium text-slate-600">Seleccione un cliente para comenzar</h3>
                    <p className="max-w-md text-center mt-2">Utilice los filtros superiores para visualizar el estado de cuenta.</p>
                </div>
            )}

            {data && (
                <>
                    {/* KPIs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <KPICard
                            title="Total Facturado"
                            value={data.kpis.total_facturado}
                            icon={<DollarSign className="h-5 w-5 text-indigo-600" />}
                            color="bg-indigo-50 border-indigo-100"
                        />
                        <KPICard
                            title="Total Pagado"
                            value={data.kpis.total_pagado}
                            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                            color="bg-emerald-50 border-emerald-100"
                        />
                        <KPICard
                            title="Vencido"
                            value={data.kpis.total_facturas_vencidas}
                            icon={<AlertCircle className="h-5 w-5 text-red-600" />}
                            color="bg-red-50 border-red-100"
                            highlight={data.kpis.total_facturas_vencidas > 0}
                        />
                        <KPICard
                            title="Comisión Bancaria"
                            value={data.kpis.total_utilidad}
                            icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
                            color="bg-blue-50 border-blue-100"
                        />
                        <KPICard
                            title="Saldo Pendiente"
                            value={data.kpis.saldo_pendiente}
                            icon={<AlertCircle className="h-5 w-5 text-amber-600" />}
                            color="bg-amber-50 border-amber-100"
                            isSaldo
                        />
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left Column: Info & Portfolio Chart */}
                        <div className="space-y-6">
                            {/* Client Info */}
                            <Card className="border-slate-200">
                                <CardHeader className="bg-slate-50/50 pb-4">
                                    <CardTitle className="text-sm uppercase tracking-wider text-slate-500 font-semibold">Información del Cliente</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">Nombre</span>
                                        <span className="font-medium text-slate-900">{data.cliente_info.nombre}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">Tax ID</span>
                                        <span className="font-medium text-slate-900">{data.cliente_info.tax_id}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">País</span>
                                        <span className="font-medium text-slate-900">{data.cliente_info.pais}</span>
                                    </div>
                                    <div className="flex justify-between pt-1">
                                        <span className="text-slate-500">Días Cartera</span>
                                        <span className="font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-full">
                                            {data.cliente_info.dias_cartera} días
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Portfolio Status Chart */}
                            <Card className="border-slate-200">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">Estado de Cartera</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="h-[200px] w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data.charts.cartera_status}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {data.charts.cartera_status.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Center Text */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="text-center mt-[-10px]">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Total</p>
                                                <p className="text-sm font-bold text-slate-800">
                                                    {formatCurrency(data.kpis.total_facturado).split('.')[0]}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Custom Legend List */}
                                    <div className="space-y-2 pt-2 border-t border-slate-50">
                                        {data.charts.cartera_status.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                    <span className="text-slate-600 font-medium">
                                                        {item.name === 'Utilidad' ? 'Comisión Bancaria' : item.name}
                                                    </span>
                                                </div>
                                                <span className="font-bold text-slate-900">{formatCurrency(item.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Upcoming Invoices (Condensed) */}
                            <Card className="border-slate-200">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold flex items-center text-amber-700">
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        Facturas Próximas a vencer
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {data.facturas_proximas.length > 0 ? (
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2">Factura</th>
                                                        <th className="px-4 py-2 text-right">Saldo</th>
                                                        <th className="px-4 py-2 text-right">Días</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {data.facturas_proximas.map((f, i) => (
                                                        <tr key={i} className="hover:bg-slate-50">
                                                            <td className="px-4 py-2 font-medium">{f.numero_factura}</td>
                                                            <td className="px-4 py-2 text-right">{formatCurrency(f.saldo)}</td>
                                                            <td className="px-4 py-2 text-right">
                                                                <span className={`
                                                                px-2 py-0.5 rounded-full text-xs font-medium
                                                                ${f.dias_restantes < 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}
                                                            `}>
                                                                    {f.dias_restantes}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="p-6 text-center text-slate-400 text-sm">
                                                No hay facturas críticas.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Center/Right Column: Charts & Tables */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Payments Trend Chart */}
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">Comportamiento de Pagos vs Días Cartera</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[320px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={data.charts.pagos_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="fecha_pago"
                                                tickFormatter={(val) => format(parseISO(val), 'MMM dd', { locale: es })}
                                                tick={{ fontSize: 11, fill: '#64748b' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: '#64748b' }}
                                                axisLine={false}
                                                tickLine={false}
                                                label={{ value: 'Días', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                                            />
                                            <Tooltip
                                                formatter={(value: any, name: any) => {
                                                    if (name === 'monto_tooltip') return [formatCurrency(value), 'Monto Pagado'];
                                                    return [value, name === 'dias_pago' ? 'Días Real' : 'Días Acordados'];
                                                }}
                                                labelFormatter={(l) => format(parseISO(l), 'dd MMMM yyyy', { locale: es })}
                                            />
                                            <Legend />

                                            {/* Reference Line for Agreement */}
                                            <Line
                                                type="step"
                                                dataKey="dias_cartera"
                                                name="Término Acordado"
                                                stroke="#f59e0b"
                                                strokeDasharray="5 5"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                            {/* Actual Payment Days */}
                                            <Area
                                                type="monotone"
                                                dataKey="dias_pago"
                                                name="Días Real de Pago"
                                                stroke="#6366f1"
                                                fill="url(#areaColor)"
                                                strokeWidth={2}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Invoice List Table */}
                            <Card className="border-slate-200 shadow-sm overflow-hidden">
                                <CardHeader className="bg-white border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <CardTitle className="text-base font-semibold">Detalle de Facturas</CardTitle>
                                        <CardDescription>Listado completo de facturas en el periodo seleccionado</CardDescription>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                        <Input
                                            placeholder="Buscar factura o AWB..."
                                            value={tableSearch}
                                            onChange={(e) => setTableSearch(e.target.value)}
                                            className="h-9 w-full sm:w-[200px]"
                                        />
                                        <Select value={tableStatusFilter} onValueChange={setTableStatusFilter}>
                                            <SelectTrigger className="h-9 w-full sm:w-[150px]">
                                                <SelectValue placeholder="Estado" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {availableStatuses.map(s => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardHeader>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3">Factura</th>
                                                <th className="px-4 py-3">AWB</th>
                                                <th className="px-4 py-3">Fecha</th>
                                                <th className="px-4 py-3">Exp. Pago</th>
                                                <th className="px-4 py-3 text-right">Total</th>
                                                <th className="px-4 py-3 text-right">Pagado</th>
                                                <th className="px-4 py-3 text-right">Nota Cr.</th>
                                                <th className="px-4 py-3 text-right">Comisión B.</th>
                                                <th className="px-4 py-3 text-right">Saldo</th>
                                                <th className="px-4 py-3 text-center">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {filteredInvoices.map((inv) => (
                                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-slate-900">{inv.numero_factura}</td>
                                                    <td className="px-4 py-3 text-slate-500">{inv.awb}</td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {inv.fecha_entrega ? format(parseISO(inv.fecha_entrega), 'dd/MM/yy') : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {inv.fecha_esperada_pago ? format(parseISO(inv.fecha_esperada_pago), 'dd/MM/yy') : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.valor_total_factura_usd)}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.valor_pagado_cliente_usd)}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.valor_total_nota_credito_usd + inv.descuento)}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.utilidad_bancaria_usd)}</td>
                                                    <td className={`px-4 py-3 text-right font-bold ${inv.saldo > 0.01 ? 'text-slate-900' : 'text-slate-400'}`}>
                                                        {formatCurrency(inv.saldo)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <StatusBadge status={inv.estado_texto} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// --- Subcomponents ---

function KPICard({ title, value, icon, color, highlight, isSaldo }: any) {
    const isPositive = isSaldo ? value <= 0 : false; // For Balance, negative or zero is good (mostly)
    // Actually for Balance (Saldo Pendiente), 0 is ideal. Positive means they owe us.

    return (
        <Card className={`border shadow-sm transition-all ${highlight ? 'ring-2 ring-red-100 border-red-200' : 'border-slate-200'}`}>
            <CardContent className="p-5 flex items-center justify-between relative overflow-hidden">
                {/* Background Decor */}
                <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 ${color.split(' ')[0]}`}></div>

                <div className="z-10">
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(value)}</h3>
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center z-10 ${color}`}>
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    let style = "bg-slate-100 text-slate-600";
    const s = status.toLowerCase();

    if (s.includes('pagada')) style = "bg-emerald-100 text-emerald-700 border border-emerald-200";
    else if (s.includes('vencida')) style = "bg-red-100 text-red-700 border border-red-200";
    else if (s.includes('pendiente')) style = "bg-amber-100 text-amber-700 border border-amber-200";
    else if (s.includes('cancelada')) style = "bg-slate-200 text-slate-600 line-through opacity-70";

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
            {status}
        </span>
    );
}
