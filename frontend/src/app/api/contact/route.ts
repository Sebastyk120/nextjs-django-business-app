import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const res = await fetch(`${API_URL}/autenticacion/api/contact_submit/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        // The endpoint is likely under /autenticacion/api/... or simply /api/...?
        // Looking at urls.py: path('api/contact_submit/', ...) is inside urlpatterns of autenticacion.
        // And mysite/urls.py includes autenticacion.urls under 'autenticacion/'.
        // So full path is /autenticacion/api/contact_submit/

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error sending contact form:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
