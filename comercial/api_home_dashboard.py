from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from django.db.models import Sum, Q, Count, F, Avg, Max, Case, When, Value, IntegerField
from django.utils import timezone
from datetime import timedelta

# Modelos
from comercial.models import (
    Pedido, 
    Exportador,
    DetallePedido
)
from inventarios.models import Inventario
from nacionales.models import CompraNacional

class HomeDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_groups = list(user.groups.values_list('name', flat=True))
        
        # Check permissions
        is_heavens = any(g in ['Heavens', 'Autorizadores', 'Superuser'] for g in user_groups)
        
        # Data containers
        response_data = {
            "is_heavens": is_heavens,
            "user_name": f"{user.first_name} {user.last_name}" or user.username,
            "greeting": self._get_greeting(),
            "metrics": {},
            "activity": [],
            "alerts": []
        }

        if is_heavens:
            response_data.update(self._get_heavens_data(user))
        else:
            # Determine Exportador
            exportador_name = self._get_exportador_from_groups(user_groups)
            if exportador_name:
                response_data.update(self._get_exportador_data(exportador_name, user))
            else:
                response_data["error"] = "No se pudo identificar la empresa asociada a su usuario."

        return Response(response_data)

    def _get_greeting(self):
        hour = timezone.localtime(timezone.now()).hour
        if 5 <= hour < 12:
            return "Buenos días"
        elif 12 <= hour < 18:
            return "Buenas tardes"
        else:
            return "Buenas noches"

    def _get_exportador_from_groups(self, groups):
        # Mapeo simple de grupos a exportadores
        mapping = {
            'Etnico': 'Etnico',
            'Fieldex': 'Fieldex', 
            'Juan Matas': 'Juan Matas',
            'Juan_Matas': 'Juan Matas',
            'CI Dorado': 'CI_Dorado',
            'CI_Dorado': 'CI_Dorado'
        }
        for g in groups:
            if g in mapping:
                return mapping[g]
        return None

    def _get_logo_url(self, company_name):
        """Returns the static path for the company logo based on name"""
        normalized = company_name.lower().replace('.', '').replace(' ', '_')
        
        # Mapping specific cases if normalization isn't enough
        logos = {
            'heavens_fruit': '/img/heavens.webp',
            'heavens': '/img/heavens.webp',
            'etnico': '/img/etnico.webp',
            'fieldex': '/img/fieldex.webp',
            'juan_matas': '/img/juan_matas.webp',
            'ci_dorado': '/img/ci_dorado.webp',
        }
        
        return logos.get(normalized, '/img/heavens.webp') # Default fallback

    def _get_airline_performance(self, exportador=None):
        """Optimized: Use DB aggregation for counts, Python for delay hours (limited dataset)"""
        sixty_days_ago = timezone.now().date() - timedelta(days=60)
        
        query = Pedido.objects.filter(
            fecha_entrega__gte=sixty_days_ago,
            aerolinea__isnull=False,
            awb__isnull=False
        )
        
        if exportador:
            query = query.filter(exportadora=exportador)
        
        # Step 1: Get base stats using DB aggregation (fast)
        airline_stats = query.values('aerolinea__nombre').annotate(
            count=Count('id'),
            total_kg=Sum('total_peso_bruto_enviado'),
            total_diff=Sum('diferencia_peso_factura_awb'),
            delayed_count=Count(
                Case(
                    When(eta__isnull=False, eta_real__isnull=False, eta_real__gt=F('eta'), then=1),
                    output_field=IntegerField()
                )
            )
        ).order_by('-total_kg')[:5]
        
        # Get list of top airline names for delay calculation
        top_airlines = [stat['aerolinea__nombre'] for stat in airline_stats]
        
        # Step 2: Calculate delay hours only for delayed orders of top 5 airlines (limited dataset)
        delay_hours_by_airline = {}
        if top_airlines:
            delayed_orders = query.filter(
                aerolinea__nombre__in=top_airlines,
                eta__isnull=False,
                eta_real__isnull=False,
                eta_real__gt=F('eta')
            ).values('aerolinea__nombre', 'eta', 'eta_real')
            
            # Group delays by airline
            airline_delays = {}
            for order in delayed_orders:
                name = order['aerolinea__nombre']
                if name not in airline_delays:
                    airline_delays[name] = []
                diff = order['eta_real'] - order['eta']
                hours = diff.total_seconds() / 3600
                if hours > 0:
                    airline_delays[name].append(hours)
            
            # Calculate averages
            for name, delays in airline_delays.items():
                if delays:
                    delay_hours_by_airline[name] = sum(delays) / len(delays)
        
        # Step 3: Build final performance list
        performance = []
        for stat in airline_stats:
            count = stat['count'] or 1
            name = stat['aerolinea__nombre']
            total_kg = float(stat['total_kg'] or 0)
            total_diff = float(stat['total_diff'] or 0)
            delayed_count = stat['delayed_count'] or 0
            avg_delay = delay_hours_by_airline.get(name, 0)
            
            performance.append({
                "name": name,
                "kg_sent": round(total_kg, 1),
                "avg_weight_diff": round(total_diff / count, 2),
                "avg_delay_hours": round(avg_delay, 1),
                "delayed_percentage": round((delayed_count / count) * 100, 1) if count > 0 else 0
            })
        
        return performance

    def _get_pending_quality_reports_count(self):
        """
        Optimized: Use a single query with annotations instead of N+1 loop.
        Count compras without complete quality chain.
        """
        # Count compras that have a complete chain: compra -> venta -> reporte_exp -> reporte_prov(completado=True)
        # We want to count those that DON'T have this complete chain
        
        total_compras = CompraNacional.objects.count()
        
        # Count compras with complete chain
        complete_chain = CompraNacional.objects.filter(
            ventanacional__isnull=False,
            ventanacional__reportecalidadexportador__isnull=False,
            ventanacional__reportecalidadexportador__reportecalidadproveedor__isnull=False,
            ventanacional__reportecalidadexportador__reportecalidadproveedor__completado=True
        ).count()
        
        return total_compras - complete_chain

    def _get_overdue_clients_optimized(self, exportador=None):
        """Optimized: Get max_days in the same query using Max aggregation"""
        query = Pedido.objects.filter(
            dias_de_vencimiento__gt=0
        ).exclude(estado_factura='Pagada')
        
        if exportador:
            query = query.filter(exportadora=exportador)
        
        top_overdue = query.values('cliente__nombre').annotate(
            total_overdue=Sum(
                F('valor_total_factura_usd') - F('valor_pagado_cliente_usd') - 
                F('valor_total_nota_credito_usd') - F('descuento')
            ),
            max_days=Max('dias_de_vencimiento'),  # Use Max instead of separate query
            orders_count=Count('id')
        ).order_by('-total_overdue')[:5]
        
        return [
            {
                "name": client['cliente__nombre'],
                "amount": float(client['total_overdue']) if client['total_overdue'] else 0,
                "max_days": client['max_days'] or 0,
                "orders": client['orders_count']
            }
            for client in top_overdue
        ]

    def _get_heavens_data(self, user):
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())  # Monday
        
        # Trend Calculation Logic
        days_passed = (today - start_of_week).days
        start_of_last_week = start_of_week - timedelta(days=7)
        end_of_last_week_comparison = start_of_last_week + timedelta(days=days_passed)
        fifteen_days_ago = today - timedelta(days=15)
        
        # === BATCH QUERIES: Combine multiple counts into fewer queries ===
        
        # Query 1: Get multiple counts in one query using conditional aggregation
        pedido_stats = Pedido.objects.aggregate(
            pending_cancellations=Count(Case(
                When(estado_cancelacion='pendiente', then=1),
                output_field=IntegerField()
            )),
            overdue_orders=Count(Case(
                When(dias_de_vencimiento__gt=0, then=1),
                output_field=IntegerField()
            ), filter=~Q(estado_factura='Pagada')),
            orders_this_week=Count(Case(
                When(fecha_solicitud__gte=start_of_week, then=1),
                output_field=IntegerField()
            )),
            orders_last_week=Count(Case(
                When(
                    fecha_solicitud__gte=start_of_last_week,
                    fecha_solicitud__lte=end_of_last_week_comparison,
                    then=1
                ),
                output_field=IntegerField()
            )),
            in_transit=Count(Case(
                When(
                    fecha_entrega__gte=fifteen_days_ago,
                    then=1
                ),
                output_field=IntegerField()
            ), filter=~Q(estado_pedido__in=['Cancelado', 'Finalizado'])),
            boxes_sent=Sum(
                Case(
                    When(fecha_entrega__gte=fifteen_days_ago, then=F('total_cajas_enviadas')),
                    default=Value(0),
                    output_field=IntegerField()
                )
            )
        )
        
        orders_this_week = pedido_stats['orders_this_week'] or 0
        orders_last_week = pedido_stats['orders_last_week'] or 0
        
        # Calculate trend percentage
        if orders_last_week > 0:
            orders_trend = round(((orders_this_week - orders_last_week) / orders_last_week) * 100, 1)
        else:
            orders_trend = 100 if orders_this_week > 0 else 0
        
        # Quality Reports (optimized single query)
        pending_quality_reports = self._get_pending_quality_reports_count()

        metrics = {
            "orders_week": orders_this_week,
            "orders_trend": orders_trend,
            "in_transit": pedido_stats['in_transit'] or 0,
            "boxes_sent": int(pedido_stats['boxes_sent'] or 0),
            "pending_cancellations": pedido_stats['pending_cancellations'] or 0,
            "overdue_orders": pedido_stats['overdue_orders'] or 0,
            "pending_quality_reports": pending_quality_reports,
        }

        # Airline Performance (optimized)
        airline_performance = self._get_airline_performance()

        # Upcoming Deliveries (already optimized with select_related)
        upcoming_deliveries = Pedido.objects.filter(
            fecha_entrega__gte=today,
            fecha_entrega__lte=today + timedelta(days=7),
            estado_pedido__in=['En Proceso', 'Despachado', 'Reprogramado']
        ).select_related('cliente', 'exportadora').order_by('fecha_entrega').only(
            'id', 'fecha_entrega', 'estado_pedido', 
            'cliente__nombre', 'exportadora__nombre'
        )[:5]
        
        upcoming = [
            {
                "id": order.id,
                "client": order.cliente.nombre,
                "exporter": order.exportadora.nombre,
                "date": order.fecha_entrega,
                "status": order.estado_pedido
            }
            for order in upcoming_deliveries
        ]

        # Trends - Top Clientes
        client_trends = Pedido.objects.filter(
            fecha_solicitud__gte=fifteen_days_ago
        ).values('cliente__nombre').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        trends_clients = [{"name": c['cliente__nombre'], "orders": c['count']} for c in client_trends]
        
        # Trends - Top Frutas
        fruit_trends = DetallePedido.objects.filter(
            pedido__fecha_solicitud__gte=fifteen_days_ago
        ).values('fruta__nombre').annotate(
            total_kilos=Sum('kilos_enviados')
        ).order_by('-total_kilos')[:5]
        
        trends_fruits = [{"name": f['fruta__nombre'], "kilos": float(f['total_kilos'] or 0)} for f in fruit_trends]

        # Overdue Clients (optimized)
        overdue_clients = self._get_overdue_clients_optimized()

        return {
            "metrics": metrics,
            "activity": [],
            "airlines_performance": airline_performance,
            "upcoming_deliveries": upcoming,
            "trends_clients": trends_clients,
            "trends_fruits": trends_fruits,
            "overdue_clients": overdue_clients,
            "role": "Administrator",
            "company_name": "Heaven's Fruit",
            "logo": self._get_logo_url("Heavens Fruit")
        }


    def _get_exportador_data(self, exportador_name, user):
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        fifteen_days_ago = today - timedelta(days=15)
        
        # Fix Trend Logic
        days_passed = (today - start_of_week).days
        start_of_last_week = start_of_week - timedelta(days=7)
        end_of_last_week_comparison = start_of_last_week + timedelta(days=days_passed)

        try:
            exportador = Exportador.objects.get(nombre__icontains=exportador_name)
        except Exportador.DoesNotExist:
            return {"error": "Exportador no encontrado"}

        # === BATCH QUERY for this exportador ===
        pedido_stats = Pedido.objects.filter(exportadora=exportador).aggregate(
            orders_this_week=Count(Case(
                When(fecha_solicitud__gte=start_of_week, then=1),
                output_field=IntegerField()
            )),
            orders_last_week=Count(Case(
                When(
                    fecha_solicitud__gte=start_of_last_week,
                    fecha_solicitud__lte=end_of_last_week_comparison,
                    then=1
                ),
                output_field=IntegerField()
            )),
            in_transit=Count(Case(
                When(fecha_entrega__gte=fifteen_days_ago, then=1),
                output_field=IntegerField()
            ), filter=~Q(estado_pedido__in=['Cancelado', 'Finalizado'])),
            boxes_sent=Sum(
                Case(
                    When(fecha_entrega__gte=fifteen_days_ago, then=F('total_cajas_enviadas')),
                    default=Value(0),
                    output_field=IntegerField()
                )
            ),
            overdue_orders=Count(Case(
                When(dias_de_vencimiento__gt=0, then=1),
                output_field=IntegerField()
            ), filter=~Q(estado_factura='Pagada'))
        )
        
        orders_this_week = pedido_stats['orders_this_week'] or 0
        orders_last_week = pedido_stats['orders_last_week'] or 0
        
        if orders_last_week > 0:
            orders_trend = round(((orders_this_week - orders_last_week) / orders_last_week) * 100, 1)
        else:
            orders_trend = 100 if orders_this_week > 0 else 0

        # Inventory count
        total_items_stock = Inventario.objects.filter(
            numero_item__exportador=exportador
        ).count()

        metrics = {
            "orders_week": orders_this_week,
            "orders_trend": orders_trend,
            "in_transit": pedido_stats['in_transit'] or 0,
            "boxes_sent": int(pedido_stats['boxes_sent'] or 0),
            "overdue_orders": pedido_stats['overdue_orders'] or 0,
            "inventory_items": total_items_stock,
        }

        # Airline Performance
        airline_performance = self._get_airline_performance(exportador)

        # Trends - Top Clientes
        client_trends = Pedido.objects.filter(
            exportadora=exportador,
            fecha_solicitud__gte=fifteen_days_ago
        ).values('cliente__nombre').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        trends_clients = [{"name": c['cliente__nombre'], "orders": c['count']} for c in client_trends]
        
        # Trends - Top Frutas
        fruit_trends = DetallePedido.objects.filter(
            pedido__exportadora=exportador,
            pedido__fecha_solicitud__gte=fifteen_days_ago
        ).values('fruta__nombre').annotate(
            total_kilos=Sum('kilos_enviados')
        ).order_by('-total_kilos')[:5]
        
        trends_fruits = [{"name": f['fruta__nombre'], "kilos": float(f['total_kilos'] or 0)} for f in fruit_trends]

        # Overdue Clients (optimized)
        overdue_clients = self._get_overdue_clients_optimized(exportador)

        # Upcoming Deliveries
        upcoming_deliveries = Pedido.objects.filter(
            exportadora=exportador,
            fecha_entrega__gte=today,
            fecha_entrega__lte=today + timedelta(days=7),
            estado_pedido__in=['En Proceso', 'Despachado', 'Reprogramado']
        ).select_related('cliente', 'exportadora').order_by('fecha_entrega').only(
            'id', 'fecha_entrega', 'estado_pedido',
            'cliente__nombre', 'exportadora__nombre'
        )[:5]
        
        upcoming = [
            {
                "id": order.id,
                "client": order.cliente.nombre,
                "exporter": order.exportadora.nombre,
                "date": order.fecha_entrega,
                "status": order.estado_pedido
            }
            for order in upcoming_deliveries
        ]

        return {
            "metrics": metrics,
            "activity": [],
            "airlines_performance": airline_performance,
            "overdue_clients": overdue_clients,
            "trends_clients": trends_clients,
            "trends_fruits": trends_fruits,
            "upcoming_deliveries": upcoming,
            "role": "Partner",
            "company_name": exportador.nombre,
            "logo": self._get_logo_url(exportador.nombre)
        }

