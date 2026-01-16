export interface EstadoCuentaFilters {
    clientes: { id: number; nombre: string; negociaciones_cartera: number; direccion: string; tax_id: string; destino_iata__pais?: string }[];
    exportadoras: { id: number; nombre: string }[];
    fecha_inicial: string;
    fecha_final: string;
    grupo_usuario: string | null;
}

export interface EstadoCuentaKPIs {
    total_facturado: number;
    total_pagado: number;
    total_utilidad: number;
    total_notas_credito: number;
    total_descuentos: number;
    saldo_pendiente: number;
    total_facturas_vencidas: number;
}

export interface EstadoCuentaInvoice {
    id: number;
    numero_factura: string;
    awb: string;
    fecha_entrega: string | null;
    fecha_esperada_pago: string | null;
    exportadora: string;
    valor_total_factura_usd: number;
    valor_pagado_cliente_usd: number;
    valor_total_nota_credito_usd: number;
    descuento: number;
    utilidad_bancaria_usd: number;
    saldo: number;
    estado_texto: string;
    estado_factura: string;
}

export interface ClientInfo {
    id: number;
    nombre: string;
    direccion: string;
    tax_id: string;
    pais: string;
    dias_cartera: number;
}

export interface EstadoCuentaData {
    cliente_info: ClientInfo;
    kpis: EstadoCuentaKPIs;
    charts: {
        pagos_trend: {
            fecha_pago: string;
            monto: number;
            dias_pago: number;
            dias_cartera: number;
        }[];
        por_exportadora: { name: string; value: number }[];
        cartera_status: { name: string; value: number; color: string }[];
    };
    facturas: EstadoCuentaInvoice[];
    facturas_proximas: {
        numero_factura: string;
        valor_total_factura_usd: number;
        dias_restantes: number;
        saldo: number;
    }[];
}

export interface EstadoCuentaResponse {
    filters: EstadoCuentaFilters;
    data?: EstadoCuentaData; // Optional because it's only present if a client is selected
    error?: string;
}

export interface EstadoCuentaParams {
    cliente?: string;
    fecha_inicial?: string;
    fecha_final?: string;
    grupo?: string;
}
