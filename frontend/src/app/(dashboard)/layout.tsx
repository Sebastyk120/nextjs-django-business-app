import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";

import { AuthGuard } from "@/components/auth/AuthGuard";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard>
            <div className="flex min-h-screen flex-col dashboard-background font-outfit">
                <DashboardHeader />
                <main className="flex-1 flex flex-col relative z-0">
                    {children}
                </main>
                <DashboardFooter />
            </div>
        </AuthGuard>
    )
}
