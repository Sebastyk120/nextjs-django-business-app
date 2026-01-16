"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import axiosClient from "@/lib/axios";
import { format } from "date-fns";
import { DashboardNacionalesFilters } from "@/types/nacionales-dashboard";

interface ExportDataModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: DashboardNacionalesFilters;
}

const EXPORT_OPTIONS = [
    { id: "compra_nacional", label: "Compra Nacional" },
    { id: "venta_nacional", label: "Venta Nacional" },
    { id: "reporte_exportador", label: "Reporte Calidad Exportador" },
    { id: "reporte_proveedor", label: "Reporte Calidad Proveedor" },
    { id: "transferencias", label: "Transferencias Proveedor" },
    { id: "dashboard", label: "Resumen Dashboard" },
];

export function ExportDataModal({
    open,
    onOpenChange,
    filters,
}: ExportDataModalProps) {
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedOptions(EXPORT_OPTIONS.map((opt) => opt.id));
        } else {
            setSelectedOptions([]);
        }
    };

    const handleOptionChange = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedOptions((prev) => [...prev, id]);
        } else {
            setSelectedOptions((prev) => prev.filter((item) => item !== id));
        }
    };

    const handleExport = async () => {
        if (selectedOptions.length === 0) {
            toast.error("Seleccione al menos una opción para exportar");
            return;
        }

        setLoading(true);
        try {
            toast.info("Generando reporte...");

            const params = new URLSearchParams();
            // Agregar cada opción seleccionada como un parámetro 'data' separado
            selectedOptions.forEach((opt) => params.append("data", opt));

            if (filters.fecha_inicio) params.append("fecha_inicio", filters.fecha_inicio);
            if (filters.fecha_fin) params.append("fecha_fin", filters.fecha_fin);
            if (filters.proveedor_id) params.append("proveedor", filters.proveedor_id);
            if (filters.fruta_id) params.append("fruta", filters.fruta_id);

            const response = await axiosClient.get(
                `/nacionales/export_data/?${params.toString()}`,
                {
                    responseType: "blob",
                    timeout: 60000,
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            const dateStr = format(new Date(), "yyyy-MM-dd");
            link.setAttribute("download", `Reporte_Nacionales_${dateStr}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Reporte descargado correctamente");
            onOpenChange(false);
            setSelectedOptions([]);
        } catch (error) {
            console.error("Error exporting:", error);
            toast.error("Error al descargar el reporte");
        } finally {
            setLoading(false);
        }
    };

    const allSelected = selectedOptions.length === EXPORT_OPTIONS.length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileDown className="h-6 w-6 text-slate-700" />
                        Exportar Datos
                    </DialogTitle>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    <div className="space-y-2">
                        <p className="text-slate-600 font-medium">
                            El archivo exportado reflejará los filtros actualmente activos.
                        </p>
                        <p className="text-sm text-slate-500">
                            Seleccione los datos que desea exportar:
                        </p>
                    </div>

                    <div className="space-y-0 border rounded-xl overflow-hidden bg-white shadow-sm border-slate-200">
                        <div className="flex items-center space-x-3 p-4 bg-slate-50/50 border-b border-slate-200 transition-colors hover:bg-slate-50">
                            <Checkbox
                                id="select-all"
                                checked={allSelected}
                                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                className="h-5 w-5 rounded border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <Label htmlFor="select-all" className="font-bold text-slate-800 cursor-pointer text-base select-none">
                                Seleccionar Todo
                            </Label>
                        </div>

                        <div className="p-2 grid grid-cols-1 gap-1">
                            {EXPORT_OPTIONS.map((option) => (
                                <div
                                    key={option.id}
                                    className="flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-slate-50"
                                >
                                    <Checkbox
                                        id={option.id}
                                        checked={selectedOptions.includes(option.id)}
                                        onCheckedChange={(checked) =>
                                            handleOptionChange(option.id, checked as boolean)
                                        }
                                        className="h-5 w-5 rounded border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                    <Label
                                        htmlFor={option.id}
                                        className="cursor-pointer font-medium text-slate-700 select-none flex-1"
                                    >
                                        {option.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-slate-50/50 p-6 -m-6 mt-2 border-t border-slate-200">
                    <div className="flex w-full justify-between items-center">
                        <p className="text-xs text-slate-400 font-medium">
                            {selectedOptions.length} opciones seleccionadas
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                                className="text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 font-medium"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleExport}
                                disabled={loading || selectedOptions.length === 0}
                                className="bg-[#3498db] hover:bg-[#2980b9] text-white font-semibold px-6 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-5 w-5" />
                                        Descargar Excel
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
