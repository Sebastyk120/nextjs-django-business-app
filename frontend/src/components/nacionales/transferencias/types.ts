export interface Transferencia {
    id: number;
    proveedor: number;
    proveedor_nombre?: string;
    fecha_transferencia: string;
    valor_transferencia: string | number;
    origen_transferencia: string;
    observaciones: string;
    referencia?: string;
}

export interface Proveedor {
    id: number;
    nombre: string;
}

export interface TransferenciaFormData {
    proveedor: string;
    fecha_transferencia: string;
    valor_transferencia: string;
    origen_transferencia: string;
    observaciones?: string;
}

export const ORIGEN_OPTIONS = [
    'Alianza',
    'Mabelly Diaz',
    'Pedro Diaz Melo',
    'Valentina Garay',
    'HEAVENS CO'
];
