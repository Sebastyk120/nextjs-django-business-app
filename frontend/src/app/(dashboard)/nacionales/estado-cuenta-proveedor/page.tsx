"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Search, Wallet } from "lucide-react";
import { getProveedores } from "@/services/nacionalesService";
import { ProveedorNacional } from "@/types/nacionales";

export default function EstadoCuentaProveedorIndexPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [proveedores, setProveedores] = useState<ProveedorNacional[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchProveedores = async () => {
            try {
                setLoading(true);
                const data = await getProveedores();
                setProveedores(data);
            } catch (error) {
                console.error("Error fetching proveedores:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProveedores();
    }, []);

    const filteredProveedores = proveedores.filter((p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleProveedorClick = (proveedorId: number) => {
        router.push(`/nacionales/estado-cuenta-proveedor/${proveedorId}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-plus-jakarta flex items-center gap-3">
                        <Wallet className="h-8 w-8 text-indigo-600" />
                        Estado de Cuenta Proveedor
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Seleccione un proveedor para ver su estado de cuenta
                    </p>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm bg-white/80 backdrop-blur">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Buscar proveedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProveedores.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                        <Users className="h-12 w-12 mb-4 opacity-50" />
                        <p>No se encontraron proveedores</p>
                    </div>
                ) : (
                    filteredProveedores.map((proveedor) => (
                        <Card
                            key={proveedor.id}
                            className="border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer group"
                            onClick={() => handleProveedorClick(proveedor.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                            {proveedor.nombre}
                                        </h3>
                                        {proveedor.nit && (
                                            <p className="text-sm text-slate-500 mt-1">
                                                NIT: {proveedor.nit}
                                            </p>
                                        )}
                                    </div>
                                    <div className="p-2 rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                        <Users className="h-4 w-4" />
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full mt-3 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                >
                                    Ver Estado de Cuenta
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
