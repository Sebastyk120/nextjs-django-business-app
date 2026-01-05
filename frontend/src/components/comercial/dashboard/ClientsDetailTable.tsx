import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientData } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface ClientsDetailTableProps {
    data: ClientData[];
    loading?: boolean;
}

export function ClientsDetailTable({ data, loading }: ClientsDetailTableProps) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat('en-US').format(val);
    };

    const formatPercent = (val: number) => {
        return `${val.toFixed(2)}%`;
    };

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                <CardTitle className="text-base font-semibold text-slate-800">
                    Detalle por Cliente
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        Cargando datos...
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        No hay datos para mostrar
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[500px]">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="font-semibold text-slate-700 w-[250px]">Cliente</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">Pedidos</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">Total Kilos</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">Facturado USD</TableHead>
                                    <TableHead className="font-semibold text-emerald-700 text-right">Utilidad USD</TableHead>
                                    <TableHead className="font-semibold text-rose-700 text-right">Notas Cre. USD</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">% Part. Kilos</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">% Part. Utilidad</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((row, index) => (
                                    <TableRow key={index} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-medium text-slate-900 sticky left-0 bg-white md:static">
                                            {row.cliente__nombre || "N/A"}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-slate-600">
                                            {row.num_pedidos}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-slate-600">
                                            {formatNumber(row.total_kilos)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-slate-600">
                                            {formatCurrency(row.total_facturado)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums font-medium text-emerald-600">
                                            {formatCurrency(row.total_utilidades)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-rose-600">
                                            {formatCurrency(row.total_nc)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-slate-500 text-xs">
                                            {formatPercent(row.percent_kilos)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-slate-500 text-xs">
                                            {formatPercent(row.percent_utilidad)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
