'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosClient from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, Search, Users } from 'lucide-react';
import { ProveedorNacional } from '@/types/nacionales';

export default function ResumenReportesProveedoresPage() {
  const router = useRouter();
  const [proveedores, setProveedores] = useState<ProveedorNacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get('/nacionales/api/proveedores/');
        setProveedores(response.data);
      } catch (error) {
        console.error('Error fetching proveedores:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProveedores();
  }, []);

  const filteredProveedores = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.nit && p.nit.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-plus-jakarta flex items-center gap-3">
          <FileText className="h-8 w-8 text-emerald-600" />
          Resumen de Reportes por Proveedor
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Seleccione un proveedor para ver su estado de cuenta y resumen de reportes.
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Buscar Proveedor</CardTitle>
          <CardDescription>Busque por nombre o NIT</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Proveedores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProveedores.map((proveedor) => (
          <Card
            key={proveedor.id}
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => router.push(`/nacionales/resumen-reportes/${proveedor.id}`)}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <span className="group-hover:text-emerald-600 transition-colors">
                    {proveedor.nombre}
                  </span>
                </div>
              </CardTitle>
              {proveedor.nit && (
                <CardDescription>NIT: {proveedor.nit}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/nacionales/resumen-reportes/${proveedor.id}`);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Resumen
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProveedores.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No se encontraron proveedores
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Intente con un término de búsqueda diferente
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
