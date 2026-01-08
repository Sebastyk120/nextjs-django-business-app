"use client";

import { useState } from "react";
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
import { FileSpreadsheet, Loader2, Info } from "lucide-react";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { DateTimePicker } from "@/components/comercial/DateTimePicker";

interface ExportCarteraModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialFechaInicial?: string;
    initialFechaFinal?: string;
}

export function ExportCarteraModal({ open, onOpenChange, initialFechaInicial = "", initialFechaFinal = "" }: ExportCarteraModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [fechaInicial, setFechaInicial] = useState(initialFechaInicial);
    const [fechaFinal, setFechaFinal] = useState(initialFechaFinal);

    if (open && fechaInicial !== initialFechaInicial && fechaInicial === "") setFechaInicial(initialFechaInicial);
    if (open && fechaFinal !== initialFechaFinal && fechaFinal === "") setFechaFinal(initialFechaFinal);

    const handleExport = async () => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("fecha_inicial", fechaInicial);
            formData.append("fecha_final", fechaFinal);

            const response = await axiosClient.post(
                "/comercial/exportar_cartera_cliente_antigua",
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
            let fileName = 'Cartera_Export.xlsx';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Exportación de cartera completada.");
            onOpenChange(false);
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Error al exportar la cartera.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <FileSpreadsheet className="h-5 w-5" />
                        Exportación de Cartera
                    </DialogTitle>
                    <DialogDescription>
                        Filtra por rango de fecha para generar el reporte de cartera.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cartera_fecha_inicial">Fecha Inicial</Label>
                            <DateTimePicker
                                value={fechaInicial}
                                onChange={setFechaInicial}
                                showTime={false}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cartera_fecha_final">Fecha Final</Label>
                            <DateTimePicker
                                value={fechaFinal}
                                onChange={setFechaFinal}
                                showTime={false}
                            />
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-100 text-sm">
                        <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <p>
                            Puede dejar los campos vacíos para exportar el historial completo de cartera.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={isLoading}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generando...
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
