"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { PedidoFilters } from "@/types/pedido";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { DateTimePicker } from "@/components/comercial/DateTimePicker";

interface OrdersFiltersProps {
    filters: PedidoFilters;
    onFiltersChange: (filters: PedidoFilters) => void;
    onClearFilters: () => void;
    clients: { id: number, nombre: string }[];
    intermediaries: { id: number, nombre: string }[];
    exportadoras: { id: number, nombre: string }[];
    weeks: { id: string, label: string }[];
    activePreset?: string | null;
}

export function OrdersFilters({
    filters,
    onFiltersChange,
    onClearFilters,
    clients,
    intermediaries,
    exportadoras,
    weeks,
    activePreset
}: OrdersFiltersProps) {
    const handleChange = (key: keyof PedidoFilters, value: string) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    return (
        <div className="flex flex-col gap-4 p-4 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {/* Inputs de Texto - Primero */}
                <Input
                    placeholder="N° Factura"
                    value={filters.numero_factura || ""}
                    onChange={(e) => handleChange("numero_factura", e.target.value)}
                    className="bg-white"
                />

                <Input
                    placeholder="Guía AWB"
                    value={filters.awb || ""}
                    onChange={(e) => handleChange("awb", e.target.value)}
                    className="bg-white"
                />

                <Input
                    placeholder="No. Pedido"
                    value={filters.pedido_id || ""}
                    onChange={(e) => handleChange("pedido_id", e.target.value)}
                    className="bg-white"
                />

                {/* Rango de Fechas */}
                <div className="flex items-center gap-2 col-span-1 md:col-span-2">
                    <div className="flex-1">
                        <DateTimePicker
                            value={filters.fecha_desde}
                            onChange={(val) => handleChange("fecha_desde", val)}
                            showTime={false}
                            label="Desde entrega"
                        />
                    </div>
                    <span className="text-muted-foreground text-xs uppercase font-bold">A</span>
                    <div className="flex-1">
                        <DateTimePicker
                            value={filters.fecha_hasta}
                            onChange={(val) => handleChange("fecha_hasta", val)}
                            showTime={false}
                            label="Hasta entrega"
                        />
                    </div>
                </div>

                {/* Dropdowns - Segundo */}
                <select
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={filters.cliente || ""}
                    onChange={(e) => handleChange("cliente", e.target.value)}
                >
                    <option value="">Cliente (Todos)</option>
                    {clients.map(c => (
                        <option key={c.id} value={c.nombre}>{c.nombre}</option>
                    ))}
                </select>

                <select
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={filters.intermediario || ""}
                    onChange={(e) => handleChange("intermediario", e.target.value)}
                >
                    <option value="">Intermediario (Todos)</option>
                    {intermediaries.map(i => (
                        <option key={i.id} value={i.nombre}>{i.nombre}</option>
                    ))}
                </select>

                <select
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={filters.estado_pedido || ""}
                    onChange={(e) => handleChange("estado_pedido", e.target.value)}
                >
                    <option value="">Estado (Todos)</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Despachado">Despachado</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Cancelado">Cancelado</option>
                    <option value="Reprogramado">Reprogramado</option>
                </select>

                <select
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={filters.exportadora || ""}
                    onChange={(e) => handleChange("exportadora", e.target.value)}
                >
                    <option value="">Exportadora (Todas)</option>
                    {exportadoras.map(e => (
                        <option key={e.id} value={e.nombre}>{e.nombre}</option>
                    ))}
                </select>

                <select
                    className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activePreset === 'resumen' && !filters.semana ? 'border-rose-400 bg-rose-50' : 'border-input bg-white'
                        }`}
                    value={filters.semana || ""}
                    onChange={(e) => handleChange("semana", e.target.value)}
                >
                    <option value="">Semana (Todas)</option>
                    {weeks.map(w => (
                        <option key={w.id} value={w.id}>{w.label}</option>
                    ))}
                </select>

                <div className="xl:col-start-5 flex justify-end">
                    <Button
                        variant="ghost"
                        onClick={onClearFilters}
                        className="h-10 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Limpiar Filtros
                    </Button>
                </div>
            </div>
        </div>
    );
}
