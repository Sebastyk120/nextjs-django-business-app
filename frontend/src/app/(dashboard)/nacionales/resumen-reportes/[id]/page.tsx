'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getNacionalesResumenReportes } from '@/services/nacionalesService';
import type { ResumenReportesResponse } from '@/types/nacionales';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Download, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axiosClient from '@/lib/axios';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatNumber = (num?: number): string => {
  if (num === undefined || num === null) return '-';
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(num);
};

const formatPercent = (num?: number | string): string => {
  if (num === undefined || num === null) return '-';
  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(value)) return '-';
  return `${value.toFixed(1)}%`;
};

const numberToWords = (num: number): string => {
  if (num === 0) return 'CERO PESOS';

  const units = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';

    let result = '';
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;

    if (hundred > 0) result += hundreds[hundred];

    if (remainder >= 10 && remainder < 20) {
      result += (result ? ' ' : '') + teens[remainder - 10];
    } else {
      const ten = Math.floor(remainder / 10);
      const unit = remainder % 10;

      if (ten > 0) result += (result ? ' ' : '') + tens[ten];
      if (unit > 0) {
        if (ten > 2) result += ' Y ' + units[unit];
        else if (ten === 2) result += (unit === 1 ? 'UNO' : units[unit]);
        else result += (result ? ' ' : '') + units[unit];
      }
    }
    return result;
  };

  let result = '';
  const absNum = Math.abs(num);

  const billions = Math.floor(absNum / 1000000000);
  const millions = Math.floor((absNum % 1000000000) / 1000000);
  const thousands = Math.floor((absNum % 1000000) / 1000);
  const remainder = Math.floor(absNum % 1000);

  if (billions > 0) result += convertLessThanThousand(billions) + ' MIL MILLONES';
  if (millions > 0) result += (result ? ' ' : '') + convertLessThanThousand(millions) + (millions === 1 ? ' MILLON' : ' MILLONES');
  if (thousands > 0) result += (result ? ' ' : '') + (thousands === 1 ? 'MIL' : convertLessThanThousand(thousands) + ' MIL');
  if (remainder > 0) result += (result ? ' ' : '') + convertLessThanThousand(remainder);

  return (num < 0 ? 'MENOS ' : '') + result + ' PESOS M/CTE';
};

export default function ResumenReportesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<ResumenReportesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await getNacionalesResumenReportes(Number(id));
        setData(response);
      } catch (error) {
        console.error('Error fetching resumen reportes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      const response = await axiosClient.get(`/nacionales/api/proveedores/${id}/exportar_pdf/`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `estado_cuenta_${data?.proveedor?.nombre?.replace(/\s+/g, '_') || 'proveedor'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">No se encontraron datos</p>
      </div>
    );
  }

  const saldoReal = data.valor_consignar || 0;
  const isSaldoPositivo = saldoReal >= 0;

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; margin: 0 !important; }
          .break-inside-avoid { break-inside: avoid; }
        }
      `}</style>

      <div className="w-full max-w-[1600px] mx-auto p-4 print-container text-xs md:text-sm">
        {/* Header con botones */}
        <div className="no-print mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Volver
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-plus-jakarta flex items-center gap-3">
              <FileText className="h-8 w-8 text-emerald-600" />
              Estado de Cuenta - Proveedor
            </h1>
          </div>
          <Button onClick={handleExportPdf} disabled={exportingPdf} className="flex items-center gap-2">
            {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Descargar PDF
          </Button>
        </div>

        {/* Header del reporte */}
        <div className="mb-4 break-inside-avoid">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img src="/img/heavens.webp" alt="Logo" className="h-12 w-auto" />
                <h2 className="text-lg font-bold">Heaven&apos;s Fruits SAS</h2>
              </div>
              <p className="text-sm text-gray-500">Estado de Cuenta de Proveedor</p>
            </div>
            <div className="text-right space-y-0.5">
              <h2 className="text-xl font-bold">{data.proveedor?.nombre}</h2>
              <p className="text-gray-600">NIT/CC: {data.proveedor?.nit || 'N/A'}</p>
              <p className="text-gray-600">Fecha Del Saldo: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>

          {/* Saldo Real Card */}
          <Card className={`${isSaldoPositivo ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <CardContent className="p-4 flex flex-col items-center">
              <h3 className={`text-lg font-bold ${isSaldoPositivo ? 'text-green-700' : 'text-red-700'}`}>
                SALDO REAL: {formatCurrency(data.monto_pendiente_total)}
              </h3>
              <p className="text-xs text-muted-foreground uppercase mt-1">
                {numberToWords(data.monto_pendiente_total)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* LEFT COLUMN */}
          <div className="space-y-4">
            {/* Reportes Pendientes de Pago */}
            <Card className="break-inside-avoid shadow-sm">
              <CardHeader className="p-3 bg-gray-50 border-b">
                <CardTitle className="text-base">Reportes Pendientes de Pago</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="h-8 py-1">Guía</TableHead>
                      <TableHead className="h-8 py-1">Fecha Compra</TableHead>
                      <TableHead className="h-8 py-1">Fecha Reporte</TableHead>
                      <TableHead className="h-8 py-1">Peso Total</TableHead>
                      <TableHead className="h-8 py-1 text-center">Export.</TableHead>
                      <TableHead className="h-8 py-1 text-center">Nacional</TableHead>
                      <TableHead className="h-8 py-1 text-right">Factura Después Retenciones</TableHead>
                      <TableHead className="h-8 py-1 text-right">Saldo Real</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.reportes_pendientes?.map((item, i) => {
                      const hasPartialPayment = item.p_total_pagar !== item.monto_pendiente && item.monto_pendiente > 0;
                      return (
                        <TableRow key={i} className={`h-8 ${hasPartialPayment ? 'bg-yellow-50' : ''}`}>
                          <TableCell className="py-1">{item.compra_guia}</TableCell>
                          <TableCell className="py-1">{formatDate(item.compra_fecha)}</TableCell>
                          <TableCell className="py-1">{formatDate(item.p_fecha_reporte)}</TableCell>
                          <TableCell className="py-1">{formatNumber(item.p_kg_totales)} kg</TableCell>
                          <TableCell className="py-1 text-center">
                            <span className="text-green-600 font-medium">{formatPercent(item.p_porcentaje_exportacion)}</span>
                          </TableCell>
                          <TableCell className="py-1 text-center">
                            <span className="text-orange-600 font-medium">{formatPercent(item.p_porcentaje_nacional)}</span>
                          </TableCell>
                          <TableCell className="py-1 text-right">{formatCurrency(item.p_total_pagar)}</TableCell>
                          <TableCell className={`py-1 text-right font-bold ${hasPartialPayment ? 'text-orange-600' : 'text-red-600'}`}>
                            {formatCurrency(item.monto_pendiente)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!data.reportes_pendientes || data.reportes_pendientes.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                          No hay reportes pendientes de pago para mostrar
                        </TableCell>
                      </TableRow>
                    )}
                    {data.reportes_pendientes && data.reportes_pendientes.length > 0 && (
                      <>
                        <TableRow className="h-8 font-bold bg-gray-100">
                          <TableCell colSpan={7} className="py-1 text-right">Total pendiente:</TableCell>
                          <TableCell className="py-1 text-right">{formatCurrency(data.monto_pendiente_total)}</TableCell>
                        </TableRow>
                        {data.saldo_disponible > 0 && (
                          <TableRow className="h-8 font-bold bg-green-50">
                            <TableCell colSpan={7} className="py-1 text-right">Anticipo Pendiente Por Aplicar:</TableCell>
                            <TableCell className="py-1 text-right text-green-600">-{formatCurrency(data.saldo_disponible)}</TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Últimos Reportes Pagados */}
            <Card className="break-inside-avoid shadow-sm">
              <CardHeader className="p-3 bg-gray-50 border-b">
                <CardTitle className="text-base">Últimos Reportes Pagados</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="h-8 py-1">Guía</TableHead>
                      <TableHead className="h-8 py-1">Fecha Compra</TableHead>
                      <TableHead className="h-8 py-1">Fecha Reporte</TableHead>
                      <TableHead className="h-8 py-1">Peso Total</TableHead>
                      <TableHead className="h-8 py-1 text-center">Export.</TableHead>
                      <TableHead className="h-8 py-1 text-center">Nacional</TableHead>
                      <TableHead className="h-8 py-1 text-right">Total a Pagar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.reportes_pagados?.slice(0, 50).map((item, i) => (
                      <TableRow key={i} className="h-8">
                        <TableCell className="py-1">{item.compra_guia}</TableCell>
                        <TableCell className="py-1">{formatDate(item.compra_fecha)}</TableCell>
                        <TableCell className="py-1">{formatDate(item.p_fecha_reporte)}</TableCell>
                        <TableCell className="py-1">{formatNumber(item.p_kg_totales)} kg</TableCell>
                        <TableCell className="py-1 text-center">
                          <span className="text-green-600 font-medium">{formatPercent(item.p_porcentaje_exportacion)}</span>
                        </TableCell>
                        <TableCell className="py-1 text-center">
                          <span className="text-orange-600 font-medium">{formatPercent(item.p_porcentaje_nacional)}</span>
                        </TableCell>
                        <TableCell className="py-1 text-right">{formatCurrency(item.p_total_pagar)}</TableCell>
                      </TableRow>
                    ))}
                    {(!data.reportes_pagados || data.reportes_pagados.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                          No hay compras completadas para mostrar
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            {/* Compras en Proceso */}
            <Card className="break-inside-avoid shadow-sm">
              <CardHeader className="p-3 bg-gray-50 border-b">
                <CardTitle className="text-base">Compras en Proceso</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="h-8 py-1">Guía</TableHead>
                      <TableHead className="h-8 py-1">Fecha Compra</TableHead>
                      <TableHead className="h-8 py-1">Fecha Reporte</TableHead>
                      <TableHead className="h-8 py-1">Peso Recibido</TableHead>
                      <TableHead className="h-8 py-1">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.compras_proceso?.map((item, i) => (
                      <TableRow key={i} className="h-8">
                        <TableCell className="py-1">{item.numero_guia}</TableCell>
                        <TableCell className="py-1">{formatDate(item.fecha_compra)}</TableCell>
                        <TableCell className="py-1">{item.fecha_reporte ? formatDate(item.fecha_reporte) : 'Pendiente'}</TableCell>
                        <TableCell className="py-1">{item.peso_recibido ? `${formatNumber(item.peso_recibido)} kg` : 'N/A'}</TableCell>
                        <TableCell className="py-1">
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{item.estado}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data.compras_proceso || data.compras_proceso.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No hay compras en proceso para mostrar
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Reportes Sin Factura */}
            <Card className="break-inside-avoid shadow-sm">
              <CardHeader className="p-3 bg-gray-50 border-b">
                <CardTitle className="text-base">Reporte Pendiente Por Facturar Proveedor</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="h-8 py-1">Guía</TableHead>
                      <TableHead className="h-8 py-1">Fecha Compra</TableHead>
                      <TableHead className="h-8 py-1">Fecha Reporte</TableHead>
                      <TableHead className="h-8 py-1 text-right">Total a Facturar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.reportes_sin_factura?.map((item, i) => (
                      <TableRow key={i} className="h-8">
                        <TableCell className="py-1">{item.compra_guia}</TableCell>
                        <TableCell className="py-1">{formatDate(item.compra_fecha)}</TableCell>
                        <TableCell className="py-1">{formatDate(item.p_fecha_reporte)}</TableCell>
                        <TableCell className="py-1 text-right">{formatCurrency(item.p_total_facturar)}</TableCell>
                      </TableRow>
                    ))}
                    {(!data.reportes_sin_factura || data.reportes_sin_factura.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No hay reportes sin factura para mostrar
                        </TableCell>
                      </TableRow>
                    )}
                    {data.reportes_sin_factura && data.reportes_sin_factura.length > 0 && (
                      <TableRow className="h-8 font-bold bg-gray-100">
                        <TableCell colSpan={3} className="py-1 text-right">Total sin factura:</TableCell>
                        <TableCell className="py-1 text-right">{formatCurrency(data.total_sin_factura)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Últimas Transferencias Realizadas */}
            <Card className="break-inside-avoid shadow-sm">
              <CardHeader className="p-3 bg-gray-50 border-b">
                <CardTitle className="text-base">Últimas Transferencias Realizadas</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="h-8 py-1">Fecha</TableHead>
                      <TableHead className="h-8 py-1">Referencia</TableHead>
                      <TableHead className="h-8 py-1">Origen</TableHead>
                      <TableHead className="h-8 py-1 text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.transferencias?.slice(0, 20).map((item, i) => (
                      <TableRow key={i} className="h-8">
                        <TableCell className="py-1">{formatDate(item.fecha_transferencia)}</TableCell>
                        <TableCell className="py-1">{item.referencia || '-'}</TableCell>
                        <TableCell className="py-1">{item.origen_transferencia || item.banco_origen}</TableCell>
                        <TableCell className="py-1 text-right text-green-600 font-medium">{formatCurrency(item.valor_transferencia)}</TableCell>
                      </TableRow>
                    ))}
                    {(!data.transferencias || data.transferencias.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No hay transferencias para mostrar
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Detalle del Saldo */}
            <Card className="break-inside-avoid shadow-sm">
              <CardHeader className="p-3 bg-gray-50 border-b">
                <CardTitle className="text-base">Detalle del Saldo</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="h-8 py-1">Concepto</TableHead>
                      <TableHead className="h-8 py-1 text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="h-8">
                      <TableCell className="py-1">Total por Pagar (Reportes pendientes)</TableCell>
                      <TableCell className="py-1 text-right">{formatCurrency(data.monto_pendiente_total)}</TableCell>
                    </TableRow>
                    {data.saldo_disponible > 0 && (
                      <TableRow className="h-8">
                        <TableCell className="py-1">Anticipo pendiente por aplicar</TableCell>
                        <TableCell className="py-1 text-right text-green-600">-{formatCurrency(data.saldo_disponible)}</TableCell>
                      </TableRow>
                    )}
                    <TableRow className="h-8 font-bold bg-gray-100">
                      <TableCell className="py-1">Saldo Actual</TableCell>
                      <TableCell className={`py-1 text-right ${saldoReal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(data.valor_consignar)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Final Balance Statement */}
        <div className={`mt-6 p-4 rounded-lg text-center break-inside-avoid ${saldoReal >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h4 className={`text-lg font-bold ${saldoReal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {saldoReal >= 0 ? 'TOTAL A PAGAR AL PROVEEDOR' : 'TOTAL A COBRAR AL PROVEEDOR'}
          </h4>
          <p className={`text-xl font-bold mt-2 ${saldoReal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(Math.abs(data.valor_consignar))}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ({numberToWords(Math.abs(data.valor_consignar))})
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500 break-inside-avoid border-t pt-4">
          <p>Este documento es informativo y representa el estado actual de su cuenta con Heaven&apos;s Fruits SAS</p>
        </div>
      </div>
    </>
  );
}
