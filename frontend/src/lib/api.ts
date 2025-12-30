const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchFromDjango(endpoint: string) {
    try {
        const res = await fetch(`${API_URL}/${endpoint}`);
        if (!res.ok) {
            throw new Error(`API call failed: ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error('Error fetching from Django:', error);
        throw error;
    }
}
