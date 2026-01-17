"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Menu,
    ChevronDown,
    ChevronRight,
    ShoppingBag,
    Wallet,
    DollarSign,
    BarChart3,
    LayoutDashboard,
    History,
    Database,
    Box,
    Truck,
    Briefcase,
    Users,
    Settings,
    LogOut,
    FileText
} from "lucide-react";
import { auth } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface MenuItem {
    title: string;
    icon: React.ElementType;
    href?: string;
    submenu?: { title: string; href: string }[];
}

const MENU_ITEMS: { section?: string; items: MenuItem[] }[] = [
    {
        section: "COMERCIAL",
        items: [
            {
                title: "Pedidos",
                icon: ShoppingBag,
                submenu: [
                    { title: "General (Heavens)", href: "/pedidos" },
                    { title: "Etnico", href: "/pedidos?exportadora=Etnico" },
                    { title: "Fieldex", href: "/pedidos?exportadora=Fieldex" },
                    { title: "Juan Matas", href: "/pedidos?exportadora=Juan_Matas" },
                    { title: "CI Dorado", href: "/pedidos?exportadora=CI_Dorado" },
                ],
            },

            {
                title: "Cartera",
                icon: Wallet,
                submenu: [
                    { title: "Estado de Cuenta Clientes", href: "/comercial/estado-cuenta" },
                ],
            },
            {
                title: "Costos y Tarifas",
                icon: DollarSign, // Reusing icon or finding better one
                submenu: [
                    { title: "Cotización Conjunta", href: "/costos/cotizacion-conjunta" },
                    { title: "Historial Cotizaciones", href: "/costos/historial" },
                    { title: "Tarifas Aéreas", href: "/comercial/tarifas-aereas" },
                    { title: "Gestión Precios Fruta", href: "/comercial/tarifas-frutas" },
                    { title: "Costos Estibado", href: "https://api.heavensfruit.com/admin/comercial/costosestibado/" },
                    { title: "Insumos", href: "https://api.heavensfruit.com/admin/comercial/insumo/" },
                    { title: "Cliente Presentación", href: "https://api.heavensfruit.com/admin/comercial/clientepresentacion/" },
                ],
            },

            {
                title: "Proyección Ventas (Todas las Exp.)",
                icon: BarChart3,
                href: "/proyeccion-ventas",
            },
            {
                title: "Dashboard Comercial (Todas las Exp.)",
                icon: LayoutDashboard,
                href: "/dashboard-comercial",
            },
        ],
    },
    {
        section: "INVENTARIOS",
        items: [
            {
                title: "Gestión de Inventario (Todas las Exp.)",
                icon: Box,
                href: "/inventarios",
            },
            {
                title: "Historico Movimientos (Todas las Exp.)",
                icon: History,
                href: "/historicos",
            },
            {
                title: "Referencias (Todas las Exp.)",
                icon: Database,
                href: "/referencias",
            },
        ],
    },
    {
        section: "NACIONALES",
        items: [
            {
                title: "Dashboard Nacionales",
                icon: LayoutDashboard,
                href: "/dashboard-nacionales",
            },
            {
                title: "Análisis de Calidad",
                icon: BarChart3,
                href: "/nacionales/analisis-calidad",
            },
            {
                title: "Operaciones Generales",
                icon: Settings,
                submenu: [
                    { title: "Listado General", href: "/nacionales/general" },
                    { title: "Nacionales Detallada", href: "/nacionales-detallada" },
                ],
            },
            {
                title: "Operaciones Exportador",
                icon: Briefcase,
                submenu: [
                    { title: "Relación Reportes Vencidos", href: "/nacionales/reportes-vencidos" },
                    { title: "Reportes Asociados", href: "/nacionales/reportes-asociados" },
                ],
            },
            {
                title: "Operaciones Proveedores",
                icon: Users,
                submenu: [
                    { title: "Transferencias Proveedores", href: "/transferencias-nacionales" },
                    { title: "Resumen Reportes Proveedor", href: "/nacionales/resumen-reportes-proveedores" },
                    { title: "Estado de Cuenta Proveedor", href: "/nacionales/estado-cuenta-proveedor" },
                    { title: "Reporte Individual", href: "/nacionales/reporte-individual" },
                ],
            },
        ],
    },
];

const NavItem = ({ item, onItemClick }: { item: MenuItem; onItemClick?: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const isActive = item.href ? pathname === item.href : false;
    const isSubActive = item.submenu?.some((sub) => pathname === sub.href);

    if (item.submenu) {
        return (
            <div className="space-y-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        (isOpen || isSubActive) && "bg-accent/50 text-accent-foreground"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                    </div>
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>
                {isOpen && (
                    <div className="ml-4 space-y-1 border-l pl-4">
                        {item.submenu.map((subItem) => (
                            <Link
                                key={subItem.href}
                                href={subItem.href}
                                onClick={onItemClick}
                                className={cn(
                                    "block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                                    pathname === subItem.href
                                        ? "bg-accent text-accent-foreground font-medium"
                                        : "text-muted-foreground"
                                )}
                            >
                                {subItem.title}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            href={item.href || "#"}
            onClick={onItemClick}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
        >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
        </Link>
    );
};

export function NavigationMenu() {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const handleLogout = async () => {
        await auth.logout();
        router.push("/");
    };

    const closeMenu = () => setOpen(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
                    <Menu className="h-4 w-4" />
                    <span className="hidden md:inline">Menú</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
                <SheetHeader className="p-6 border-b bg-gradient-to-br from-emerald-50 to-white">
                    <SheetTitle className="text-left flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                            H
                        </div>
                        <span className="font-plus-jakarta">Heavens Co</span>
                    </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-140px)]">
                    <div className="flex flex-col gap-6 p-6">
                        <div className="space-y-1">
                            <Link
                                href="/home"
                                onClick={closeMenu}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-emerald-700",
                                )}
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                <span>Menú Principal</span>
                            </Link>
                        </div>

                        {MENU_ITEMS.map((section) => (
                            <div key={section.section} className="space-y-3">
                                {section.section && (
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 font-plus-jakarta">
                                        {section.section}
                                    </h4>
                                )}
                                <div className="space-y-1">
                                    {section.items.map((item) => (
                                        <NavItem key={item.title} item={item} onItemClick={closeMenu} />
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="space-y-3 pt-6 border-t">
                            <div className="space-y-1">
                                <Link
                                    href="https://api.heavensfruit.com/admin"
                                    onClick={closeMenu}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                                >
                                    <Settings className="h-4 w-4" />
                                    <span>Administración General</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        closeMenu();
                                        handleLogout();
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-red-50 hover:text-red-600 text-muted-foreground"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
