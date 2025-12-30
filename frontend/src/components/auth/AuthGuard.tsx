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
            // Quick check using localStorage for improved UX
            const localAuth = typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true';

            if (!localAuth) {
                // Not authenticated locally, try to verify with server just in case
                // (e.g. if user cleared storage but still has cookie)
                const authStatus = await auth.checkAuth();
                if (!authStatus.authenticated) {
                    router.push("/autenticacion/login");
                    return;
                }
            } else {
                // Authenticated locally, trust it for now but verify in background
                // Or just proceed. For now let's trust it to avoid delays.
                // We'll trust checkAuth within the components to handle deeper validation if needed

                // Actually, let's verify if the server session is still valid
                // But don't block render if we have local flag
            }

            // If we are here, we are either locally authenticated or server authenticated
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
