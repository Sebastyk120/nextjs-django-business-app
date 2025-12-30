"use client";

import { Company } from "@/types/companies";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompanyPortalProps {
    company: Company;
    onBack: () => void;
}

export function CompanyPortal({ company, onBack }: CompanyPortalProps) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        <span>Volver a Empresas</span>
                    </button>

                    <div className="flex items-center gap-6">
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-soft-lg p-3 bg-white border border-slate-100">
                            <Image
                                src={company.logo}
                                alt={company.name}
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div>
                            <h2 className="text-4xl font-bold text-slate-900 tracking-tight font-plus-jakarta">
                                {company.name}
                            </h2>
                            <p className="text-lg text-slate-500 font-medium">
                                {company.description}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="hidden md:block">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-400">
                        <LayoutGrid className="h-4 w-4" />
                        <span className="text-sm font-medium uppercase tracking-widest">{company.menuItems.length} Módulos</span>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {company.menuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={index}
                            href={item.href}
                            className="group relative flex flex-col items-start p-6 rounded-2xl transition-all duration-300 bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 overflow-hidden"
                        >
                            {/* Decorative background pattern */}
                            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-24 h-24 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 text-slate-500 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all duration-300 mb-4">
                                <Icon className="h-7 w-7" />
                            </div>

                            <div className="relative z-10 flex flex-col gap-1 w-full">
                                <div className="flex items-center justify-between w-full">
                                    <span className="font-bold text-slate-800 group-hover:text-emerald-950 font-plus-jakarta text-lg transition-colors leading-tight">
                                        {item.label}
                                    </span>
                                    <ChevronRight className="h-5 w-5 text-slate-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-emerald-500 transition-all duration-300" />
                                </div>
                                <span className="text-xs text-slate-400 font-medium tracking-wide">
                                    Módulo de Gestión
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Footer decoration */}
            <div className="pt-10 flex justify-center">
                <div className="h-px w-32 bg-slate-100" />
            </div>
        </div>
    );
}
