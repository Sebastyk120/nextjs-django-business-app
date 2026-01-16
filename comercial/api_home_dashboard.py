from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from django.db.models import Sum, Q, Count, F
from django.utils import timezone
from datetime import timedelta

# Modelos
from comercial.models import (
    Pedido, 
    Exportador
)
from inventarios.models import Inventario, Bodega
from nacionales.models import VentaNacional, ReporteCalidadExportador, CompraNacional
from comercial.models import CostoPresentacionCliente

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

    def _get_heavens_data(self, user):
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())  # Monday
        start_of_last_week = start_of_week - timedelta(days=7)
        fifteen_days_ago = today - timedelta(days=15)
        
        # --- 1. Critical Alerts ---
        pending_cancellations = Pedido.objects.filter(estado_cancelacion='pendiente').count()
        
        # Pedidos vencidos count (días de vencimiento > 0 y factura no pagada)
        overdue_orders = Pedido.objects.filter(
            dias_de_vencimiento__gt=0
        ).exclude(estado_factura='Pagada').count()
        
        # --- 2. Orders This Week (with trend) ---
        orders_this_week = Pedido.objects.filter(
            fecha_solicitud__gte=start_of_week
        ).count()
        
        orders_last_week = Pedido.objects.filter(
            fecha_solicitud__gte=start_of_last_week,
            fecha_solicitud__lt=start_of_week
        ).count()
        
        # Calculate trend percentage
        if orders_last_week > 0:
            orders_trend = round(((orders_this_week - orders_last_week) / orders_last_week) * 100, 1)
        else:
            orders_trend = 100 if orders_this_week > 0 else 0
        
        # --- 3. In Transit (últimos 15 días, no finalizados/cancelados) ---
        in_transit = Pedido.objects.filter(
            fecha_entrega__gte=fifteen_days_ago
        ).exclude(estado_pedido__in=['Cancelado', 'Finalizado']).count()
        
        # --- 4. Cajas Enviadas (últimos 15 días) ---
        boxes_data = Pedido.objects.filter(
            fecha_entrega__gte=fifteen_days_ago
        ).aggregate(
            total_boxes=Sum('total_cajas_enviadas')
        )
        
        boxes_sent = boxes_data['total_boxes'] or 0

        # --- 5. Quality Reports Pending (Nacionales) ---
        compras_nacionales = CompraNacional.objects.all()
        pending_quality_reports = 0
        
        for compra in compras_nacionales:
            tiene_venta = hasattr(compra, 'ventanacional')
            tiene_reporte_exp = False
            tiene_reporte_prov = False
            reporte_prov_completado = False

            if tiene_venta:
                venta = compra.ventanacional
                tiene_reporte_exp = hasattr(venta, 'reportecalidadexportador')
                if tiene_reporte_exp:
                    reporte_exp = venta.reportecalidadexportador
                    tiene_reporte_prov = hasattr(reporte_exp, 'reportecalidadproveedor')
                    if tiene_reporte_prov:
                        reporte_prov = reporte_exp.reportecalidadproveedor
                        reporte_prov_completado = reporte_prov.completado

            if not (tiene_venta and tiene_reporte_exp and tiene_reporte_prov and reporte_prov_completado):
                pending_quality_reports += 1

        metrics = {
            "orders_week": orders_this_week,
            "orders_trend": orders_trend,
            "in_transit": in_transit,
            "boxes_sent": int(boxes_sent),
            "pending_cancellations": pending_cancellations,
            "overdue_orders": overdue_orders,
            "pending_quality_reports": pending_quality_reports,
        }


        # --- 6. Recent Activity ---
        last_orders = Pedido.objects.select_related('cliente', 'exportadora').order_by('-id')[:5]
        activity = []
        for order in last_orders:
            activity.append({
                "id": order.id,
                "type": "new_order",
                "title": f"Pedido #{order.id}",
                "description": f"{order.cliente.nombre} ({order.exportadora.nombre})",
                "date": order.fecha_solicitud,
                "status": order.estado_pedido
            })

        # --- 7. Upcoming Deliveries (next 7 days) ---
        upcoming_deliveries = Pedido.objects.filter(
            fecha_entrega__gte=today,
            fecha_entrega__lte=today + timedelta(days=7),
            estado_pedido__in=['En Proceso', 'Despachado', 'Reprogramado']
        ).select_related('cliente', 'exportadora').order_by('fecha_entrega')[:5]
        
        upcoming = []
        for order in upcoming_deliveries:
            upcoming.append({
                "id": order.id,
                "client": order.cliente.nombre,
                "exporter": order.exportadora.nombre,
                "date": order.fecha_entrega,
                "status": order.estado_pedido
            })

        # --- 8. Trends (últimos 15 días) ---
        # Top Clientes por cantidad de pedidos
        client_trends = Pedido.objects.filter(
            fecha_solicitud__gte=fifteen_days_ago
        ).values('cliente__nombre').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        trends_clients = [{"name": c['cliente__nombre'], "orders": c['count']} for c in client_trends]
        
        # Top Frutas por cantidad de kilos enviados
        from comercial.models import DetallePedido
        fruit_trends = DetallePedido.objects.filter(
            pedido__fecha_solicitud__gte=fifteen_days_ago
        ).values('fruta__nombre').annotate(
            total_kilos=Sum('kilos_enviados')
        ).order_by('-total_kilos')[:5]
        
        trends_fruits = [{"name": f['fruta__nombre'], "kilos": float(f['total_kilos'] or 0)} for f in fruit_trends]


        # --- 9. Top Clientes Morosos ---
        top_overdue_clients = Pedido.objects.filter(
            dias_de_vencimiento__gt=0
        ).exclude(estado_factura='Pagada').values(
            'cliente__nombre'
        ).annotate(
            total_overdue=Sum(F('valor_total_factura_usd') - F('valor_pagado_cliente_usd') - F('valor_total_nota_credito_usd') - F('descuento')),
            max_days=Count('dias_de_vencimiento'),
            orders_count=Count('id')
        ).order_by('-total_overdue')[:5]
        
        overdue_clients = []
        for client in top_overdue_clients:
            # Get max days for this client
            max_days_query = Pedido.objects.filter(
                cliente__nombre=client['cliente__nombre'],
                dias_de_vencimiento__gt=0
            ).exclude(estado_factura='Pagada').order_by('-dias_de_vencimiento').first()
            
            overdue_clients.append({
                "name": client['cliente__nombre'],
                "amount": float(client['total_overdue']) if client['total_overdue'] else 0,
                "max_days": max_days_query.dias_de_vencimiento if max_days_query else 0,
                "orders": client['orders_count']
            })

        return {
            "metrics": metrics,
            "activity": activity,
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
        
        try:
            exportador = Exportador.objects.get(nombre__icontains=exportador_name)
        except Exportador.DoesNotExist:
            return {"error": "Exportador no encontrado"}

        # --- 1. Orders This Week (with trend) ---
        orders_this_week = Pedido.objects.filter(
            exportadora=exportador,
            fecha_solicitud__gte=start_of_week
        ).count()
        
        start_of_last_week = start_of_week - timedelta(days=7)
        orders_last_week = Pedido.objects.filter(
            exportadora=exportador,
            fecha_solicitud__gte=start_of_last_week,
            fecha_solicitud__lt=start_of_week
        ).count()
        
        if orders_last_week > 0:
            orders_trend = round(((orders_this_week - orders_last_week) / orders_last_week) * 100, 1)
        else:
            orders_trend = 100 if orders_this_week > 0 else 0

        # --- 2. In Transit (15 days) ---
        in_transit = Pedido.objects.filter(
            exportadora=exportador,
            fecha_entrega__gte=fifteen_days_ago
        ).exclude(estado_pedido__in=['Cancelado', 'Finalizado']).count()

        # --- 3. Boxes Sent (15 days) ---
        boxes_data = Pedido.objects.filter(
            exportadora=exportador,
            fecha_entrega__gte=fifteen_days_ago
        ).aggregate(
            total_boxes=Sum('total_cajas_enviadas')
        )
        boxes_sent = boxes_data['total_boxes'] or 0

        # --- 4. Overdue Orders Count ---
        overdue_orders = Pedido.objects.filter(
            exportadora=exportador,
            dias_de_vencimiento__gt=0
        ).exclude(estado_factura='Pagada').count()
        
        # --- 5. Inventory (Existing metric) ---
        total_items_stock = Inventario.objects.filter(
            numero_item__exportador=exportador
        ).count()

        metrics = {
            "orders_week": orders_this_week,
            "orders_trend": orders_trend,
            "in_transit": in_transit,
            "boxes_sent": int(boxes_sent),
            "overdue_orders": overdue_orders,
            "inventory_items": total_items_stock,
        }

        # --- 6. Recent Activity ---
        last_orders = Pedido.objects.filter(
            exportadora=exportador
        ).order_by('-id')[:5]
        
        activity = []
        for order in last_orders:
            activity.append({
                "id": order.id,
                "type": "my_order",
                "title": f"Pedido #{order.id}",
                "description": f"Destino: {order.cliente.nombre}",
                "date": order.fecha_solicitud,
                "status": order.estado_pedido
            })

        # --- 7. Trends (últimos 15 días) ---
        # Top Clientes por cantidad de pedidos
        client_trends = Pedido.objects.filter(
            exportadora=exportador,
            fecha_solicitud__gte=fifteen_days_ago
        ).values('cliente__nombre').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        trends_clients = [{"name": c['cliente__nombre'], "orders": c['count']} for c in client_trends]
        
        # Top Frutas por cantidad de kilos enviados
        from comercial.models import DetallePedido
        fruit_trends = DetallePedido.objects.filter(
            pedido__exportadora=exportador,
            pedido__fecha_solicitud__gte=fifteen_days_ago
        ).values('fruta__nombre').annotate(
            total_kilos=Sum('kilos_enviados')
        ).order_by('-total_kilos')[:5]
        
        trends_fruits = [{"name": f['fruta__nombre'], "kilos": float(f['total_kilos'] or 0)} for f in fruit_trends]

        # --- 8. Top Clientes Morosos (For this exporter) ---
        top_overdue_clients = Pedido.objects.filter(
            exportadora=exportador,
            dias_de_vencimiento__gt=0
        ).exclude(estado_factura='Pagada').values(
            'cliente__nombre'
        ).annotate(
            total_overdue=Sum(F('valor_total_factura_usd') - F('valor_pagado_cliente_usd') - F('valor_total_nota_credito_usd') - F('descuento')),
            max_days=Count('dias_de_vencimiento'),
            orders_count=Count('id')
        ).order_by('-total_overdue')[:5]
        
        overdue_clients = []
        for client in top_overdue_clients:
            max_days_query = Pedido.objects.filter(
                exportadora=exportador,
                cliente__nombre=client['cliente__nombre'],
                dias_de_vencimiento__gt=0
            ).exclude(estado_factura='Pagada').order_by('-dias_de_vencimiento').first()
            
            overdue_clients.append({
                "name": client['cliente__nombre'],
                "amount": float(client['total_overdue']) if client['total_overdue'] else 0,
                "max_days": max_days_query.dias_de_vencimiento if max_days_query else 0,
                "orders": client['orders_count']
            })

        # --- 9. Upcoming Deliveries (next 7 days) ---
        upcoming_deliveries = Pedido.objects.filter(
            exportadora=exportador,
            fecha_entrega__gte=today,
            fecha_entrega__lte=today + timedelta(days=7),
            estado_pedido__in=['En Proceso', 'Despachado', 'Reprogramado']
        ).select_related('cliente', 'exportadora').order_by('fecha_entrega')[:5]
        
        upcoming = []
        for order in upcoming_deliveries:
            upcoming.append({
                "id": order.id,
                "client": order.cliente.nombre,
                "exporter": order.exportadora.nombre,
                "date": order.fecha_entrega,
                "status": order.estado_pedido
            })

        return {
            "metrics": metrics,
            "activity": activity,
            "overdue_clients": overdue_clients,
            "trends_clients": trends_clients,
            "trends_fruits": trends_fruits,
            "upcoming_deliveries": upcoming,
            "role": "Partner",
            "company_name": exportador.nombre,
            "logo": self._get_logo_url(exportador.nombre)
        }
