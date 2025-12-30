import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        // Forward the request to Django with cookies
        const response = await fetch(`${API_URL}/autenticacion/api/check-auth/`, {
            method: 'GET',
            headers: {
                'Cookie': request.headers.get('cookie') || '',
            },
            // Don't follow redirects, handle them manually
            redirect: 'manual',
        });

        // If Django redirects, follow it manually
        if (response.status === 301 || response.status === 302 || response.status === 308) {
            const location = response.headers.get('location');
            if (location) {
                const redirectUrl = location.startsWith('http')
                    ? location
                    : `${API_URL}${location}`;

                const redirectResponse = await fetch(redirectUrl, {
                    method: 'GET',
                    headers: {
                        'Cookie': request.headers.get('cookie') || '',
                    },
                });

                const data = await redirectResponse.json();
                return NextResponse.json(data);
            }
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Check auth error:', error);
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}
