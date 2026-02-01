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
import { Users, ArrowUpRight, ArrowDownRight } from "lucide-react";

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

    // Calculate totals for summary
    const totals = data.reduce((acc, row) => ({
        pedidos: acc.pedidos + row.num_pedidos,
        kilos: acc.kilos + row.total_kilos,
        facturado: acc.facturado + row.total_facturado,
        utilidad: acc.utilidad + row.total_utilidades,
        nc: acc.nc + row.total_nc,
    }), { pedidos: 0, kilos: 0, facturado: 0, utilidad: 0, nc: 0 });

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 py-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800">
                                Detalle por Cliente
                            </CardTitle>
                            <p className="text-[11px] text-slate-400">
                                {data.length} clientes en el período seleccionado
                            </p>
                        </div>
                    </div>
                    
                    {/* Summary stats */}
                    {data.length > 0 && (
                        <div className="hidden md:flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Facturado</p>
                                <p className="text-sm font-bold text-slate-800">{formatCurrency(totals.facturado)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Utilidad</p>
                                <p className="text-sm font-bold text-emerald-600">{formatCurrency(totals.utilidad)}</p>
                            </div>
                        </div>
                    )}
                </div>
            </CardHeader>
            
            <CardContent className="p-0">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Cargando datos de clientes...</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <Users className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">No hay datos para mostrar</p>
                        <p className="text-slate-400 text-sm mt-1">Intenta ajustar los filtros de fecha</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
                                <TableRow className="border-b border-slate-200 hover:bg-transparent">
                                    <TableHead className="font-bold text-slate-700 w-[220px] py-4">
                                        Cliente
                                    </TableHead>
                                    <TableHead className="font-bold text-slate-700 text-right py-4">
                                        Pedidos
                                    </TableHead>
                                    <TableHead className="font-bold text-slate-700 text-right py-4">
                                        Total Kilos
                                    </TableHead>
                                    <TableHead className="font-bold text-slate-700 text-right py-4">
                                        Facturado USD
                                    </TableHead>
                                    <TableHead className="font-bold text-emerald-700 text-right py-4">
                                        Utilidad USD
                                    </TableHead>
                                    <TableHead className="font-bold text-rose-700 text-right py-4">
                                        Notas Crédito
                                    </TableHead>
                                    <TableHead className="font-bold text-slate-700 text-right py-4">
                                        % Kilos
                                    </TableHead>
                                    <TableHead className="font-bold text-slate-700 text-right py-4">
                                        % Utilidad
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            
                            <TableBody>
                                {data.map((row, index) => {
                                    const isPositiveUtilidad = row.total_utilidades > 0;
                                    const rowBgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30';
                                    
                                    return (
                                        <TableRow 
                                            key={index} 
                                            className={cn(
                                                "border-b border-slate-100 transition-colors hover:bg-slate-50",
                                                rowBgClass
                                            )}
                                        >
                                            <TableCell className="font-semibold text-slate-900 py-4 sticky left-0 bg-inherit">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                        {row.cliente__nombre?.charAt(0) || "?"}
                                                    </div>
                                                    <span className="truncate max-w-[160px]">
                                                        {row.cliente__nombre || "N/A"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            
                                            <TableCell className="text-right tabular-nums text-slate-600 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium">
                                                    {row.num_pedidos}
                                                </span>
                                            </TableCell>
                                            
                                            <TableCell className="text-right tabular-nums text-slate-700 font-medium py-4">
                                                {formatNumber(row.total_kilos)}
                                            </TableCell>
                                            
                                            <TableCell className="text-right tabular-nums text-slate-700 font-medium py-4">
                                                {formatCurrency(row.total_facturado)}
                                            </TableCell>
                                            
                                            <TableCell className="text-right tabular-nums py-4">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
                                                    isPositiveUtilidad 
                                                        ? "bg-emerald-50 text-emerald-700" 
                                                        : "bg-rose-50 text-rose-700"
                                                )}>
                                                    {isPositiveUtilidad ? (
                                                        <ArrowUpRight className="h-3 w-3" />
                                                    ) : (
                                                        <ArrowDownRight className="h-3 w-3" />
                                                    )}
                                                    {formatCurrency(row.total_utilidades)}
                                                </span>
                                            </TableCell>
                                            
                                            <TableCell className="text-right tabular-nums text-rose-600 py-4">
                                                {row.total_nc > 0 ? formatCurrency(row.total_nc) : "-"}
                                            </TableCell>
                                            
                                            <TableCell className="text-right tabular-nums py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${Math.min(row.percent_kilos, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-500 w-12">
                                                        {formatPercent(row.percent_kilos)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            
                                            <TableCell className="text-right tabular-nums py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={cn(
                                                                "h-full rounded-full",
                                                                isPositiveUtilidad ? "bg-emerald-500" : "bg-rose-500"
                                                            )}
                                                            style={{ width: `${Math.min(Math.abs(row.percent_utilidad), 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-500 w-12">
                                                        {formatPercent(row.percent_utilidad)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
