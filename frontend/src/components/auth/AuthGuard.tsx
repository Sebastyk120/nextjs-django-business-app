"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const verifyAuth = async () => {
            // Clean up old localStorage data (migration)
            if (typeof window !== 'undefined') {
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('user');
            }

            // Quick check using sessionStorage for improved UX
            const localAuth = typeof window !== 'undefined' && sessionStorage.getItem('isAuthenticated') === 'true';

            // Always verify with server to ensure session is still valid
            const authStatus = await auth.checkAuth();

            if (!authStatus.authenticated) {
                // Clear local state if server says not authenticated
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('isAuthenticated');
                    sessionStorage.removeItem('user');
                }
                router.push("/login");
                return;
            }

            // If we are here, server confirmed authentication
            setIsAuthorized(true);
            setIsLoading(false);
        };

        verifyAuth();
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    <p className="text-sm font-medium text-slate-600">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return <>{children}</>;
}
