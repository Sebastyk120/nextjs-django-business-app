export interface ProveedorNacional {
    id: number;
    nombre: string;
    nit?: string;
}

export interface Empaque {
    id: number;
    nombre: string;
    peso: number;
}

export interface ReporteCalidadProveedor {
    rep_cal_exp: number; // PK is OneToOne with ReporteExportador
    p_fecha_reporte: string;
    p_kg_totales: number | null;
    p_kg_exportacion: number | null;
    p_porcentaje_exportacion: number;
    p_precio_kg_exp: number;
    p_kg_nacional: number | null;
    p_porcentaje_nacional: number;
    p_precio_kg_nal: number;
    p_kg_merma: number;
    p_porcentaje_merma: number;
    p_total_facturar: number;
    asohofrucol: number;
    rte_fte: number;
    rte_ica: number;
    p_total_pagar: number;
    monto_pendiente: number;
    p_utilidad: number;
    p_utilidad_sin_ajuste: number | null;
    diferencia_utilidad: number | null;
    p_porcentaje_utilidad: number;
    estado_reporte_prov: string;
    completado: boolean;
    factura_prov?: string;
    reporte_enviado: boolean;
    reporte_pago: boolean;
    observaciones?: string;
}

export interface ReporteCalidadExportador {
    venta_nacional: number; // PK is OneToOne with VentaNacional
    remision_exp?: string;
    fecha_reporte: string;
    kg_totales: number;
    kg_exportacion: number;
    porcentaje_exportacion: number;
    precio_venta_kg_exp: number;
    kg_nacional: number;
    porcentaje_nacional: number;
    precio_venta_kg_nal: number;
    kg_merma?: number;
    porcentaje_merma?: number;
    precio_total: number;
    factura?: string;
    fecha_factura?: string;
    vencimiento_factura?: string;
    estado_reporte_exp: string;
    reportecalidadproveedor?: ReporteCalidadProveedor;
}

export interface VentaNacional {
    id: number; // PK
    compra_nacional: number;
    exportador: number;
    exportador_nombre: string;
    fecha_llegada: string;
    fecha_vencimiento: string;
    cantidad_empaque_recibida?: number;
    peso_bruto_recibido: number;
    peso_neto_recibido: number;
    diferencia_peso?: number;
    diferencia_empaque?: number;
    estado_venta: string;
    observaciones?: string;
    tipo?: string;
    lote?: string;
    reportecalidadexportador?: ReporteCalidadExportador;
}

export interface CompraNacional {
    id: number;
    proveedor: number;
    proveedor_nombre: string;
    origen_compra: string;
    fruta: number;
    fruta_nombre: string;
    peso_compra: number;
    fecha_compra: string;
    numero_guia: string;
    remision?: string;
    precio_compra_exp: number;
    precio_compra_nal?: number;
    tipo_empaque: number;
    tipo_empaque_nombre: string;
    tipo_empaque_peso: number;
    cantidad_empaque: number;
    observaciones?: string;

    // Nested
    ventas?: VentaNacional[];

    // Computed helpers from Serializer
    porcentaje_completitud: number;
    progreso_color: string;

    estado_venta?: string;
    estado_reporte_exp?: string;
    estado_facturacion_exp?: string;
    estado_reporte_prov?: string;
    remision_exp?: string;

    // Proveedor tax settings
    proveedor_asohofrucol?: boolean;
    proveedor_rte_fte?: boolean;
    proveedor_rte_ica?: boolean;
}

export interface CompraNacionalResponse {
    results: CompraNacional[];
    count: number;
    next: string | null;
    previous: string | null;
}

export interface ReporteVencido {
    id: number;
    numero_guia: string;
    fecha_llegada: string;
    fecha_vencimiento: string;
    fruta: string;
    origen: string;
    peso_bruto_recibido: number;
    peso_neto_recibido: number;
    cantidad_empaque_recibida: number;
    tipo_empaque: string;
    dias_vencidos: number;
}

export interface Exportador {
    id: number;
    nombre: string;
}

export interface ReportesVencidosResponse {
    exportador: Exportador;
    reportes_vencidos: ReporteVencido[];
    total_reportes: number;
    fecha_actual: string;
}

export interface FacturaAgrupadaItem {
    id: number;
    remision_exp: string;
    numero_guia: string;
    fecha_reporte: string;
    fruta: string;
    valor_exp: number;
    valor_nal: number;
    precio_total: number;
}

export interface FacturaAgrupada {
    factura: string;
    fecha_factura: string | null;
    vencimiento_factura: string | null;
    exportador: string;
    items: FacturaAgrupadaItem[];
    subtotal: number;
}

export interface ReportesAsociadosResponse {
    facturas: FacturaAgrupada[];
    total_a_pagar: number;
    criterio_busqueda: string | null;
    fecha_actual: string;
}

export interface AutocompleteItem {
    value: string;
    label: string;
}

export interface GuiaAutocompleteItem extends AutocompleteItem { }

export interface ReporteIndividualResponse {
    proveedor: {
        id: number;
        nombre: string;
        nit: string;
        ciudad: string;
    };
    compra: {
        id: number;
        numero_guia: string;
        fruta_nombre: string;
        fecha_compra: string | null;
    };
    venta: {
        fecha_llegada: string | null;
    };
    reporte_proveedor: {
        pk: number;
        p_kg_totales: number;
        p_kg_exportacion: number;
        p_porcentaje_exportacion: number;
        p_precio_kg_exp: number;
        p_kg_nacional: number;
        p_porcentaje_nacional: number;
        p_precio_kg_nal: number;
        p_kg_merma: number;
        p_porcentaje_merma: number;
        p_total_facturar: number;
        asohofrucol: number;
        rte_fte: number;
        rte_ica: number;
        p_total_pagar: number;
    };
    today: string;
}

export interface EstadoCuentaProveedorFilters {
    fecha_inicio: string | null;
    fecha_fin: string | null;
    fruta_id: number | null;
}

export interface CompraProveedorItem {
    id: number;
    fecha_compra: string;
    numero_guia: string;
    fruta_nombre: string;
    peso_compra: number;
    precio_compra_exp: number | null;
    precio_compra_nal: number | null;
    porcentaje_completitud: number;
    total_pagar: number | null;
    utilidad: number | null;
    utilidad_sin_ajuste: number | null;
    diferencia_utilidad: number | null;
}

export interface TransferenciaProveedorItem {
    id: number;
    fecha_transferencia: string;
    valor_transferencia: number;
    origen_transferencia: string;
    referencia?: string;
    banco_origen?: string;
}

export interface EstadoCuentaProveedorResponse {
    proveedor: {
        id: number;
        nombre: string;
        nit: string;
    };
    proveedores: { id: number; nombre: string; nit: string | null }[];
    total_compras_valor: number;
    total_kilos: number;
    total_transferido: number;
    saldo_pendiente: number;
    total_utilidad: number;
    compras: CompraProveedorItem[];
    transferencias: TransferenciaProveedorItem[];
    fecha_inicio: string | null;
    fecha_fin: string | null;
    es_primera_carga: boolean;
    valor_consignar?: number;
}

export interface ReporteResumenPendiente {
    compra_guia: string;
    compra_fecha: string;
    p_fecha_reporte: string;
    p_kg_totales: number;
    p_porcentaje_exportacion: number;
    p_porcentaje_nacional: number;
    p_total_pagar: number;
    monto_pendiente: number;
}

export interface ReporteResumenPagado {
    compra_guia: string;
    compra_fecha: string;
    p_fecha_reporte: string;
    p_kg_totales: number;
    p_porcentaje_exportacion: number;
    p_porcentaje_nacional: number;
    p_total_pagar: number;
}

export interface ReporteSinFactura {
    compra_guia: string;
    compra_fecha: string;
    p_fecha_reporte: string;
    p_total_facturar: number;
}

export interface CompraProceso {
    numero_guia: string;
    fecha_compra: string;
    fecha_reporte: string | null;
    peso_recibido: number | null;
    estado: string;
}

export interface ResumenReportesResponse {
    proveedor: {
        id: number;
        nombre: string;
        nit: string;
    };
    reportes_pendientes: ReporteResumenPendiente[];
    reportes_pagados: ReporteResumenPagado[];
    reportes_sin_factura: ReporteSinFactura[];
    compras_proceso: CompraProceso[];
    transferencias: TransferenciaProveedorItem[];
    total_pendientes: number;
    monto_pendiente_total: number;
    total_sin_factura: number;
    saldo_disponible: number;
    saldo_actual: number;
    valor_consignar: number;
    fecha_actual?: string;
}



