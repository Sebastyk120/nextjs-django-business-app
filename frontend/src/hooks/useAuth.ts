import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

interface UseAuthOptions {
    middleware?: 'auth' | 'guest';
    redirectIfAuthenticated?: string;
}

export const useAuth = ({ middleware, redirectIfAuthenticated }: UseAuthOptions = {}) => {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const { authenticated, user } = await auth.checkAuth();

                if (authenticated) {
                    setUser(user);
                }

                if (middleware === 'guest' && authenticated && redirectIfAuthenticated) {
                    router.push(redirectIfAuthenticated);
                }

                if (middleware === 'auth' && !authenticated) {
                    router.push('/login');
                }
            } catch (error) {
                if (middleware === 'auth') {
                    router.push('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, [middleware, redirectIfAuthenticated, router]);

    const logout = async () => {
        await auth.logout();
        setUser(null);
        router.push('/');
    };

    return {
        user,
        isLoading,
        logout
    };
};
