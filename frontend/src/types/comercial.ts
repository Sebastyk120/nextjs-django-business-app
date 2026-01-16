export interface Contenedor {
    id: number;
    nombre: string;
    precio: number | string;
}

export interface Referencia {
    id: number;
    nombre: string;
    referencia_nueva: string | null;
    contenedor: number | null;
    contenedor_nombre?: string;
    cant_contenedor: number | null;
    precio: number | string | null;
    exportador: number;
    exportador_nombre?: string;
    cantidad_pallet_con_contenedor: number | null;
    cantidad_pallet_sin_contenedor: number | null;
    porcentaje_peso_bruto: number | string;
}

export interface PaginatedReferencias {
    count: number;
    next: string | null;
    previous: string | null;
    results: Referencia[];
}

export interface ReferenciasFilters {
    search?: string;
    exportador?: string;
}
