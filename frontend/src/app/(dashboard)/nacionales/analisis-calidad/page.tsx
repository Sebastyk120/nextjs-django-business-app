import { QualityDashboard } from "@/components/nacionales/quality/QualityDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Análisis de Calidad | Nacionales",
    description: "Dashboard de análisis de calidad para compras nacionales",
};

export default function QualityAnalysisPage() {
    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                    Análisis de Calidad
                </h1>
                <p className="text-muted-foreground mt-2">
                    Visualiza el comportamiento de calidad, precios y merma de tus proveedores.
                </p>
            </div>

            <QualityDashboard />
        </div>
    );
}
