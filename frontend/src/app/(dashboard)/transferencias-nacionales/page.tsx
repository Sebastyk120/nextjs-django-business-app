"use client";

import { useState } from "react";
import { TransferenciasTable } from "@/components/nacionales/transferencias/TransferenciasTable";
import { TransferenciasFilters } from "@/components/nacionales/transferencias/TransferenciasFilters";
import { TransferenciaModal } from "@/components/nacionales/transferencias/TransferenciaModal";
import { Transferencia } from "@/components/nacionales/transferencias/types";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRightLeft, TrendingUp, Wallet, CalendarDays, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { StatCard } from "@/components/nacionales/transferencias/StatCard";
import { toast } from "sonner";

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
        toast.success("Operación completada exitosamente");
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 md:p-8">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-[1600px] mx-auto space-y-8"
            >
                {/* Header Section */}
                <motion.div variants={itemVariants} className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 rounded-3xl -z-10" />
                    
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-3xl border border-white/50 backdrop-blur-sm">
                        <div className="flex items-start gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                                <div className="relative p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/25">
                                    <ArrowRightLeft className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-plus-jakarta">
                                    Transferencias a Proveedores
                                </h1>
                                <p className="text-slate-500 mt-1.5 text-sm max-w-xl leading-relaxed">
                                    Gestione los pagos, anticipos y transferencias realizadas a proveedores nacionales.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleCreate}
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 rounded-xl h-12 px-6"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Nueva Transferencia
                        </Button>
                    </div>
                </motion.div>

                {/* Filters */}
                <motion.div variants={itemVariants}>
                    <TransferenciasFilters
                        filters={filters}
                        onFilterChange={setFilters}
                    />
                </motion.div>

                {/* Table */}
                <motion.div variants={itemVariants}>
                    <TransferenciasTable
                        filters={filters}
                        refreshTrigger={refreshKey}
                        onEdit={handleEdit}
                    />
                </motion.div>

                {/* Modal */}
                <TransferenciaModal
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    transferencia={selectedTransferencia}
                    onSuccess={handleSuccess}
                />
            </motion.div>
        </div>
    );
}
