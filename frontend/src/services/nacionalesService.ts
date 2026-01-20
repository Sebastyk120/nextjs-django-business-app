import axiosClient from "@/lib/axios";
import { CompraNacional, CompraNacionalResponse } from "@/types/nacionales";

interface CompraParams {
    page?: number;
    pageSize?: number;
    search?: string;
    completed?: boolean;
}

const nacionalesService = {
    getComprasNacionales: async (params?: CompraParams): Promise<CompraNacionalResponse | CompraNacional[]> => {
        const queryParams = new URLSearchParams();

        if (params?.page) {
            queryParams.append("page", params.page.toString());
        }
        if (params?.pageSize) {
            queryParams.append("page_size", params.pageSize.toString());
        }
        if (params?.search) {
            queryParams.append("search", params.search);
        }
        if (params?.completed) {
            queryParams.append("completed", "true");
        }

        const response = await axiosClient.get<CompraNacionalResponse | CompraNacional[]>(`/nacionales/api/compra/?${queryParams.toString()}`);
        return response.data;
    },

    getIncompletas: async () => {
        const response = await axiosClient.get<CompraNacional[]>(`/nacionales/api/compra/incompletas/`);
        return response.data;
    },

    getCompraById: async (id: number) => {
        const response = await axiosClient.get<CompraNacional>(`/nacionales/api/compra/${id}/`);
        return response.data;
    },

    getQualityDashboardData: async (params?: Record<string, any>) => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (value instanceof Date) {
                        queryParams.append(key, value.toISOString().split('T')[0]);
                    } else {
                        queryParams.append(key, value.toString());
                    }
                }
            });
        }
        const response = await axiosClient.get<import("@/types/quality-dashboard").QualityDashboardResponse>(`/nacionales/api/dashboard/calidad/?${queryParams.toString()}`);
        return response.data;
    },

    getQualityOptions: async () => {
        const response = await axiosClient.get<{
            proveedores: { id: number, nombre: string }[];
            exportadores: { id: number, nombre: string }[];
            frutas: { id: number, nombre: string }[];
        }>(`/nacionales/api/dashboard/options/`);
        return response.data;
    },

    exportQualityExcel: async (params?: Record<string, any>) => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '' && value !== 'all') {
                    if (value instanceof Date) {
                        queryParams.append(key, value.toISOString().split('T')[0]);
                    } else {
                        queryParams.append(key, value.toString());
                    }
                }
            });
        }
        const response = await axiosClient.get(`/nacionales/exportar-excel-analisis-calidad/?${queryParams.toString()}`, {
            responseType: 'blob'
        });
        return response.data;
    }
};

export interface ExportadorListItem {
    id: number;
    nombre: string;
}

export const getExportadores = async (): Promise<ExportadorListItem[]> => {
    const response = await axiosClient.get<ExportadorListItem[]>('/comercial/api/exportadores/');
    return response.data;
};

export const getReportesVencidos = async (exportadorId: number): Promise<import("@/types/nacionales").ReportesVencidosResponse> => {
    const response = await axiosClient.get<import("@/types/nacionales").ReportesVencidosResponse>(`/nacionales/api/reportes-vencidos/?exportador=${exportadorId}`);
    return response.data;
};

export interface ReportesAsociadosParams {
    factura?: string;
    numero_guia?: string;
    remision?: string;
}

export const getReportesAsociados = async (params: ReportesAsociadosParams): Promise<import("@/types/nacionales").ReportesAsociadosResponse> => {
    const response = await axiosClient.get<import("@/types/nacionales").ReportesAsociadosResponse>('/nacionales/api/reportes-asociados/', { params });
    return response.data;
};

export const getGuiasAutocomplete = async (query: string): Promise<import("@/types/nacionales").GuiaAutocompleteItem[]> => {
    const response = await axiosClient.get<{ guias: import("@/types/nacionales").GuiaAutocompleteItem[] }>('/nacionales/api/guias/autocomplete/', { params: { q: query } });
    return response.data.guias;
};

export const getFacturasAutocomplete = async (query: string): Promise<import("@/types/nacionales").AutocompleteItem[]> => {
    const response = await axiosClient.get<{ facturas: import("@/types/nacionales").AutocompleteItem[] }>('/nacionales/api/facturas/autocomplete/', { params: { q: query } });
    return response.data.facturas;
};

export const getRemisionesAutocomplete = async (query: string): Promise<import("@/types/nacionales").AutocompleteItem[]> => {
    const response = await axiosClient.get<{ remisiones: import("@/types/nacionales").AutocompleteItem[] }>('/nacionales/api/remisiones/autocomplete/', { params: { q: query } });
    return response.data.remisiones;
};

export const getReporteIndividual = async (numeroGuia: string): Promise<import("@/types/nacionales").ReporteIndividualResponse> => {
    const response = await axiosClient.get<import("@/types/nacionales").ReporteIndividualResponse>('/nacionales/api/reporte-individual/', { params: { numero_guia: numeroGuia } });
    return response.data;
};

export const getProveedores = async (): Promise<import("@/types/nacionales").ProveedorNacional[]> => {
    const response = await axiosClient.get<import("@/types/nacionales").ProveedorNacional[]>('/nacionales/api/proveedores/');
    return response.data;
};

export interface EstadoCuentaProveedorParams {
    fecha_inicio?: string;
    fecha_fin?: string;
    fruta_id?: number;
}

export const getEstadoCuentaProveedor = async (id: number, params: EstadoCuentaProveedorParams): Promise<import("@/types/nacionales").EstadoCuentaProveedorResponse> => {
    const response = await axiosClient.get<import("@/types/nacionales").EstadoCuentaProveedorResponse>(`/nacionales/api/proveedores/${id}/estado_cuenta/`, { params });
    return response.data;
};

export const getNacionalesResumenReportes = async (id: number): Promise<import("@/types/nacionales").ResumenReportesResponse> => {
    const response = await axiosClient.get<import("@/types/nacionales").ResumenReportesResponse>(`/nacionales/api/proveedores/${id}/resumen_reportes/`);
    return response.data;
};

// Exporting individual functions as named exports for backward compatibility
export const getComprasNacionales = nacionalesService.getComprasNacionales;
export const getIncompletas = nacionalesService.getIncompletas;
export const getCompraById = nacionalesService.getCompraById;
export const getQualityDashboardData = nacionalesService.getQualityDashboardData;
export const getQualityOptions = nacionalesService.getQualityOptions;

export default nacionalesService;



