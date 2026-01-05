import { useState } from "react";
import { HistoricalDataPoint, ForecastDataPoint } from "@/types/proyeccion";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DetailedForecastTableProps {
    historicalData: HistoricalDataPoint[];
    forecastData: ForecastDataPoint[];
    loading?: boolean;
}

export function DetailedForecastTable({
    historicalData,
    forecastData,
    loading
}: DetailedForecastTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Combine and Sort Data descending by date
    const allData = [...forecastData, ...historicalData].sort((a, b) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    const totalPages = Math.ceil(allData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = allData.slice(startIndex, startIndex + itemsPerPage);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    const formatNumber = (val: number) =>
        new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(val);

    const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
    const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

    if (loading) {
        return (
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold text-slate-800">Detalle de Proyección</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center text-slate-400">
                        Cargando detalle...
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-800">
                    Detalle de Datos ({allData.length} registros)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-slate-200 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Kilos</TableHead>
                                <TableHead className="text-right">Cajas</TableHead>
                                <TableHead className="text-right">Venta USD</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Fruta</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                                        No hay datos para mostrar
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((row, idx) => (
                                    <TableRow key={idx} className={row.is_forecast ? "bg-emerald-50/30" : ""}>
                                        <TableCell className="font-medium text-slate-700">
                                            {format(parseISO(row.fecha), 'MMMM yyyy', { locale: es })}
                                        </TableCell>
                                        <TableCell>
                                            {row.is_forecast ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                                                    Proyección
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-slate-500 bg-slate-50">
                                                    Histórico
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-slate-600">
                                            {formatNumber(row.kilos)} kg
                                            {row.is_forecast && row.kilos_lower && (
                                                <div className="text-[10px] text-emerald-600/70">
                                                    ± {(row.kilos - row.kilos_lower).toFixed(0)}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-slate-600">
                                            {formatNumber(row.cajas)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-slate-700">
                                            {formatCurrency(row.valor)}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500 max-w-[150px] truncate" title={row.cliente}>
                                            {row.cliente || "Todos"}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">
                                            {row.fruta || "Todas"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-xs text-slate-500">
                            Página {currentPage} de {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrev}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNext}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
