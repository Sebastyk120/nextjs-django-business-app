import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown, UserPlus, UserMinus, Calendar } from 'lucide-react';
import { PortfolioAnalysis } from '@/types/proyeccion';

interface CustomerPortfolioAnalysisProps {
    data: PortfolioAnalysis;
}

export function CustomerPortfolioAnalysis({ data }: CustomerPortfolioAnalysisProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Portfolio Churn Column */}
            <div className="space-y-4">
                <Card className="shadow-sm border-l-4 border-l-green-500">
                    <CardHeader className="py-3">
                        <CardTitle className="text-lg flex items-center text-green-700">
                            <UserPlus className="mr-2 h-5 w-5" />
                            Nuevos Clientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.new_customers.length > 0 ? (
                            <ul className="space-y-2">
                                {data.new_customers.map((client, idx) => (
                                    <li key={idx} className="flex justify-between items-center p-2 bg-green-50 rounded text-sm">
                                        <span className="font-medium text-gray-700">{client}</span>
                                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">Nuevo</Badge>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center text-gray-500 py-4 italic text-sm">No hay nuevos clientes en este período</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-red-500">
                    <CardHeader className="py-3">
                        <CardTitle className="text-lg flex items-center text-red-700">
                            <UserMinus className="mr-2 h-5 w-5" />
                            Clientes Perdidos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.lost_customers.length > 0 ? (
                            <ul className="space-y-2">
                                {data.lost_customers.map((client, idx) => (
                                    <li key={idx} className="flex justify-between items-center p-2 bg-red-50 rounded text-sm">
                                        <span className="font-medium text-gray-700">{client}</span>
                                        <Badge variant="destructive">Perdido</Badge>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center text-gray-500 py-4 italic text-sm">No hay clientes perdidos en este período</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Trends Column */}
            <div className="space-y-4">
                <Card className="shadow-sm">
                    <CardHeader className="py-3 bg-gray-50 border-b">
                        <CardTitle className="text-lg flex items-center">
                            <TrendingUp className="mr-2 h-5 w-5 text-gray-700" />
                            Tendencia de Clientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="p-4 bg-white">
                            <h5 className="text-sm font-bold text-green-600 flex items-center mb-2">
                                <TrendingUp className="mr-1 h-4 w-4" /> Clientes en Crecimiento
                            </h5>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-2 text-left">Cliente</th>
                                            <th className="p-2 text-right">Crecimiento</th>
                                            <th className="p-2 text-right">Actual</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.growing_customers.length > 0 ? (
                                            data.growing_customers.slice(0, 5).map((item, idx) => (
                                                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                                    <td className="p-2 flex items-center">
                                                        <span className="truncate max-w-[120px]" title={item.cliente}>{item.cliente}</span>
                                                        {item.is_seasonal && <Badge variant="outline" className="ml-1 text-[10px] px-1 bg-yellow-50 text-yellow-700 border-yellow-200"><Calendar className="h-3 w-3" /></Badge>}
                                                    </td>
                                                    <td className="p-2 text-right font-bold text-green-600">+{item.growth.toFixed(1)}%</td>
                                                    <td className="p-2 text-right text-gray-500">{item.current_year_kilos.toLocaleString()} kg</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={3} className="text-center py-2 text-gray-400">Sin datos</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="border-t"></div>

                        <div className="p-4 bg-white">
                            <h5 className="text-sm font-bold text-red-600 flex items-center mb-2">
                                <TrendingDown className="mr-1 h-4 w-4" /> Clientes en Declive
                            </h5>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-2 text-left">Cliente</th>
                                            <th className="p-2 text-right">Declive</th>
                                            <th className="p-2 text-right">Actual</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.declining_customers.length > 0 ? (
                                            data.declining_customers.slice(0, 5).map((item, idx) => (
                                                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                                    <td className="p-2 flex items-center">
                                                        <span className="truncate max-w-[120px]" title={item.cliente}>{item.cliente}</span>
                                                        {item.is_seasonal && <Badge variant="outline" className="ml-1 text-[10px] px-1 bg-yellow-50 text-yellow-700 border-yellow-200"><Calendar className="h-3 w-3" /></Badge>}
                                                    </td>
                                                    <td className="p-2 text-right font-bold text-red-600">{item.growth.toFixed(1)}%</td>
                                                    <td className="p-2 text-right text-gray-500">{item.current_year_kilos.toLocaleString()} kg</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={3} className="text-center py-2 text-gray-400">Sin datos</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
