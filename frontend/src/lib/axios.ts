import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Helper to determine API URL dynamically
const getBaseUrl = () => {
    let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Auto-detect LAN IP for mobile testing
    if (typeof window !== 'undefined') {
        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiIsLocal = url.includes('localhost') || url.includes('127.0.0.1');

        if (!isLocalHost && apiIsLocal) {
            // Assume backend is running on the same machine, standard Django port 8000
            url = `${window.location.protocol}//${window.location.hostname}:8000`;
        }
    }
    return url;
};

// Create axios instance with default config
const axiosClient = axios.create({
    baseURL: getBaseUrl(),
    withCredentials: true, // Important for session-based auth
    headers: {
        'Content-Type': 'application/json',
    },
});

// Function to get CSRF token from cookies
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

// Request interceptor to add CSRF token
axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Add CSRF token for non-GET requests
        if (config.method !== 'get') {
            const csrftoken = getCookie('csrftoken');
            if (csrftoken) {
                config.headers['X-CSRFToken'] = csrftoken;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
axiosClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle CSRF token errors with automatic retry
        if (error.response?.status === 403) {
            const responseData = error.response.data as { detail?: string };
            const errorDetail = responseData?.detail || '';

            // Check if it's a CSRF error and we haven't already retried
            if (errorDetail.toLowerCase().includes('csrf') && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    // Refresh CSRF token
                    await axiosClient.get('/autenticacion/api/csrf/');

                    // Get the new token from cookie
                    const newCsrfToken = getCookie('csrftoken');
                    if (newCsrfToken && originalRequest.headers) {
                        originalRequest.headers['X-CSRFToken'] = newCsrfToken;
                    }

                    // Retry the original request
                    return axiosClient(originalRequest);
                } catch (csrfError) {
                    console.error('Failed to refresh CSRF token:', csrfError);
                }
            } else {
                console.error('Forbidden - You do not have permission');
            }
        }

        // Handle other specific error cases
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    console.error('Unauthorized - Please log in');
                    // Optionally redirect to login
                    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                        // Clear auth state
                        sessionStorage.removeItem('isAuthenticated');
                        sessionStorage.removeItem('user');
                    }
                    break;
                case 404:
                    console.error('Not Found - Resource does not exist');
                    break;
                case 500:
                    console.error('Server Error - Please try again later');
                    break;
            }
        } else if (error.request) {
            console.error('Network Error - No response from server');
        } else {
            console.error('Error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default axiosClient;

// Helper function for API calls with better error handling
export async function apiRequest<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    data?: any,
    config?: any
): Promise<T> {
    try {
        const response = await axiosClient.request<T>({
            method,
            url,
            data,
            ...config,
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // Extract error message from response
            const message =
                error.response?.data?.message ||
                error.response?.data?.detail ||
                error.message ||
                'An error occurred';
            throw new Error(message);
        }
        throw error;
    }
}
