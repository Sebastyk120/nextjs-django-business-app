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
import { TrendingUp, Loader2, Info, FileSpreadsheet } from "lucide-react";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { DateTimePicker } from "@/components/comercial/DateTimePicker";

interface ExportUtilitiesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialFechaInicial?: string;
    initialFechaFinal?: string;
}

export function ExportUtilitiesModal({ open, onOpenChange, initialFechaInicial = "", initialFechaFinal = "" }: ExportUtilitiesModalProps) {
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
                "/comercial/exportar_utilidades_general",
                formData,
                {
                    responseType: 'blob',
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Create a link to download the blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Try to get filename from content-disposition
            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'Utilidades_Export.xlsx';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Excel de utilidades generado correctamente.");
            onOpenChange(false);
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Error al exportar las utilidades.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                        Exportación de Utilidades
                    </DialogTitle>
                    <DialogDescription>
                        Genera el informe detallado de utilidades por periodo.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fecha_inicial_util">Fecha Inicial</Label>
                            <DateTimePicker
                                value={fechaInicial}
                                onChange={setFechaInicial}
                                showTime={false}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fecha_final_util">Fecha Final</Label>
                            <DateTimePicker
                                value={fechaFinal}
                                onChange={setFechaFinal}
                                showTime={false}
                            />
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100 text-sm">
                        <Info className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p>
                            El filtro se aplica sobre la <strong>fecha de entrega</strong> del pedido.
                            Si se omiten las fechas, se exportará el histórico completo.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={isLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generando Reporte...
                            </>
                        ) : (
                            <>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Exportar Utilidades
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
