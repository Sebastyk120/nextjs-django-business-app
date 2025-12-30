import { fetchFromDjango } from './api';

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

// Get CSRF token from cookie
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

export const auth = {
    // Login to Django
    // Login to Django
    async login(formData: FormData): Promise<LoginResponse> {
        try {
            const csrftoken = getCookie('csrftoken');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            const response = await fetch(`${API_URL}/autenticacion/api/login/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken || '',
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al iniciar sesión');
            }

            const data = await response.json();

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
        } catch (error: any) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message || 'Error de conexión'
            };
        }
    },

    // Logout from Django
    async logout(): Promise<AuthResponse> {
        try {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('user');
            }

            const csrftoken = getCookie('csrftoken');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            const response = await fetch(`${API_URL}/autenticacion/api/logout/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken || '',
                },
            });

            if (response.redirected) {
                window.location.href = response.url;
                return { success: true };
            }

            return await response.json();
        } catch (error: any) {
            console.error('Logout error:', error);
            // Even if server request fails, clear local state
            if (typeof window !== 'undefined') {
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('user');
            }
            return { success: false, message: error.message };
        }
    },

    // Request password reset
    async requestPasswordReset(email: string): Promise<AuthResponse> {
        // ... (existing implementation)
        try {
            const csrftoken = getCookie('csrftoken');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            const formData = new FormData();
            formData.append('email', email);

            const response = await fetch(`${API_URL}/autenticacion/api/password-reset/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken || '',
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al solicitar restablecimiento');
            }

            return await response.json();
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Ocurrió un error al procesar la solicitud'
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

        // Fallback to server check (using the new API route)
        try {
            const response = await fetch('/api/check-auth', {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                return { authenticated: false };
            }

            const data = await response.json();

            // Sync local storage if server says authenticated
            if (data.authenticated && typeof window !== 'undefined') {
                localStorage.setItem('isAuthenticated', 'true');
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
            }

            return data;
        } catch (error: any) {
            console.error('Auth check error:', error);
            return { authenticated: false };
        }
    }
};
