import { CompraNacional } from "@/types/nacionales";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface NacionalesTimelineProps {
    data: CompraNacional;
}

export function NacionalesTimeline({ data }: NacionalesTimelineProps) {

    // Determine status for Reporte Proveedor separately logic
    const reporteProvExists = !!data.ventanacional?.reportecalidadexportador?.reportecalidadproveedor;
    const reporteProvCompleted = data.ventanacional?.reportecalidadexportador?.reportecalidadproveedor?.completado;

    const steps = [
        {
            id: 'compra',
            label: 'Compra Nacional',
            date: data.fecha_compra,
            status: 'completed', // Always completed if present
            details: `Guía: ${data.numero_guia}\nProv: ${data.proveedor_nombre}`
        },
        {
            id: 'venta',
            label: 'Venta Nacional',
            date: data.ventanacional?.fecha_llegada,
            status: data.ventanacional ? 'completed' : 'current',
            details: data.ventanacional ? `Exp: ${data.ventanacional.exportador_nombre}` : 'Pendiente de venta'
        },
        {
            id: 'reporte_exp',
            label: 'Reporte Exportador',
            date: data.ventanacional?.reportecalidadexportador?.fecha_reporte,
            status: data.ventanacional?.reportecalidadexportador ? 'completed' : (data.ventanacional ? 'current' : 'pending'),
            details: data.ventanacional?.reportecalidadexportador ? `Rem: ${data.ventanacional.reportecalidadexportador.remision_exp || 'Sin remisión'}` : 'Pendiente reporte'
        },
        {
            id: 'reporte_prov',
            label: 'Reporte Proveedor',
            date: data.ventanacional?.reportecalidadexportador?.reportecalidadproveedor?.p_fecha_reporte,
            status: reporteProvCompleted ? 'completed' : (reporteProvExists ? 'current' : (data.ventanacional?.reportecalidadexportador ? 'current' : 'pending')),
            details: reporteProvExists ? (reporteProvCompleted ? 'Completado' : 'En proceso de pago/cierre') : 'Pendiente'
        }
    ];

    return (
        <div className="w-full py-4 relative z-0">
            <div className="relative mx-4">
                {/* Horizontal progress bar background */}
                <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-slate-100 -z-10" />

                {/* Active progress bar overlay - calculated roughly based on status */}
                <div className="absolute top-5 left-[10%] h-0.5 bg-emerald-100 -z-10 transition-all duration-500"
                    style={{
                        width: steps[3].status === 'completed' ? '80%' :
                            steps[2].status === 'completed' ? '55%' :
                                steps[1].status === 'completed' ? '28%' : '0%'
                    }}
                />

                <div className="flex justify-between items-start w-full px-2">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex flex-col items-center flex-1 relative group cursor-pointer">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 mb-3 relative bg-white z-10 shadow-sm",
                                step.status === 'completed' ? "border-emerald-500 text-emerald-600 bg-emerald-50 shadow-emerald-100" :
                                    step.status === 'current' ? "border-blue-500 text-blue-600 bg-blue-50 animate-pulse ring-4 ring-blue-50" :
                                        "border-slate-200 text-slate-300 bg-slate-50"
                            )}>
                                {step.status === 'completed' ? <Check className="h-5 w-5" /> :
                                    step.status === 'current' ? <Clock className="h-5 w-5" /> :
                                        <span className="text-sm font-semibold">{index + 1}</span>}
                            </div>

                            <h4 className={cn(
                                "text-sm font-bold text-center mb-1 transition-colors px-2",
                                step.status === 'completed' ? "text-emerald-700" :
                                    step.status === 'current' ? "text-blue-700" : "text-slate-400"
                            )}>{step.label}</h4>

                            <span className="text-xs text-center text-slate-500 font-medium font-mono bg-slate-50 px-1.5 rounded border border-slate-100">{step.date || '--/--/----'}</span>

                            {/* Hover Card for Details */}
                            <div className="absolute top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto transform translate-y-2 group-hover:translate-y-0 text-left">
                                {/* Arrow */}
                                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-slate-200 transform rotate-45"></div>

                                <h5 className="font-bold text-xs text-slate-800 uppercase border-b border-slate-100 pb-2 mb-2">{step.label}</h5>

                                <div className="space-y-1.5">
                                    {step.id === 'compra' && (
                                        <>
                                            <div className="flex justify-between text-xs"><span className="text-slate-500">Guía:</span> <span className="font-medium">{data.numero_guia}</span></div>
                                            <div className="flex justify-between text-xs"><span className="text-slate-500">Prov:</span> <span className="font-medium truncate max-w-[140px]">{data.proveedor_nombre}</span></div>
                                            <div className="flex justify-between text-xs"><span className="text-slate-500">Peso:</span> <span className="font-mono text-emerald-600">{data.peso_compra.toLocaleString()} Kg</span></div>
                                        </>
                                    )}

                                    {step.id === 'venta' && (
                                        data.ventanacional ? (
                                            <>
                                                <div className="flex justify-between text-xs"><span className="text-slate-500">Exp:</span> <span className="font-medium truncate max-w-[140px]">{data.ventanacional.exportador_nombre}</span></div>
                                                <div className="flex justify-between text-xs"><span className="text-slate-500">Recibido:</span> <span className="font-mono text-emerald-600">{data.ventanacional.peso_neto_recibido.toLocaleString()} Kg</span></div>
                                                <div className="flex justify-between text-xs"><span className="text-slate-500">Llegada:</span> <span>{data.ventanacional.fecha_llegada}</span></div>
                                            </>
                                        ) : <span className="text-xs text-slate-400 italic">Pendiente de registro</span>
                                    )}

                                    {step.id === 'reporte_exp' && (
                                        data.ventanacional?.reportecalidadexportador ? (
                                            <>
                                                <div className="flex justify-between text-xs"><span className="text-slate-500">Remisión:</span> <span className="font-medium">{data.ventanacional.reportecalidadexportador.remision_exp}</span></div>
                                                <div className="flex gap-2 mt-1">
                                                    <div className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">Exp: {data.ventanacional.reportecalidadexportador.porcentaje_exportacion}%</div>
                                                    <div className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">Nal: {data.ventanacional.reportecalidadexportador.porcentaje_nacional}%</div>
                                                </div>
                                                <div className="flex justify-between text-xs pt-1 border-t border-dashed mt-1"><span className="font-bold text-slate-700">Total:</span> <span className="font-mono">${parseFloat(data.ventanacional.reportecalidadexportador.precio_total.toString()).toLocaleString()}</span></div>
                                            </>
                                        ) : <span className="text-xs text-slate-400 italic">Pendiente de reporte</span>
                                    )}

                                    {step.id === 'reporte_prov' && (
                                        data.ventanacional?.reportecalidadexportador?.reportecalidadproveedor ? (
                                            <>
                                                <div className="flex justify-between text-xs"><span className="text-slate-500">Estado:</span> <span className="text-blue-600 font-medium">{data.ventanacional.reportecalidadexportador.reportecalidadproveedor.estado_reporte_prov}</span></div>
                                                <div className="flex justify-between text-xs"><span className="text-slate-500">Factura:</span> <span className="font-medium">{data.ventanacional.reportecalidadexportador.reportecalidadproveedor.factura_prov || 'N/A'}</span></div>
                                                <div className="flex justify-between text-xs pt-1 border-t border-dashed mt-1">
                                                    <span className="font-bold text-slate-700">A Pagar:</span>
                                                    <span className="font-bold text-emerald-600 font-mono">${parseFloat(data.ventanacional.reportecalidadexportador.reportecalidadproveedor.p_total_pagar.toString()).toLocaleString()}</span>
                                                </div>
                                            </>
                                        ) : <span className="text-xs text-slate-400 italic">Pendiente de cierre</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
