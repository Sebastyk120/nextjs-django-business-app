export interface DetallePedido {
    id: number;
    pedido: number;
    fruta: number;
    fruta_nombre: string;
    presentacion: number;
    presentacion_nombre: string;
    cajas_solicitadas: number;
    presentacion_peso: number | null;
    kilos: number; // calculated
    cajas_enviadas: number | null;
    kilos_enviados: number; // calculated
    diferencia: number; // calculated
    tipo_caja: number;
    tipo_caja_nombre: string;
    referencia: number;
    referencia_nombre: string;
    stickers: string | null;
    lleva_contenedor: boolean;
    referencia_contenedor: string | null;
    cantidad_contenedores: number | null;

    // Financials
    tarifa_utilidad: number | null;
    tarifa_recuperacion: number | null;
    valor_x_caja_usd: number | null;
    valor_x_producto: number | null;

    // Credit Note / Utility adjustments
    no_cajas_nc: number | null;
    valor_nota_credito_usd: number | null;
    afecta_utilidad: boolean | null; // true, false, or null (descuento)
    valor_total_utilidad_x_producto: number | null;
    valor_total_recuperacion_x_producto: number | null;
    precio_proforma: number | null;

    observaciones: string | null;

    // Parent Context (from serializer)
    pedido_info: {
        awb: string | null;
        numero_factura: string | null;
        estado_factura: string | null;
    };
}
