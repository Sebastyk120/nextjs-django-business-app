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
