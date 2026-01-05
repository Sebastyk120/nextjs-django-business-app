import axiosClient from './axios';
import { AxiosError } from 'axios';

// API Response interfaces
interface AuthResponse {
    success: boolean;
    message?: string;
    user?: any;
    errors?: any;
}

interface LoginResponse extends AuthResponse {
    redirect_url?: string;
}

export const auth = {
    // Login to Django
    async login(formData: FormData): Promise<LoginResponse> {
        try {
            const response = await axiosClient.post<LoginResponse>(
                '/autenticacion/api/login/',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            const data = response.data;

            if (data.success) {
                // Save auth state
                if (typeof window !== 'undefined') {
                    localStorage.setItem('isAuthenticated', 'true');
                    if (data.user) {
                        localStorage.setItem('user', JSON.stringify(data.user));
                    }
                }
            }

            return data;
        } catch (error) {
            const axiosError = error as AxiosError<AuthResponse>;
            console.error('Login error:', error);
            return {
                success: false,
                message: axiosError.response?.data?.message || 'Error de conexión',
            };
        }
    },

    // Logout from Django
    async logout(): Promise<AuthResponse> {
        try {
            // Clear local storage first
            if (typeof window !== 'undefined') {
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('user');
            }

            const response = await axiosClient.post<AuthResponse>(
                '/autenticacion/api/logout/'
            );

            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<AuthResponse>;
            console.error('Logout error:', error);

            // Even if server request fails, clear local state
            if (typeof window !== 'undefined') {
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('user');
            }

            return {
                success: false,
                message: axiosError.response?.data?.message || 'Error al cerrar sesión',
            };
        }
    },

    // Request password reset
    async requestPasswordReset(email: string): Promise<AuthResponse> {
        try {
            const formData = new FormData();
            formData.append('email', email);

            const response = await axiosClient.post<AuthResponse>(
                '/autenticacion/api/password-reset/',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<AuthResponse>;
            return {
                success: false,
                message: axiosError.response?.data?.message || 'Ocurrió un error al procesar la solicitud',
            };
        }
    },

    // Check if user is authenticated
    async checkAuth(): Promise<{ authenticated: boolean; user?: any }> {
        // First check local storage for immediate feedback
        if (typeof window !== 'undefined') {
            const isAuth = localStorage.getItem('isAuthenticated') === 'true';
            if (isAuth) {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                return { authenticated: true, user };
            }
        }

        // Fallback to server check (call Django directly, not Next.js API route)
        try {
            const response = await axiosClient.get<{ authenticated: boolean; user?: any }>(
                '/autenticacion/api/check-auth/'
            );

            const data = response.data;

            // Sync local storage if server says authenticated
            if (data.authenticated && typeof window !== 'undefined') {
                localStorage.setItem('isAuthenticated', 'true');
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
            }

            return data;
        } catch (error) {
            console.error('Auth check error:', error);
            return { authenticated: false };
        }
    },
};

