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
import { Send, Loader2, Info, AlertCircle } from "lucide-react";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { DateTimePicker } from "@/components/comercial/DateTimePicker";

interface ExportCarteraEnviarModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clients: { id: number; nombre: string }[];
    intermediaries: { id: number; nombre: string }[];
    initialFechaInicial?: string;
    initialFechaFinal?: string;
}

export function ExportCarteraEnviarModal({
    open,
    onOpenChange,
    clients,
    intermediaries,
    initialFechaInicial = "",
    initialFechaFinal = ""
}: ExportCarteraEnviarModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [fechaInicial, setFechaInicial] = useState(initialFechaInicial);
    const [fechaFinal, setFechaFinal] = useState(initialFechaFinal);
    const [clienteId, setClienteId] = useState<string>("");
    const [intermediarioId, setIntermediarioId] = useState<string>("");

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setFechaInicial(initialFechaInicial);
            setFechaFinal(initialFechaFinal);
            setClienteId("");
            setIntermediarioId("");
        }
    }, [open, initialFechaInicial, initialFechaFinal]);

    const handleSend = async () => {
        if (!clienteId && !intermediarioId) {
            toast.error("Debe seleccionar un cliente o un intermediario.");
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("fecha_inicial", fechaInicial);
            formData.append("fecha_final", fechaFinal);
            if (clienteId) formData.append("cliente", clienteId);
            if (intermediarioId) formData.append("intermediario", intermediarioId);

            const response = await axiosClient.post(
                "/comercial/exportar_cartera_cliente_enviar",
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
            let fileName = 'Cartera_Enviar_Export.xlsx';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Archivo de cartera generado correctamente.");
            onOpenChange(false);
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Error al generar el archivo de cartera.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-blue-600">
                        <Send className="h-5 w-5" />
                        Enviar Cartera a Cliente
                    </DialogTitle>
                    <DialogDescription>
                        Filtra por cliente/intermediario y fechas para generar el documento de envío.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 text-sm">
                        <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <p>
                            Debe seleccionar un cliente <strong>o</strong> un intermediario, no ambos. Al seleccionar uno, el otro se inhabilitará.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="enviar_intermediario">Intermediario</Label>
                            <Select
                                value={intermediarioId}
                                onValueChange={(val) => {
                                    setIntermediarioId(val);
                                    if (val) setClienteId("");
                                }}
                                disabled={!!clienteId}
                            >
                                <SelectTrigger id="enviar_intermediario">
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
                            <Label htmlFor="enviar_cliente">Cliente</Label>
                            <Select
                                value={clienteId}
                                onValueChange={(val) => {
                                    setClienteId(val);
                                    if (val) setIntermediarioId("");
                                }}
                                disabled={!!intermediarioId}
                            >
                                <SelectTrigger id="enviar_cliente">
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
                            <Label htmlFor="enviar_fecha_inicial">Fecha Inicial</Label>
                            <DateTimePicker
                                value={fechaInicial}
                                onChange={setFechaInicial}
                                showTime={false}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="enviar_fecha_final">Fecha Final</Label>
                            <DateTimePicker
                                value={fechaFinal}
                                onChange={setFechaFinal}
                                showTime={false}
                            />
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 text-slate-600 rounded-lg border border-slate-100 text-sm">
                        <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                        <p>
                            Omita las fechas para incluir todo el historial de cartera del receptor seleccionado.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={isLoading || (!clienteId && !intermediarioId)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generando...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Generar Para Enviar
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
