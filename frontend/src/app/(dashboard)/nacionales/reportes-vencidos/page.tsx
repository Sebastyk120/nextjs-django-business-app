
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { ClipboardX, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ReportesVencidosFilters } from "@/components/nacionales/reportes-vencidos/ReportesVencidosFilters";
import { ReportesVencidosTable } from "@/components/nacionales/reportes-vencidos/ReportesVencidosTable";
import { getExportadores, getReportesVencidos } from "@/services/nacionalesService";
import type { ExportadorListItem } from "@/services/nacionalesService";
import type { ReporteVencido, Exportador, ReportesVencidosResponse } from "@/types/nacionales";

export default function ReportesVencidosPage() {
    const [exportadores, setExportadores] = useState<ExportadorListItem[]>([]);
    const [selectedExportadorId, setSelectedExportadorId] = useState<string>("");

    // Data state
    const [reportesData, setReportesData] = useState<ReporteVencido[]>([]);
    const [currentExportador, setCurrentExportador] = useState<Exportador | null>(null);
    const [fechaConsulta, setFechaConsulta] = useState<string>("");

    // Loading states
    const [loadingExportadores, setLoadingExportadores] = useState(true);
    const [loadingReportes, setLoadingReportes] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);

    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        const fetchExportadores = async () => {
            try {
                const data = await getExportadores();
                setExportadores(data);
            } catch (error) {
                console.error("Error fetching exportadores:", error);
                toast.error("Error al cargar exportadores");
            } finally {
                setLoadingExportadores(false);
            }
        };
        fetchExportadores();
    }, []);

    const handleFilter = async () => {
        if (!selectedExportadorId) return;

        setLoadingReportes(true);
        setHasSearched(true);

        try {
            const data = await getReportesVencidos(parseInt(selectedExportadorId));
            setReportesData(data.reportes_vencidos);
            setCurrentExportador(data.exportador);
            setFechaConsulta(data.fecha_actual);

            if (data.reportes_vencidos.length > 0) {
                toast.success(`Se encontraron ${data.total_reportes} reportes vencidos`);
            } else {
                toast.info("No se encontraron reportes vencidos para este exportador");
            }
        } catch (error) {
            console.error("Error fetching reportes vencidos:", error);
            toast.error("Error al consultar reportes vencidos");
            setReportesData([]);
            setCurrentExportador(null);
        } finally {
            setLoadingReportes(false);
        }
    };

    const handleExportPdf = async () => {
        if (!currentExportador || reportesData.length === 0) return;

        setExportingPdf(true);
        toast.info("Generando PDF...", { description: "Por favor espere un momento." });

        try {
            const { pdf } = await import("@react-pdf/renderer");
            const { default: ReportesVencidosPdf } = await import("@/components/nacionales/reportes-vencidos/ReportesVencidosPdf");

            // Reconstruct full response object for the PDF component
            const textDate = format(new Date(), "yyyy-MM-dd");
            const fullData: ReportesVencidosResponse = {
                exportador: currentExportador,
                reportes_vencidos: reportesData,
                total_reportes: reportesData.length,
                fecha_actual: fechaConsulta || textDate
            };

            const blob = await pdf(<ReportesVencidosPdf data={fullData} />).toBlob();

            const exportadorName = currentExportador.nombre.replace(/\s+/g, "_");
            const fileName = `ReportesVencidos_${exportadorName}_${textDate.replace(/-/g, "")}.pdf`;

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("PDF Exportado correctamente");

        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Error al generar el PDF");
        } finally {
            setExportingPdf(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6 font-outfit">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-plus-jakarta flex items-center gap-3">
                        <ClipboardX className="h-8 w-8 text-emerald-600" />
                        Ingresos Vencidos Pendientes por Reporte
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Consulta de ingresos vencidos pendientes por reporte
                    </p>
                </div>

                {reportesData.length > 0 && (
                    <Button
                        onClick={handleExportPdf}
                        disabled={exportingPdf}
                        variant="outline"
                        className="bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 shadow-sm"
                    >
                        {exportingPdf ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileDown className="mr-2 h-4 w-4 text-emerald-600" />
                        )}
                        Exportar a PDF
                    </Button>
                )}
            </div>

            <ReportesVencidosFilters
                exportadores={exportadores}
                selectedExportador={selectedExportadorId}
                onExportadorChange={setSelectedExportadorId}
                onFilter={handleFilter}
                loading={loadingReportes || loadingExportadores}
            />

            {loadingReportes ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                    <p className="text-slate-500 font-medium">Consultando reportes vencidos...</p>
                </div>
            ) : hasSearched ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ReportesVencidosTable
                        reportes={reportesData}
                        exportador={currentExportador}
                        fechaConsulta={fechaConsulta}
                    />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                    <div className="bg-slate-100 p-6 rounded-full mb-4">
                        <ClipboardX className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700">Esperando Consulta</h3>
                    <p className="text-slate-500 max-w-sm mt-1">
                        Seleccione un exportador arriba para ver los reportes vencidos pendientes.
                    </p>
                </div>
            )}
        </div>
    );
}
