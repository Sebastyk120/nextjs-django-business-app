/**
 * Types for Tarifas Aéreas (Air Freight Rates)
 */

export interface TarifaAerea {
    id: number;
    aerolinea: string;
    aerolinea_id: number;
    destino: string;
    destino_ciudad: string;
    destino_id: number;
    tarifa_por_kilo: number | string;
    fecha: string;
    es_activa: boolean;
}

export interface TarifaAereaForm {
    aerolinea: number;
    destino: number;
    tarifa_por_kilo: number;
    es_activa: boolean;
}

export interface DestinationRate {
    aerolinea: string;
    tarifa: number | string;
}

export interface DestinationComparison {
    destino: string;
    rates: DestinationRate[];
}

export interface AerolineaOption {
    id: number;
    codigo: string;
    nombre: string;
}

export interface DestinoOption {
    id: number;
    codigo: string;
    ciudad: string;
}

export interface TarifasFormOptions {
    aerolineas: AerolineaOption[];
    destinos: DestinoOption[];
}
