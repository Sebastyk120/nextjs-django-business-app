"use client";

import { useState } from "react";
import { TransferenciasTable } from "@/components/nacionales/transferencias/TransferenciasTable";
import { TransferenciasFilters } from "@/components/nacionales/transferencias/TransferenciasFilters";
import { TransferenciaModal } from "@/components/nacionales/transferencias/TransferenciaModal";
import { Transferencia } from "@/components/nacionales/transferencias/types";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRightLeft } from "lucide-react";

export default function TransferenciasPage() {
    const [filters, setFilters] = useState({
        proveedor: "",
        fecha_inicio: "",
        fecha_fin: "",
        origen: ""
    });
    const [refreshKey, setRefreshKey] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTransferencia, setSelectedTransferencia] = useState<Transferencia | null>(null);

    const handleCreate = () => {
        setSelectedTransferencia(null);
        setIsModalOpen(true);
    };

    const handleEdit = (transferencia: Transferencia) => {
        setSelectedTransferencia(transferencia);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-8 font-outfit animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-plus-jakarta flex items-center gap-3">
                        <ArrowRightLeft className="h-8 w-8 text-blue-600" />
                        Transferencias a Proveedores
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Gestione los pagos y anticipos realizados a proveedores nacionales.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        onClick={handleCreate}
                        className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Nueva Transferencia
                    </Button>
                </div>
            </div>

            <TransferenciasFilters
                filters={filters}
                onFilterChange={setFilters}
            />

            <TransferenciasTable
                filters={filters}
                refreshTrigger={refreshKey}
                onEdit={handleEdit}
            />

            <TransferenciaModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                transferencia={selectedTransferencia}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
