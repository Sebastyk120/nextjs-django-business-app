"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Download, FileBarChart, History, Loader2 } from "lucide-react";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExportInventoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentFilters?: {
        search?: string;
        exportador?: string;
    };
}

export function ExportInventoryModal({ open, onOpenChange, currentFilters }: ExportInventoryModalProps) {
    const [reportType, setReportType] = useState<"resumen" | "movimientos">("resumen");
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const endpoint = reportType === "resumen"
                ? "/inventarios/api/inventario-resumen/export-excel/"
                : "/inventarios/api/items/export-excel/";

            // Build params based on current view filters
            const params = new URLSearchParams();
            if (currentFilters?.search) params.append('search', currentFilters.search);
            if (currentFilters?.exportador && currentFilters.exportador !== 'all') {
                params.append('exportador', currentFilters.exportador);
            }

            const response = await axiosClient.get(`${endpoint}?${params.toString()}`, {
                responseType: 'blob'
            });

            // Handle file download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = reportType === "resumen" ? "inventario_resumen.xlsx" : "movimientos_inventario.xlsx";
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Excel generado correctamente");
            onOpenChange(false);
        } catch (error) {
            console.error("Error exporting:", error);
            toast.error("Error al generar el archivo Excel");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                            <Download className="h-5 w-5" />
                        </div>
                        <DialogTitle className="text-2xl font-bold font-plus-jakarta">Exportar Datos</DialogTitle>
                    </div>
                    <DialogDescription>
                        Selecciona el tipo de reporte que deseas generar. Se aplicarán los filtros activos de la tabla actual.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            onClick={() => setReportType("resumen")}
                            className={cn(
                                "flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all gap-3",
                                reportType === "resumen"
                                    ? "border-emerald-500 bg-emerald-50/50"
                                    : "border-slate-100 hover:border-slate-200 bg-white"
                            )}
                        >
                            <FileBarChart className={cn("h-10 w-10", reportType === "resumen" ? "text-emerald-600" : "text-slate-400")} />
                            <div className="text-center">
                                <p className="font-bold text-sm text-slate-900">Resumen Stock</p>
                                <p className="text-[10px] text-slate-500">Saldos por referencia</p>
                            </div>
                        </div>

                        <div
                            onClick={() => setReportType("movimientos")}
                            className={cn(
                                "flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all gap-3",
                                reportType === "movimientos"
                                    ? "border-emerald-500 bg-emerald-50/50"
                                    : "border-slate-100 hover:border-slate-200 bg-white"
                            )}
                        >
                            <History className={cn("h-10 w-10", reportType === "movimientos" ? "text-emerald-600" : "text-slate-400")} />
                            <div className="text-center">
                                <p className="font-bold text-sm text-slate-900">Movimientos</p>
                                <p className="text-[10px] text-slate-500">Historial detallado</p>
                            </div>
                        </div>
                    </div>

                    {currentFilters?.exportador && currentFilters.exportador !== 'all' && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600">
                            <span className="font-semibold">Filtro activo:</span> Exportador: {currentFilters.exportador}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-500">
                        Cerrar
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={loading}
                        className="bg-slate-900 hover:bg-slate-800 text-white min-w-[140px]"
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Generar Excel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
