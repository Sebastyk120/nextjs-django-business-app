'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">

                {/* Logo wrapper */}
                <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 bg-blue-100/50 rounded-full animate-pulse blur-xl" />
                    <div className="relative bg-white rounded-full w-32 h-32 flex items-center justify-center p-4 shadow-sm border border-slate-100">
                        <Image
                            src="/img/heavens.webp"
                            alt="Heavens Logo"
                            width={100}
                            height={100}
                            className="object-contain w-full h-full"
                            priority
                        />
                    </div>
                    {/* Small status indicator */}
                    <div className="absolute bottom-0 right-0 bg-amber-100 p-2 rounded-full border-4 border-white shadow-sm z-10">
                        <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-3">
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">404</h1>
                    <h2 className="text-xl font-semibold text-slate-700">Página no encontrada</h2>

                    <div className="text-slate-500 leading-relaxed text-sm pt-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <p>
                            Hemos actualizado nuestra plataforma recientemente.
                        </p>
                        <p className="mt-2 font-medium text-slate-700">
                            Es posible que algunas rutas hayan cambiado.
                        </p>
                        <p className="mt-2 text-xs text-slate-400 italic">
                            (Por favor actualiza tus marcadores y accesos directos)
                        </p>
                    </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                    <Link href="/home">
                        <Button className="w-full h-12 text-base font-medium gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5 text-white" size="lg">
                            <Home className="w-5 h-5" />
                            Volver al Inicio
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <p className="mt-8 text-xs font-medium text-slate-400 opacity-60">
                Heavens Fruit System
            </p>
        </div>
    );
}
