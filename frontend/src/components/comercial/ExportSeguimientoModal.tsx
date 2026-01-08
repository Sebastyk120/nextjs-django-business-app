"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plane, Loader2, Info, AlertCircle, FileSpreadsheet } from "lucide-react";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { DateTimePicker } from "@/components/comercial/DateTimePicker";

interface ExportSeguimientoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clients: { id: number; nombre: string }[];
    intermediaries: { id: number; nombre: string }[];
    initialFechaInicial?: string;
    initialFechaFinal?: string;
}

export function ExportSeguimientoModal({
    open,
    onOpenChange,
    clients,
    intermediaries,
    initialFechaInicial = "",
    initialFechaFinal = ""
}: ExportSeguimientoModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [fechaInicial, setFechaInicial] = useState(initialFechaInicial);
    const [fechaFinal, setFechaFinal] = useState(initialFechaFinal);
    const [clienteId, setClienteId] = useState<string>("");
    const [intermediarioId, setIntermediarioId] = useState<string>("");

    useEffect(() => {
        if (open) {
            setFechaInicial(initialFechaInicial);
            setFechaFinal(initialFechaFinal);
            setClienteId("");
            setIntermediarioId("");
        }
    }, [open, initialFechaInicial, initialFechaFinal]);

    const handleExport = async () => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("fecha_inicial", fechaInicial);
            formData.append("fecha_final", fechaFinal);
            if (clienteId) formData.append("cliente", clienteId);
            if (intermediarioId) formData.append("intermediario", intermediarioId);

            const response = await axiosClient.post(
                "/comercial/exportar_excel_seguimiento_tracking",
                formData,
                {
                    responseType: 'blob',
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'Seguimiento_Export.xlsx';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Excel de seguimiento generado correctamente.");
            onOpenChange(false);
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Error al exportar los seguimientos.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-indigo-600 font-plus-jakarta">
                        <Plane className="h-5 w-5" />
                        Exportación de Seguimientos
                    </DialogTitle>
                    <DialogDescription>
                        Filtra por reporte detallado de seguimiento de exportaciones.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4 font-plus-jakarta">
                    <div className="flex items-start gap-3 p-3 bg-indigo-50 text-indigo-800 rounded-lg border border-indigo-100 text-sm">
                        <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                        <p>
                            Debe seleccionar un cliente <strong>o</strong> un intermediario, no ambos. Omita los campos para exportar todo.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Intermediario</Label>
                            <Select
                                value={intermediarioId}
                                onValueChange={(val) => {
                                    setIntermediarioId(val);
                                    if (val) setClienteId("");
                                }}
                                disabled={!!clienteId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un intermediario..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" disabled>Seleccione...</SelectItem>
                                    {intermediaries.map((i) => (
                                        <SelectItem key={i.id} value={i.id.toString()}>
                                            {i.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Cliente</Label>
                            <Select
                                value={clienteId}
                                onValueChange={(val) => {
                                    setClienteId(val);
                                    if (val) setIntermediarioId("");
                                }}
                                disabled={!!intermediarioId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un cliente..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" disabled>Seleccione...</SelectItem>
                                    {clients.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha Inicial</Label>
                            <DateTimePicker
                                value={fechaInicial}
                                onChange={setFechaInicial}
                                showTime={false}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha Final</Label>
                            <DateTimePicker
                                value={fechaFinal}
                                onChange={setFechaFinal}
                                showTime={false}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exportando...
                            </>
                        ) : (
                            <>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Exportar Excel
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
