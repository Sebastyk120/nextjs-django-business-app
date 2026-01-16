"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { DateTimePicker } from "@/components/comercial/DateTimePicker";

interface Option {
    id: number;
    nombre: string;
}

interface IataOption {
    id: number;
    codigo: string;
    ciudad: string;
    pais: string;
}

interface NewOrderModalProps {
    onOrderCreated: () => void;
}

export function NewOrderModal({ onOrderCreated }: NewOrderModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        cliente: "",
        intermediario: "",
        fecha_entrega: "",
        exportadora: "",
        subexportadora: "",
        destino: "",
        observaciones: ""
    });

    // Options State
    const [clientes, setClientes] = useState<Option[]>([]);
    const [intermediarios, setIntermediarios] = useState<Option[]>([]);
    const [exportadores, setExportadores] = useState<Option[]>([]);
    const [subexportadoras, setSubexportadoras] = useState<Option[]>([]);
    const [destinos, setDestinos] = useState<IataOption[]>([]);

    useEffect(() => {
        if (open) {
            fetchOptions();
        }
    }, [open]);

    const fetchOptions = async () => {
        try {
            const [cRes, iRes, eRes, sRes, dRes] = await Promise.all([
                axiosClient.get('/comercial/api/clientes/'),
                axiosClient.get('/comercial/api/intermediarios/'),
                axiosClient.get('/comercial/api/exportadores/'),
                axiosClient.get('/comercial/api/subexportadoras/'),
                axiosClient.get('/comercial/api/destinos/')
            ]);

            setClientes(cRes.data.results || cRes.data);
            setIntermediarios(iRes.data.results || iRes.data);
            setExportadores(eRes.data.results || eRes.data);
            setSubexportadoras(sRes.data.results || sRes.data);
            setDestinos(dRes.data.results || dRes.data);
        } catch (error) {
            console.error("Error fetching options:", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Clean empty strings to null for optional fields
            const payload = {
                ...formData,
                intermediario: formData.intermediario || null,
                subexportadora: formData.subexportadora || null,
                destino: formData.destino || null,
                observaciones: formData.observaciones || null
            };

            await axiosClient.post('/comercial/api/pedidos/', payload);
            setOpen(false);
            setFormData({
                cliente: "",
                intermediario: "",
                fecha_entrega: "",
                exportadora: "",
                subexportadora: "",
                destino: "",
                observaciones: ""
            });
            toast.success("Pedido creado exitosamente.");
            onOrderCreated(); // Refresh parent list
        } catch (error) {
            console.error("Error creating order:", error);
            toast.error("Error al crear el pedido. Verifique los datos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Pedido
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Pedido</DialogTitle>
                    <DialogDescription>
                        Complete el formulario para registrar un nuevo pedido de exportación.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cliente">Cliente *</Label>
                            <select
                                id="cliente"
                                name="cliente"
                                required
                                value={formData.cliente}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Seleccione un cliente</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="intermediario">Intermediario</Label>
                            <select
                                id="intermediario"
                                name="intermediario"
                                value={formData.intermediario}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Seleccione un intermediario</option>
                                {intermediarios.map(i => (
                                    <option key={i.id} value={i.id}>{i.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fecha_entrega">Fecha de Entrega *</Label>
                            <DateTimePicker
                                value={formData.fecha_entrega}
                                onChange={(val) => setFormData(prev => ({ ...prev, fecha_entrega: val }))}
                                showTime={false}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="destino">Destino</Label>
                            <select
                                id="destino"
                                name="destino"
                                value={formData.destino}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Seleccione un destino</option>
                                {destinos.map(d => (
                                    <option key={d.id} value={d.id}>{d.codigo} - {d.ciudad}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="exportadora">Exportadora *</Label>
                            <select
                                id="exportadora"
                                name="exportadora"
                                required
                                value={formData.exportadora}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Seleccione exportadora</option>
                                {exportadores.map(e => (
                                    <option key={e.id} value={e.id}>{e.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subexportadora">Subexportadora</Label>
                            <select
                                id="subexportadora"
                                name="subexportadora"
                                value={formData.subexportadora}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Seleccione subexportadora</option>
                                {subexportadoras.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="observaciones">Observaciones</Label>
                        <textarea
                            id="observaciones"
                            name="observaciones"
                            rows={3}
                            value={formData.observaciones}
                            onChange={handleChange}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {loading ? "Creando..." : "Crear Pedido"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
