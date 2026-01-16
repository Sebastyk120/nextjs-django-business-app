export interface Pedido {
    id: number;
    cliente: number | string; // ID or name depending on API
    cliente_nombre?: string; // Optional expanded field
    intermediario?: number | string | null;
    semana?: string | null;
    fecha_solicitud: string;
    fecha_entrega: string;
    fecha_llegada?: string | null;
    exportadora: number | string;
    exportadora_nombre?: string;
    subexportadora?: number | string | null;
    subexportadora_nombre?: string;
    dias_cartera?: number | null;
    awb?: string | null;
    destino?: number | string | null;
    destino_nombre?: string;
    intermediario_nombre?: string;
    numero_factura?: string | null;

    // Totals
    total_cajas_solicitadas?: number | null;
    total_cajas_enviadas?: number | null;
    total_peso_bruto_solicitado: number;
    total_peso_bruto_enviado: number;
    total_piezas_solicitadas?: number | null;
    total_piezas_enviadas?: number | null;

    // Financials
    nota_credito_no?: string | null;
    motivo_nota_credito?: string | null;
    descuento?: number | null; // Decimal
    valor_total_nota_credito_usd?: number | null;
    tasa_representativa_usd_diaria?: number | null;
    trm_cotizacion?: number | null;
    valor_pagado_cliente_usd?: number | null;
    utilidad_bancaria_usd?: number | null;
    fecha_pago?: string | null;
    fecha_monetizacion?: string | null;
    trm_monetizacion?: number | null;
    estado_factura?: string | null;
    diferencia_por_abono?: number | null;
    dias_de_vencimiento?: number | null;
    valor_total_factura_usd?: number | null;
    valor_total_utilidad_usd?: number | null;
    valor_total_recuperacion_usd?: number | null;
    valor_utilidad_pesos?: number | null;
    documento_cobro_utilidad?: string | null;
    fecha_pago_utilidad?: string | null;
    estado_utilidad: string;

    // Status
    estado_pedido?: string | null;
    estado_cancelacion: 'sin_solicitud' | 'pendiente' | 'autorizado' | 'no_autorizado';
    observaciones?: string | null;

    // Tracking
    variedades?: string | null;
    responsable_reserva?: number | string | null;
    estatus_reserva?: string | null;
    agencia_carga?: number | string | null;
    aerolinea?: number | string | null;
    etd?: string | null; // DateTime
    eta?: string | null; // DateTime
    peso_awb?: number | null;
    estado_documentos?: string | null;
    observaciones_tracking?: string | null;
    eta_real?: string | null;
    diferencia_peso_factura_awb?: number | null;
    termo?: string | null;

    // Computed/Display properties
    color_vencimiento?: string; // 'green' | 'red'
}

export interface PedidoListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Pedido[];
}

export interface PedidoFilters {
    search?: string;
    awb?: string;
    pedido_id?: string;
    intermediario?: string;
    cliente?: string;
    numero_factura?: string;
    estado_pedido?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    exportadora?: string;
    semana?: string;
}
