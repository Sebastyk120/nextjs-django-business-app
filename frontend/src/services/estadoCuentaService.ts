import axiosClient from '../lib/axios';
import { EstadoCuentaResponse, EstadoCuentaParams } from '../types/estadoCuenta';

export const getEstadoCuenta = async (params: EstadoCuentaParams): Promise<EstadoCuentaResponse> => {
    try {
        const response = await axiosClient.get('/comercial/api/estado-cuenta/', {
            params,
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching estado de cuenta:', error);
        throw error;
    }
};
