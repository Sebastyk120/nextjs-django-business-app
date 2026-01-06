'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Receipt, FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import ReportesAsociadosSearch from '@/components/nacionales/reportes-asociados/ReportesAsociadosSearch';
import ReportesAsociadosResults from '@/components/nacionales/reportes-asociados/ReportesAsociadosResults';
import { getReportesAsociados, ReportesAsociadosParams } from '@/services/nacionalesService';
import type { FacturaAgrupada, ReportesAsociadosResponse } from '@/types/nacionales';

export default function ReportesAsociadosPage() {
    const [reportesData, setReportesData] = useState<FacturaAgrupada[]>([]);
    const [totalAPagar, setTotalAPagar] = useState(0);
    const [criterioBusqueda, setCriterioBusqueda] = useState<string | null>(null);
    const [fechaConsulta, setFechaConsulta] = useState('');

    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (params: ReportesAsociadosParams) => {
        setLoading(true);
        setHasSearched(true);

        try {
            const data = await getReportesAsociados(params);
            setReportesData(data.facturas);
            setTotalAPagar(data.total_a_pagar);
            setCriterioBusqueda(data.criterio_busqueda);
            setFechaConsulta(data.fecha_actual);

            if (data.facturas.length > 0) {
                const totalItems = data.facturas.reduce((acc, f) => acc + f.items.length, 0);
                toast.success(`Se encontraron ${totalItems} reportes en ${data.facturas.length} factura(s)`);
            } else {
                toast.info('No se encontraron reportes con los criterios proporcionados');
            }
        } catch (error: any) {
            console.error('Error fetching reportes:', error);
            const errorMessage = error?.response?.data?.error || 'Error al consultar reportes';
            toast.error(errorMessage);
            setReportesData([]);
            setTotalAPagar(0);
            setCriterioBusqueda(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6 font-outfit">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-plus-jakarta flex items-center gap-3">
                        <Receipt className="h-8 w-8 text-emerald-600" />
                        Reportes Asociados
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Consulta de reportes por factura, número de guía o remisión
                    </p>
                </div>
            </div>

            {/* Search Form */}
            <ReportesAsociadosSearch onSearch={handleSearch} loading={loading} />

            {/* Results */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
                    <p className="text-slate-500 font-medium">Consultando reportes...</p>
                </div>
            ) : hasSearched ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ReportesAsociadosResults
                        facturas={reportesData}
                        totalAPagar={totalAPagar}
                        criterioBusqueda={criterioBusqueda}
                        fechaConsulta={fechaConsulta}
                    />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                    <div className="bg-slate-100 p-6 rounded-full mb-4">
                        <Receipt className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700">Esperando Consulta</h3>
                    <p className="text-slate-500 max-w-sm mt-1">
                        Ingrese al menos un criterio de búsqueda (factura, guía o remisión) para ver los reportes asociados.
                    </p>
                </div>
            )}
        </div>
    );
}
