"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Wallet, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    EstadoCuentaProveedorFilters,
    EstadoCuentaProveedorMetrics,
    ComprasProveedorTable,
    TransferenciasProveedorTable,
} from "@/components/nacionales/estado-cuenta-proveedor";
import {
    getEstadoCuentaProveedor,
    EstadoCuentaProveedorParams,
} from "@/services/nacionalesService";
import {
    EstadoCuentaProveedorResponse,
    EstadoCuentaProveedorFilters as FiltersType,
} from "@/types/nacionales";

export default function EstadoCuentaProveedorPage() {
    const params = useParams();
    const router = useRouter();
    const proveedorId = parseInt(params.id as string);

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<EstadoCuentaProveedorResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FiltersType>({
        fecha_inicio: null,
        fecha_fin: null,
        fruta_id: null,
    });

    const fetchData = useCallback(async () => {
        if (!proveedorId || isNaN(proveedorId)) {
            setError("ID de proveedor inválido");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const queryParams: EstadoCuentaProveedorParams = {};
            if (filters.fecha_inicio) queryParams.fecha_inicio = filters.fecha_inicio;
            if (filters.fecha_fin) queryParams.fecha_fin = filters.fecha_fin;
            if (filters.fruta_id) queryParams.fruta_id = filters.fruta_id;

            const response = await getEstadoCuentaProveedor(proveedorId, queryParams);
            setData(response);

            if (response.fecha_inicio && !filters.fecha_inicio) {
                setFilters((prev) => ({
                    ...prev,
                    fecha_inicio: response.fecha_inicio,
                    fecha_fin: response.fecha_fin,
                }));
            }
        } catch (err) {
            console.error("Error fetching estado de cuenta:", err);
            setError("Error al cargar el estado de cuenta. Intente nuevamente.");
        } finally {
            setLoading(false);
        }
    }, [proveedorId, filters.fecha_inicio, filters.fecha_fin, filters.fruta_id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value || null,
        }));
    };

    const handleProveedorChange = (newProveedorId: number) => {
        router.push(`/nacionales/estado-cuenta-proveedor/${newProveedorId}`);
    };

    const handleRefresh = () => {
        fetchData();
    };

    const handleReset = () => {
        setFilters({
            fecha_inicio: null,
            fecha_fin: null,
            fruta_id: null,
        });
    };

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-lg text-red-600">{error}</p>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                </Button>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const dateRangeText = data.es_primera_carga
        ? "Total General"
        : `${formatDisplayDate(data.fecha_inicio)} - ${formatDisplayDate(data.fecha_fin)}`;

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/nacionales/estado-cuenta-proveedor")}
                            className="text-slate-500 hover:text-slate-700 -ml-2"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Proveedores
                        </Button>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Wallet className="h-8 w-8 text-indigo-600" />
                        Estado de Cuenta - {data.proveedor.nombre}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {dateRangeText}
                    </p>
                </div>
            </div>

            <EstadoCuentaProveedorFilters
                filters={filters}
                proveedores={data.proveedores}
                currentProveedorId={proveedorId}
                onFilterChange={handleFilterChange}
                onProveedorChange={handleProveedorChange}
                onRefresh={handleRefresh}
                onReset={handleReset}
                loading={loading}
            />

            <EstadoCuentaProveedorMetrics
                totalComprasValor={data.total_compras_valor}
                totalKilos={data.total_kilos}
                totalTransferido={data.total_transferido}
                saldoPendiente={data.saldo_pendiente}
                totalUtilidad={data.total_utilidad}
            />

            <div className="space-y-4">
                <ComprasProveedorTable compras={data.compras} />
                <TransferenciasProveedorTable transferencias={data.transferencias} />
            </div>
        </div>
    );
}

function formatDisplayDate(dateString: string | null): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
