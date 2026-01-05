"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { FilterOption, BalanceProveedoresResponse, BalanceProveedor } from "@/types/nacionales-dashboard";
import axiosClient from "@/lib/axios";
import { FileText, Send, Scale, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NacionalesDashboardModalsProps {
    proveedores: FilterOption[];
    estadoCuentaOpen: boolean;
    setEstadoCuentaOpen: (open: boolean) => void;
    resumenReportesOpen: boolean;
    setResumenReportesOpen: (open: boolean) => void;
    balanceOpen: boolean;
    setBalanceOpen: (open: boolean) => void;
}

export function NacionalesDashboardModals({
    proveedores,
    estadoCuentaOpen,
    setEstadoCuentaOpen,
    resumenReportesOpen,
    setResumenReportesOpen,
    balanceOpen,
    setBalanceOpen
}: NacionalesDashboardModalsProps) {
    const [selectedProveedorEC, setSelectedProveedorEC] = useState<string>("");
    const [selectedProveedorRR, setSelectedProveedorRR] = useState<string>("");
    const [balanceFilter, setBalanceFilter] = useState<string>("todos");
    const [balanceData, setBalanceData] = useState<BalanceProveedoresResponse | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    };

    const fetchBalance = async () => {
        setBalanceLoading(true);
        try {
            const params = new URLSearchParams();
            if (balanceFilter && balanceFilter !== "todos") {
                params.append("proveedor", balanceFilter);
            }
            const response = await axiosClient.get(`/nacionales/api/balance-proveedores/?${params.toString()}`);
            setBalanceData(response.data);
        } catch (error) {
            console.error("Error fetching balance:", error);
            toast.error("Error al cargar balance de proveedores");
        } finally {
            setBalanceLoading(false);
        }
    };

    useEffect(() => {
        if (balanceOpen) {
            fetchBalance();
        }
    }, [balanceOpen, balanceFilter]);

    const handleEstadoCuenta = () => {
        if (!selectedProveedorEC) {
            toast.error("Seleccione un proveedor");
            return;
        }
        window.open(`/nacionales/estado-cuenta/${selectedProveedorEC}/`, '_blank');
        setEstadoCuentaOpen(false);
    };

    const handleResumenReportes = () => {
        if (!selectedProveedorRR) {
            toast.error("Seleccione un proveedor");
            return;
        }
        window.open(`/nacionales/reporte_estado_cuenta_proveedor/${selectedProveedorRR}/`, '_blank');
        setResumenReportesOpen(false);
    };

    return (
        <>
            <Dialog open={estadoCuentaOpen} onOpenChange={setEstadoCuentaOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-emerald-600" />
                            Estado de Cuenta Proveedor
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Seleccione Proveedor
                            </label>
                            <Select value={selectedProveedorEC} onValueChange={setSelectedProveedorEC}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar proveedor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {proveedores.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setEstadoCuentaOpen(false)}>
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button onClick={handleEstadoCuenta} className="bg-emerald-600 hover:bg-emerald-700">
                                <FileText className="h-4 w-4 mr-2" />
                                Generar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={resumenReportesOpen} onOpenChange={setResumenReportesOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-blue-600" />
                            Resumen Reportes Proveedor
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Seleccione Proveedor
                            </label>
                            <Select value={selectedProveedorRR} onValueChange={setSelectedProveedorRR}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar proveedor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {proveedores.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setResumenReportesOpen(false)}>
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button onClick={handleResumenReportes} className="bg-blue-600 hover:bg-blue-700">
                                <Send className="h-4 w-4 mr-2" />
                                Enviar Reportes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={balanceOpen} onOpenChange={setBalanceOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Scale className="h-5 w-5 text-purple-600" />
                            Balance de Proveedores
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtrar por proveedor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos los proveedores</SelectItem>
                                        {proveedores.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                {p.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchBalance} disabled={balanceLoading}>
                                <RefreshCw className={cn("h-4 w-4 mr-2", balanceLoading && "animate-spin")} />
                                Actualizar
                            </Button>
                        </div>

                        <div className="flex-1 overflow-auto border rounded-lg">
                            {balanceLoading ? (
                                <div className="p-8 text-center text-slate-400">Cargando...</div>
                            ) : !balanceData || balanceData.balances.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">No hay datos de balance</div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-slate-50 sticky top-0">
                                        <TableRow>
                                            <TableHead>Proveedor</TableHead>
                                            <TableHead className="text-right">Total Compras</TableHead>
                                            <TableHead className="text-right">Total Transferido</TableHead>
                                            <TableHead className="text-right">Saldo Pendiente</TableHead>
                                            <TableHead className="text-right">Utilidad</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {balanceData.balances.map((row: BalanceProveedor) => (
                                            <TableRow key={row.proveedor_id}>
                                                <TableCell className="font-medium">{row.proveedor_nombre}</TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {formatCurrency(row.total_compras)}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {formatCurrency(row.total_transferido)}
                                                </TableCell>
                                                <TableCell className={cn(
                                                    "text-right tabular-nums font-medium",
                                                    row.saldo_pendiente > 0 ? "text-amber-600" : "text-emerald-600"
                                                )}>
                                                    {formatCurrency(row.saldo_pendiente)}
                                                </TableCell>
                                                <TableCell className={cn(
                                                    "text-right tabular-nums font-medium",
                                                    row.total_utilidad >= 0 ? "text-emerald-600" : "text-rose-600"
                                                )}>
                                                    {formatCurrency(row.total_utilidad)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>

                        {balanceData && balanceData.totales && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Total Compras</p>
                                    <p className="font-semibold text-slate-800">
                                        {formatCurrency(balanceData.totales.total_compras)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Total Transferido</p>
                                    <p className="font-semibold text-slate-800">
                                        {formatCurrency(balanceData.totales.total_transferido)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Saldo Pendiente</p>
                                    <p className="font-semibold text-amber-600">
                                        {formatCurrency(balanceData.totales.total_saldo_pendiente)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Utilidad Total</p>
                                    <p className={cn(
                                        "font-semibold",
                                        balanceData.totales.total_utilidad >= 0 ? "text-emerald-600" : "text-rose-600"
                                    )}>
                                        {formatCurrency(balanceData.totales.total_utilidad)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
