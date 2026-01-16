'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

interface OverdueClient {
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
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    Clientes con Mayor Mora
                </h3>
                <p className="text-slate-500 text-sm">Sin clientes morosos</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    Clientes con Mayor Mora
                </h3>
            </div>
            <div className="divide-y divide-slate-100">
                {clients.map((client, index) => (
                    <div
                        key={client.name}
                        className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between"
                        onClick={() => router.push(`/comercial/estado-cuenta?cliente=${encodeURIComponent(client.name)}`)}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                ${index === 0 ? 'bg-rose-100 text-rose-700' :
                                    index === 1 ? 'bg-amber-100 text-amber-700' :
                                        'bg-slate-100 text-slate-600'}
                            `}>
                                {index + 1}
                            </span>
                            <div>
                                <p className="font-medium text-slate-800 text-sm">{client.name}</p>
                                <p className="text-xs text-slate-500">{client.orders} pedidos pendientes</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-slate-900">
                                ${client.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                            <p className={`text-xs font-medium ${client.max_days > 60 ? 'text-rose-600' :
                                    client.max_days > 30 ? 'text-amber-600' :
                                        'text-slate-500'
                                }`}>
                                {client.max_days} días máx.
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
