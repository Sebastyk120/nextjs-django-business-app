import django_tables2 as tables
from django.utils.html import format_html
from .models import Movimiento, Item, Inventario


# Ingreso de Referencias (Cajas) Primer momento: --------------------------------------------------------------
class ItemTable(tables.Table):
    editar = tables.TemplateColumn(
        template_name='recibo_editar_button.html',
        orderable=False
    )

    eliminar = tables.TemplateColumn(
        template_name='recibo_eliminar_button.html',
        orderable=False
    )

    class Meta:
        model = Item
        template_name = "django_tables2/bootstrap5-responsive.html"
        fields = (
            "numero_item", "cantidad_cajas", "bodega", "proveedor", "fecha_movimiento", "propiedad",
            "tipo_documento", "documento", "observaciones", "user", "editar")


# Historicos (Inventario De Movimientos).---------------------------------------------------------------------------
class MovimientoTable(tables.Table):
    class Meta:
        model = Movimiento
        template_name = "django_tables2/bootstrap5-responsive.html"
        fields = (
            "item_historico", "cantidad_cajas_h", "bodega", "propiedad", "fecha_movimiento",
            "observaciones", "fecha", "user",)


class InventarioTable(tables.Table):
    numero_item = tables.Column(verbose_name="Referencia", attrs={"class": "justify-column"})
    stock_actual = tables.Column(empty_values=(), orderable=False, verbose_name="Stock Actual")

    class Meta:
        model = Inventario
        template_name = 'django_tables2/bootstrap5-responsive.html'
        fields = ("numero_item", "compras_efectivas", "saldos_iniciales", "salidas",
                  "traslado_propio", "traslado_remisionado", "ventas", "venta_contenedor")
        attrs = {
            'compras_efectivas': {'th': {'style': 'color: red; background-color: #c5e65c;'}},
            # Agrega más columnas según sea necesario
        }

    def render_stock_actual(self, record):
        stock_actual = (record.compras_efectivas + record.saldos_iniciales) - (
                record.salidas + record.traslado_propio + record.traslado_remisionado + record.ventas)
        if stock_actual < 0:
            return format_html(f'<span style="color: red;">{stock_actual}</span>')
        else:
            return format_html(f'<span style="color: black;">{stock_actual}</span>')
