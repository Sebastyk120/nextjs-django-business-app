"use client";

import { useEffect, useState } from "react";
import axiosClient from "@/lib/axios";
import { HomeDashboardData } from "@/types/home-dashboard";
import { DashboardHeader } from "@/components/home/DashboardHeader";
import { HeavensHomeView } from "@/components/home/HeavensHomeView";
import { ExporterHomeView } from "@/components/home/ExporterHomeView";
import { CancellationNotifications } from "@/components/dashboard/CancellationNotifications";
import { toast } from "sonner";

export default function HomePage() {
    const [data, setData] = useState<HomeDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await axiosClient.get<HomeDashboardData>('/comercial/api/home-dashboard/');
                setData(response.data);
            } catch (error) {
                console.error("Error loading home dashboard:", error);
                toast.error("No se pudo cargar la información del dashboard.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="h-12 w-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
                    <p className="text-slate-500 font-medium">Cargando tu experiencia Heavens...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen dashboard-background p-6 md:p-10 font-outfit">
            <CancellationNotifications />

            <div className="max-w-[1800px] mx-auto space-y-10">
                <DashboardHeader
                    userName={data.user_name}
                    greeting={data.greeting}
                    role={data.role}
                    companyName={data.company_name}
                    logoUrl={data.logo}
                />

                {data.is_heavens ? (
                    <HeavensHomeView data={data} />
                ) : (
                    <ExporterHomeView data={data} />
                )}
            </div>
        </div>
    );
}
