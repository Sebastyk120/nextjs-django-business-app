export interface Inventario {
    id: number;
    numero_item: number;
    numero_item_nombre: string;
    exportador_nombre: string;
    compras_efectivas: number;
    saldos_iniciales: number;
    salidas: number;
    traslado_propio: number;
    traslado_remisionado: number;
    ventas: number;
    venta_contenedor: number;
    stock_actual: number;
}

export interface Item {
    id: number;
    numero_item: number;
    numero_item_nombre: string;
    cantidad_cajas: number;
    tipo_documento: string;
    tipo_documento_display: string;
    documento: string;
    bodega: number;
    bodega_nombre: string;
    proveedor: number;
    proveedor_nombre: string;
    fecha_movimiento: string;
    propiedad: number;
    propiedad_nombre: string;
    observaciones: string | null;
    user: number;
    user_username: string;
}

export interface Movimiento {
    id: number;
    item_historico: string;
    cantidad_cajas_h: number;
    bodega: number;
    bodega_nombre: string;
    propiedad: string;
    fecha_movimiento: string;
    observaciones: string | null;
    fecha: string;
    user: number;
    user_username: string;
}

export interface Bodega {
    id: number;
    nombre: string;
    exportador: number;
    exportador_nombre: string;
}

export interface Proveedor {
    id: number;
    nombre: string;
}

export interface Referencia {
    id: number;
    nombre: string;
    exportador: number;
    exportador_nombre: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface InventarioFilters {
    search?: string;
    exportador?: string;
    stockStatus?: "low" | "out";
}

export interface ItemFilters {
    search?: string;
    exportador?: string;
}
