import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Apple, Info, AlertCircle } from 'lucide-react';
import { SeasonalClient, SeasonalFruit } from '@/types/proyeccion';

interface SeasonalityPanelProps {
    seasonalPatterns: {
        seasonal_clients: SeasonalClient[];
        seasonal_fruits: SeasonalFruit[];
    };
    loading?: boolean;
}

export function SeasonalityPanel({ seasonalPatterns, loading }: SeasonalityPanelProps) {

    if (loading) {
        return <div className="p-4 text-center text-gray-400">Analizando patrones estacionales...</div>;
    }

    const hasClients = seasonalPatterns.seasonal_clients.length > 0;
    const hasFruits = seasonalPatterns.seasonal_fruits.length > 0;

    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-orange-500 text-white rounded-t-lg py-3">
                <CardTitle className="text-lg flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Análisis de Patrones Estacionales
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <Alert className="mb-6 bg-blue-50 text-blue-800 border-blue-200">
                    <Info className="h-4 w-4 text-blue-800" />
                    <AlertTitle>Información</AlertTitle>
                    <AlertDescription>
                        Esta sección identifica clientes y frutas con patrones de compra estacionales marcados (concentración alta en meses específicos).
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Seasonal Clients Table */}
                    <div>
                        <h4 className="font-bold flex items-center text-primary mb-3">
                            <Calendar className="mr-2 h-4 w-4" />
                            Clientes Estacionales
                        </h4>
                        <div className="border rounded-md overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Meses Activos</TableHead>
                                        <TableHead className="text-right">Concentración</TableHead>
                                        <TableHead>Fuerza</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {hasClients ? (
                                        seasonalPatterns.seasonal_clients.map((client, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium text-xs">{client.cliente}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {client.active_months.map(m => (
                                                            <Badge key={m} variant="secondary" className="px-1 py-0 text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-200">{m}</Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-xs">
                                                    {client.concentration.toFixed(1)}%
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={client.pattern_strength === 'Alta' ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'}>
                                                        {client.pattern_strength}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-4 text-gray-500 text-xs">
                                                No se detectaron clientes con patrones estacionales marcados
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Seasonal Fruits Table */}
                    <div>
                        <h4 className="font-bold flex items-center text-green-600 mb-3">
                            <Apple className="mr-2 h-4 w-4" />
                            Frutas Estacionales
                        </h4>
                        <div className="border rounded-md overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead>Fruta</TableHead>
                                        <TableHead>Temporada</TableHead>
                                        <TableHead className="text-right">Concentración</TableHead>
                                        <TableHead>Fuerza</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {hasFruits ? (
                                        seasonalPatterns.seasonal_fruits.map((fruit, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium text-xs">{fruit.fruta}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {fruit.active_months.map(m => (
                                                            <Badge key={m} variant="secondary" className="px-1 py-0 text-[10px] bg-green-100 text-green-700 hover:bg-green-200">{m}</Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-xs">
                                                    {fruit.concentration.toFixed(1)}%
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={fruit.pattern_strength === 'Alta' ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'}>
                                                        {fruit.pattern_strength}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-4 text-gray-500 text-xs">
                                                No se detectaron frutas con patrones estacionales marcados
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
