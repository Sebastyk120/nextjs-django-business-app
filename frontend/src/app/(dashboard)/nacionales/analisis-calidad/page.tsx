import { QualityDashboard } from "@/components/nacionales/quality/QualityDashboard";
import { ClipboardCheck } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Análisis de Calidad | Nacionales",
    description: "Dashboard de análisis de calidad para compras nacionales",
};

export default function QualityAnalysisPage() {
    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-plus-jakarta flex items-center gap-3">
                    <ClipboardCheck className="h-8 w-8 text-emerald-600" />
                    Análisis de Calidad
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Visualiza el comportamiento de calidad, precios y merma de tus proveedores.
                </p>
            </div>

            <QualityDashboard />
        </div>
    );
}
