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
    rep_cal_exp: number; // OneToOne primary key -> Maps to ReporteCalidadExportador ID
    p_fecha_reporte: string;
    p_kg_totales?: number;
    p_kg_exportacion?: number;
    p_porcentaje_exportacion: number;
    p_precio_kg_exp: number;
    p_kg_nacional?: number;
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
    p_utilidad_sin_ajuste?: number;
    diferencia_utilidad?: number;
    p_porcentaje_utilidad: number;
    reporte_enviado: boolean;
    factura_prov?: string;
    reporte_pago: boolean;
    estado_reporte_prov: string;
    completado: boolean;
}

export interface ReporteCalidadExportador {
    venta_nacional: number; // OneToOne primary key -> Maps to VentaNacional ID
    remision_exp?: string;
    fecha_reporte: string;
    kg_totales: number;
    kg_exportacion: number;
    porcentaje_exportacion: number;
    precio_venta_kg_exp: number;
    kg_nacional: number;
    porcentaje_nacional: number;
    precio_venta_kg_nal: number;
    kg_merma: number;
    porcentaje_merma: number;
    precio_total: number;
    factura?: string;
    fecha_factura?: string;
    vencimiento_factura?: string;
    estado_reporte_exp: string;

    // Nested
    reportecalidadproveedor?: ReporteCalidadProveedor;
}

export interface VentaNacional {
    compra_nacional: number; // OneToOne primary key -> Maps to CompraNacional ID
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

    // Nested
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
    precio_compra_nal?: number; // ReadOnly
    tipo_empaque: number;
    tipo_empaque_nombre: string;
    tipo_empaque_peso?: number;
    cantidad_empaque: number;
    observaciones?: string;

    // Proveedor tax settings (for ReporteProveedor)
    proveedor_asohofrucol?: boolean;
    proveedor_rte_fte?: boolean;
    proveedor_rte_ica?: boolean;

    // Nested
    ventanacional?: VentaNacional;

    // Computed/Helpers
    porcentaje_completitud: number;
    progreso_color: string;
    estado_venta?: string;
    estado_reporte_exp?: string;
    estado_facturacion_exp?: string;
    estado_reporte_prov?: string;
    remision_exp?: string;
}

export interface CompraNacionalListItem extends CompraNacional {
    // Specifically for list view if needed, but CompraNacional covers it based on serializer
}

export interface ResumenReporteProveedor extends ReporteCalidadProveedor {
    compra_guia: string;
    compra_fecha: string;
    peso_recibido?: number;
}

export interface CompraProceso {
    numero_guia: string;
    fecha_compra: string;
    peso_recibido?: number;
    fecha_reporte?: string;
    estado: string;
}

export interface TransferenciaProveedor {
    id: number;
    proveedor: number;
    proveedor_nombre: string;
    fecha_transferencia: string;
    valor_transferencia: number;
    banco_origen: string;
    origen_transferencia?: string;
    referencia?: string;
    observaciones?: string;
}

export interface ResumenReportesResponse {
    proveedor: ProveedorNacional;
    reportes_pendientes: ResumenReporteProveedor[];
    reportes_pagados: ResumenReporteProveedor[];
    reportes_sin_factura: ResumenReporteProveedor[];
    compras_proceso: CompraProceso[];
    transferencias: TransferenciaProveedor[];
    
    total_pendientes: number;
    monto_pendiente_total: number;
    total_sin_factura: number;
    saldo_disponible: number;
    saldo_actual: number;
    total_por_pagar: number;
    total_pagado: number;
    total_utilidad: number;
    valor_consignar: number;
}

export interface EstadoCuentaProveedorFilters {
    fecha_inicio: string | null;
    fecha_fin: string | null;
    fruta_id: string | null;
}

export interface EstadoCuentaCompra {
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

export interface EstadoCuentaTransferencia {
    id: number;
    fecha_transferencia: string;
    valor_transferencia: number;
    origen_transferencia: string | null;
}

export interface EstadoCuentaProveedorResponse {
    proveedor: ProveedorNacional;
    proveedores: ProveedorNacional[];
    total_compras_valor: number;
    total_kilos: number;
    total_transferido: number;
    saldo_pendiente: number;
    total_utilidad: number;
    compras: EstadoCuentaCompra[];
    transferencias: EstadoCuentaTransferencia[];
    fecha_inicio: string | null;
    fecha_fin: string | null;
    es_primera_carga: boolean;
}

export interface ReporteIndividualProveedor {
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
}

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
        fecha_compra: string;
    };
    venta: {
        fecha_llegada: string;
    };
    reporte_proveedor: ReporteIndividualProveedor;
    today: string;
}

export interface GuiaAutocompleteItem {
    value: string;
    label: string;
}
