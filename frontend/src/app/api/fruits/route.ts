import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function GET() {
    try {
        const res = await fetch(`${API_URL}/autenticacion/api/fruits/`, {
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(`Django API error: ${res.status}`);
        }

        const data = await res.json();

        // Transform image URLs to be absolute if they are relative
        const fruits = data.map((fruit: any) => ({
            ...fruit,
            imagen: fruit.imagen ? (fruit.imagen.startsWith('http') ? fruit.imagen : `${API_URL}${fruit.imagen}`) : null
        }));

        return NextResponse.json(fruits);
    } catch (error: any) {
        console.error("Error fetching fruits:", error);
        return NextResponse.json({
            error: "Failed to fetch fruits",
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
