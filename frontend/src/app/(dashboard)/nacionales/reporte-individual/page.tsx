'use client';

import React, { useState } from 'react';
import { ReporteIndividualSearch, ReporteIndividualDocument } from '@/components/nacionales/reporte-individual';
import { getReporteIndividual } from '@/services/nacionalesService';
import type { ReporteIndividualResponse } from '@/types/nacionales';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileDown, Search, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ReporteIndividualPage() {
    const router = useRouter();
    const [data, setData] = useState<ReporteIndividualResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchedGuia, setSearchedGuia] = useState<string>('');

    const handleSearch = async (numeroGuia: string) => {
        setLoading(true);
        setError(null);
        setSearchedGuia(numeroGuia);

        try {
            const response = await getReporteIndividual(numeroGuia);
            setData(response);
            toast.success('Reporte Cargado', {
                description: `El reporte para ${response.proveedor.nombre} se cargó exitosamente.`
            });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'No se encontró el reporte para la guía especificada';
            setError(errorMessage);
            setData(null);
            toast.error('Búsqueda sin Resultados', {
                description: `No se encontró ningún reporte para la guía "${numeroGuia}".`
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExportPdf = async () => {
        if (!data) return;

        setExporting(true);
        toast.info('Generando PDF...', {
            description: 'Por favor espere, esto puede tardar un momento.'
        });

        try {
            const { pdf } = await import('@react-pdf/renderer');
            const { default: ReporteIndividualPdf } = await import('@/components/nacionales/reporte-individual/ReporteIndividualPdf');

            const blob = await pdf(<ReporteIndividualPdf data={data} />).toBlob();
            
            const proveedorNombre = data.proveedor.nombre.replace(/\s+/g, '_');
            const numeroGuia = data.compra.numero_guia.replace(/\s+/g, '_');
            const fileName = `reporte_${proveedorNombre}_${numeroGuia}.pdf`;

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('PDF Generado', {
                description: 'El documento se ha exportado correctamente.'
            });
        } catch (err) {
            console.error('Error generating PDF:', err);
            toast.error('Error de Exportación', {
                description: 'Hubo un problema al generar el PDF.'
            });
        } finally {
            setExporting(false);
        }
    };

    const handleNewSearch = () => {
        setData(null);
        setError(null);
        setSearchedGuia('');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {!data ? (
                <div className="py-8">
                    <ReporteIndividualSearch onSearch={handleSearch} loading={loading} />
                    
                    {error && (
                        <div className="max-w-md mx-auto mt-6 p-6 bg-white rounded-xl shadow-lg text-center">
                            <AlertCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontró el reporte</h3>
                            <p className="text-gray-600">
                                No se encontró ningún reporte para la guía <strong>&quot;{searchedGuia}&quot;</strong> o la información está incompleta.
                            </p>
                            <p className="text-gray-500 mt-2 text-sm">
                                Por favor, verifique el número de guía e intente nuevamente.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full max-w-7xl mx-auto my-8 bg-gray-50 rounded-xl shadow-lg overflow-hidden px-4">
                    {/* Actions Bar */}
                    <div className="flex justify-center gap-4 p-6 bg-gray-50 border-b border-gray-200">
                        <Button
                            onClick={handleExportPdf}
                            disabled={exporting}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                        >
                            {exporting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Exportar a PDF
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={handleNewSearch}
                            variant="outline"
                            className="bg-gray-600 hover:bg-gray-700 text-white border-0 px-6 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                        >
                            <Search className="mr-2 h-4 w-4" />
                            Nueva Búsqueda
                        </Button>
                        <Button
                            onClick={() => router.back()}
                            variant="outline"
                            className="px-6 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                    </div>

                    {/* Document Preview */}
                    <div className="py-6">
                        <ReporteIndividualDocument data={data} />
                    </div>
                </div>
            )}
        </div>
    );
}
