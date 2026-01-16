export interface TarifaFruta {
    id: number;
    fruta: string;
    fruta_id: number;
    exportadora: string;
    exportadora_id: number;
    precio_kilo: number;
    fecha: string; // YYYY-MM-DD
    precio_anterior: number | null;
}

export interface ComparisonRate {
    exportador: string;
    precio: number;
    trend: 'up' | 'down' | 'neutral' | 'new';
}

export interface ComparisonStats {
    min: number;
    max: number;
    avg: number;
}

export interface FruitComparison {
    fruta: string;
    rates: ComparisonRate[];
    stats: ComparisonStats;
}

export interface Option {
    id: number;
    nombre: string;
}

export interface TarifasFrutasOptions {
    frutas: Option[];
    exportadores: Option[];
}

export interface TarifaFrutaForm {
    fruta: number;
    exportadora: number;
    precio_kilo: number;
}
