import axiosClient from './axios';
import { AxiosError } from 'axios';

// API Response interfaces
// API Response interfaces
interface AuthResponse {
    success: boolean;
    message?: string;
    user?: any;
    errors?: any;
    csrfToken?: string;
}

interface LoginResponse extends AuthResponse {
    redirect_url?: string;
}

export const auth = {
    // Ensure CSRF cookie is set (needed for cross-origin in production)
    async ensureCsrf(): Promise<void> {
        try {
            const response = await axiosClient.get<{ csrfToken?: string }>('/autenticacion/api/csrf/');
            if (response.data?.csrfToken && typeof window !== 'undefined') {
                localStorage.setItem('csrfToken', response.data.csrfToken);
            }
        } catch (error) {
            console.warn('Could not ensure CSRF token:', error);
        }
    },

    // Login to Django
    async login(formData: FormData): Promise<LoginResponse> {
        try {
            // Ensure CSRF cookie is set before login attempt
            await this.ensureCsrf();

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
                    sessionStorage.setItem('isAuthenticated', 'true');
                    if (data.user) {
                        sessionStorage.setItem('user', JSON.stringify(data.user));
                    }
                    if (data.csrfToken) {
                        localStorage.setItem('csrfToken', data.csrfToken);
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
                sessionStorage.removeItem('isAuthenticated');
                sessionStorage.removeItem('user');
                localStorage.removeItem('csrfToken');
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
                sessionStorage.removeItem('isAuthenticated');
                sessionStorage.removeItem('user');
                localStorage.removeItem('csrfToken');
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

    // Check if user is authenticated (always validates with server)
    // The /check-auth/ endpoint now also ensures the CSRF cookie is set
    async checkAuth(): Promise<{ authenticated: boolean; user?: any; csrfToken?: string }> {
        try {
            const response = await axiosClient.get<{ authenticated: boolean; user?: any; csrfToken?: string }>(
                '/autenticacion/api/check-auth/'
            );

            const data = response.data;

            // Sync session storage based on server response
            if (typeof window !== 'undefined') {
                if (data.authenticated) {
                    sessionStorage.setItem('isAuthenticated', 'true');
                    if (data.user) {
                        sessionStorage.setItem('user', JSON.stringify(data.user));
                    }
                    if (data.csrfToken) {
                        localStorage.setItem('csrfToken', data.csrfToken);
                    }
                } else {
                    // Server says not authenticated, clear local state
                    sessionStorage.removeItem('isAuthenticated');
                    sessionStorage.removeItem('user');
                }
            }

            return data;
        } catch (error) {
            console.error('Auth check error:', error);
            // On error, clear local state to be safe
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('isAuthenticated');
                sessionStorage.removeItem('user');
            }
            return { authenticated: false };
        }
    },
};

