'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';

interface OverdueClient {
    id: number;
    name: string;
    amount: number;
    max_days: number;
    orders: number;
}

interface OverdueClientsTableProps {
    clients: OverdueClient[];
}

export function OverdueClientsTable({ clients }: OverdueClientsTableProps) {
    const router = useRouter();

    if (!clients || clients.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-emerald-600" />
                    </div>
                    Clientes con Mayor Mora
                </h3>
                <p className="text-slate-500 text-sm">Sin clientes morosos</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-rose-50/50 to-white">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <div className="p-1.5 bg-rose-100 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                    </div>
                    Clientes con Mayor Mora
                </h3>
            </div>
            <div className="divide-y divide-slate-100">
                {clients.map((client, index) => (
                    <div
                        key={client.name}
                        className="p-4 hover:bg-slate-50 cursor-pointer transition-all duration-200 group flex items-center justify-between"
                        onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            router.push(`/comercial/estado-cuenta?cliente=${client.id}&fecha_inicial=2024-01-01&fecha_final=${today}`);
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`
                                w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm
                                ${index === 0 ? 'bg-rose-500 text-white shadow-rose-200' :
                                    index === 1 ? 'bg-amber-500 text-white shadow-amber-200' :
                                        'bg-slate-200 text-slate-600'}
                            `}>
                                {index + 1}
                            </span>
                            <div>
                                <p className="font-semibold text-slate-800 text-sm group-hover:text-slate-900 transition-colors">{client.name}</p>
                                <p className="text-xs text-slate-500">{client.orders} pedidos pendientes</p>
                            </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                            <div>
                                <p className="font-bold text-slate-900 text-lg">
                                    ${client.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </p>
                                <p className={`text-xs font-medium ${client.max_days > 60 ? 'text-rose-600' :
                                    client.max_days > 30 ? 'text-amber-600' :
                                        'text-slate-500'
                                    }`}>
                                    {client.max_days} días máx.
                                </p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-slate-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
