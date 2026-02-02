import datetime
from decimal import Decimal
from typing import Optional, Dict, List, Any
from django.db.models import Sum, Avg

from comercial.models import Fruta
from nacionales.models import (
    CompraNacional, VentaNacional, ReporteCalidadExportador,
    ReporteCalidadProveedor, ProveedorNacional, TransferenciasProveedor
)


class DashboardNacionalesService:
    def __init__(
        self,
        fecha_inicio: Optional[datetime.date] = None,
        fecha_fin: Optional[datetime.date] = None,
        proveedor_id: Optional[int] = None,
        fruta_id: Optional[int] = None
    ):
        if not fecha_fin:
            fecha_fin = datetime.date.today()
        if not fecha_inicio:
            fecha_inicio = fecha_fin - datetime.timedelta(days=30)

        self.fecha_inicio = fecha_inicio
        self.fecha_fin = fecha_fin
        self.proveedor_id = proveedor_id
        self.fruta_id = fruta_id

        self.periodo_anterior_inicio = fecha_inicio - (fecha_fin - fecha_inicio)
        self.periodo_anterior_fin = fecha_inicio - datetime.timedelta(days=1)

    def _get_base_compras_queryset(self):
        compras = CompraNacional.objects.filter(
            fecha_compra__gte=self.fecha_inicio,
            fecha_compra__lte=self.fecha_fin
        ).select_related('proveedor', 'fruta', 'tipo_empaque').prefetch_related(
            'ventas',
            'ventas__reportecalidadexportador',
            'ventas__reportecalidadexportador__reportecalidadproveedor'
        )

        if self.proveedor_id:
            compras = compras.filter(proveedor_id=self.proveedor_id)
        if self.fruta_id:
            compras = compras.filter(fruta_id=self.fruta_id)

        return compras

    def _get_prev_compras_queryset(self):
        compras = CompraNacional.objects.filter(
            fecha_compra__gte=self.periodo_anterior_inicio,
            fecha_compra__lte=self.periodo_anterior_fin
        ).select_related('proveedor', 'fruta').prefetch_related(
            'ventas',
            'ventas__reportecalidadexportador',
            'ventas__reportecalidadexportador__reportecalidadproveedor'
        )

        if self.proveedor_id:
            compras = compras.filter(proveedor_id=self.proveedor_id)
        if self.fruta_id:
            compras = compras.filter(fruta_id=self.fruta_id)

        return compras

    def _count_reportes_pendientes(self, compras_queryset) -> int:
        count = 0
        count = 0
        for compra in compras_queryset:
            ventas = compra.ventas.all()
            if not ventas.exists():
                count += 1
                continue

            compra_completa = True
            for venta in ventas:
                tiene_reporte_exp = hasattr(venta, 'reportecalidadexportador')
                tiene_reporte_prov = False
                reporte_prov_completado = False

                if tiene_reporte_exp:
                    reporte_exp = venta.reportecalidadexportador
                    tiene_reporte_prov = hasattr(reporte_exp, 'reportecalidadproveedor')
                    if tiene_reporte_prov:
                        reporte_prov = reporte_exp.reportecalidadproveedor
                        reporte_prov_completado = reporte_prov.completado

                if not (tiene_reporte_exp and tiene_reporte_prov and reporte_prov_completado):
                    compra_completa = False
                    break
            
            if not compra_completa:
                count += 1
        return count
        return count

    def _calc_percent(self, current: Decimal, prev: Decimal) -> float:
        if prev and prev != 0:
            return round(float((current - prev) / abs(prev) * 100), 2)
        return 0.0

    def get_metrics(self) -> Dict[str, Any]:
        compras = self._get_base_compras_queryset()
        compras_prev = self._get_prev_compras_queryset()

        total_compras = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras
        ).aggregate(total=Sum('p_total_pagar'))['total'] or Decimal('0')

        kilos_brutos = VentaNacional.objects.filter(
            compra_nacional__in=compras
        ).aggregate(total=Sum('peso_bruto_recibido'))['total'] or Decimal('0')

        kilos_netos = VentaNacional.objects.filter(
            compra_nacional__in=compras
        ).aggregate(total=Sum('peso_neto_recibido'))['total'] or Decimal('0')

        utilidad_real = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras
        ).aggregate(total=Sum('p_utilidad'))['total'] or Decimal('0')

        utilidad_sin_ajuste = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras
        ).aggregate(total=Sum('p_utilidad_sin_ajuste'))['total'] or Decimal('0')

        reportes_pendientes = self._count_reportes_pendientes(compras)

        total_compras_prev = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras_prev
        ).aggregate(total=Sum('p_total_pagar'))['total'] or Decimal('0')

        kilos_brutos_prev = VentaNacional.objects.filter(
            compra_nacional__in=compras_prev
        ).aggregate(total=Sum('peso_bruto_recibido'))['total'] or Decimal('0')

        kilos_netos_prev = VentaNacional.objects.filter(
            compra_nacional__in=compras_prev
        ).aggregate(total=Sum('peso_neto_recibido'))['total'] or Decimal('0')

        utilidad_real_prev = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras_prev
        ).aggregate(total=Sum('p_utilidad'))['total'] or Decimal('0')

        utilidad_sin_ajuste_prev = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras_prev
        ).aggregate(total=Sum('p_utilidad_sin_ajuste'))['total'] or Decimal('0')

        reportes_pendientes_prev = self._count_reportes_pendientes(compras_prev)

        return {
            'compras_totales': {
                'current': float(total_compras),
                'prev': float(total_compras_prev),
                'percent': self._calc_percent(total_compras, total_compras_prev)
            },
            'kilos_brutos': {
                'current': float(kilos_brutos),
                'prev': float(kilos_brutos_prev),
                'percent': self._calc_percent(kilos_brutos, kilos_brutos_prev)
            },
            'kilos_netos': {
                'current': float(kilos_netos),
                'prev': float(kilos_netos_prev),
                'percent': self._calc_percent(kilos_netos, kilos_netos_prev)
            },
            'utilidad_real': {
                'current': float(utilidad_real),
                'prev': float(utilidad_real_prev),
                'percent': self._calc_percent(utilidad_real, utilidad_real_prev)
            },
            'utilidad_sin_ajuste': {
                'current': float(utilidad_sin_ajuste),
                'prev': float(utilidad_sin_ajuste_prev),
                'percent': self._calc_percent(utilidad_sin_ajuste, utilidad_sin_ajuste_prev)
            },
            'reportes_pendientes': {
                'current': reportes_pendientes,
                'prev': reportes_pendientes_prev,
                'percent': self._calc_percent(Decimal(reportes_pendientes), Decimal(reportes_pendientes_prev))
            }
        }

    def get_proveedores_data(self) -> List[Dict[str, Any]]:
        compras = self._get_base_compras_queryset()

        if self.proveedor_id:
            proveedores = ProveedorNacional.objects.filter(id=self.proveedor_id)
        else:
            proveedores = ProveedorNacional.objects.all()

        total_kilos_global = Decimal('0')
        total_utilidad_global = Decimal('0')

        proveedores_data = []

        for proveedor in proveedores:
            compras_proveedor = compras.filter(proveedor=proveedor)
            numero_compras = compras_proveedor.count()

            reportes_pendientes = 0
            for compra in compras_proveedor:
                ventas = compra.ventas.all()
                if not ventas.exists():
                    reportes_pendientes += 1
                    continue

                compra_completa = True
                for venta in ventas:
                    tiene_reporte_exp = hasattr(venta, 'reportecalidadexportador')
                    tiene_reporte_prov = False
                    reporte_prov_completado = False

                    if tiene_reporte_exp:
                        reporte_exp = venta.reportecalidadexportador
                        tiene_reporte_prov = hasattr(reporte_exp, 'reportecalidadproveedor')
                        if tiene_reporte_prov:
                            reporte_prov = reporte_exp.reportecalidadproveedor
                            reporte_prov_completado = reporte_prov.completado

                    if not (tiene_reporte_exp and tiene_reporte_prov and reporte_prov_completado):
                        compra_completa = False
                        break
                
                if not compra_completa:
                    reportes_pendientes += 1

            valor_compras = ReporteCalidadProveedor.objects.filter(
                rep_cal_exp__venta_nacional__compra_nacional__in=compras_proveedor
            ).aggregate(total=Sum('p_total_pagar'))['total'] or Decimal('0')

            total_pagado = TransferenciasProveedor.objects.filter(
                proveedor=proveedor,
                fecha_transferencia__gte=self.fecha_inicio,
                fecha_transferencia__lte=self.fecha_fin,
            ).aggregate(total=Sum('valor_transferencia'))['total'] or Decimal('0')

            facturado_exp = ReporteCalidadExportador.objects.filter(
                venta_nacional__compra_nacional__in=compras_proveedor
            ).aggregate(total=Sum('precio_total'))['total'] or Decimal('0')

            kilos_brutos = VentaNacional.objects.filter(
                compra_nacional__in=compras_proveedor
            ).aggregate(total=Sum('peso_bruto_recibido'))['total'] or Decimal('0')

            kilos_netos = VentaNacional.objects.filter(
                compra_nacional__in=compras_proveedor
            ).aggregate(total=Sum('peso_neto_recibido'))['total'] or Decimal('0')

            utilidad_real = ReporteCalidadProveedor.objects.filter(
                rep_cal_exp__venta_nacional__compra_nacional__in=compras_proveedor
            ).aggregate(total=Sum('p_utilidad'))['total'] or Decimal('0')

            total_kilos_global += kilos_brutos
            total_utilidad_global += utilidad_real

            proveedores_data.append({
                'proveedor_id': proveedor.id,
                'proveedor_nombre': proveedor.nombre,
                'numero_compras': numero_compras,
                'reportes_pendientes': reportes_pendientes,
                'valor_compras': float(valor_compras),
                'total_pagado': float(total_pagado),
                'facturado_exportadores': float(facturado_exp),
                'kilos_brutos': float(kilos_brutos),
                'kilos_netos': float(kilos_netos),
                'utilidad_real': float(utilidad_real),
                '_kilos_brutos_raw': kilos_brutos,
                '_utilidad_real_raw': utilidad_real,
                '_valor_compras_raw': valor_compras,
            })

        for item in proveedores_data:
            if total_kilos_global > 0:
                item['percent_kilos'] = round(float(item['_kilos_brutos_raw'] / total_kilos_global * 100), 2)
            else:
                item['percent_kilos'] = 0.0

            if total_utilidad_global != 0:
                pct = float(item['_utilidad_real_raw'] / abs(total_utilidad_global) * 100)
                item['percent_utilidad'] = round(pct, 2) if total_utilidad_global > 0 else round(-pct, 2)
            else:
                item['percent_utilidad'] = 0.0

            if item['_valor_compras_raw'] > 0:
                item['percent_utilidad_compra'] = round(float(item['_utilidad_real_raw'] / item['_valor_compras_raw'] * 100), 2)
            else:
                item['percent_utilidad_compra'] = 0.0

            del item['_kilos_brutos_raw']
            del item['_utilidad_real_raw']
            del item['_valor_compras_raw']

        return proveedores_data

    def get_chart_data(self) -> Dict[str, Any]:
        compras = self._get_base_compras_queryset()

        if self.proveedor_id:
            proveedores = ProveedorNacional.objects.filter(id=self.proveedor_id)
        else:
            proveedores = ProveedorNacional.objects.all()

        utilidades_proveedor = []
        for proveedor in proveedores:
            compras_prov = compras.filter(proveedor=proveedor)
            utilidad = ReporteCalidadProveedor.objects.filter(
                rep_cal_exp__venta_nacional__compra_nacional__in=compras_prov
            ).aggregate(total=Sum('p_utilidad'))['total'] or Decimal('0')
            utilidades_proveedor.append({
                'nombre': proveedor.nombre,
                'utilidad': float(utilidad)
            })

        utilidades_proveedor = sorted(utilidades_proveedor, key=lambda x: x['utilidad'], reverse=True)

        frutas_data = {}
        reportes = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__in=compras
        ).select_related('rep_cal_exp__venta_nacional__compra_nacional__fruta')

        for reporte in reportes:
            fruta_nombre = reporte.rep_cal_exp.venta_nacional.compra_nacional.fruta.nombre
            if fruta_nombre not in frutas_data:
                frutas_data[fruta_nombre] = Decimal('0')
            frutas_data[fruta_nombre] += reporte.p_utilidad

        utilidades_fruta = [
            {'nombre': nombre, 'utilidad': float(utilidad)}
            for nombre, utilidad in frutas_data.items()
        ]
        utilidades_fruta = sorted(utilidades_fruta, key=lambda x: x['utilidad'], reverse=True)

        reportes_calidad = ReporteCalidadExportador.objects.filter(
            venta_nacional__compra_nacional__in=compras
        )

        totales = reportes_calidad.aggregate(
            kg_exportacion=Sum('kg_exportacion'),
            kg_nacional=Sum('kg_nacional'),
            kg_merma=Sum('kg_merma'),
            kg_totales=Sum('kg_totales')
        )

        kg_totales = totales['kg_totales'] or Decimal('0')
        kg_exportacion = totales['kg_exportacion'] or Decimal('0')
        kg_nacional = totales['kg_nacional'] or Decimal('0')
        kg_merma = totales['kg_merma'] or Decimal('0')

        if kg_totales > 0:
            pct_exp = float(kg_exportacion / kg_totales * 100)
            pct_nal = float(kg_nacional / kg_totales * 100)
            pct_merma = float(kg_merma / kg_totales * 100)
        else:
            pct_exp = pct_nal = pct_merma = 0.0

        kilos_distribucion = [
            {'tipo': 'Exportación', 'kilos': float(kg_exportacion), 'porcentaje': round(pct_exp, 2)},
            {'tipo': 'Nacional', 'kilos': float(kg_nacional), 'porcentaje': round(pct_nal, 2)},
            {'tipo': 'Merma', 'kilos': float(kg_merma), 'porcentaje': round(pct_merma, 2)},
        ]

        evolucion_meses = []
        current_date = self.fecha_inicio.replace(day=1)
        while current_date <= self.fecha_fin:
            evolucion_meses.append(current_date.strftime('%Y-%m'))
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)

        evolucion_proveedores = []
        for proveedor in proveedores:
            datos_proveedor = {
                'nombre': proveedor.nombre,
                'exportacion': []
            }

            for mes_str in evolucion_meses:
                año, mes = mes_str.split('-')
                mes_inicio = datetime.date(int(año), int(mes), 1)

                if int(mes) == 12:
                    mes_fin = datetime.date(int(año) + 1, 1, 1) - datetime.timedelta(days=1)
                else:
                    mes_fin = datetime.date(int(año), int(mes) + 1, 1) - datetime.timedelta(days=1)

                if mes_fin > self.fecha_fin:
                    mes_fin = self.fecha_fin

                reportes_mes = ReporteCalidadExportador.objects.filter(
                    venta_nacional__compra_nacional__proveedor=proveedor,
                    fecha_reporte__gte=mes_inicio,
                    fecha_reporte__lte=mes_fin
                )

                if self.fruta_id:
                    reportes_mes = reportes_mes.filter(
                        venta_nacional__compra_nacional__fruta_id=self.fruta_id
                    )

                prom_exp = reportes_mes.aggregate(
                    prom_exp=Avg('porcentaje_exportacion')
                )['prom_exp'] or 0

                datos_proveedor['exportacion'].append(round(float(prom_exp), 2))

            evolucion_proveedores.append(datos_proveedor)

        return {
            'utilidades_proveedor': utilidades_proveedor,
            'utilidades_fruta': utilidades_fruta,
            'kilos_distribucion': kilos_distribucion,
            'evolucion_calidad': {
                'meses': evolucion_meses,
                'proveedores': evolucion_proveedores
            }
        }

    def get_filter_options(self) -> Dict[str, List[Dict[str, Any]]]:
        proveedores = ProveedorNacional.objects.all().order_by('nombre')
        frutas = Fruta.objects.all().order_by('nombre')

        return {
            'proveedores': [{'id': p.id, 'nombre': p.nombre} for p in proveedores],
            'frutas': [{'id': f.id, 'nombre': f.nombre} for f in frutas]
        }

    def get_full_dashboard_data(self) -> Dict[str, Any]:
        return {
            'filters': {
                'fecha_inicio': self.fecha_inicio.isoformat(),
                'fecha_fin': self.fecha_fin.isoformat(),
                'proveedor_id': self.proveedor_id,
                'fruta_id': self.fruta_id
            },
            **self.get_filter_options(),
            'metrics': self.get_metrics(),
            'proveedores_data': self.get_proveedores_data(),
            'charts': self.get_chart_data()
        }
