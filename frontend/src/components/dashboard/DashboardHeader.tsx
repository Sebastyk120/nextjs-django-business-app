"use client";

import { NavigationMenu } from "@/components/dashboard/NavigationMenu";

import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Home } from "lucide-react";
import { auth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function DashboardHeader() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<{ username: string; email: string; first_name?: string; last_name?: string } | null>(null);

    useEffect(() => {
        setMounted(true);

        // Fetch real user data
        const fetchUser = async () => {
            const authStatus = await auth.checkAuth();
            if (authStatus.authenticated && authStatus.user) {
                setUser(authStatus.user);
            }
        };
        fetchUser();
    }, []);

    const getUserDisplayName = () => {
        if (!user) return "Usuario Heavens";
        if (user.first_name || user.last_name) {
            return `${user.first_name || ''} ${user.last_name || ''}`.trim();
        }
        return user.username || "Usuario";
    };

    const getUserInitials = () => {
        const name = getUserDisplayName();
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const handleLogout = async () => {
        await auth.logout();
        router.push("/");
    };

    // Prevent hydration mismatch by only rendering client-side parts after mounting
    if (!mounted) {
        return (
            <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl">
                <div className="container flex h-16 items-center justify-between px-4 md:px-8">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10" />
                            <div className="h-5 w-32 bg-slate-100 rounded-md" />
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
            <div className="container flex h-16 items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-3">
                    <NavigationMenu />
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20 transition-all duration-300 group-hover:shadow-emerald-500/40 group-hover:scale-105">
                            <Home className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-800 font-plus-jakarta">
                            Heaven&apos;s <span className="text-emerald-600">Connect</span>
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-slate-100 transition-colors">
                                <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                    <AvatarImage src="" alt={getUserDisplayName()} />
                                    <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 font-bold">
                                        {getUserInitials()}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email || "usuario@heavensfruits.com"}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Cerrar Sesión</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
