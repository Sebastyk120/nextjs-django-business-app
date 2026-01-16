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
import { Download, FileDown, X } from "lucide-react";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { DashboardNacionalesFilters } from "@/types/nacionales-dashboard";

interface ExportDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: DashboardNacionalesFilters;
}

export function ExportDetailsModal({
    open,
    onOpenChange,
    filters
}: ExportDetailsModalProps) {
    const [loading, setLoading] = useState(false);
    
    // Opciones disponibles para exportar (coinciden con el backend)
    const [options, setOptions] = useState({
        compra_nacional: false,
        venta_nacional: false,
        reporte_exportador: false,
        reporte_proveedor: false,
        transferencias: false,
        dashboard: false
    });

    const handleCheckboxChange = (key: keyof typeof options, checked: boolean) => {
        setOptions(prev => ({ ...prev, [key]: checked }));
    };

    const handleSelectAll = (checked: boolean) => {
        setOptions({
            compra_nacional: checked,
            venta_nacional: checked,
            reporte_exportador: checked,
            reporte_proveedor: checked,
            transferencias: checked,
            dashboard: checked
        });
    };

    const allSelected = Object.values(options).every(Boolean);
    const someSelected = Object.values(options).some(Boolean);

    const handleExport = async () => {
        if (!someSelected) {
            toast.error("Seleccione al menos una opción para exportar");
            return;
        }

        setLoading(true);
        try {
            toast.info("Generando reporte...");

            const params = new URLSearchParams();
            
            // Añadir filtros
            if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
            if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
            if (filters.proveedor_id) params.append('proveedor', filters.proveedor_id);
            if (filters.fruta_id) params.append('fruta', filters.fruta_id);

            // Añadir opciones de datos seleccionadas
            Object.entries(options).forEach(([key, value]) => {
                if (value) {
                    params.append('data', key);
                }
            });

            const response = await axiosClient.get(
                `/nacionales/export_data/?${params.toString()}`,
                {
                    responseType: 'blob',
                    timeout: 60000 // Mayor timeout para reportes grandes
                }
            );

            // Descargar archivo
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const dateStr = format(new Date(), 'yyyy-MM-dd');
            link.setAttribute('download', `Reporte_Nacionales_${dateStr}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Reporte descargado correctamente");
            onOpenChange(false);
        } catch (error) {
            console.error("Error exporting:", error);
            toast.error("Error al generar el reporte. Intente con menos datos o un rango de fechas menor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileDown className="h-6 w-6 text-emerald-600" />
                        Exportar Datos
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <p className="text-sm text-slate-500">
                        El archivo exportado reflejará los filtros actualmente activos.
                    </p>
                    
                    <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                        <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
                            <Checkbox 
                                id="select-all" 
                                checked={allSelected}
                                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                            />
                            <Label htmlFor="select-all" className="font-bold text-slate-800 cursor-pointer">
                                Seleccionar Todo
                            </Label>
                        </div>
                        
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="compra_nacional" 
                                    checked={options.compra_nacional}
                                    onCheckedChange={(checked) => handleCheckboxChange("compra_nacional", checked as boolean)}
                                />
                                <Label htmlFor="compra_nacional" className="cursor-pointer">Compra Nacional</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="venta_nacional" 
                                    checked={options.venta_nacional}
                                    onCheckedChange={(checked) => handleCheckboxChange("venta_nacional", checked as boolean)}
                                />
                                <Label htmlFor="venta_nacional" className="cursor-pointer">Venta Nacional</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="reporte_exportador" 
                                    checked={options.reporte_exportador}
                                    onCheckedChange={(checked) => handleCheckboxChange("reporte_exportador", checked as boolean)}
                                />
                                <Label htmlFor="reporte_exportador" className="cursor-pointer">Reporte Calidad Exportador</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="reporte_proveedor" 
                                    checked={options.reporte_proveedor}
                                    onCheckedChange={(checked) => handleCheckboxChange("reporte_proveedor", checked as boolean)}
                                />
                                <Label htmlFor="reporte_proveedor" className="cursor-pointer">Reporte Calidad Proveedor</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="transferencias" 
                                    checked={options.transferencias}
                                    onCheckedChange={(checked) => handleCheckboxChange("transferencias", checked as boolean)}
                                />
                                <Label htmlFor="transferencias" className="cursor-pointer">Transferencias Proveedor</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="dashboard" 
                                    checked={options.dashboard}
                                    onCheckedChange={(checked) => handleCheckboxChange("dashboard", checked as boolean)}
                                />
                                <Label htmlFor="dashboard" className="cursor-pointer font-medium text-emerald-700">Resumen Dashboard</Label>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleExport} 
                        disabled={loading || !someSelected}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {loading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        Descargar Excel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
