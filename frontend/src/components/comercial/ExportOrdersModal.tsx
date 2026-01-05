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
import { Checkbox } from "@/components/ui/checkbox";
import { FileDown, Loader2, Info } from "lucide-react";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";

interface ExportOrdersModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ExportOrdersModal({ open, onOpenChange }: ExportOrdersModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [fechaInicial, setFechaInicial] = useState("");
    const [fechaFinal, setFechaFinal] = useState("");
    const [incluirDetalles, setIncluirDetalles] = useState(false);

    const handleExport = async () => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("fecha_inicial", fechaInicial);
            formData.append("fecha_final", fechaFinal);
            formData.append("incluir_detalles", incluirDetalles ? "true" : "false");

            const response = await axiosClient.post(
                "/comercial/exportar_pedidos_excel_general",
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
            let fileName = 'Pedidos_Export.xlsx';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Exportación completada.");
            onOpenChange(false);
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Error al exportar los pedidos.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileDown className="h-5 w-5 text-emerald-600" />
                        Exportación De Pedidos General
                    </DialogTitle>
                    <DialogDescription>
                        Configura los parámetros para la exportación a Excel.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fecha_inicial">Fecha Inicial</Label>
                            <Input
                                id="fecha_inicial"
                                type="date"
                                value={fechaInicial}
                                onChange={(e) => setFechaInicial(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fecha_final">Fecha Final</Label>
                            <Input
                                id="fecha_final"
                                type="date"
                                value={fechaFinal}
                                onChange={(e) => setFechaFinal(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <Checkbox
                            id="incluir_detalles"
                            checked={incluirDetalles}
                            onCheckedChange={(checked) => setIncluirDetalles(checked as boolean)}
                        />
                        <Label
                            htmlFor="incluir_detalles"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                            ¿Incluir Detalles del Pedido?
                        </Label>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 text-sm">
                        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <p>
                            Para exportar todos los pedidos omita los campos de fecha.
                            El filtro se aplica con la <strong>fecha de factura</strong>.
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
                                Generando...
                            </>
                        ) : (
                            <>
                                <FileDown className="mr-2 h-4 w-4" />
                                Exportar Excel
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
