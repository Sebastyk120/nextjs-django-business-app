import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function GET() {
    try {
        const res = await fetch(`${API_URL}/autenticacion/api/get_captcha/`, {
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(`Django API error: ${res.status}`);
        }

        const data = await res.json();

        // Ensure image URL is absolute
        const imageUrl = data.image_url.startsWith('http')
            ? data.image_url
            : `${API_URL}${data.image_url}`;

        return NextResponse.json({ ...data, image_url: imageUrl });
    } catch (error: any) {
        console.error("Error fetching captcha:", error);
        return NextResponse.json({
            error: "Failed to fetch captcha",
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
