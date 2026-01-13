import { z } from "zod";

export const orderSchemas = {
    // 1. Base Edit (Logistics)
    base: z.object({
        cliente: z.coerce.number().min(1, "Requerido"),
        intermediario: z.coerce.number().nullable().optional(),
        fecha_entrega: z.string().min(1, "Requerido"),
        exportadora: z.coerce.number().min(1, "Requerido"),
        subexportadora: z.coerce.number().nullable().optional(),
        destino: z.coerce.number().min(1, "Requerido"),

        // Editable
        awb: z.string().max(12, "Máximo 12 caracteres").nullable().optional(),
        numero_factura: z.string().max(50).nullable().optional(),
        descuento: z.coerce.number().min(0).nullable().optional(),
        observaciones: z.string().nullable().optional(),
    }),

    // 2. Cartera (Wallet)
    cartera: z.object({
        nota_credito_no: z.string().max(50).nullable().optional(),
        motivo_nota_credito: z.string().nullable().optional(),
        observaciones: z.string().nullable().optional(),
    }),

    // 3. Utilidades (Utilities)
    utilidades: z.object({
        documento_cobro_utilidad: z.string().nullable().optional(),
        fecha_pago_utilidad: z.string().nullable().optional(), // Date string YYYY-MM-DD
        observaciones: z.string().nullable().optional(),

        // Readonly in form but potentially present
        nota_credito_no: z.string().nullable().optional(),
        motivo_nota_credito: z.string().nullable().optional(),
    }),

    // 4. Seguimiento (Tracking)
    seguimiento: z.object({
        // Although fecha_llegada is editable in form, it might need date validation
        fecha_llegada: z.string().nullable().optional(),
        responsable_reserva: z.coerce.number().nullable().optional(),
        estatus_reserva: z.string().nullable().optional(),
        agencia_carga: z.coerce.number().nullable().optional(), // ID
        etd: z.string().nullable().optional(), // DateTime
        eta: z.string().nullable().optional(), // DateTime
        peso_awb: z.coerce.number().nullable().optional(),
        eta_real: z.string().nullable().optional(), // DateTime
        termo: z.string().nullable().optional(),
        estado_documentos: z.string().nullable().optional(),
        observaciones_tracking: z.string().nullable().optional(),
    }),

    // 5. Exportador (Limited View)
    exportador: z.object({
        valor_pagado_cliente_usd: z.coerce.number().nullable().optional(),
        utilidad_bancaria_usd: z.coerce.number().nullable().optional(),
        fecha_pago: z.string().nullable().optional(),
        fecha_monetizacion: z.string().nullable().optional(),
        trm_monetizacion: z.coerce.number().nullable().optional(),
        trm_cotizacion: z.coerce.number().nullable().optional(),
    })
};

export type OrderFormValues = z.infer<typeof orderSchemas.base> & z.infer<typeof orderSchemas.cartera> & z.infer<typeof orderSchemas.utilidades> & z.infer<typeof orderSchemas.seguimiento> & z.infer<typeof orderSchemas.exportador>;
