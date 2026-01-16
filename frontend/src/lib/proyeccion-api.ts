import axiosClient from "./axios";
import { ProyeccionFilters, ProyeccionResponse } from "@/types/proyeccion";

export const proyeccionApi = {
    getProyeccion: async (filters: Partial<ProyeccionFilters>) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value.toString());
        });

        const response = await axiosClient.get<ProyeccionResponse>(`/comercial/api/proyeccion-ventas-v2/?${params.toString()}`);
        return response.data;
    },

    exportExcel: async (filters: Partial<ProyeccionFilters>) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                params.append(key, value.toString());
            }
        });

        params.append('export', 'excel');

        return axiosClient.get(`/comercial/api/proyeccion-ventas-v2/?${params.toString()}`, {
            responseType: 'blob'
        });
    }
};
