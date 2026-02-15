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
import { FileDown, Loader2, Info } from "lucide-react";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";

interface ExportDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ExportDetailsModal({ open, onOpenChange }: ExportDetailsModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [idInicial, setIdInicial] = useState("");
    const [idFinal, setIdFinal] = useState("");

    const handleExport = async () => {
        if (!idInicial || !idFinal) {
            toast.error("Por favor, ingresa los números de pedido inicial y final.");
            return;
        }

        const start = parseInt(idInicial);
        const end = parseInt(idFinal);

        if (isNaN(start) || isNaN(end)) {
            toast.error("Los números de pedido no son válidos.");
            return;
        }

        if (end < start) {
            toast.error("El número final debe ser mayor o igual al inicial.");
            return;
        }

        // Check range size
        if ((end - start + 1) > 700) {
            toast.error("No se pueden exportar más de 700 pedidos a la vez.");
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("numero_pedido_inicial", idInicial);
            formData.append("numero_pedido_final", idFinal);

            const response = await axiosClient.post(
                "/comercial/exportar_detalles_p_heavens",
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
            let fileName = 'Detalles_Pedidos_Heavens.xlsx';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Exportación de detalles completada.");
            onOpenChange(false);
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Error al exportar los detalles.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileDown className="h-5 w-5 text-blue-600" />
                        Exportación De Detalles De Pedido
                    </DialogTitle>
                    <DialogDescription>
                        Configura el rango de pedidos para exportar sus detalles a Excel.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="id_inicial">Pedido Inicial (#)</Label>
                            <Input
                                id="id_inicial"
                                type="number"
                                placeholder="Ej: 100"
                                value={idInicial}
                                onChange={(e) => setIdInicial(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="id_final">Pedido Final (#)</Label>
                            <Input
                                id="id_final"
                                type="number"
                                placeholder="Ej: 200"
                                value={idFinal}
                                onChange={(e) => setIdFinal(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 text-sm">
                        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <p>
                            Ingrese el rango de pedidos a exportar. El rango <strong>no puede exceder los 700 pedidos</strong>.
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
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generando...
                            </>
                        ) : (
                            <>
                                <FileDown className="mr-2 h-4 w-4" />
                                Exportar Detalles
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
