"use strict";

import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CloudSun } from "lucide-react";

interface DashboardHeaderProps {
    userName?: string;
    greeting?: string;
    role?: string;
    companyName?: string;
}

export function DashboardHeader({ userName, greeting = "Hola", role, companyName, logoUrl }: DashboardHeaderProps & { logoUrl?: string }) {
    const today = useMemo(() => {
        return format(new Date(), "EEEE, d 'de' MMMM", { locale: es });
    }, []);

    return (
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <CloudSun className="h-4 w-4" />
                    <span className="capitalize">{today}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-plus-jakarta">
                    {greeting}, <span className="text-gradient-primary">{userName}</span>
                </h1>
                <p className="text-slate-500 max-w-lg text-lg">
                    {companyName ? (
                        <>Panel de gestión para <span className="font-semibold text-slate-700">{companyName}</span></>
                    ) : (
                        "Bienvenido a tu panel de control general."
                    )}
                </p>
            </div>

            <div className="flex flex-col items-end gap-2">
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt={companyName || "Logo"}
                        className="h-16 w-auto object-contain mix-blend-multiply"
                    />
                ) : (
                    role && (
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <div className="text-sm font-semibold text-slate-700">
                                {companyName || role}
                            </div>
                        </div>
                    )
                )}
                {logoUrl && companyName && (
                    <div className="flex items-center gap-1.5 px-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-slate-500">{companyName}</span>
                    </div>
                )}
            </div>
        </header>
    );
}
