"use client";

import { useState } from "react";
import { CompanyCard } from "@/components/dashboard/CompanyCard";
import { Company } from "@/types/companies";
import {
    TrendingUp,
    ShoppingBag,
    Store,
    Globe,
    HandCoins,
    Wallet,
    FileText,
    History,
    Plane,
    Tags,
    Package,
    Box,
    Users,
    PlaneTakeoff,
    Bookmark,
    ClipboardList,
    Boxes,
    Database,
    Building,
    UsersRound,
    Truck,
    Contact,
    ShoppingCart,
    Ban,
} from "lucide-react";

// Company Data Definition with Icons
const COMPANIES: Company[] = [
    {
        id: "heavens",
        name: "Heaven's",
        description: "Gestión comercial y proyecciones estratégicas",
        logo: "/img/heavens.webp",
        menuItems: [
            { label: "Proyección Ventas (Todas las Exp.)", icon: TrendingUp, href: "#" },
            { label: "Dashboard Comercial (Todas las Exp.)", icon: ShoppingBag, href: "#" },
            { label: "Dashboard Compras Nacionales", icon: Store, href: "#" },
            { label: "Pedidos General", icon: Globe, href: "#" },

            { label: "Estado Cuenta Clientes", icon: Wallet, href: "#" },
            { label: "Cotización Conjunta", icon: FileText, href: "#" },
            { label: "Historial Cotizaciones", icon: History, href: "#" },
            { label: "Tarifas Aéreas", icon: Plane, href: "#" },
            { label: "Gestión Precios Fruta", icon: Tags, href: "#" },
            { label: "Costos Estibado", icon: Package, href: "#" },
            { label: "Insumos", icon: Box, href: "#" },
            { label: "Cliente Presentación", icon: Users, href: "#" },
            { label: "Seguimiento Pedidos", icon: PlaneTakeoff, href: "#" },
            { label: "Resumen Semanal Pedidos", icon: Bookmark, href: "#" },
            { label: "Histórico De Movimientos (Todas las Exp.)", icon: ClipboardList, href: "#" },
        ],
    },
    {
        id: "etnico",
        name: "Etnico",
        description: "Pedidos, inventario y cartera de clientes",
        logo: "/img/etnico.webp",
        menuItems: [
            { label: "Pedidos", icon: ShoppingBag, href: "#" },

            { label: "Estado Cuenta Clientes", icon: Wallet, href: "#" },
            { label: "Stock Inventario Bodega (Todas las Exp.)", icon: Boxes, href: "#" },
            { label: "Movimientos Inventario (Todas las Exp.)", icon: Database, href: "#" },
            { label: "Referencia De Cajas (Todas las Exp.)", icon: Box, href: "#" },
            { label: "Administración", icon: Building, href: "#" },
        ],
    },
    {
        id: "fieldex",
        name: "Fieldex",
        description: "Soluciones logísticas y de inventario",
        logo: "/img/fieldex.webp",
        menuItems: [
            { label: "Pedidos", icon: ShoppingBag, href: "#" },

            { label: "Estado Cuenta Clientes", icon: Wallet, href: "#" },
            { label: "Stock Inventario Bodega (Todas las Exp.)", icon: Boxes, href: "#" },
            { label: "Movimientos Inventario (Todas las Exp.)", icon: Database, href: "#" },
            { label: "Referencia De Cajas (Todas las Exp.)", icon: Box, href: "#" },
            { label: "Administración", icon: Building, href: "#" },
        ],
    },
    {
        id: "juanmatas",
        name: "Juan Matas",
        description: "Gestión especializada de productos",
        logo: "/img/juan_matas.webp",
        menuItems: [
            { label: "Pedidos", icon: ShoppingBag, href: "#" },

            { label: "Estado Cuenta Clientes", icon: Wallet, href: "#" },
            { label: "Stock Inventario Bodega (Todas las Exp.)", icon: Boxes, href: "#" },
            { label: "Movimientos Inventario (Todas las Exp.)", icon: Database, href: "#" },
            { label: "Referencia De Cajas (Todas las Exp.)", icon: Box, href: "#" },
            { label: "Administración", icon: Building, href: "#" },
        ],
    },
    {
        id: "cidorado",
        name: "CI Dorado",
        description: "Comercio internacional y operaciones",
        logo: "/img/ci_dorado.webp",
        menuItems: [
            { label: "Pedidos", icon: ShoppingBag, href: "#" },

            { label: "Estado Cuenta Clientes", icon: Wallet, href: "#" },
            { label: "Stock Inventario Bodega (Gral.)", icon: Boxes, href: "#" },
            { label: "Movimientos Inventario (Gral.)", icon: Database, href: "#" },
            { label: "Referencia De Cajas (Gral.)", icon: Box, href: "#" },
            { label: "Administración", icon: Building, href: "#" },
        ],
    },
    {
        id: "admin",
        name: "Admin",
        description: "Panel de administración del sistema",
        logo: "/img/admin.webp",
        menuItems: [
            { label: "Histórico De Cambios", icon: History, href: "#" },
            { label: "Grupos", icon: UsersRound, href: "#" },
            { label: "Usuarios", icon: Users, href: "#" },
            { label: "Areolineas", icon: Plane, href: "#" },
            { label: "Agencias De Carga", icon: Truck, href: "#" },
            { label: "Clientes", icon: Contact, href: "#" },
            { label: "Pedidos", icon: ShoppingCart, href: "#" },
            { label: "Cancelaciones", icon: Ban, href: "#" },
        ],
    },
];

import { CompanyPortal } from "@/components/dashboard/CompanyPortal";
import { CancellationNotifications } from "@/components/dashboard/CancellationNotifications";

export default function HomePage() {
    const [view, setView] = useState<'companies' | 'portal'>('companies');
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    const handleCompanyClick = (company: Company) => {
        // First set the company
        setSelectedCompany(company);
        // Then switch view
        setView('portal');
        // Scroll to top for a clean transition
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToCompanies = () => {
        setView('companies');
        // Small delay to clear company data after transition
        setTimeout(() => setSelectedCompany(null), 500);
    };

    return (
        <div className="container px-4 py-8 mx-auto">
            <CancellationNotifications />
            {view === 'companies' ? (
                <div className="space-y-12 animate-in fade-in duration-500">
                    {/* Hero Section */}
                    <section className="text-center space-y-6 pt-10 pb-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-semibold tracking-wide uppercase">Sistema Activo</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-800 font-plus-jakarta leading-tight">
                            Bienvenido a <span className="text-gradient-primary">Heaven&apos;s Connect</span>
                        </h1>

                        <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium">
                            Selecciona una de nuestras compañías para gestionar sus operaciones y acceder a los módulos de control.
                        </p>
                    </section>

                    {/* Companies Grid */}
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                        {COMPANIES.map((company, index) => (
                            <div
                                key={company.id}
                                className="animate-in fade-in zoom-in duration-500"
                                style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
                            >
                                <CompanyCard
                                    company={company}
                                    onClick={handleCompanyClick}
                                    className="h-full cursor-pointer"
                                />
                            </div>
                        ))}
                    </section>
                </div>
            ) : (
                selectedCompany && (
                    <CompanyPortal
                        company={selectedCompany}
                        onBack={handleBackToCompanies}
                    />
                )
            )}
        </div>
    );
}
