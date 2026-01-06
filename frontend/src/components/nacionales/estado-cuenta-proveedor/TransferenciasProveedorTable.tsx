"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Banknote, Info } from "lucide-react";
import { EstadoCuentaTransferencia } from "@/types/nacionales";

interface TransferenciasProveedorTableProps {
    transferencias: EstadoCuentaTransferencia[];
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const COLLAPSE_THRESHOLD = 25;

export function TransferenciasProveedorTable({ transferencias }: TransferenciasProveedorTableProps) {
    const [isExpanded, setIsExpanded] = useState(transferencias.length <= COLLAPSE_THRESHOLD);

    const totalTransferido = transferencias.reduce((acc, t) => acc + t.valor_transferencia, 0);

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader 
                className="cursor-pointer hover:bg-slate-50 transition-colors py-3"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-emerald-600" />
                        Transferencias Realizadas
                        <span className="text-xs font-normal text-slate-500 ml-2">
                            ({transferencias.length} registros)
                        </span>
                    </CardTitle>
                    {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                </div>
            </CardHeader>
            
            {isExpanded && (
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="text-xs font-semibold text-slate-600">Fecha</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Valor</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600">Origen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transferencias.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <Info className="h-8 w-8" />
                                                <span>No hay transferencias en este período</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <>
                                        {transferencias.map((transferencia) => (
                                            <TableRow key={transferencia.id} className="hover:bg-slate-50/50">
                                                <TableCell className="text-sm">
                                                    {formatDate(transferencia.fecha_transferencia)}
                                                </TableCell>
                                                <TableCell className="text-sm text-right tabular-nums font-medium text-emerald-600">
                                                    {formatCurrency(transferencia.valor_transferencia)}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {transferencia.origen_transferencia || "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-slate-50 font-semibold">
                                            <TableCell className="text-sm">Total</TableCell>
                                            <TableCell className="text-sm text-right tabular-nums text-emerald-700">
                                                {formatCurrency(totalTransferido)}
                                            </TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
