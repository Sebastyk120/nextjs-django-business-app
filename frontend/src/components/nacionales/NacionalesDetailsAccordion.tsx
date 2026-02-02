import { useState } from "react";
import { CompraNacional, VentaNacional, ReporteCalidadExportador, ReporteCalidadProveedor } from "@/types/nacionales";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Edit2, 
    Plus, 
    ChevronDown, 
    ChevronRight, 
    Lock,
    Store,
    FileOutput,
    FileCheck,
    Package,
    Calendar,
    Scale,
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle2,
    Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface NacionalesDetailsAccordionProps {
    data: CompraNacional;
    onEditCompra: () => void;
    onEditVenta: (venta: VentaNacional) => void;
    onCreateVenta: () => void;
    onEditReporteExp: (venta: VentaNacional) => void;
    onCreateReporteExp: (venta: VentaNacional) => void;
    onEditReporteProv: (venta: VentaNacional) => void;
    onCreateReporteProv: (venta: VentaNacional) => void;
}

export function NacionalesDetailsAccordion({
    data,
    onEditCompra, onEditVenta, onCreateVenta,
    onEditReporteExp, onCreateReporteExp,
    onEditReporteProv, onCreateReporteProv
}: NacionalesDetailsAccordionProps) {

    // Calculate GLOBAL stats for all ventas
    const globalStats = {
        totalPesoBruto: data.ventas?.reduce((sum, v) => sum + (Number(v.peso_bruto_recibido) || 0), 0) || 0,
        totalEmpaque: data.ventas?.reduce((sum, v) => sum + (Number(v.cantidad_empaque_recibida) || 0), 0) || 0,
        compraPeso: Number(data.peso_compra) || 0,
        compraEmpaque: Number(data.cantidad_empaque) || 0,
        get diferenciaPeso() { return this.totalPesoBruto - this.compraPeso; },
        get diferenciaEmpaque() { return this.totalEmpaque - this.compraEmpaque; }
    };

    // Determine lock state for Compra
    const isCompraLocked = data.ventas?.some(v => v.reportecalidadexportador?.vencimiento_factura);

    return (
        <div className="w-full space-y-6">
            {/* Step 1: Compra - Redesigned as Card */}
            <Card className="border-emerald-200 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg">
                                <Package className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-emerald-900">Detalles de Compra</CardTitle>
                                <p className="text-sm text-emerald-600">{data.proveedor_nombre} • {data.fecha_compra}</p>
                            </div>
                        </div>
                        
                        <Badge variant="outline" className="bg-white border-emerald-200 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completado
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <InfoItem icon={<Package className="h-4 w-4" />} label="Proveedor" value={data.proveedor_nombre} />
                        
                        <InfoItem icon={<Calendar className="h-4 w-4" />} label="Fecha Compra" value={data.fecha_compra} />
                        
                        <InfoItem icon={<Scale className="h-4 w-4" />} label="Número Guía" value={data.numero_guia} />
                        
                        <InfoItem icon={<FileOutput className="h-4 w-4" />} label="Remisión" value={data.remision || 'Sin remisión'} />
                        
                        <InfoItem icon={<Package className="h-4 w-4" />} label="Fruta" value={data.fruta_nombre} />
                        
                        <InfoItem icon={<Store className="h-4 w-4" />} label="Origen" value={data.origen_compra} />
                        
                        <InfoItem icon={<Package className="h-4 w-4" />} label="Empaque" value={`${data.tipo_empaque_nombre} x ${data.cantidad_empaque}`} />
                        
                        <InfoItem 
                            icon={<Scale className="h-4 w-4" />} 
                            label="Peso Compra" 
                            value={`${data.peso_compra.toLocaleString()} Kg`}
                            highlight
                            highlightColor="emerald"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <Card className="bg-slate-50 border-slate-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Precio Compra Exp</span>
                                    
                                    <span className="text-xl font-bold text-slate-800 font-mono">${Math.round(data.precio_compra_exp).toLocaleString()}</span>
                                </div>
                            </CardContent>
                        </Card>

                        
                        <Card className="bg-emerald-50 border-emerald-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-emerald-700">Valor Total Estimado</span>
                                    
                                    <span className="text-xl font-bold text-emerald-700 font-mono">${(data.peso_compra * data.precio_compra_exp).toLocaleString()}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {data.observaciones && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                <div>
                                    <div className="text-xs font-bold text-amber-700 uppercase mb-1">Observaciones</div>
                                    
                                    <p className="text-sm text-amber-800">{data.observaciones}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onEditCompra}
                            disabled={!!isCompraLocked}
                            className="border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                            {isCompraLocked ? <Lock className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
                            Editar Compra
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Ventas Section - Redesigned Tabs */}
            
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                            <Store className="h-5 w-5" />
                        </div>
                        
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">Ventas y Reportes</h2>
                            
                            <p className="text-sm text-slate-500">{data.ventas?.length || 0} ventas registradas</p>
                        </div>
                    </div>
                    
                    <Button onClick={onCreateVenta} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Venta
                    </Button>
                </div>

                {!data.ventas || data.ventas.length === 0 ? (
                    <Card className="border-dashed border-2 border-slate-200">
                        <CardContent className="p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Store className="h-8 w-8 text-slate-400" />
                            </div>
                            
                            <h3 className="text-lg font-medium text-slate-700 mb-2">No hay ventas registradas</h3>
                            
                            <p className="text-slate-500 mb-4">Registre una nueva venta para continuar con el proceso</p>
                            
                            
                            <Button onClick={onCreateVenta} variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Registrar Primera Venta
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Tabs defaultValue={data.ventas[0].id.toString()} className="w-full">
                        <TabsList className="mb-4 flex flex-wrap h-auto bg-slate-100 p-2 w-full justify-start gap-2 items-center rounded-xl">
                            {data.ventas.map((venta, index) => {
                                const hasReporteExp = !!venta.reportecalidadexportador;
                                const hasReporteProv = !!venta.reportecalidadexportador?.reportecalidadproveedor;
                                
                                return (
                                    <TabsTrigger
                                        key={venta.id}
                                        value={venta.id.toString()}
                                        className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 rounded-lg transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">Venta {index + 1}</span>
                                            
                                            <div className="flex gap-1">
                                                {hasReporteExp && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                                {hasReporteProv && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                                            </div>
                                        </div>
                                    </TabsTrigger>
                                );
                            })}

                            {/* Sales Summary */}
                            
                            <div className="ml-auto px-4 py-2 flex items-center gap-4 text-sm border-l border-slate-200">
                                {(() => {
                                    const totalVentas = data.ventas?.reduce((acc, v) => acc + (v.cantidad_empaque_recibida || 0), 0) || 0;
                                    const remaining = data.cantidad_empaque - totalVentas;
                                    return (
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-xs text-slate-500">Empaque Vendido</div>
                                                
                                                <div className="font-bold text-slate-800">{totalVentas} / {data.cantidad_empaque}</div>
                                            </div>
                                            
                                            <div className={cn(
                                                "text-right px-3 py-1 rounded-lg",
                                                remaining < 0 ? "bg-red-100" : "bg-emerald-100"
                                            )}>
                                                <div className="text-xs text-slate-500">{remaining < 0 ? 'Excedente' : 'Disponible'}</div>
                                                
                                                <div className={cn(
                                                    "font-bold",
                                                    remaining < 0 ? "text-red-700" : "text-emerald-700"
                                                )}>
                                                    {remaining < 0 ? `+${Math.abs(remaining)}` : remaining}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </TabsList>

                        {data.ventas.map(venta => {
                            const isLockedByFactura = !!venta.reportecalidadexportador?.vencimiento_factura;
                            const isReporteProvLocked = !!venta.reportecalidadexportador?.reportecalidadproveedor?.completado;

                            return (
                                <TabsContent key={venta.id} value={venta.id.toString()} className="space-y-4 animate-in fade-in duration-300">
                                    {/* Venta Details Card */}
                                    
                                    <VentaCard
                                        venta={venta}
                                        locked={isLockedByFactura}
                                        onEdit={() => onEditVenta(venta)}
                                        globalDiferenciaPeso={globalStats.diferenciaPeso}
                                        globalDiferenciaEmpaque={globalStats.diferenciaEmpaque}
                                    />

                                    {/* Reporte Exportador Card */}
                                    
                                    <ReporteExpCard
                                        venta={venta}
                                        locked={isLockedByFactura}
                                        onCreate={() => onCreateReporteExp(venta)}
                                        onEdit={() => onEditReporteExp(venta)}
                                    />

                                    {/* Reporte Proveedor Card */}
                                    
                                    <ReporteProvCard
                                        venta={venta}
                                        locked={isReporteProvLocked}
                                        onCreate={() => onCreateReporteProv(venta)}
                                        onEdit={() => onEditReporteProv(venta)}
                                    />
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                )}
            </div>
        </div>
    );
}

// Info Item Component
function InfoItem({ 
    icon, 
    label, 
    value, 
    highlight,
    highlightColor = "slate"
}: { 
    icon: React.ReactNode;
    label: string; 
    value: string;
    highlight?: boolean;
    highlightColor?: "emerald" | "blue" | "slate";
}) {
    const colorClasses = {
        emerald: "text-emerald-700 bg-emerald-50",
        blue: "text-blue-700 bg-blue-50",
        slate: "text-slate-700 bg-slate-50"
    };

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                {icon}
                <span className="font-medium uppercase tracking-wider">{label}</span>
            </div>
            
            <div className={cn(
                "text-sm font-semibold",
                highlight && `px-2 py-1 rounded-lg ${colorClasses[highlightColor]}`
            )}>
                {value}
            </div>
        </div>
    );
}

function VentaCard({ venta, locked, onEdit, globalDiferenciaPeso, globalDiferenciaEmpaque }: {
    venta: VentaNacional;
    locked: boolean;
    onEdit: () => void;
    globalDiferenciaPeso: number;
    globalDiferenciaEmpaque: number;
}) {
    const isVencido = venta.estado_venta === 'Vencido';
    
    return (
        <Card className="border-blue-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                            <Store className="h-5 w-5" />
                        </div>
                        
                        <div>
                            <CardTitle className="text-lg text-blue-900">Información de Venta</CardTitle>
                            
                            <p className="text-sm text-blue-600">{venta.exportador_nombre}</p>
                        </div>
                    </div>
                    
                    <Badge 
                        variant="outline" 
                        className={cn(
                            "bg-white",
                            isVencido ? "border-red-200 text-red-600" : "border-blue-200 text-blue-600"
                        )}
                    >
                        {isVencido ? <AlertCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                        {venta.estado_venta}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <InfoItem icon={<Store className="h-4 w-4" />} label="Exportador" value={venta.exportador_nombre} />
                    
                    <InfoItem icon={<Calendar className="h-4 w-4" />} label="Fecha Llegada" value={venta.fecha_llegada} />
                    
                    <InfoItem 
                        icon={<Calendar className="h-4 w-4" />} 
                        label="Fecha Vencimiento" 
                        value={venta.fecha_vencimiento}
                        highlight={isVencido}
                        highlightColor={isVencido ? "emerald" : "slate"}
                    />
                    
                    <InfoItem icon={<Package className="h-4 w-4" />} label="Tipo / Lote" value={`${venta.tipo || '-'} / ${venta.lote || '-'}`} />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card className="bg-slate-50 border-slate-200">
                        <CardContent className="p-4 text-center">
                            <div className="text-xs text-slate-500 uppercase mb-1">Peso Bruto</div>
                            
                            <div className="text-xl font-bold text-slate-800 font-mono">{venta.peso_bruto_recibido.toLocaleString()}</div>
                            
                            <div className="text-xs text-slate-400">Kg</div>
                        </CardContent>
                    </Card>

                    
                    <Card className="bg-slate-50 border-slate-200">
                        <CardContent className="p-4 text-center">
                            <div className="text-xs text-slate-500 uppercase mb-1">Peso Neto</div>
                            
                            <div className="text-xl font-bold text-emerald-700 font-mono">{venta.peso_neto_recibido.toLocaleString()}</div>
                            
                            <div className="text-xs text-slate-400">Kg</div>
                        </CardContent>
                    </Card>

                    
                    <Card className={cn(
                        "border-2",
                        globalDiferenciaPeso < 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
                    )}>
                        <CardContent className="p-4 text-center">
                            <div className={cn(
                                "text-xs uppercase mb-1",
                                globalDiferenciaPeso < 0 ? "text-red-600" : "text-emerald-600"
                            )}>Diferencia Global</div>
                            
                            <div className={cn(
                                "text-xl font-bold font-mono",
                                globalDiferenciaPeso < 0 ? "text-red-700" : "text-emerald-700"
                            )}>
                                {globalDiferenciaPeso > 0 ? '+' : ''}{globalDiferenciaPeso.toLocaleString()}
                            </div>
                            
                            <div className="text-xs text-slate-400">Kg</div>
                        </CardContent>
                    </Card>
                </div>

                {venta.observaciones && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                            
                            <div>
                                <div className="text-xs font-bold text-amber-700 uppercase mb-1">Observaciones</div>
                                
                                <p className="text-sm text-amber-800">{venta.observaciones}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onEdit}
                        disabled={locked}
                        className={cn(
                            "border-blue-200",
                            locked ? "opacity-50 cursor-not-allowed" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        )}
                    >
                        {locked ? <Lock className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
                        Editar Venta
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function ReporteExpCard({ venta, locked, onCreate, onEdit }: { venta: VentaNacional, locked: boolean, onCreate: () => void, onEdit: () => void }) {
    const reporte = venta.reportecalidadexportador;

    if (!reporte) {
        return (
            <Card className="border-dashed border-2 border-indigo-200 bg-indigo-50/50">
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                        <FileOutput className="h-8 w-8 text-indigo-400" />
                    </div>
                    
                    <h3 className="text-lg font-medium text-indigo-900 mb-2">Reporte Exportador Pendiente</h3>
                    
                    <p className="text-indigo-600 mb-4">Registre el reporte de calidad del exportador</p>
                    
                    <Button onClick={onCreate} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Reporte
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-indigo-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                            <FileOutput className="h-5 w-5" />
                        </div>
                        
                        <div>
                            <CardTitle className="text-lg text-indigo-900">Reporte Calidad Exportador</CardTitle>
                            
                            <p className="text-sm text-indigo-600">{reporte.fecha_reporte}</p>
                        </div>
                    </div>
                    
                    <Badge variant="outline" className="bg-white border-indigo-200 text-indigo-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {reporte.estado_reporte_exp}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <InfoItem icon={<Calendar className="h-4 w-4" />} label="Fecha Reporte" value={reporte.fecha_reporte} />
                    
                    <InfoItem icon={<FileOutput className="h-4 w-4" />} label="Remisión" value={reporte.remision_exp || 'Sin Remisión'} />
                    
                    <InfoItem icon={<Scale className="h-4 w-4" />} label="Kg Totales" value={`${parseFloat(reporte.kg_totales.toString()).toLocaleString()} Kg`} />
                    
                    <InfoItem icon={<FileOutput className="h-4 w-4" />} label="Factura Heavens" value={reporte.factura || 'Pendiente'} />
                </div>

                {/* Quality Distribution */}
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card className="bg-emerald-50 border-emerald-200">
                        <CardContent className="p-4 text-center">
                            <div className="text-xs text-emerald-600 uppercase font-bold mb-1">Exportación</div>
                            
                            <div className="text-2xl font-bold text-emerald-700">{reporte.porcentaje_exportacion}%</div>
                            
                            <div className="text-xs text-emerald-600">{parseFloat(reporte.kg_exportacion.toString()).toLocaleString()} Kg</div>
                        </CardContent>
                    </Card>

                    
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4 text-center">
                            <div className="text-xs text-blue-600 uppercase font-bold mb-1">Nacional</div>
                            
                            <div className="text-2xl font-bold text-blue-700">{reporte.porcentaje_nacional}%</div>
                            
                            <div className="text-xs text-blue-600">{parseFloat(reporte.kg_nacional.toString()).toLocaleString()} Kg</div>
                        </CardContent>
                    </Card>

                    
                    <Card className="bg-slate-50 border-slate-200">
                        <CardContent className="p-4 text-center">
                            <div className="text-xs text-slate-600 uppercase font-bold mb-1">Merma</div>
                            
                            <div className="text-2xl font-bold text-slate-700">{reporte.porcentaje_merma || 0}%</div>
                            
                            <div className="text-xs text-slate-500">{parseFloat((reporte.kg_merma || 0).toString()).toLocaleString()} Kg</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                        </div>
                        
                        <div>
                            <div className="text-sm text-slate-500">Valor Total Factura</div>
                            
                            <div className="text-xs text-slate-400">Precio Exp: ${parseFloat(reporte.precio_venta_kg_exp.toString()).toLocaleString()}</div>
                        </div>
                    </div>
                    
                    <div className="text-2xl font-bold text-emerald-700 font-mono">
                        ${parseFloat(reporte.precio_total.toString()).toLocaleString()}
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onEdit}
                        disabled={locked}
                        className={cn(
                            "border-indigo-200",
                            locked ? "opacity-50 cursor-not-allowed" : "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        )}
                    >
                        {locked ? <Lock className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
                        Editar Reporte
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function ReporteProvCard({ venta, locked, onCreate, onEdit }: { venta: VentaNacional, locked: boolean, onCreate: () => void, onEdit: () => void }) {
    const reporteExp = venta.reportecalidadexportador;
    const reporteProv = reporteExp?.reportecalidadproveedor;

    if (!reporteExp) return null;

    if (!reporteProv) {
        return (
            <Card className="border-dashed border-2 border-purple-200 bg-purple-50/50">
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                        <FileCheck className="h-8 w-8 text-purple-400" />
                    </div>
                    
                    <h3 className="text-lg font-medium text-purple-900 mb-2">Reporte Proveedor Pendiente</h3>
                    
                    <p className="text-purple-600 mb-4">Genere el reporte de calidad para el proveedor</p>
                    
                    <Button onClick={onCreate} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Generar Reporte
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const formatCurrency = (val: number | undefined | null) => {
        if (val === undefined || val === null) return '$0';
        return '$' + parseFloat(val.toString()).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    return (
        <Card className="border-purple-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                            <FileCheck className="h-5 w-5" />
                        </div>
                        
                        <div>
                            <CardTitle className="text-lg text-purple-900">Reporte Calidad Proveedor</CardTitle>
                        </div>
                    </div>
                    
                    <Badge 
                        variant="outline" 
                        className={cn(
                            "bg-white",
                            reporteProv.completado ? "border-emerald-200 text-emerald-600" : "border-purple-200 text-purple-600"
                        )}
                    >
                        {reporteProv.estado_reporte_prov}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {/* Header Info Row */}
                <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-slate-200">
                    <div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">FECHA REPORTE</div>
                        <div className="text-base font-semibold text-slate-800">{reporteProv.p_fecha_reporte || '-'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">ESTADO REPORTE</div>
                        <div className="text-base font-semibold text-slate-800">{reporteProv.estado_reporte_prov}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">NO. FACTURA PROV</div>
                        <div className="text-base font-semibold text-slate-800">{reporteProv.factura_prov || '-'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">KG TOTALES</div>
                        <div className="text-base font-semibold text-slate-800 font-mono">{Number(reporteProv.p_kg_totales || 0).toLocaleString()} Kg</div>
                    </div>
                </div>

                {/* Quality Breakdown - Exp / Nal / Merma */}
                <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="text-center">
                        <span className="block text-xs uppercase font-bold text-emerald-600 mb-1">EXPORTACIÓN</span>
                        <div className="text-lg font-bold text-slate-800">{Number(reporteProv.p_porcentaje_exportacion || 0).toFixed(2)}%</div>
                        <div className="text-sm text-slate-500">{Number(reporteProv.p_kg_exportacion || 0).toLocaleString()} Kg</div>
                        <div className="text-sm text-emerald-600 font-mono">{formatCurrency(reporteProv.p_precio_kg_exp)}/Kg</div>
                    </div>
                    <div className="text-center border-l border-r border-slate-200">
                        <span className="block text-xs uppercase font-bold text-blue-600 mb-1">NACIONAL</span>
                        <div className="text-lg font-bold text-slate-800">{Number(reporteProv.p_porcentaje_nacional || 0).toFixed(2)}%</div>
                        <div className="text-sm text-slate-500">{Number(reporteProv.p_kg_nacional || 0).toLocaleString()} Kg</div>
                        <div className="text-sm text-blue-600 font-mono">{formatCurrency(reporteProv.p_precio_kg_nal)}/Kg</div>
                    </div>
                    <div className="text-center">
                        <span className="block text-xs uppercase font-bold text-slate-500 mb-1">MERMA</span>
                        <div className="text-lg font-bold text-slate-800">{Number(reporteProv.p_porcentaje_merma || 0).toFixed(2)}%</div>
                        <div className="text-sm text-slate-500">{Number(reporteProv.p_kg_merma || 0).toLocaleString()} Kg</div>
                    </div>
                </div>

                {/* Two columns: Costos y Retenciones | Análisis de Utilidad */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Costos y Retenciones */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
                        <h5 className="text-xs font-bold uppercase text-slate-500 border-b pb-2 mb-3">COSTOS Y RETENCIONES</h5>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Total Facturar:</span>
                            <span className="font-mono font-medium">{formatCurrency(reporteProv.p_total_facturar)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Asohofrucol (1%):</span>
                            <span className="font-mono text-red-500">- {formatCurrency(reporteProv.asohofrucol)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Rte Fte (1.5%):</span>
                            <span className="font-mono text-red-500">- {formatCurrency(reporteProv.rte_fte)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Rte Ica (4.14/1000):</span>
                            <span className="font-mono text-red-500">- {formatCurrency(reporteProv.rte_ica)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
                            <span className="text-slate-700">Total a Pagar:</span>
                            <span className="font-mono text-blue-700">{formatCurrency(reporteProv.p_total_pagar)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Monto Pendiente:</span>
                            <span className="font-mono text-amber-600">{formatCurrency(reporteProv.monto_pendiente)}</span>
                        </div>
                    </div>

                    {/* Análisis de Utilidad */}
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 space-y-2">
                        <h5 className="text-xs font-bold uppercase text-emerald-600 border-b border-emerald-200 pb-2 mb-3">ANÁLISIS DE UTILIDAD</h5>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Total Venta Exp:</span>
                            <span className="font-mono font-medium">{formatCurrency(reporteExp.precio_total)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Utilidad Real:</span>
                            <span className={`font-mono font-medium ${(reporteProv.p_utilidad || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                {formatCurrency(reporteProv.p_utilidad)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">% Utilidad:</span>
                            <span className={`font-mono font-medium ${(reporteProv.p_porcentaje_utilidad || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                {Number(reporteProv.p_porcentaje_utilidad || 0).toFixed(2)}%
                            </span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-emerald-200 pt-2 mt-2">
                            <span className="text-slate-600">Utilidad Sin Ajuste:</span>
                            <span className="font-mono">{formatCurrency(reporteProv.p_utilidad_sin_ajuste)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Diferencia Utilidades:</span>
                            <span className={`font-mono font-bold ${(reporteProv.diferencia_utilidad || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                {formatCurrency(reporteProv.diferencia_utilidad)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status Row */}
                <div className="grid grid-cols-4 gap-4 py-3 px-2 bg-slate-50 rounded-lg border border-slate-100 mb-6">
                    <div className="text-center">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">REPORTE ENVIADO</label>
                        {reporteProv.reporte_enviado ? (
                            <span className="text-emerald-500 text-lg">✓</span>
                        ) : (
                            <span className="text-red-400 text-lg">✗</span>
                        )}
                    </div>
                    <div className="text-center">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">REPORTE PAGO</label>
                        {reporteProv.reporte_pago ? (
                            <span className="text-emerald-500 text-lg">✓</span>
                        ) : (
                            <span className="text-red-400 text-lg">✗</span>
                        )}
                    </div>
                    <div className="text-center">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">COMPLETADO</label>
                        <span className="text-slate-600">{reporteProv.completado ? 'Sí' : 'No'}</span>
                    </div>
                    <div className="text-center">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">ESTADO FINAL</label>
                        <Badge variant="outline" className="text-xs">{reporteProv.estado_reporte_prov}</Badge>
                    </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-dashed border-slate-200">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onEdit}
                        disabled={locked}
                        className={cn(
                            "border-blue-200",
                            locked ? "opacity-50 cursor-not-allowed" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        )}
                    >
                        {locked ? <Lock className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
                        Editar Reporte
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
