import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pedido } from "@/types/pedido";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { Loader2, AlertTriangle, CheckCircle, Ban } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface OrderCancellationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: Pedido | null;
    onOrderUpdated: () => void;
    userGroups?: string[];
}

export function OrderCancellationModal({
    open,
    onOpenChange,
    order,
    onOrderUpdated,
    userGroups = []
}: OrderCancellationModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [observaciones, setObservaciones] = useState("");

    // Derived State
    const isAutorizador = userGroups.includes("Autorizadores");
    const estado = order?.estado_cancelacion || 'sin_solicitud';

    // Reset form on open
    useEffect(() => {
        if (open && order) {
            setObservaciones(order.observaciones || "");
        } else {
            setObservaciones("");
        }
    }, [open, order]);

    const handleAction = async (action: 'solicitar' | 'autorizar' | 'no_autorizar') => {
        if (!order) return;
        setIsLoading(true);
        try {
            if (action === 'solicitar') {
                await axiosClient.post(`/comercial/api/pedidos/${order.id}/solicitar-cancelacion/`, {
                    observaciones
                });
                toast.success("Solicitud de cancelación enviada correctamente.");
            } else {
                await axiosClient.post(`/comercial/api/pedidos/${order.id}/gestionar-cancelacion/`, {
                    accion: action,
                    observaciones
                });
                if (action === 'autorizar') {
                    toast.success("Pedido cancelado exitosamente.");
                } else {
                    toast.info("Cancelación rechazada/anulada.");
                }
            }
            onOrderUpdated();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error processing cancellation:", error);
            const msg = error.response?.data?.error || "Error al procesar la solicitud.";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (!order) return null;

    // View Logic based on template and role
    const canRequest = !isAutorizador && (estado === 'sin_solicitud' || estado === 'no_autorizado');
    const canAuthorize = isAutorizador && estado === 'pendiente';
    const isPendingView = !isAutorizador && estado === 'pendiente';

    // Title Logic
    const getTitle = () => {
        if (canRequest) return "Solicitar Cancelación";
        if (canAuthorize) return "Autorizar Cancelación";
        if (isPendingView) return "Solicitud Pendiente";
        return "Estado Cancelación";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{getTitle()}</DialogTitle>
                    <DialogDescription>
                        Pedido #{order.id} - {order.cliente_nombre || order.cliente}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Instructions / Alerts */}
                    {canRequest && (
                        <Alert className="bg-amber-50 border-amber-200 text-amber-900">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertTitle>Advertencia</AlertTitle>
                            <AlertDescription>
                                Estás a punto de solicitar la cancelación de este pedido. Esta acción requiere aprobación de un administrador.
                            </AlertDescription>
                        </Alert>
                    )}

                    {canAuthorize && (
                        <Alert className="bg-red-50 border-red-200 text-red-900">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertTitle>Acción Destructiva</AlertTitle>
                            <AlertDescription>
                                Si autorizas la cancelación, se <strong>eliminarán todos los detalles</strong> del pedido y se resetearán sus valores. Esta acción es irreversible.
                            </AlertDescription>
                        </Alert>
                    )}

                    {isPendingView && (
                        <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-2" />
                            <p>Tu solicitud está siendo revisada por un administrador.</p>
                        </div>
                    )}

                    {/* Form Fields */}
                    {(canRequest || canAuthorize) && (
                        <div className="space-y-2">
                            <Label htmlFor="observaciones">Motivo / Observaciones</Label>
                            <Textarea
                                id="observaciones"
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                placeholder="Indica el motivo de la cancelación..."
                                className="min-h-[100px]"
                            />
                        </div>
                    )}

                    {!canRequest && !canAuthorize && !isPendingView && (
                        <div className="p-4 bg-slate-50 rounded-md border text-sm text-slate-600">
                            <p><strong>Estado Actual:</strong> {estado}</p>
                            <p className="mt-2"><strong>Observaciones:</strong> {order.observaciones || "Sin observaciones"}</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cerrar
                    </Button>

                    {canRequest && (
                        <Button
                            variant="destructive"
                            onClick={() => handleAction('solicitar')}
                            disabled={isLoading || !observaciones.trim()}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enviar Solicitud
                        </Button>
                    )}

                    {canAuthorize && (
                        <>
                            <Button
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                onClick={() => handleAction('no_autorizar')}
                                disabled={isLoading}
                            >
                                <Ban className="mr-2 h-4 w-4" />
                                No Autorizar
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleAction('autorizar')}
                                disabled={isLoading}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Autorizar Cancelación
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
