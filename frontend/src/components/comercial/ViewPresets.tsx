import { Pedido } from "@/types/pedido";

export interface ViewPreset {
    id: string;
    label: string;
    description: string;
    columns: (keyof Pedido)[];
    headers?: Partial<Record<keyof Pedido, string>>;
}

export const VIEW_PRESETS: ViewPreset[] = [
    {
        id: "general",
        label: "Vista General",
        description: "Vista estándar con información básica de pedidos",
        columns: [
            "id", "semana", "cliente", "fecha_entrega", "exportadora", "awb", "destino", "variedades",
            "total_cajas_solicitadas", "numero_factura", "estado_factura", "valor_total_factura_usd",
            "valor_pagado_cliente_usd", "fecha_pago", "estado_pedido", "dias_de_vencimiento"
        ],
        headers: {
            "id": "No.",
            "total_cajas_solicitadas": "Cajas Sol."
        }
    },
    {
        id: "cartera",
        label: "Vista Cartera",
        description: "Enfoque en pagos y vencimientos de facturas",
        columns: [
            "intermediario", "cliente", "exportadora", "awb", "id", "fecha_entrega", "numero_factura",
            "valor_total_factura_usd", "dias_de_vencimiento", "valor_pagado_cliente_usd", "diferencia_por_abono",
            "nota_credito_no", "motivo_nota_credito", "valor_total_nota_credito_usd", "descuento",
            "utilidad_bancaria_usd", "fecha_pago", "estado_factura"
        ],
        headers: {
            "id": "Pedido",
            "fecha_entrega": "Fecha Factura",
            "valor_total_factura_usd": "$Total Factura"
        }
    },
    {
        id: "utilidades",
        label: "Vista Utilidades",
        description: "Análisis financiero y métricas de rentabilidad",
        columns: [
            "id", "fecha_entrega", "cliente", "exportadora", "awb", "fecha_pago", "numero_factura",
            "valor_total_factura_usd", "valor_pagado_cliente_usd", "diferencia_por_abono", "trm_monetizacion",
            "tasa_representativa_usd_diaria", "estado_factura", "total_cajas_enviadas", "valor_total_utilidad_usd",
            "valor_utilidad_pesos", "valor_total_recuperacion_usd", "documento_cobro_utilidad", "fecha_pago_utilidad", "estado_utilidad"
        ],
        headers: {
            "id": "No.",
            "fecha_pago": "Fecha Pago Cliente",
            "valor_total_utilidad_usd": "$Utilidades (USD)",
            "valor_utilidad_pesos": "$Utilidades (Pesos)",
            "documento_cobro_utilidad": "Cobro Utilidad"
        }
    },
    {
        id: "seguimiento",
        label: "Vista Seguimiento Exportaciones",
        description: "Detalle completo de logística y tracking de envíos",
        columns: [
            "semana", "id", "fecha_solicitud", "exportadora", "intermediario", "cliente", "destino",
            "total_cajas_solicitadas", "total_piezas_solicitadas", "total_peso_bruto_solicitado", "fecha_entrega",
            "awb", "aerolinea", "fecha_llegada", "eta", "etd", "agencia_carga", "variedades",
            "total_cajas_enviadas", "total_piezas_enviadas", "total_peso_bruto_enviado", "peso_awb",
            "diferencia_peso_factura_awb", "eta_real", "numero_factura", "termo", "responsable_reserva",
            "estatus_reserva", "estado_documentos", "estado_pedido", "observaciones_tracking"
        ],
        headers: {
            "semana": "Week",
            "id": "Order",
            "fecha_solicitud": "Request Date",
            "exportadora": "Exporter",
            "cliente": "Customer",
            "intermediario": "Intermediary",
            "destino": "Destination",
            "total_cajas_solicitadas": "Requested Boxes",
            "total_piezas_solicitadas": "Requested Pallets",
            "total_peso_bruto_solicitado": "Requested Gross Weight",
            "fecha_entrega": "Date Of Delivery",
            "aerolinea": "Airline",
            "fecha_llegada": "Arrival Date",
            "agencia_carga": "Cargo Agency",
            "variedades": "Products",
            "total_cajas_enviadas": "Shipped Boxes",
            "total_piezas_enviadas": "Total Pallets Shipped",
            "total_peso_bruto_enviado": "Total Gross Weight Shipped",
            "peso_awb": "Weight Awb",
            "numero_factura": "Invoice",
            "termo": "# Termo",
            "responsable_reserva": "Booking Responsible",
            "estado_documentos": "Document Status",
            "estatus_reserva": "Booking Status",
            "estado_pedido": "Order Status",
            "observaciones_tracking": "Comments"
        }
    },
    {
        id: "resumen",
        label: "Vista Resumen Exportaciones",
        description: "Resumen ejecutivo de operaciones de exportación",
        columns: [
            "semana", "id", "exportadora", "cliente", "destino", "variedades",
            "total_cajas_solicitadas", "total_cajas_enviadas", "total_piezas_solicitadas", "fecha_entrega",
            "responsable_reserva", "estatus_reserva", "awb", "aerolinea", "agencia_carga",
            "total_peso_bruto_solicitado", "estado_pedido", "estado_documentos", "observaciones_tracking"
        ],
        headers: {
            "semana": "Week",
            "id": "Order",
            "exportadora": "Exporter",
            "cliente": "Customer",
            "destino": "Destination",
            "variedades": "Products",
            "total_cajas_solicitadas": "Requested Boxes",
            "total_cajas_enviadas": "Shipped Boxes",
            "total_piezas_solicitadas": "Requested Pallets",
            "fecha_entrega": "Date Of Delivery",
            "responsable_reserva": "Booking Responsible",
            "estatus_reserva": "Booking Status",
            "aerolinea": "Airline",
            "agencia_carga": "Cargo Agency",
            "total_peso_bruto_solicitado": "Requested Gross Weight",
            "estado_pedido": "Order Status",
            "estado_documentos": "Document Status",
            "observaciones_tracking": "Comments"
        }
    }
];
