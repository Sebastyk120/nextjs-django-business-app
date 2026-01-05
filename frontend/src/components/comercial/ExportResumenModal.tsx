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
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Loader2, FileText, FileSpreadsheet, AlertCircle } from "lucide-react";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";

interface ExportResumenModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    exportadoras: { id: number; nombre: string }[];
    weeks: { id: string; label: string }[];
    currentSemana?: string;
}

export function ExportResumenModal({
    open,
    onOpenChange,
    exportadoras,
    weeks,
    currentSemana
}: ExportResumenModalProps) {
    const [isLoading, setIsLoading] = useState<"excel" | "pdf" | null>(null);
    const [semana, setSemana] = useState<string>(currentSemana || "");
    const [exportadoraId, setExportadoraId] = useState<string>("");

    useEffect(() => {
        if (open) {
            setSemana(currentSemana || "");
            setExportadoraId("");
        }
    }, [open, currentSemana]);

    const handleExport = async (type: "excel" | "pdf") => {
        if (!semana) {
            toast.error("Debe seleccionar una semana antes de exportar.");
            return;
        }

        setIsLoading(type);
        try {
            const params = new URLSearchParams();
            params.append("semana", semana);
            if (exportadoraId) params.append("exportadora", exportadoraId);

            const urlEndpoint = type === "pdf"
                ? "/comercial/exportar_resumen_semana_pdf/"
                : "/comercial/exportar_excel_seguimientos_resumen/";

            const response = await axiosClient.get(urlEndpoint, {
                params,
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const contentDisposition = response.headers['content-disposition'];
            let fileName = type === "pdf" ? `Resumen_Semana_${semana}.pdf` : `Resumen_Semana_${semana}.xlsx`;
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success(`Reporte ${type.toUpperCase()} generado correctamente.`);
            onOpenChange(false);
        } catch (error) {
            console.error("Export error:", error);
            toast.error(`Error al generar el reporte ${type.toUpperCase()}.`);
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-rose-600 font-plus-jakarta">
                        <ClipboardList className="h-5 w-5" />
                        Exportación Resumen de Exportaciones
                    </DialogTitle>
                    <DialogDescription>
                        Seleccione el período y exportadora para generar la vista consolidada.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4 font-plus-jakarta">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                                Semana <span className="text-rose-500">*</span>
                            </Label>
                            <Select value={semana} onValueChange={setSemana}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione una semana..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {weeks.map((w) => (
                                        <SelectItem key={w.id} value={w.id}>
                                            {w.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Exportadora</Label>
                            <Select value={exportadoraId} onValueChange={setExportadoraId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas las exportadoras" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" className="text-muted-foreground italic">Todas las exportadoras</SelectItem>
                                    {exportadoras.map((e) => (
                                        <SelectItem key={e.id} value={e.id.toString()}>
                                            {e.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-rose-50 text-rose-800 rounded-lg border border-rose-100 text-sm">
                        <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                        <p>
                            El campo <strong>Semana</strong> es obligatorio para poder generar cualquiera de los informes.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            className="flex-1 sm:flex-none border-rose-200 text-rose-700 hover:bg-rose-50"
                            onClick={() => handleExport("pdf")}
                            disabled={!!isLoading || !semana}
                        >
                            {isLoading === "pdf" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileText className="mr-2 h-4 w-4" />
                            )}
                            PDF
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 sm:flex-none border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleExport("excel")}
                            disabled={!!isLoading || !semana}
                        >
                            {isLoading === "excel" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                            )}
                            Excel
                        </Button>
                    </div>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={!!isLoading}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
