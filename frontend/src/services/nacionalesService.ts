import axiosClient from "@/lib/axios";
import { ResumenReportesResponse, EstadoCuentaProveedorResponse, ProveedorNacional, ReporteIndividualResponse, GuiaAutocompleteItem } from "@/types/nacionales";

export const getNacionalesResumenReportes = async (proveedorId: number): Promise<ResumenReportesResponse> => {
    const { data } = await axiosClient.get<ResumenReportesResponse>(`/nacionales/api/proveedores/${proveedorId}/resumen_reportes/`);
    return data;
};

export interface EstadoCuentaProveedorParams {
    fecha_inicio?: string;
    fecha_fin?: string;
    fruta_id?: string;
}

export const getEstadoCuentaProveedor = async (
    proveedorId: number,
    params?: EstadoCuentaProveedorParams
): Promise<EstadoCuentaProveedorResponse> => {
    const { data } = await axiosClient.get<EstadoCuentaProveedorResponse>(
        `/nacionales/api/proveedores/${proveedorId}/estado_cuenta/`,
        { params }
    );
    return data;
};

export const getProveedores = async (): Promise<ProveedorNacional[]> => {
    const { data } = await axiosClient.get<ProveedorNacional[]>('/nacionales/api/proveedores/');
    return data;
};

export const getReporteIndividual = async (numeroGuia: string): Promise<ReporteIndividualResponse> => {
    const { data } = await axiosClient.get<ReporteIndividualResponse>(
        `/nacionales/api/reporte-individual/`,
        { params: { numero_guia: numeroGuia } }
    );
    return data;
};

export const getGuiasAutocomplete = async (query: string): Promise<GuiaAutocompleteItem[]> => {
    const { data } = await axiosClient.get<{ guias: GuiaAutocompleteItem[] }>(
        `/nacionales/api/guias/autocomplete/`,
        { params: { q: query } }
    );
    return data.guias;
};
