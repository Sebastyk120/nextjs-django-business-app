"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axiosClient from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface PendingSolicitud {
    id: number;
    cliente: string;
    fecha_entrega: string;
    observaciones: string;
}

export function CancellationNotifications() {
    const { user } = useAuth();
    const router = useRouter();
    const [solicitudes, setSolicitudes] = useState<PendingSolicitud[]>([]);
    const [open, setOpen] = useState(false);
    const [hasBeenShown, setHasBeenShown] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const handleAction = async (pedidoId: number, accion: 'autorizar' | 'no_autorizar') => {
        setProcessingId(pedidoId);
        try {
            await axiosClient.post(`/comercial/api/pedidos/${pedidoId}/gestionar-cancelacion/`, {
                accion: accion
            });

            toast.success(
                accion === 'autorizar'
                    ? "Cancelación aprobada exitosamente"
                    : "Cancelación rechazada exitosamente"
            );

            // Remove from list
            setSolicitudes(prev => prev.filter(p => p.id !== pedidoId));

            // If no more requests, close modal after a brief delay
            if (solicitudes.length <= 1) {
                setTimeout(() => setOpen(false), 1000);
            }

        } catch (error) {
            console.error("Error managing cancellation:", error);
            toast.error("Error al procesar la solicitud");
        } finally {
            setProcessingId(null);
        }
    };

    useEffect(() => {
        const checkSolicitudes = async () => {
            if (!user) return;

            const isAutorizador = user.groups?.includes("Autorizadores");
            if (!isAutorizador) return;

            try {
                const response = await axiosClient.get("/comercial/api/pedidos/solicitudes-pendientes/");
                if (response.data && response.data.length > 0) {
                    setSolicitudes(response.data);
                    setOpen(true);
                }
            } catch (error) {
                console.error("Error fetching pending cancellations:", error);
            }
        };

        if (!hasBeenShown && user) {
            checkSolicitudes();
            setHasBeenShown(true);
        }
    }, [user, hasBeenShown]);

    if (solicitudes.length === 0) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[550px] border-none shadow-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-md [&>button]:!text-white [&>button]:opacity-80 [&>button:hover]:opacity-100 [&>button:hover]:bg-white/10 [&>button]:transition-all">
                <div className="bg-gradient-to-r from-red-600 to-rose-500 p-6 text-white relative">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <AlertCircle className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold font-plus-jakarta">
                                Solicitudes Pendientes
                            </DialogTitle>
                            <p className="text-red-100 text-sm opacity-90">
                                Hay {solicitudes.length} pedido(s) esperando autorización de cancelación.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                        {solicitudes.map((sol) => (
                            <div
                                key={sol.id}
                                className="group p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all duration-200"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider">
                                            Pedido #{sol.id}
                                        </p>
                                        <h4 className="font-bold text-slate-800 font-plus-jakarta">
                                            {sol.cliente}
                                        </h4>
                                    </div>
                                    <span className="text-[10px] font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded-md">
                                        {sol.fecha_entrega}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-2 italic mb-3">
                                    &ldquo;{sol.observaciones || "Sin observaciones específicas"}&rdquo;
                                </p>

                                <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 h-8 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 border-slate-200"
                                        onClick={() => handleAction(sol.id, 'no_autorizar')}
                                        disabled={processingId === sol.id}
                                    >
                                        {processingId === sol.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <>
                                                <X className="h-3 w-3 mr-1.5" />
                                                Rechazar
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => handleAction(sol.id, 'autorizar')}
                                        disabled={processingId === sol.id}
                                    >
                                        {processingId === sol.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <>
                                                <Check className="h-3 w-3 mr-1.5" />
                                                Aprobar
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="p-6 pt-0 flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="flex-1 font-semibold text-slate-600 hover:bg-slate-100"
                    >
                        Cerrar avisos
                    </Button>
                    <Button
                        onClick={() => {
                            setOpen(false);
                            router.push("/pedidos?preset=base"); // Redirigir a pedidos
                        }}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg shadow-slate-200 group"
                    >
                        Gestionar Pedidos
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
