import django_tables2 as tables
from .models import CompraNacional, VentaNacional, ReporteCalidadExportador, ReporteCalidadProveedor, TransferenciasProveedor
from comercial.templatetags.custom_filters import format_currency, format_percentage_color_exportacion, format_percentage_color_nacional, format_percentage_color_merma


class CompraNacionalTable(tables.Table):
    id = tables.Column(verbose_name="No.")
    precio_compra_exp = tables.Column()
    class Meta:
        model = CompraNacional
        attrs = {
            'class': 'table'
        }
        row_attrs = {
            'class': lambda record: 'even' if record.id % 2 == 0 else ''
        }
        template_name = "django_tables2/bootstrap5-responsive.html"
        fields = ("id", "numero_guia", "proveedor", "fruta", "peso_compra", "fecha_compra", "precio_compra_exp")

    def render_precio_compra_exp(self, value):
        return format_currency(value)


class VentaNacionalTable(tables.Table):
    id = tables.Column(verbose_name="No.")

    class Meta:
        model = VentaNacional
        attrs = {
            'class': 'table'
        }
        row_attrs = {
            'class': lambda record: 'even' if record.id % 2 == 0 else ''
        }
        template_name = "django_tables2/bootstrap5-responsive.html"
        fields = ("id", "exportador", "peso_bruto_recibido", "peso_neto_recibido", "diferencia_peso", "fecha_vencimiento", "estado_venta")


class ReporteCalidadExportadorTable(tables.Table):
    id = tables.Column(verbose_name="No.")
    porcentaje_exportacion = tables.Column(verbose_name="% Exportación")
    porcentaje_nacional = tables.Column(verbose_name="% Nacional")
    porcentaje_merma = tables.Column(verbose_name="% Merma")

    class Meta:
        model = ReporteCalidadExportador
        attrs = {
            'class': 'table'
        }
        row_attrs = {
            'class': lambda record: 'even' if record.id % 2 == 0 else ''
        }
        template_name = "django_tables2/bootstrap5-responsive.html"
        fields = ("id", "remision_exp", "fecha_reporte", "kg_totales", "porcentaje_exportacion", "porcentaje_nacional", "porcentaje_merma", "estado_reporte_exp")

    def render_porcentaje_exportacion(self, value):
        return format_percentage_color_exportacion(value)

    def render_porcentaje_nacional(self, value):
        return format_percentage_color_nacional(value)

    def render_porcentaje_merma(self, value):
        return format_percentage_color_merma(value)


class ReporteCalidadProveedorTable(tables.Table):
    id = tables.Column(verbose_name="No.")
    p_porcentaje_exportacion = tables.Column(verbose_name="% Exportación")
    p_porcentaje_nacional = tables.Column(verbose_name="% Nacional")
    p_porcentaje_merma = tables.Column(verbose_name="% Merma")

    class Meta:
        model = ReporteCalidadProveedor
        attrs = {
            'class': 'table'
        }
        row_attrs = {
            'class': lambda record: 'even' if record.id % 2 == 0 else ''
        }
        template_name = "django_tables2/bootstrap5-responsive.html"
        fields = ("id", "p_fecha_reporte", "p_kg_exportacion", "p_porcentaje_exportacion", "p_kg_nacional", "p_porcentaje_nacional", "p_kg_merma", "p_porcentaje_merma", "estado_reporte_prov")

    def render_p_porcentaje_exportacion(self, value):
        return format_percentage_color_exportacion(value)

    def render_p_porcentaje_nacional(self, value):
        return format_percentage_color_nacional(value)

    def render_p_porcentaje_merma(self, value):
        return format_percentage_color_merma(value)


class TransferenciasProveedorTable(tables.Table):
    id = tables.Column(verbose_name="No.")
    valor_transferencia = tables.Column()
    editar = tables.TemplateColumn(template_name='button_edit_transferencia_nacional.html', orderable=False)

    class Meta:
        model = TransferenciasProveedor
        attrs = {
            'class': 'table'
        }
        template_name = "django_tables2/bootstrap5-responsive.html"
        fields = ("id", "proveedor", "origen_transferencia", "fecha_transferencia", "valor_transferencia", "referencia",
                  "observaciones", "editar")

    def render_valor_transferencia(self, value):
        return format_currency(value)
